import { Module } from '@nestjs/common';
import { AlertsRepository } from '../alerts/alerts.repository';
import { AlertsService } from '../alerts/alerts.service';
import { EmailSender } from '../alerts/email.sender';
import { sesClientProvider } from '../alerts/ses.client.provider';
import { SlackSender } from '../alerts/slack.sender';
import { HttpCheckerService } from '../checker/http-checker.service';
import { IncidentsService } from '../incidents/incidents.service';
import { PrismaModule } from '../prisma/prisma.module';
import { CheckConsumerService } from '../sqs/check-consumer.service';
import { sqsClientProvider } from '../sqs/sqs.client.provider';
import { CheckProcessorService } from './check-processor.service';
import { WorkerRepository } from './worker.repository';

@Module({
  imports: [PrismaModule],
  providers: [
    // consumer + checker (part A)
    sqsClientProvider,
    CheckConsumerService,
    CheckProcessorService,
    HttpCheckerService,
    WorkerRepository,
    // incident state machine (part B)
    IncidentsService,
    // alerting (part B)
    sesClientProvider,
    AlertsService,
    AlertsRepository,
    EmailSender,
    SlackSender,
  ],
})
export class WorkerModule {}
