import { join } from 'node:path';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ServeStaticModule } from '@nestjs/serve-static';
import { LoggerModule } from 'nestjs-pino';
import { AlertChannelsModule } from './alert-channels/alert-channels.module';
import { AuthModule } from './auth/auth.module';
import { HealthModule } from './health/health.module';
import { IncidentsModule } from './incidents/incidents.module';
import { MonitorsModule } from './monitors/monitors.module';
import { PrismaModule } from './prisma/prisma.module';
import { StatsModule } from './stats/stats.module';

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
    IncidentsModule,
    StatsModule,
    // Serve the built React app (same origin as the API). The API route
    // prefixes are excluded so they fall through to the controllers; every
    // other path returns index.html for client-side routing.
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', '..', 'web', 'dist'),
      exclude: ['/auth(.*)', '/monitors(.*)', '/alert-channels(.*)', '/health(.*)', '/docs(.*)'],
    }),
  ],
})
export class AppModule {}
