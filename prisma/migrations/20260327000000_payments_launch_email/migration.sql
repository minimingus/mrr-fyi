-- Add unsubscribedAt to EmailSignup
ALTER TABLE "EmailSignup" ADD COLUMN "unsubscribedAt" TIMESTAMP(3);

-- Create SystemEvent table for idempotency tracking
CREATE TABLE "SystemEvent" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SystemEvent_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "SystemEvent_key_key" ON "SystemEvent"("key");
