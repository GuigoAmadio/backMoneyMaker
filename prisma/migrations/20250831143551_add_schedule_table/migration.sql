-- CreateEnum
CREATE TYPE "ScheduleStatus" AS ENUM ('PENDING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'POSTPONED');

-- CreateEnum
CREATE TYPE "SchedulePriority" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'URGENT');

-- CreateEnum
CREATE TYPE "ScheduleCategory" AS ENUM ('WORK', 'PERSONAL', 'MEETING', 'APPOINTMENT', 'REMINDER', 'OTHER');

-- CreateTable
CREATE TABLE "schedules" (
    "id" TEXT NOT NULL,
    "client_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "employee_id" TEXT,
    "date" TIMESTAMP(3) NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "tasks" JSONB NOT NULL DEFAULT '[]',
    "status" "ScheduleStatus" NOT NULL DEFAULT 'PENDING',
    "priority" "SchedulePriority" NOT NULL DEFAULT 'MEDIUM',
    "start_time" TIMESTAMP(3),
    "end_time" TIMESTAMP(3),
    "all_day" BOOLEAN NOT NULL DEFAULT false,
    "is_recurring" BOOLEAN NOT NULL DEFAULT false,
    "recurring_pattern" JSONB,
    "color" TEXT,
    "category" "ScheduleCategory" NOT NULL DEFAULT 'WORK',
    "reminders" JSONB NOT NULL DEFAULT '[]',
    "attachments" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "is_public" BOOLEAN NOT NULL DEFAULT false,
    "completed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "schedules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "frontend_cache_metadata" (
    "id" TEXT NOT NULL,
    "client_id" TEXT NOT NULL,
    "cache_key" TEXT NOT NULL,
    "last_updated" TIMESTAMP(3) NOT NULL,
    "version" TEXT,
    "data_size" INTEGER,
    "hit_count" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "frontend_cache_metadata_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "schedules_client_id_date_idx" ON "schedules"("client_id", "date");

-- CreateIndex
CREATE INDEX "schedules_client_id_user_id_date_idx" ON "schedules"("client_id", "user_id", "date");

-- CreateIndex
CREATE INDEX "schedules_client_id_status_idx" ON "schedules"("client_id", "status");

-- CreateIndex
CREATE INDEX "schedules_client_id_priority_idx" ON "schedules"("client_id", "priority");

-- CreateIndex
CREATE INDEX "schedules_client_id_category_idx" ON "schedules"("client_id", "category");

-- CreateIndex
CREATE INDEX "schedules_employee_id_date_idx" ON "schedules"("employee_id", "date");

-- CreateIndex
CREATE UNIQUE INDEX "schedules_client_id_user_id_date_key" ON "schedules"("client_id", "user_id", "date");

-- CreateIndex
CREATE INDEX "frontend_cache_metadata_client_id_cache_key_idx" ON "frontend_cache_metadata"("client_id", "cache_key");

-- CreateIndex
CREATE INDEX "frontend_cache_metadata_client_id_last_updated_idx" ON "frontend_cache_metadata"("client_id", "last_updated");

-- CreateIndex
CREATE UNIQUE INDEX "frontend_cache_metadata_client_id_cache_key_key" ON "frontend_cache_metadata"("client_id", "cache_key");

-- AddForeignKey
ALTER TABLE "schedules" ADD CONSTRAINT "schedules_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "clients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "schedules" ADD CONSTRAINT "schedules_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "schedules" ADD CONSTRAINT "schedules_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "employees"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "frontend_cache_metadata" ADD CONSTRAINT "frontend_cache_metadata_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "clients"("id") ON DELETE CASCADE ON UPDATE CASCADE;
