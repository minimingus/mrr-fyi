-- CreateEnum
CREATE TYPE "PaymentType" AS ENUM ('FEATURED', 'VERIFIED');

-- CreateTable
CREATE TABLE "Founder" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "twitter" TEXT,
    "productName" TEXT NOT NULL,
    "productUrl" TEXT NOT NULL,
    "description" TEXT,
    "mrr" INTEGER NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "verified" BOOLEAN NOT NULL DEFAULT false,
    "featured" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Founder_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MRRSnapshot" (
    "id" TEXT NOT NULL,
    "founderId" TEXT NOT NULL,
    "mrr" INTEGER NOT NULL,
    "recordedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MRRSnapshot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Payment" (
    "id" TEXT NOT NULL,
    "founderId" TEXT NOT NULL,
    "type" "PaymentType" NOT NULL,
    "stripeId" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Payment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Founder_slug_key" ON "Founder"("slug");

-- CreateIndex
CREATE INDEX "Founder_mrr_idx" ON "Founder"("mrr" DESC);

-- CreateIndex
CREATE INDEX "Founder_featured_idx" ON "Founder"("featured");

-- CreateIndex
CREATE INDEX "MRRSnapshot_founderId_recordedAt_idx" ON "MRRSnapshot"("founderId", "recordedAt");

-- CreateIndex
CREATE UNIQUE INDEX "Payment_stripeId_key" ON "Payment"("stripeId");

-- AddForeignKey
ALTER TABLE "MRRSnapshot" ADD CONSTRAINT "MRRSnapshot_founderId_fkey" FOREIGN KEY ("founderId") REFERENCES "Founder"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_founderId_fkey" FOREIGN KEY ("founderId") REFERENCES "Founder"("id") ON DELETE CASCADE ON UPDATE CASCADE;
