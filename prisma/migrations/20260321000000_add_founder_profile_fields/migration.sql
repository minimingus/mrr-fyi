-- Add bio, websiteUrl, and avatarUrl to Founder profile
ALTER TABLE "Founder"
  ADD COLUMN IF NOT EXISTS "bio"        TEXT,
  ADD COLUMN IF NOT EXISTS "websiteUrl" TEXT,
  ADD COLUMN IF NOT EXISTS "avatarUrl"  TEXT;
