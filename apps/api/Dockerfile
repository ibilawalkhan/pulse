# Multi-stage build for the pulse-api service (built from the monorepo root).
# Build context must be the repo root: `docker build -f apps/api/Dockerfile .`

FROM node:20-alpine AS builder
WORKDIR /app

# Install workspace dependencies using only the manifests first (better caching).
COPY package.json package-lock.json ./
COPY packages/db/package.json packages/db/
COPY packages/shared/package.json packages/shared/
COPY apps/api/package.json apps/api/
COPY apps/scheduler/package.json apps/scheduler/
COPY apps/worker/package.json apps/worker/
COPY apps/web/package.json apps/web/
RUN npm ci

# Build the shared packages + this app, generating the Prisma client.
COPY . .
RUN npx prisma generate --schema packages/db/prisma/schema.prisma \
  && npm run build --workspace packages/db --workspace packages/shared --workspace apps/api

FROM node:20-alpine AS runner
ENV NODE_ENV=production
WORKDIR /app

# Dev deps are kept so this image can also run `prisma migrate deploy` as the
# one-off migration task in the deploy pipeline. Slimming is a future optimisation.
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/packages ./packages
COPY --from=builder /app/apps/api/dist ./apps/api/dist
COPY --from=builder /app/apps/api/package.json ./apps/api/package.json

EXPOSE 3000
CMD ["node", "apps/api/dist/main.js"]
