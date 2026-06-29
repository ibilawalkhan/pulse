import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { createPrismaAdapter, PrismaClient } from '@pulse/db';

/** Wraps the shared Prisma client and ties its lifecycle to the Nest module. */
@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  constructor() {
    // Prisma 7 connects via a driver adapter rather than a schema-level URL.
    super({ adapter: createPrismaAdapter() });
  }

  async onModuleInit(): Promise<void> {
    await this.$connect();
  }

  async onModuleDestroy(): Promise<void> {
    await this.$disconnect();
  }
}
