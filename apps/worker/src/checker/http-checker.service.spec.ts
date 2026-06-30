import { lookup } from 'node:dns/promises';
import type { Monitor } from '@pulse/db';
import { CHECK_ERROR } from '@pulse/shared';
import { HttpCheckerService } from './http-checker.service';

jest.mock('node:dns/promises', () => ({ lookup: jest.fn() }));

const lookupMock = lookup as jest.MockedFunction<typeof lookup>;

const monitor = {
  url: 'https://api.acme.io/health',
  method: 'GET',
  timeoutMs: 10000,
  expectedStatus: 200,
} as Monitor;

describe('HttpCheckerService', () => {
  let service: HttpCheckerService;
  const fetchMock = jest.fn();

  beforeEach(() => {
    service = new HttpCheckerService();
    fetchMock.mockReset();
    lookupMock.mockReset();
    // Default: resolves to a public address.
    lookupMock.mockResolvedValue([{ address: '93.184.216.34', family: 4 }]);
    global.fetch = fetchMock as unknown as typeof fetch;
  });

  it('succeeds when the status matches expectedStatus', async () => {
    fetchMock.mockResolvedValue({ status: 200 });
    const outcome = await service.check(monitor);
    expect(outcome).toMatchObject({ success: true, statusCode: 200, error: null });
  });

  it('fails with UNEXPECTED_STATUS on a status mismatch', async () => {
    fetchMock.mockResolvedValue({ status: 503 });
    const outcome = await service.check(monitor);
    expect(outcome).toMatchObject({
      success: false,
      statusCode: 503,
      error: CHECK_ERROR.UNEXPECTED_STATUS,
    });
  });

  it('classifies an aborted request as TIMEOUT', async () => {
    const abort = new Error('aborted');
    abort.name = 'AbortError';
    fetchMock.mockRejectedValue(abort);
    const outcome = await service.check(monitor);
    expect(outcome.error).toBe(CHECK_ERROR.TIMEOUT);
  });

  it('classifies a DNS failure', async () => {
    const err = new TypeError('fetch failed');
    (err as Error & { cause?: unknown }).cause = { code: 'ENOTFOUND' };
    fetchMock.mockRejectedValue(err);
    const outcome = await service.check(monitor);
    expect(outcome.error).toBe(CHECK_ERROR.DNS);
  });

  it('classifies a refused connection', async () => {
    const err = new TypeError('fetch failed');
    (err as Error & { cause?: unknown }).cause = { code: 'ECONNREFUSED' };
    fetchMock.mockRejectedValue(err);
    const outcome = await service.check(monitor);
    expect(outcome.error).toBe(CHECK_ERROR.CONNECTION_REFUSED);
  });

  it('blocks a host that resolves to a private address (SSRF) without fetching', async () => {
    lookupMock.mockResolvedValue([{ address: '10.0.0.5', family: 4 }]);
    const outcome = await service.check(monitor);
    expect(outcome.error).toBe(CHECK_ERROR.SSRF_BLOCKED);
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
