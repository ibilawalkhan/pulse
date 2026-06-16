-- CreateEnum
CREATE TYPE "MonitorStatus" AS ENUM ('UP', 'DOWN', 'PAUSED', 'PENDING');

-- CreateEnum
CREATE TYPE "HttpMethod" AS ENUM ('GET', 'POST', 'HEAD');

-- CreateEnum
CREATE TYPE "AlertChannelType" AS ENUM ('EMAIL', 'SLACK_WEBHOOK');

-- CreateEnum
CREATE TYPE "AlertKind" AS ENUM ('DOWN', 'RECOVERED');

-- CreateEnum
CREATE TYPE "DeliveryStatus" AS ENUM ('SENT', 'FAILED');

-- CreateTable
CREATE TABLE "user" (
    "id" UUID NOT NULL,
    "email" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "monitor" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "method" "HttpMethod" NOT NULL DEFAULT 'GET',
    "interval_seconds" INTEGER NOT NULL,
    "expected_status" INTEGER NOT NULL DEFAULT 200,
    "timeout_ms" INTEGER NOT NULL DEFAULT 10000,
    "failure_threshold" INTEGER NOT NULL DEFAULT 2,
    "status" "MonitorStatus" NOT NULL DEFAULT 'PENDING',
    "consecutive_failures" INTEGER NOT NULL DEFAULT 0,
    "next_check_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "monitor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "check_result" (
    "id" BIGSERIAL NOT NULL,
    "monitor_id" UUID NOT NULL,
    "success" BOOLEAN NOT NULL,
    "status_code" INTEGER,
    "response_time_ms" INTEGER NOT NULL,
    "error" TEXT,
    "checked_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "check_result_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "incident" (
    "id" UUID NOT NULL,
    "monitor_id" UUID NOT NULL,
    "started_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolved_at" TIMESTAMPTZ(6),
    "cause" TEXT,

    CONSTRAINT "incident_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "alert_channel" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "type" "AlertChannelType" NOT NULL,
    "destination" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "alert_channel_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "alert_event" (
    "id" UUID NOT NULL,
    "incident_id" UUID NOT NULL,
    "channel_id" UUID NOT NULL,
    "kind" "AlertKind" NOT NULL,
    "delivery_status" "DeliveryStatus" NOT NULL,
    "sent_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "alert_event_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "user_email_key" ON "user"("email");

-- CreateIndex
CREATE INDEX "monitor_next_check_at_idx" ON "monitor"("next_check_at");

-- CreateIndex
CREATE INDEX "monitor_user_id_idx" ON "monitor"("user_id");

-- CreateIndex
CREATE INDEX "check_result_monitor_id_checked_at_idx" ON "check_result"("monitor_id", "checked_at" DESC);

-- CreateIndex
CREATE INDEX "incident_monitor_id_started_at_idx" ON "incident"("monitor_id", "started_at" DESC);

-- CreateIndex
CREATE INDEX "alert_channel_user_id_idx" ON "alert_channel"("user_id");

-- CreateIndex
CREATE INDEX "alert_event_incident_id_idx" ON "alert_event"("incident_id");

-- AddForeignKey
ALTER TABLE "monitor" ADD CONSTRAINT "monitor_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "check_result" ADD CONSTRAINT "check_result_monitor_id_fkey" FOREIGN KEY ("monitor_id") REFERENCES "monitor"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "incident" ADD CONSTRAINT "incident_monitor_id_fkey" FOREIGN KEY ("monitor_id") REFERENCES "monitor"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "alert_channel" ADD CONSTRAINT "alert_channel_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "alert_event" ADD CONSTRAINT "alert_event_incident_id_fkey" FOREIGN KEY ("incident_id") REFERENCES "incident"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "alert_event" ADD CONSTRAINT "alert_event_channel_id_fkey" FOREIGN KEY ("channel_id") REFERENCES "alert_channel"("id") ON DELETE CASCADE ON UPDATE CASCADE;
