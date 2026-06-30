import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { LoggerModule } from 'nestjs-pino';
import { AlertChannelsModule } from './alert-channels/alert-channels.module';
import { AuthModule } from './auth/auth.module';
import { HealthModule } from './health/health.module';
import { MonitorsModule } from './monitors/monitors.module';
import { PrismaModule } from './prisma/prisma.module';

@Module({
  imports: [
    // Load the repo-root .env locally; in production env vars are injected
    // directly (no file) and process.env is used as-is.
    ConfigModule.forRoot({ isGlobal: true, envFilePath: ['.env', '../../.env'] }),
    LoggerModule.forRoot({
      pinoHttp: {
        level: process.env.LOG_LEVEL ?? 'info',
        // Pretty-print only outside production; structured JSON in prod.
        transport: process.env.NODE_ENV === 'development' ? { target: 'pino-pretty' } : undefined,
        customProps: () => ({ service: 'pulse-api' }),
      },
    }),
    PrismaModule,
    HealthModule,
    AuthModule,
    MonitorsModule,
    AlertChannelsModule,
  ],
})
export class AppModule {}
