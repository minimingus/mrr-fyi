-- CreateEnum
CREATE TYPE "FounderCategory" AS ENUM ('SAAS', 'ECOMMERCE', 'AGENCY', 'CREATOR', 'MARKETPLACE', 'DEV_TOOLS', 'OTHER');

-- AlterTable
ALTER TABLE "Founder" ADD COLUMN "category" "FounderCategory";
