import { lookup } from 'node:dns/promises';
import { Injectable } from '@nestjs/common';
import type { Monitor } from '@pulse/db';
import { CHECK_ERROR, type CheckErrorCode, isPrivateOrReservedIp } from '@pulse/shared';
import type { CheckOutcome } from './check-outcome';

/**
 * Executes the actual HTTP check for a monitor: enforces the SSRF guard at
 * request time (DNS resolution → private-IP rejection), applies the timeout,
 * and classifies the outcome into the shared error taxonomy.
 */
@Injectable()
export class HttpCheckerService {
  async check(monitor: Monitor): Promise<CheckOutcome> {
    // Runtime half of the SSRF guard: a public hostname can still resolve to a
    // private address (DNS rebinding), so re-check after resolution. The input
    // validator only saw the literal string.
    const hostname = this.safeHostname(monitor.url);
    if (hostname && (await this.resolvesToPrivateAddress(hostname))) {
      return {
        success: false,
        statusCode: null,
        responseTimeMs: 0,
        error: CHECK_ERROR.SSRF_BLOCKED,
      };
    }

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), monitor.timeoutMs);
    const start = Date.now();

    try {
      const response = await fetch(monitor.url, {
        method: monitor.method,
        signal: controller.signal,
        redirect: 'follow',
      });
      const responseTimeMs = Date.now() - start;
      const success = response.status === monitor.expectedStatus;
      return {
        success,
        statusCode: response.status,
        responseTimeMs,
        error: success ? null : CHECK_ERROR.UNEXPECTED_STATUS,
      };
    } catch (err) {
      return {
        success: false,
        statusCode: null,
        responseTimeMs: Date.now() - start,
        error: this.classifyError(err),
      };
    } finally {
      clearTimeout(timer);
    }
  }

  private safeHostname(url: string): string | null {
    try {
      return new URL(url).hostname;
    } catch {
      return null;
    }
  }

  /** lookup() accepts both hostnames and IP literals, returning the address(es). */
  private async resolvesToPrivateAddress(hostname: string): Promise<boolean> {
    try {
      const addresses = await lookup(hostname, { all: true });
      return addresses.some((entry) => isPrivateOrReservedIp(entry.address));
    } catch {
      // Unresolvable — let the fetch below surface it as a DNS error.
      return false;
    }
  }

  private classifyError(err: unknown): CheckErrorCode {
    if (err instanceof Error && err.name === 'AbortError') {
      return CHECK_ERROR.TIMEOUT;
    }
    const code = this.errorCode(err);
    if (code === 'ENOTFOUND' || code === 'EAI_AGAIN') {
      return CHECK_ERROR.DNS;
    }
    if (code === 'ECONNREFUSED') {
      return CHECK_ERROR.CONNECTION_REFUSED;
    }
    return CHECK_ERROR.UNKNOWN;
  }

  /** fetch wraps low-level network errors; the OS code sits on err.cause. */
  private errorCode(err: unknown): string | undefined {
    const cause = err instanceof Error ? (err.cause as { code?: string } | undefined) : undefined;
    return cause?.code;
  }
}
