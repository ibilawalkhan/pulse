import { Injectable, NotFoundException } from '@nestjs/common';
import type { IncidentResponse } from '@pulse/shared';
import { toIncidentResponse } from './incidents.mapper';
import { IncidentsRepository } from './incidents.repository';

@Injectable()
export class IncidentsService {
  constructor(private readonly repository: IncidentsRepository) {}

  /** Incident history for a monitor the user owns (404 otherwise). */
  async listForMonitor(userId: string, monitorId: string): Promise<IncidentResponse[]> {
    const owned = await this.repository.findOwnedMonitorId(monitorId, userId);
    if (!owned) {
      throw new NotFoundException('Monitor not found');
    }

    const incidents = await this.repository.findByMonitor(monitorId);
    return incidents.map(toIncidentResponse);
  }
}
