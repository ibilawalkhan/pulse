# Multi-stage build for the pulse-scheduler service (built from the monorepo root).
# Build context must be the repo root: `docker build -f apps/scheduler/Dockerfile .`

FROM node:20-alpine AS builder
WORKDIR /app

COPY package.json package-lock.json ./
COPY packages/db/package.json packages/db/
COPY packages/shared/package.json packages/shared/
COPY apps/api/package.json apps/api/
COPY apps/scheduler/package.json apps/scheduler/
COPY apps/worker/package.json apps/worker/
COPY apps/web/package.json apps/web/
RUN npm ci

COPY . .
RUN npx prisma generate --schema packages/db/prisma/schema.prisma \
  && npm run build --workspace packages/db --workspace packages/shared --workspace apps/scheduler
RUN npm prune --omit=dev

FROM node:20-alpine AS runner
ENV NODE_ENV=production
WORKDIR /app

COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/packages ./packages
COPY --from=builder /app/apps/scheduler/dist ./apps/scheduler/dist
COPY --from=builder /app/apps/scheduler/package.json ./apps/scheduler/package.json

CMD ["node", "apps/scheduler/dist/main.js"]
