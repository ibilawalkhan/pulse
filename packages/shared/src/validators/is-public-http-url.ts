import {
  registerDecorator,
  type ValidationOptions,
  ValidatorConstraint,
  type ValidatorConstraintInterface,
} from 'class-validator';

/**
 * Input-level SSRF guard for user-supplied monitor URLs.
 *
 * Rejects:
 *  - non-http(s) schemes (file:, gopher:, ftp:, …)
 *  - localhost and *.local / *.localhost names
 *  - literal private, loopback, link-local and reserved IPv4/IPv6 addresses
 *
 * NOTE: this catches literal addresses only. A public hostname that *resolves*
 * to a private IP (DNS rebinding) must be re-checked at request time in the
 * worker, after DNS resolution and before the HTTP call.
 */
export function isPublicHttpUrl(value: unknown): boolean {
  if (typeof value !== 'string' || value.trim() === '') {
    return false;
  }

  let url: URL;
  try {
    url = new URL(value);
  } catch {
    return false;
  }

  if (url.protocol !== 'http:' && url.protocol !== 'https:') {
    return false;
  }

  const host = url.hostname.toLowerCase();
  if (!host) {
    return false;
  }
  if (host === 'localhost' || host.endsWith('.localhost') || host.endsWith('.local')) {
    return false;
  }

  if (isIpv4(host)) {
    return !isPrivateOrReservedIpv4(host);
  }
  // URL.hostname strips the brackets from IPv6 literals, leaving the colons.
  if (host.includes(':')) {
    return !isPrivateOrReservedIpv6(host);
  }

  // A regular DNS hostname — allowed here; the worker performs the
  // resolve-then-check before actually issuing the request.
  return true;
}

/**
 * Whether an IP literal (v4 or v6) falls in a private/loopback/reserved range.
 * Shared between the input validator and the worker's runtime DNS re-check so
 * both use the exact same range definitions. Returns false for non-IP strings.
 */
export function isPrivateOrReservedIp(ip: string): boolean {
  const normalized = ip.toLowerCase();
  if (isIpv4(normalized)) {
    return isPrivateOrReservedIpv4(normalized);
  }
  if (normalized.includes(':')) {
    return isPrivateOrReservedIpv6(normalized);
  }
  return false;
}

function isIpv4(host: string): boolean {
  const parts = host.split('.');
  if (parts.length !== 4) {
    return false;
  }
  return parts.every((part) => /^\d{1,3}$/.test(part) && Number(part) <= 255);
}

function isPrivateOrReservedIpv4(host: string): boolean {
  const [a, b] = host.split('.').map(Number);
  if (a === 0) return true; // 0.0.0.0/8 "this network"
  if (a === 10) return true; // 10.0.0.0/8 private
  if (a === 127) return true; // 127.0.0.0/8 loopback
  if (a === 169 && b === 254) return true; // 169.254.0.0/16 link-local
  if (a === 172 && b >= 16 && b <= 31) return true; // 172.16.0.0/12 private
  if (a === 192 && b === 168) return true; // 192.168.0.0/16 private
  if (a === 100 && b >= 64 && b <= 127) return true; // 100.64.0.0/10 CGNAT
  if (a >= 224) return true; // 224.0.0.0/4 multicast + 240.0.0.0/4 reserved
  return false;
}

function isPrivateOrReservedIpv6(host: string): boolean {
  const ip = host.replace(/^\[|\]$/g, '');
  if (ip === '::1' || ip === '::') return true; // loopback / unspecified
  if (ip.startsWith('fc') || ip.startsWith('fd')) return true; // fc00::/7 unique-local
  if (/^fe[89ab]/.test(ip)) return true; // fe80::/10 link-local
  // IPv4-mapped: ::ffff:a.b.c.d, or the hex form the URL parser normalises to
  // (e.g. ::ffff:7f00:1). Decode and defer to the IPv4 check.
  if (ip.startsWith('::ffff:')) {
    const mapped = mappedToIpv4(ip.slice('::ffff:'.length));
    return mapped ? isPrivateOrReservedIpv4(mapped) : true;
  }
  return false;
}

/** Decode the tail of an `::ffff:` IPv4-mapped address into dotted IPv4. */
function mappedToIpv4(rest: string): string | null {
  if (rest.includes('.')) {
    return isIpv4(rest) ? rest : null;
  }
  const groups = rest.split(':').filter(Boolean);
  if (groups.length === 0 || groups.some((g) => !/^[0-9a-f]{1,4}$/.test(g))) {
    return null;
  }
  const hex = groups
    .map((g) => g.padStart(4, '0'))
    .join('')
    .padStart(8, '0')
    .slice(-8);
  const octets = [hex.slice(0, 2), hex.slice(2, 4), hex.slice(4, 6), hex.slice(6, 8)];
  return octets.map((h) => parseInt(h, 16)).join('.');
}

@ValidatorConstraint({ name: 'isPublicHttpUrl', async: false })
class IsPublicHttpUrlConstraint implements ValidatorConstraintInterface {
  validate(value: unknown): boolean {
    return isPublicHttpUrl(value);
  }

  defaultMessage(): string {
    return 'url must be a public http(s) endpoint (private, loopback and non-http(s) addresses are rejected)';
  }
}

/** class-validator decorator wrapping {@link isPublicHttpUrl}. */
export function IsPublicHttpUrl(options?: ValidationOptions) {
  return (object: object, propertyName: string): void => {
    registerDecorator({
      name: 'isPublicHttpUrl',
      target: object.constructor,
      propertyName,
      options,
      validator: IsPublicHttpUrlConstraint,
    });
  };
}
