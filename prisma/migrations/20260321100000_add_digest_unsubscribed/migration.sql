-- Add digestUnsubscribedAt to Founder for weekly digest unsubscribe
ALTER TABLE "Founder"
  ADD COLUMN IF NOT EXISTS "digestUnsubscribedAt" TIMESTAMP(3);
