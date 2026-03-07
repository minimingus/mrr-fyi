/*
  Warnings:

  - A unique constraint covering the columns `[updateToken]` on the table `Founder` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "Founder" ADD COLUMN     "email" TEXT,
ADD COLUMN     "updateToken" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Founder_updateToken_key" ON "Founder"("updateToken");
