-- AlterTable: add defaultTemplateId column to businesses table
ALTER TABLE "businesses" ADD COLUMN IF NOT EXISTS "defaultTemplateId" TEXT;
