// application code imports everything DB-related from a single package.
export * from '@prisma/client';
export { PrismaClient } from '@prisma/client';

import { PrismaPg } from '@prisma/adapter-pg';

/**
 * Builds the Postgres driver adapter the runtime PrismaClient needs (Prisma 7
 * removed the schema-level connection URL). Kept here so the `@prisma/adapter-pg`
 * + `pg` dependencies live only in this package.
 */
export function createPrismaAdapter(connectionString = process.env.DATABASE_URL): PrismaPg {
  if (!connectionString) {
    throw new Error('DATABASE_URL is not set — cannot create the Prisma driver adapter');
  }
  return new PrismaPg(connectionString);
}
