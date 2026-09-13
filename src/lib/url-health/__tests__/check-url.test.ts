import assert from 'node:assert/strict';
import test from 'node:test';
import { AxiosError } from 'axios';
import { checkUrl } from '../check-url.ts';
import { UrlTargetError } from '../ssrf-guard.ts';
import type { HostResolver, UrlHealthTransport, UrlHealthTransportResponse } from '../types.ts';

const PUBLIC_RESOLVER: HostResolver = async () => [{ address: '93.184.216.34', family: 4 }];

interface MockResponse {
  status: number;
  location?: string;
  body?: string;
  contentType?: string;
}

function response(status: number, options: Omit<MockResponse, 'status'> = {}): MockResponse {
  return { status, ...options };
}

function transportResponse(spec: MockResponse): UrlHealthTransportResponse {
  let closed = false;
  return {
    status: spec.status,
    headers: {
      ...(spec.location ? { location: spec.location } : {}),
      ...(spec.contentType ? { 'content-type': spec.contentType } : {}),
    },
    ...(spec.body !== undefined
      ? { body: (async function* () { yield new TextEncoder().encode(spec.body); })() }
      : {}),
    close: () => { closed = true; },
  };
}

function routeTransport(
  routes: Record<string, MockResponse | Error | (() => MockResponse | Promise<MockResponse>)>,
  calls: string[] = [],
): UrlHealthTransport {
  return async (request) => {
    const key = `${request.method} ${request.url.href}`;
    calls.push(key);
    const route = routes[key];
    if (!route) throw new Error(`Unexpected request: ${key}`);
    if (route instanceof Error) throw route;
    const resolved = typeof route === 'function' ? await route() : route;
    return transportResponse(resolved);
  };
}

test('classifies an HTTP 200 as healthy', async () => {
  const result = await checkUrl('https://example.com/', {
    resolve: PUBLIC_RESOLVER,
    transport: routeTransport({ 'HEAD https://example.com/': response(200, { contentType: 'text/html' }) }),
  });
  assert.equal(result.status, 'healthy');
  assert.equal(result.reason, 'ok');
  assert.equal(result.httpStatus, 200);
});

test('reports a normal HTTP to HTTPS redirect without treating it as a problem', async () => {
  const result = await checkUrl('http://example.com/', {
    resolve: PUBLIC_RESOLVER,
    transport: routeTransport({
      'HEAD http://example.com/': response(301, { location: 'https://example.com/' }),
      'HEAD https://example.com/': response(200, { contentType: 'text/html' }),
    }),
  });
  assert.equal(result.status, 'healthy');
  assert.equal(result.reason, 'redirected');
  assert.equal(result.redirectCount, 1);
  assert.equal(result.finalUrl, 'https://example.com/');
  assert.ok(result.evidence.some(({ type }) => type === 'protocol_upgrade'));
});

test('reports a same-service redirect as healthy', async () => {
  const result = await checkUrl('https://example.com/docs', {
    resolve: PUBLIC_RESOLVER,
    transport: routeTransport({
      'HEAD https://example.com/docs': response(302, { location: '/docs/' }),
      'HEAD https://example.com/docs/': response(200, { contentType: 'text/html' }),
    }),
  });
  assert.equal(result.status, 'healthy');
  assert.equal(result.reason, 'redirected');
  assert.equal(result.finalUrl, 'https://example.com/docs/');
});

for (const status of [403, 405, 429, 202]) {
  test(`falls back to GET when HEAD returns ${status}`, async () => {
    const calls: string[] = [];
    const result = await checkUrl('https://example.com/', {
      resolve: PUBLIC_RESOLVER,
      transport: routeTransport({
        'HEAD https://example.com/': response(status),
        'GET https://example.com/': response(200, { body: '<html>Useful page</html>', contentType: 'text/html' }),
      }, calls),
    });
    assert.equal(result.status, 'healthy');
    assert.deepEqual(calls, ['HEAD https://example.com/', 'GET https://example.com/']);
    assert.ok(result.evidence.some(({ type }) => type === 'head_fallback'));
  });
}

for (const status of [404, 410]) {
  test(`reports HTTP ${status} as suspicious evidence after GET confirmation`, async () => {
    const result = await checkUrl('https://example.com/missing', {
      resolve: PUBLIC_RESOLVER,
      transport: routeTransport({
        'HEAD https://example.com/missing': response(status),
        'GET https://example.com/missing': response(status, { body: 'missing', contentType: 'text/plain' }),
      }),
    });
    assert.equal(result.status, 'suspicious');
    assert.equal(result.reason, 'http_error');
    assert.equal(result.httpStatus, status);
  });
}

for (const status of [500, 502, 503]) {
  test(`reports HTTP ${status} as unreachable evidence`, async () => {
    const result = await checkUrl('https://example.com/', {
      resolve: PUBLIC_RESOLVER,
      transport: routeTransport({
        'HEAD https://example.com/': response(status),
        'GET https://example.com/': response(status, { body: 'temporary failure', contentType: 'text/plain' }),
      }),
    });
    assert.equal(result.status, 'unreachable');
    assert.equal(result.reason, 'http_error');
    assert.equal(result.httpStatus, status);
  });
}

test('reports a timeout only after GET fallback also fails', async () => {
  const timeout = new AxiosError('timeout exceeded', 'ECONNABORTED');
  const result = await checkUrl('https://example.com/', {
    resolve: PUBLIC_RESOLVER,
    transport: routeTransport({
      'HEAD https://example.com/': timeout,
      'GET https://example.com/': timeout,
    }),
  });
  assert.equal(result.status, 'unreachable');
  assert.equal(result.reason, 'timeout');
  assert.ok(result.evidence.some(({ type }) => type === 'head_fallback'));
});

test('reports a DNS failure', async () => {
  const dnsError = Object.assign(new Error('not found'), { code: 'ENOTFOUND' });
  const result = await checkUrl('https://does-not-exist.example/', {
    resolve: async () => { throw dnsError; },
    transport: routeTransport({}),
  });
  assert.equal(result.status, 'unreachable');
  assert.equal(result.reason, 'dns_error');
});

test('detects a redirect loop', async () => {
  const result = await checkUrl('https://example.com/a', {
    resolve: PUBLIC_RESOLVER,
    transport: routeTransport({
      'HEAD https://example.com/a': response(302, { location: '/b' }),
      'HEAD https://example.com/b': response(302, { location: '/a' }),
    }),
  });
  assert.equal(result.status, 'suspicious');
  assert.equal(result.reason, 'redirect_loop');
  assert.equal(result.redirectCount, 2);
});

test('detects an excessive redirect chain', async () => {
  const transport: UrlHealthTransport = async (request) => {
    const current = request.url;
    const step = Number(current.pathname.slice(1) || '0');
    return transportResponse(response(302, { location: `/${step + 1}` }));
  };
  const result = await checkUrl('https://example.com/0', {
    resolve: PUBLIC_RESOLVER,
    transport,
    maxRedirects: 2,
  });
  assert.equal(result.reason, 'too_many_redirects');
  assert.equal(result.redirectCount, 2);
});

test('detects a bot challenge as suspicious rather than broken', async () => {
  const result = await checkUrl('https://example.com/', {
    resolve: PUBLIC_RESOLVER,
    transport: routeTransport({
      'HEAD https://example.com/': response(403),
      'GET https://example.com/': response(200, {
        body: '<html><title>Just a moment...</title>Verify you are human</html>',
        contentType: 'text/html',
      }),
    }),
  });
  assert.equal(result.status, 'suspicious');
  assert.equal(result.reason, 'blocked');
});

test('rejects invalid and non-HTTP URLs before transport', async (t) => {
  for (const [name, url] of [
    ['invalid', 'not a url'],
    ['file', 'file:///etc/passwd'],
    ['credentials', 'https://user:secret@example.com/'],
  ]) {
    await t.test(name, async () => {
      const result = await checkUrl(url, { resolve: PUBLIC_RESOLVER, transport: routeTransport({}) });
      assert.ok(result.reason === 'invalid_url' || result.reason === 'unsafe_url');
    });
  }
});

test('blocks direct SSRF destinations before transport', async (t) => {
  const cases = [
    ['localhost', 'http://localhost/'],
    ['IPv4 loopback', 'http://127.0.0.1/'],
    ['unspecified IPv4', 'http://0.0.0.0/'],
    ['private IPv4', 'http://10.2.3.4/'],
    ['shared carrier IPv4', 'http://100.64.10.20/'],
    ['link-local IPv4', 'http://169.254.169.254/latest/meta-data/'],
    ['IPv6 loopback', 'http://[::1]/'],
    ['IPv4-mapped IPv6 loopback', 'http://[::ffff:127.0.0.1]/'],
    ['IPv6 unique local', 'http://[fd00::1]/'],
    ['IPv6 unique local prefix', 'http://[fc00::]/'],
    ['IPv6 link local', 'http://[fe80::1]/'],
    ['IPv6 site local', 'http://[fec0::1]/'],
  ];
  for (const [name, url] of cases) {
    await t.test(name, async () => {
      const result = await checkUrl(url, { resolve: PUBLIC_RESOLVER, transport: routeTransport({}) });
      assert.equal(result.reason, 'unsafe_url');
    });
  }
});

test('blocks a public hostname resolving to a private address', async () => {
  const result = await checkUrl('https://public.example/', {
    resolve: async () => [{ address: '192.168.1.20', family: 4 }],
    transport: routeTransport({}),
  });
  assert.equal(result.reason, 'unsafe_url');
});

test('rejects the entire DNS answer set when any candidate address is private', async () => {
  const result = await checkUrl('https://mixed.example/', {
    resolve: async () => [
      { address: '93.184.216.34', family: 4 },
      { address: '10.0.0.8', family: 4 },
    ],
    transport: routeTransport({}),
  });
  assert.equal(result.reason, 'unsafe_url');
});

test('blocks a redirect from a public URL to a private address', async () => {
  const result = await checkUrl('https://example.com/', {
    resolve: PUBLIC_RESOLVER,
    transport: routeTransport({
      'HEAD https://example.com/': response(302, { location: 'http://127.0.0.1/admin' }),
    }),
  });
  assert.equal(result.reason, 'unsafe_url');
  assert.equal(result.redirectCount, 1);
  assert.ok(result.evidence.some(({ type }) => type === 'unsafe_redirect'));
});

test('surfaces resolver security errors', async () => {
  const result = await checkUrl('https://example.com/', {
    resolve: async () => { throw new UrlTargetError('unsafe_url', 'blocked by resolver'); },
    transport: routeTransport({}),
  });
  assert.equal(result.reason, 'unsafe_url');
});
