-- CreateEnum
CREATE TYPE "VerificationStatus" AS ENUM ('SELF_REPORTED', 'CONNECTED', 'VERIFIED');

-- AlterTable
ALTER TABLE "Founder" ADD COLUMN "verificationStatus" "VerificationStatus" NOT NULL DEFAULT 'SELF_REPORTED',
ADD COLUMN "trustScore" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN "mrrRangeMin" INTEGER,
ADD COLUMN "mrrRangeMax" INTEGER;

-- DataMigration: populate verificationStatus from existing stripeAccountId + verified fields
UPDATE "Founder"
SET "verificationStatus" = CASE
  WHEN verified = true AND "stripeAccountId" IS NOT NULL THEN 'VERIFIED'::"VerificationStatus"
  WHEN "stripeAccountId" IS NOT NULL AND verified = false THEN 'CONNECTED'::"VerificationStatus"
  ELSE 'SELF_REPORTED'::"VerificationStatus"
END;
