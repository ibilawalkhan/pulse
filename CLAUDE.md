# CLAUDE.md — Pulse Project Guide

This file gives Claude Code the context and rules for working in this repository. The full architecture, diagrams, data model, and milestone plan live in **README.md** (also the README) — read it before implementing anything non-trivial.

## What this project is

Pulse is an uptime/API monitoring service: users register HTTP endpoints, a scheduler enqueues checks to SQS, a worker executes them, records results in Postgres, detects UP→DOWN transitions, and sends email (SES) + Slack alerts. It is a portfolio project whose purpose is to demonstrate **production-grade backend and cloud engineering**. Code quality, tests, and infrastructure matter more than feature count.

## Owner context (matters for decisions)

- Solo developer, ~10–15 hrs/week, target: finished MVP in 4 weeks
- The repo will be read by hiring managers — code must be clean, idiomatic, and explainable
- Every architectural choice must be defensible in a job interview; when you make one, add 2–3 sentences to the "Design Decisions" section of README.md

## Tech stack (fixed — do not substitute)

- **Backend:** NestJS 10+, TypeScript strict mode, Node 20
- **DB:** PostgreSQL 16 via Prisma; schema lives in `packages/db/prisma/schema.prisma`
- **Queue:** AWS SQS (LocalStack locally) — not RabbitMQ, not Redis queues, not BullMQ
- **Infra:** Terraform in `infra/` — never create AWS resources outside Terraform
- **CI/CD:** GitHub Actions (`.github/workflows/ci.yml`, `deploy.yml`)
- **Frontend:** React 18 + Vite + recharts in `apps/web` — keep it minimal and functional
- **Tests:** Jest; integration tests use testcontainers for Postgres

## Repository layout

npm workspaces monorepo:

```
apps/api        NestJS REST API (auth, monitors, incidents, alert-channels, health)
apps/scheduler  standalone Nest app: claim-and-enqueue loop (singleton service)
apps/worker     standalone Nest app: SQS consumer, HTTP checker, incident state machine, alert senders
apps/web        React dashboard
packages/db     Prisma schema + generated client (shared)
packages/shared DTOs, types, constants shared across apps
infra/          Terraform
```

## Commands

```bash
npm run dev          # all services in watch mode (requires: docker compose up -d)
npm run db:migrate   # prisma migrate dev
npm run test         # unit tests
npm run test:int     # integration tests (testcontainers)
npm run lint         # eslint + prettier check
npm run build        # build all workspaces
```

Always run `npm run lint && npm run test` before declaring a task complete.

## Hard rules

1. **Scope discipline.** Implement only what is in README.md sections 1 and 12. If a feature isn't in a milestone checklist, do not build it. No Kubernetes, no AI features, no extra alert channels, no status pages. Suggest additions only by noting them under "Future Improvements".
2. **Idempotency invariants.** The scheduler must claim monitors by advancing `next_check_at` *before* enqueueing (README.md §4.1). The worker must tolerate duplicate SQS deliveries (at-least-once) — check results may duplicate harmlessly; incident transitions must not (guard with the monitor's current status in the same transaction).
3. **Transactions.** Status transition + incident insert/update + consecutive_failures update happen in a single Prisma transaction.
4. **No secrets in code or git.** Local config via `.env` (gitignored, with `.env.example` kept current). Production secrets only in AWS Secrets Manager via Terraform.
5. **Errors and logging.** Structured JSON logs (pino) with `service`, `monitorId`, `requestId` fields. API errors use the standard envelope `{statusCode, message, error}`. Never swallow exceptions silently; failed alert deliveries are recorded as `alert_event.delivery_status = FAILED`, not thrown away.
6. **Validation everywhere.** Every API input through class-validator DTOs in `packages/shared`. URL validation must reject non-http(s) schemes and private/loopback IP ranges (SSRF guard) — monitored URLs are user input hitting our worker.
7. **Tests are part of the task.** New module = unit tests for the service layer. The incident state machine (worker) requires exhaustive tests: threshold boundaries, flapping, recovery, paused monitors.
8. **Migrations are forward-only** once merged to main. Never edit an applied migration; create a new one.
9. **Terraform discipline.** `terraform fmt` + `terraform validate` must pass. Least-privilege IAM: worker gets SQS consume + SES send only; api gets neither.
10. **Conventional commits** (`feat:`, `fix:`, `chore:`, `infra:`, `test:`). Small, reviewable commits — the git history is part of the portfolio.

## Code style

- TypeScript `strict: true`; no `any` without an inline justification comment
- NestJS idioms: modules per domain, thin controllers, logic in services, repositories via Prisma client from `packages/db`
- Prefer explicit, boring code over clever abstractions — readability for a reviewer is the priority
- Australian English in user-facing strings and docs (organise, colour)

## Definition of done (any task)

- [ ] Lint + unit tests pass locally
- [ ] Integration test added/updated if behaviour crosses a service boundary
- [ ] `.env.example`, README.md, and this file updated if config/architecture changed
- [ ] No TODOs left without a linked issue
