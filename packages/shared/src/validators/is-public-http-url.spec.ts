import { isPublicHttpUrl } from './is-public-http-url';

describe('isPublicHttpUrl', () => {
  it('accepts public http(s) URLs', () => {
    expect(isPublicHttpUrl('https://api.acme.io/health')).toBe(true);
    expect(isPublicHttpUrl('http://example.com')).toBe(true);
    expect(isPublicHttpUrl('https://8.8.8.8/')).toBe(true);
    expect(isPublicHttpUrl('https://sub.domain.co.uk:8443/path?q=1')).toBe(true);
  });

  it('rejects non-http(s) schemes', () => {
    expect(isPublicHttpUrl('ftp://example.com')).toBe(false);
    expect(isPublicHttpUrl('file:///etc/passwd')).toBe(false);
    expect(isPublicHttpUrl('gopher://example.com')).toBe(false);
    expect(isPublicHttpUrl('javascript:alert(1)')).toBe(false);
  });

  it('rejects malformed and empty values', () => {
    expect(isPublicHttpUrl('not a url')).toBe(false);
    expect(isPublicHttpUrl('')).toBe(false);
    expect(isPublicHttpUrl(undefined)).toBe(false);
    expect(isPublicHttpUrl(123)).toBe(false);
  });

  it('rejects localhost and local names', () => {
    expect(isPublicHttpUrl('http://localhost')).toBe(false);
    expect(isPublicHttpUrl('http://localhost:3000/x')).toBe(false);
    expect(isPublicHttpUrl('http://db.local')).toBe(false);
    expect(isPublicHttpUrl('http://foo.localhost')).toBe(false);
  });

  it('rejects private, loopback, link-local and reserved IPv4', () => {
    expect(isPublicHttpUrl('http://127.0.0.1')).toBe(false);
    expect(isPublicHttpUrl('http://10.0.0.5')).toBe(false);
    expect(isPublicHttpUrl('http://172.16.0.1')).toBe(false);
    expect(isPublicHttpUrl('http://172.31.255.254')).toBe(false);
    expect(isPublicHttpUrl('http://192.168.1.1')).toBe(false);
    expect(isPublicHttpUrl('http://169.254.169.254')).toBe(false); // cloud metadata
    expect(isPublicHttpUrl('http://0.0.0.0')).toBe(false);
    expect(isPublicHttpUrl('http://100.64.0.1')).toBe(false);
    expect(isPublicHttpUrl('http://224.0.0.1')).toBe(false);
  });

  it('allows public IPv4 that is near but outside private ranges', () => {
    expect(isPublicHttpUrl('http://172.15.0.1')).toBe(true);
    expect(isPublicHttpUrl('http://172.32.0.1')).toBe(true);
    expect(isPublicHttpUrl('http://11.0.0.1')).toBe(true);
  });

  it('rejects private and loopback IPv6 (incl. IPv4-mapped)', () => {
    expect(isPublicHttpUrl('http://[::1]')).toBe(false);
    expect(isPublicHttpUrl('http://[fe80::1]')).toBe(false);
    expect(isPublicHttpUrl('http://[fc00::1]')).toBe(false);
    expect(isPublicHttpUrl('http://[fd12:3456::1]')).toBe(false);
    expect(isPublicHttpUrl('http://[::ffff:127.0.0.1]')).toBe(false);
  });
});
