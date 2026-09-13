import http from 'node:http';
import https from 'node:https';
import type { LookupFunction } from 'node:net';
import { Readable } from 'node:stream';
import axios, { type AxiosInstance, type AxiosResponseHeaders, type RawAxiosResponseHeaders } from 'axios';
import type {
  ResolvedAddress,
  UrlHealthTransport,
  UrlHealthTransportRequest,
  UrlHealthTransportResponse,
} from './types.ts';

const axiosClient = axios.create({
  maxRedirects: 0,
  proxy: false,
  validateStatus: () => true,
});

function lookupError(hostname: string, code: string, message: string): NodeJS.ErrnoException {
  const error = new Error(message) as NodeJS.ErrnoException;
  error.code = code;
  error.message = `${message} (${hostname})`;
  return error;
}

function normalizedHostname(hostname: string): string {
  return hostname.toLowerCase().replace(/\.$/, '');
}

/**
 * Supplies only addresses already approved by the SSRF guard. Node's agents
 * therefore cannot perform a second, unvalidated DNS lookup or silently fall
 * back to a new address.
 */
export function createPinnedLookup(
  validatedHostname: string,
  validatedAddresses: ResolvedAddress[],
): LookupFunction {
  const expectedHostname = normalizedHostname(validatedHostname);
  const approved = validatedAddresses.map(({ address, family }) => ({ address, family }));

  return (hostname, options, callback) => {
    if (normalizedHostname(hostname) !== expectedHostname) {
      callback(lookupError(hostname, 'ENOTFOUND', `Unvalidated hostname requested: ${hostname}`), '');
      return;
    }

    const family = options.family === 4 || options.family === 6 ? options.family : undefined;
    const eligible = family ? approved.filter((candidate) => candidate.family === family) : approved;
    if (eligible.length === 0) {
      callback(lookupError(hostname, 'EAI_ADDRFAMILY', `No validated address for IPv${family ?? '4/6'}`), '');
      return;
    }

    if (options.all) {
      callback(null, eligible);
      return;
    }
    callback(null, eligible[0].address, eligible[0].family);
  };
}

function normalizeHeaders(headers: RawAxiosResponseHeaders | AxiosResponseHeaders): Record<string, string> {
  return Object.fromEntries(
    Object.entries(headers).flatMap(([name, value]) => {
      if (value === undefined || value === null) return [];
      return [[name.toLowerCase(), Array.isArray(value) ? value.join(', ') : String(value)]];
    }),
  );
}

function toReadable(value: unknown): Readable | undefined {
  return value instanceof Readable ? value : undefined;
}

export function createAxiosTransport(client: AxiosInstance = axiosClient): UrlHealthTransport {
  return async (request: UrlHealthTransportRequest): Promise<UrlHealthTransportResponse> => {
    if (request.validatedAddresses.length === 0) {
      throw lookupError(request.hostname, 'ENOTFOUND', 'No validated addresses were supplied');
    }

    const lookup = createPinnedLookup(request.hostname, request.validatedAddresses);
    const httpAgent = new http.Agent({ keepAlive: false, lookup });
    // TLS verification and SNI retain their secure Node defaults. The request
    // URL keeps the original hostname; only DNS address selection is pinned.
    const httpsAgent = new https.Agent({ keepAlive: false, lookup });
    let body: Readable | undefined;
    let closed = false;
    const close = () => {
      if (closed) return;
      closed = true;
      body?.destroy();
      httpAgent.destroy();
      httpsAgent.destroy();
    };

    try {
      const response = await client.request({
        url: request.url.href,
        method: request.method,
        headers: {
          'User-Agent': request.userAgent,
          Accept: request.method === 'HEAD'
            ? '*/*'
            : 'text/html,application/xhtml+xml,application/pdf;q=0.9,*/*;q=0.5',
        },
        timeout: request.timeoutMs,
        responseType: 'stream',
        maxRedirects: 0,
        proxy: false,
        validateStatus: () => true,
        httpAgent,
        httpsAgent,
      });
      body = toReadable(response.data);
      return {
        status: response.status,
        headers: normalizeHeaders(response.headers),
        ...(body ? { body } : {}),
        close,
      };
    } catch (error) {
      close();
      throw error;
    }
  };
}

export const axiosTransport = createAxiosTransport();
