import type { Incident } from '@pulse/db';
import type { IncidentResponse } from '@pulse/shared';

/** Map an Incident entity to its public API representation, with duration. */
export function toIncidentResponse(incident: Incident): IncidentResponse {
  // Ongoing incidents (resolvedAt === null) measure duration up to now.
  const end = incident.resolvedAt ?? new Date();
  return {
    id: incident.id,
    startedAt: incident.startedAt.toISOString(),
    resolvedAt: incident.resolvedAt ? incident.resolvedAt.toISOString() : null,
    cause: incident.cause,
    durationSeconds: Math.round((end.getTime() - incident.startedAt.getTime()) / 1000),
  };
}
