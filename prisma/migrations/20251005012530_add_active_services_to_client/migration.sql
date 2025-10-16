-- AlterTable
ALTER TABLE "clients" ADD COLUMN     "activeServices" JSONB NOT NULL DEFAULT '[]';
