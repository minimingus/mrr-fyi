-- Baseline migration capturing all schema changes applied via `prisma db push`
-- These changes already exist in the production database.
-- This migration is marked as applied without executing to sync migration history.

-- CreateEnum (if not exists)
DO $$ BEGIN
  CREATE TYPE "FounderCategory" AS ENUM ('SAAS', 'ECOMMERCE', 'AGENCY', 'CREATOR', 'MARKETPLACE', 'DEV_TOOLS', 'OTHER');
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- AlterTable Founder: add fields added after init migration
ALTER TABLE "Founder"
  ADD COLUMN IF NOT EXISTS "emailVerified"    BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS "emailVerifyToken" TEXT,
  ADD COLUMN IF NOT EXISTS "referralCode"     TEXT,
  ADD COLUMN IF NOT EXISTS "referredBy"       TEXT,
  ADD COLUMN IF NOT EXISTS "onboardingStep"   INTEGER NOT NULL DEFAULT 0;

-- CreateIndex on Founder (idempotent)
DO $$ BEGIN
  CREATE UNIQUE INDEX "Founder_emailVerifyToken_key" ON "Founder"("emailVerifyToken");
EXCEPTION WHEN duplicate_table THEN null; END $$;

DO $$ BEGIN
  CREATE UNIQUE INDEX "Founder_referralCode_key" ON "Founder"("referralCode");
EXCEPTION WHEN duplicate_table THEN null; END $$;

-- AlterTable Payment: migrate from stripeId to externalId, add trial fields
ALTER TABLE "Payment"
  ADD COLUMN IF NOT EXISTS "externalId"    TEXT,
  ADD COLUMN IF NOT EXISTS "trialEndsAt"   TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "trialReminder" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS "trialExpiredNotice" BOOLEAN NOT NULL DEFAULT false;

-- Drop old stripeId if it still exists
ALTER TABLE "Payment" DROP COLUMN IF EXISTS "stripeId";

-- CreateIndex on Payment.externalId
DO $$ BEGIN
  CREATE UNIQUE INDEX "Payment_externalId_key" ON "Payment"("externalId");
EXCEPTION WHEN duplicate_table THEN null; END $$;

-- CreateTable MRRMilestone
CREATE TABLE IF NOT EXISTS "MRRMilestone" (
  "id"        TEXT NOT NULL,
  "founderId" TEXT NOT NULL,
  "amount"    INTEGER NOT NULL,
  "reachedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "MRRMilestone_pkey" PRIMARY KEY ("id")
);

DO $$ BEGIN
  ALTER TABLE "MRRMilestone" ADD CONSTRAINT "MRRMilestone_founderId_fkey"
    FOREIGN KEY ("founderId") REFERENCES "Founder"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE UNIQUE INDEX "MRRMilestone_founderId_amount_key" ON "MRRMilestone"("founderId", "amount");
EXCEPTION WHEN duplicate_table THEN null; END $$;

DO $$ BEGIN
  CREATE INDEX "MRRMilestone_founderId_idx" ON "MRRMilestone"("founderId");
EXCEPTION WHEN duplicate_table THEN null; END $$;

-- CreateTable Referral
CREATE TABLE IF NOT EXISTS "Referral" (
  "id"         TEXT NOT NULL,
  "referrerId" TEXT NOT NULL,
  "referredId" TEXT NOT NULL,
  "createdAt"  TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Referral_pkey" PRIMARY KEY ("id")
);

DO $$ BEGIN
  ALTER TABLE "Referral" ADD CONSTRAINT "Referral_referrerId_fkey"
    FOREIGN KEY ("referrerId") REFERENCES "Founder"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  ALTER TABLE "Referral" ADD CONSTRAINT "Referral_referredId_fkey"
    FOREIGN KEY ("referredId") REFERENCES "Founder"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE UNIQUE INDEX "Referral_referrerId_referredId_key" ON "Referral"("referrerId", "referredId");
EXCEPTION WHEN duplicate_table THEN null; END $$;

DO $$ BEGIN
  CREATE INDEX "Referral_referrerId_idx" ON "Referral"("referrerId");
EXCEPTION WHEN duplicate_table THEN null; END $$;
