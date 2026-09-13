import assert from 'node:assert/strict';
import http from 'node:http';
import https from 'node:https';
import type { LookupFunction } from 'node:net';
import { Readable } from 'node:stream';
import test from 'node:test';
import axios, {
  AxiosError,
  AxiosHeaders,
  type AxiosResponse,
  type InternalAxiosRequestConfig,
} from 'axios';
import { createAxiosTransport } from '../axios-transport.ts';
import { checkUrl } from '../check-url.ts';
import type { HostResolver, ResolvedAddress } from '../types.ts';

interface MockAxiosResponse {
  status: number;
  headers?: Record<string, string>;
  body?: string | Uint8Array;
}

type AxiosHandler = (
  config: InternalAxiosRequestConfig,
) => MockAxiosResponse | Promise<MockAxiosResponse>;

function axiosWithAdapter(handler: AxiosHandler) {
  return axios.create({
    adapter: async (config): Promise<AxiosResponse> => {
      const result = await handler(config);
      return {
        data: Readable.from(result.body === undefined ? [] : [result.body]),
        status: result.status,
        statusText: String(result.status),
        headers: new AxiosHeaders(result.headers),
        config,
        request: {},
      };
    },
  });
}

function agentLookup(agent: http.Agent | https.Agent): LookupFunction {
  const options = (agent as unknown as { options: { lookup?: LookupFunction } }).options;
  assert.ok(options.lookup, 'pinned agent must provide a lookup function');
  return options.lookup;
}

function lookupOne(lookup: LookupFunction, hostname: string): Promise<ResolvedAddress> {
  return new Promise((resolve, reject) => {
    lookup(hostname, { all: false }, (error, address, family) => {
      if (error) return reject(error);
      if (typeof address !== 'string') return reject(new Error('Expected one pinned address'));
      resolve({ address, family: family as 4 | 6 });
    });
  });
}

const PUBLIC: ResolvedAddress[] = [{ address: '93.184.216.34', family: 4 }];
const PUBLIC_RESOLVER: HostResolver = async () => PUBLIC;

test('Axios HEAD uses the validated address without re-resolving DNS', async () => {
  let resolverCalls = 0;
  const connectedAddresses: string[] = [];
  const resolver: HostResolver = async () => {
    resolverCalls += 1;
    return resolverCalls === 1 ? PUBLIC : [{ address: '127.0.0.1', family: 4 }];
  };
  const client = axiosWithAdapter(async (config) => {
    assert.equal(config.method, 'head');
    assert.equal(config.url, 'https://example.com/');
    assert.equal(config.maxRedirects, 0);
    assert.equal(config.proxy, false);
    const agent = config.httpsAgent as https.Agent;
    assert.notEqual(agent.options.rejectUnauthorized, false);
    assert.equal(config.headers.get('host'), undefined);
    connectedAddresses.push((await lookupOne(agentLookup(agent), 'example.com')).address);
    return { status: 200, headers: { 'content-type': 'text/html' } };
  });

  const result = await checkUrl('https://example.com/', {
    resolve: resolver,
    transport: createAxiosTransport(client),
  });

  assert.equal(result.status, 'healthy');
  assert.equal(resolverCalls, 1);
  assert.deepEqual(connectedAddresses, ['93.184.216.34']);
});

test('Axios performs GET fallback and keeps response inspection bounded', async () => {
  const methods: string[] = [];
  const client = axiosWithAdapter((config) => {
    methods.push(config.method ?? '');
    if (config.method === 'head') return { status: 405 };
    return {
      status: 200,
      headers: { 'content-type': 'text/html' },
      body: new Uint8Array(100_000).fill(65),
    };
  });
  const result = await checkUrl('https://example.com/', {
    resolve: PUBLIC_RESOLVER,
    transport: createAxiosTransport(client),
  });

  assert.deepEqual(methods, ['head', 'get']);
  assert.equal(result.status, 'healthy');
  assert.ok(result.evidence.some(({ type, value }) => type === 'body_truncated' && value === 65_536));
});

test('Axios redirects remain disabled, manually validated, and independently pinned', async () => {
  const resolverCalls = new Map<string, number>();
  const pinnedConnections: string[] = [];
  const resolver: HostResolver = async (hostname) => {
    const count = (resolverCalls.get(hostname) ?? 0) + 1;
    resolverCalls.set(hostname, count);
    if (count > 1) return [{ address: '127.0.0.1', family: 4 }];
    return hostname === 'example.com'
      ? [{ address: '93.184.216.34', family: 4 }]
      : [{ address: '142.250.72.14', family: 4 }];
  };
  const client = axiosWithAdapter(async (config) => {
    assert.equal(config.maxRedirects, 0);
    const hostname = new URL(config.url ?? '').hostname;
    const agent = config.httpsAgent as https.Agent;
    pinnedConnections.push((await lookupOne(agentLookup(agent), hostname)).address);
    const response: MockAxiosResponse = hostname === 'example.com'
      ? { status: 302, headers: { location: 'https://destination.example/path' } }
      : { status: 200, headers: { 'content-type': 'text/html' } };
    return response;
  });

  const result = await checkUrl('https://example.com/', {
    resolve: resolver,
    transport: createAxiosTransport(client),
  });

  assert.equal(result.reason, 'redirected');
  assert.equal(result.redirectCount, 1);
  assert.deepEqual(Object.fromEntries(resolverCalls), { 'example.com': 1, 'destination.example': 1 });
  assert.deepEqual(pinnedConnections, ['93.184.216.34', '142.250.72.14']);
});

test('a redirect hostname that resolves privately is blocked before Axios connects', async () => {
  const requestedHosts: string[] = [];
  const client = axiosWithAdapter((config) => {
    requestedHosts.push(new URL(config.url ?? '').hostname);
    return { status: 302, headers: { location: 'https://private.example/' } };
  });
  const resolver: HostResolver = async (hostname) => hostname === 'private.example'
    ? [{ address: '127.0.0.1', family: 4 }]
    : PUBLIC;

  const result = await checkUrl('https://example.com/', {
    resolve: resolver,
    transport: createAxiosTransport(client),
  });

  assert.equal(result.reason, 'unsafe_url');
  assert.deepEqual(requestedHosts, ['example.com']);
  assert.ok(result.evidence.some(({ type }) => type === 'unsafe_redirect'));
});

for (const [name, code, expected] of [
  ['timeout', 'ECONNABORTED', 'timeout'],
  ['DNS failure', 'ENOTFOUND', 'dns_error'],
  ['TLS failure', 'CERT_HAS_EXPIRED', 'tls_error'],
  ['connection reset', 'ECONNRESET', 'connection_error'],
] as const) {
  test(`Axios ${name} errors normalize to ${expected}`, async () => {
    const client = axios.create({
      adapter: async (config) => {
        throw new AxiosError(`${name} during request`, code, config);
      },
    });
    const result = await checkUrl('https://example.com/', {
      resolve: PUBLIC_RESOLVER,
      transport: createAxiosTransport(client),
    });
    assert.equal(result.reason, expected);
    assert.equal(result.status, 'unreachable');
  });
}

test('Axios HTTP errors are returned as diagnostic results rather than thrown failures', async () => {
  const client = axiosWithAdapter(() => ({ status: 404, body: 'missing', headers: { 'content-type': 'text/plain' } }));
  const result = await checkUrl('https://example.com/missing', {
    resolve: PUBLIC_RESOLVER,
    transport: createAxiosTransport(client),
  });
  assert.equal(result.reason, 'http_error');
  assert.equal(result.httpStatus, 404);
  assert.equal(result.status, 'suspicious');
});
