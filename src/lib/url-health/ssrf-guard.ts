import { promises as dns } from 'node:dns';
import { isIP } from 'node:net';
import type { HostResolver, ResolvedAddress, UrlHealthReason } from './types.ts';

const BLOCKED_HOSTNAMES = new Set([
  'localhost',
  'localhost.localdomain',
  'metadata',
  'metadata.google.internal',
  'instance-data',
]);

export class UrlTargetError extends Error {
  readonly reason: Extract<UrlHealthReason, 'invalid_url' | 'unsafe_url' | 'dns_error'>;

  constructor(
    reason: Extract<UrlHealthReason, 'invalid_url' | 'unsafe_url' | 'dns_error'>,
    message: string,
  ) {
    super(message);
    this.name = 'UrlTargetError';
    this.reason = reason;
  }
}

export const defaultHostResolver: HostResolver = async (hostname) => {
  try {
    const results = await dns.lookup(hostname, { all: true, verbatim: true });
    return results.map(({ address, family }) => ({ address, family: family as 4 | 6 }));
  } catch (error) {
    const message = error instanceof Error ? error.message : 'DNS lookup failed';
    throw new UrlTargetError('dns_error', message);
  }
};

function normalizeHostname(hostname: string): string {
  const lower = hostname.toLowerCase().replace(/\.$/, '');
  return lower.startsWith('[') && lower.endsWith(']') ? lower.slice(1, -1) : lower;
}

function ipv4ToNumber(address: string): number | undefined {
  const parts = address.split('.');
  if (parts.length !== 4) return undefined;
  const octets = parts.map(Number);
  if (octets.some((part) => !Number.isInteger(part) || part < 0 || part > 255)) return undefined;
  return (((octets[0] * 256 + octets[1]) * 256 + octets[2]) * 256 + octets[3]) >>> 0;
}

function isBlockedIpv4(address: string): boolean {
  const value = ipv4ToNumber(address);
  if (value === undefined) return true;

  const first = value >>> 24;
  const second = (value >>> 16) & 0xff;
  return (
    first === 0 ||
    first === 10 ||
    first === 127 ||
    (first === 100 && second >= 64 && second <= 127) ||
    (first === 169 && second === 254) ||
    (first === 172 && second >= 16 && second <= 31) ||
    (first === 192 && (second === 0 || second === 168)) ||
    (first === 198 && (second === 18 || second === 19)) ||
    first >= 224
  );
}

function parseIpv6(address: string): bigint | undefined {
  if (address.includes('%')) return undefined;

  const normalized = address.toLowerCase();
  const halves = normalized.split('::');
  if (halves.length > 2) return undefined;

  const parseHalf = (half: string): number[] | undefined => {
    if (!half) return [];
    const groups: number[] = [];
    for (const part of half.split(':')) {
      if (part.includes('.')) {
        const ipv4 = ipv4ToNumber(part);
        if (ipv4 === undefined) return undefined;
        groups.push((ipv4 >>> 16) & 0xffff, ipv4 & 0xffff);
      } else {
        const group = Number.parseInt(part, 16);
        if (!/^[0-9a-f]{1,4}$/.test(part) || !Number.isInteger(group)) return undefined;
        groups.push(group);
      }
    }
    return groups;
  };

  const left = parseHalf(halves[0]);
  const right = parseHalf(halves[1] ?? '');
  if (!left || !right) return undefined;
  const omitted = 8 - left.length - right.length;
  if ((halves.length === 1 && omitted !== 0) || omitted < 0) return undefined;
  const groups = [...left, ...Array.from({ length: omitted }, () => 0), ...right];
  if (groups.length !== 8) return undefined;
  return groups.reduce((value, group) => (value << 16n) | BigInt(group), 0n);
}

function isBlockedIpv6(address: string): boolean {
  const value = parseIpv6(address);
  if (value === undefined) return true;

  if (value === 0n || value === 1n) return true;
  if (value >> 121n === 0x7en) return true; // fc00::/7 unique local
  if (value >> 118n === 0x3fan) return true; // fe80::/10 link local
  if (value >> 118n === 0x3fbn) return true; // fec0::/10 deprecated site local
  if (value >> 120n === 0xffn) return true; // multicast

  // IPv4-compatible and IPv4-mapped IPv6 forms must receive IPv4 checks too.
  const ipv4Prefix = value >> 32n;
  if (ipv4Prefix === 0n || ipv4Prefix === 0xffffn) {
    const ipv4 = Number(value & 0xffffffffn);
    const dotted = [ipv4 >>> 24, (ipv4 >>> 16) & 0xff, (ipv4 >>> 8) & 0xff, ipv4 & 0xff].join('.');
    return isBlockedIpv4(dotted);
  }

  return false;
}

export function isUnsafeIpAddress(address: string): boolean {
  const normalized = normalizeHostname(address);
  const family = isIP(normalized);
  if (family === 4) return isBlockedIpv4(normalized);
  if (family === 6) return isBlockedIpv6(normalized);
  return true;
}

function isBlockedHostname(hostname: string): boolean {
  return (
    BLOCKED_HOSTNAMES.has(hostname) ||
    hostname.endsWith('.localhost') ||
    hostname.endsWith('.local') ||
    hostname.endsWith('.internal')
  );
}

export function parseHttpUrl(input: string): URL {
  let url: URL;
  try {
    url = new URL(input);
  } catch {
    throw new UrlTargetError('invalid_url', 'The URL could not be parsed');
  }

  if (url.protocol !== 'http:' && url.protocol !== 'https:') {
    throw new UrlTargetError('invalid_url', 'Only HTTP and HTTPS URLs are supported');
  }
  if (url.username || url.password) {
    throw new UrlTargetError('unsafe_url', 'URLs containing credentials are not allowed');
  }
  if (!url.hostname) {
    throw new UrlTargetError('invalid_url', 'The URL has no hostname');
  }
  return url;
}

export async function validateUrlTarget(
  input: string | URL,
  resolve: HostResolver = defaultHostResolver,
): Promise<{ url: URL; addresses: ResolvedAddress[] }> {
  const url = typeof input === 'string' ? parseHttpUrl(input) : parseHttpUrl(input.href);
  const hostname = normalizeHostname(url.hostname);

  if (isBlockedHostname(hostname)) {
    throw new UrlTargetError('unsafe_url', `Blocked local or internal hostname: ${hostname}`);
  }

  if (isIP(hostname)) {
    if (isUnsafeIpAddress(hostname)) {
      throw new UrlTargetError('unsafe_url', `Blocked local, private, or reserved address: ${hostname}`);
    }
    return { url, addresses: [{ address: hostname, family: isIP(hostname) as 4 | 6 }] };
  }

  const addresses = await resolve(hostname);
  if (addresses.length === 0) {
    throw new UrlTargetError('dns_error', `DNS returned no addresses for ${hostname}`);
  }
  const unsafe = addresses.find(({ address }) => isUnsafeIpAddress(address));
  if (unsafe) {
    throw new UrlTargetError(
      'unsafe_url',
      `Hostname ${hostname} resolves to a blocked address (${unsafe.address})`,
    );
  }
  return { url, addresses };
}
