import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { createPrismaAdapter, PrismaClient } from '@pulse/db';

/** Wraps the shared Prisma client and ties its lifecycle to the Nest module. */
@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  constructor() {
    super({ adapter: createPrismaAdapter() });
  }

  async onModuleInit(): Promise<void> {
    await this.$connect();
  }

  async onModuleDestroy(): Promise<void> {
    await this.$disconnect();
  }
}
