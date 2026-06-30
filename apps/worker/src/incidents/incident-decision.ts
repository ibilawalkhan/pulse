import { MonitorStatus } from '@pulse/db';
import type { CheckOutcome } from '../checker/check-outcome';

/** The minimal monitor state the decision depends on. */
export interface MonitorState {
  status: MonitorStatus;
  consecutiveFailures: number;
  failureThreshold: number;
}

/**
 * The outcome of the state machine for a single check. Only `wentDown` and
 * `recovered` are alert-worthy; the others just persist (or do nothing).
 */
export type IncidentDecision =
  | { kind: 'noop' }
  | { kind: 'cameUp'; consecutiveFailures: 0 }
  | { kind: 'updateFailures'; consecutiveFailures: number }
  | { kind: 'wentDown'; consecutiveFailures: number }
  | { kind: 'recovered'; consecutiveFailures: 0 };

/**
 * Pure incident state machine. Given the monitor's *current*
 * state and a check outcome, decide the transition — with no side effects, so
 * every edge case (threshold boundaries, flapping, recovery, pending) is unit
 * testable in isolation. Paused monitors are filtered out before this runs.
 */
export function decideIncidentTransition(
  monitor: MonitorState,
  outcome: CheckOutcome,
): IncidentDecision {
  if (outcome.success) {
    if (monitor.status === MonitorStatus.DOWN) {
      return { kind: 'recovered', consecutiveFailures: 0 };
    }
    // Already healthy with a clean counter — nothing changed.
    if (monitor.status === MonitorStatus.UP && monitor.consecutiveFailures === 0) {
      return { kind: 'noop' };
    }
    // First success of a PENDING monitor, or a recovery that was still below
    // the DOWN threshold: become UP and reset the counter (no alert).
    return { kind: 'cameUp', consecutiveFailures: 0 };
  }

  const consecutiveFailures = monitor.consecutiveFailures + 1;

  // Already DOWN — keep counting, but don't re-open an incident or re-alert.
  if (monitor.status === MonitorStatus.DOWN) {
    return { kind: 'updateFailures', consecutiveFailures };
  }

  if (consecutiveFailures >= monitor.failureThreshold) {
    return { kind: 'wentDown', consecutiveFailures };
  }

  return { kind: 'updateFailures', consecutiveFailures };
}
