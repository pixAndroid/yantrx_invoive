-- AlterTable
ALTER TABLE "site_configs" ADD COLUMN IF NOT EXISTS "stat4Value" TEXT,
ADD COLUMN IF NOT EXISTS "stat4Label" TEXT;
