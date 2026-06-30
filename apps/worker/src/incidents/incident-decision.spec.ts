import { MonitorStatus } from '@pulse/db';
import type { CheckOutcome } from '../checker/check-outcome';
import { decideIncidentTransition, type MonitorState } from './incident-decision';

const success: CheckOutcome = { success: true, statusCode: 200, responseTimeMs: 50, error: null };
const failure: CheckOutcome = {
  success: false,
  statusCode: null,
  responseTimeMs: 0,
  error: 'TIMEOUT',
};

function state(partial: Partial<MonitorState> = {}): MonitorState {
  return { status: MonitorStatus.UP, consecutiveFailures: 0, failureThreshold: 2, ...partial };
}

describe('decideIncidentTransition', () => {
  describe('failures crossing the threshold', () => {
    it('stays up but counts the first failure (below threshold)', () => {
      const d = decideIncidentTransition(state({ consecutiveFailures: 0 }), failure);
      expect(d).toEqual({ kind: 'updateFailures', consecutiveFailures: 1 });
    });

    it('goes DOWN exactly at the threshold', () => {
      const d = decideIncidentTransition(state({ consecutiveFailures: 1 }), failure);
      expect(d).toEqual({ kind: 'wentDown', consecutiveFailures: 2 });
    });

    it('goes DOWN on the first failure when threshold is 1', () => {
      const d = decideIncidentTransition(state({ failureThreshold: 1 }), failure);
      expect(d).toEqual({ kind: 'wentDown', consecutiveFailures: 1 });
    });

    it('keeps counting while already DOWN without re-opening', () => {
      const d = decideIncidentTransition(
        state({ status: MonitorStatus.DOWN, consecutiveFailures: 5 }),
        failure,
      );
      expect(d).toEqual({ kind: 'updateFailures', consecutiveFailures: 6 });
    });
  });

  describe('recovery', () => {
    it('recovers on the first success after being DOWN', () => {
      const d = decideIncidentTransition(
        state({ status: MonitorStatus.DOWN, consecutiveFailures: 3 }),
        success,
      );
      expect(d).toEqual({ kind: 'recovered', consecutiveFailures: 0 });
    });
  });

  describe('pending (newly created) monitors', () => {
    it('becomes UP on first success', () => {
      const d = decideIncidentTransition(state({ status: MonitorStatus.PENDING }), success);
      expect(d).toEqual({ kind: 'cameUp', consecutiveFailures: 0 });
    });

    it('goes DOWN once it reaches the threshold', () => {
      const d = decideIncidentTransition(
        state({ status: MonitorStatus.PENDING, consecutiveFailures: 1 }),
        failure,
      );
      expect(d).toEqual({ kind: 'wentDown', consecutiveFailures: 2 });
    });
  });

  describe('healthy steady state', () => {
    it('is a noop when already UP with no failures', () => {
      expect(decideIncidentTransition(state(), success)).toEqual({ kind: 'noop' });
    });

    it('resets the counter when a success follows a sub-threshold failure', () => {
      const d = decideIncidentTransition(state({ consecutiveFailures: 1 }), success);
      expect(d).toEqual({ kind: 'cameUp', consecutiveFailures: 0 });
    });
  });

  describe('flapping sequence (threshold 2)', () => {
    it('only transitions on real threshold crossings, not on every blip', () => {
      let s = state({ consecutiveFailures: 0 });
      const kinds: string[] = [];

      const apply = (outcome: CheckOutcome): void => {
        const d = decideIncidentTransition(s, outcome);
        kinds.push(d.kind);
        // advance the state as the service would persist it
        if (d.kind === 'wentDown')
          s = { ...s, status: MonitorStatus.DOWN, consecutiveFailures: d.consecutiveFailures };
        else if (d.kind === 'recovered' || d.kind === 'cameUp')
          s = { ...s, status: MonitorStatus.UP, consecutiveFailures: 0 };
        else if (d.kind === 'updateFailures')
          s = { ...s, consecutiveFailures: d.consecutiveFailures };
      };

      // fail, fail (DOWN), succeed (recover), fail (just a blip), succeed
      apply(failure);
      apply(failure);
      apply(success);
      apply(failure);
      apply(success);

      expect(kinds).toEqual([
        'updateFailures',
        'wentDown',
        'recovered',
        'updateFailures',
        'cameUp',
      ]);
    });
  });
});
