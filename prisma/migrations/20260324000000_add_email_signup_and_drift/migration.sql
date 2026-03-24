-- CreateEnum
CREATE TYPE IF NOT EXISTS "PaymentProvider" AS ENUM ('LEMON_SQUEEZY', 'STRIPE');

-- CreateTable
CREATE TABLE IF NOT EXISTS "EmailSignup" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "source" TEXT NOT NULL DEFAULT 'homepage',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EmailSignup_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "EmailSignup_email_key" ON "EmailSignup"("email");

-- AlterTable
ALTER TABLE "Founder" ADD COLUMN IF NOT EXISTS "digestUnsubscribedAt" TIMESTAMP(3);
ALTER TABLE "Founder" ADD COLUMN IF NOT EXISTS "stripeAccountId" TEXT;
ALTER TABLE "Founder" ADD COLUMN IF NOT EXISTS "stripeMrr" INTEGER;

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "Founder_stripeAccountId_key" ON "Founder"("stripeAccountId");

-- AlterTable
ALTER TABLE "Payment" ADD COLUMN IF NOT EXISTS "provider" "PaymentProvider" NOT NULL DEFAULT 'LEMON_SQUEEZY';
ALTER TABLE "Payment" ADD COLUMN IF NOT EXISTS "trialUrgencyReminder" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Payment" ALTER COLUMN "externalId" SET NOT NULL;
