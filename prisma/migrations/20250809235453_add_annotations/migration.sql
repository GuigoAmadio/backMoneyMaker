-- CreateEnum
CREATE TYPE "AnnotationVisibility" AS ENUM ('PRIVATE_TO_EMPLOYEE', 'SHARED_WITH_CLIENT');

-- CreateTable
CREATE TABLE "annotations" (
    "id" TEXT NOT NULL,
    "client_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "employee_id" TEXT,
    "created_by_id" TEXT NOT NULL,
    "created_by_role" "UserRole" NOT NULL,
    "appointment_id" TEXT,
    "content" TEXT NOT NULL,
    "visibility" "AnnotationVisibility" NOT NULL DEFAULT 'PRIVATE_TO_EMPLOYEE',
    "is_pinned" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "annotations_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "annotations_client_id_user_id_created_at_idx" ON "annotations"("client_id", "user_id", "created_at");

-- CreateIndex
CREATE INDEX "annotations_appointment_id_idx" ON "annotations"("appointment_id");

-- AddForeignKey
ALTER TABLE "annotations" ADD CONSTRAINT "annotations_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "annotations" ADD CONSTRAINT "annotations_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "employees"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "annotations" ADD CONSTRAINT "annotations_appointment_id_fkey" FOREIGN KEY ("appointment_id") REFERENCES "appointments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "annotations" ADD CONSTRAINT "annotations_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "clients"("id") ON DELETE CASCADE ON UPDATE CASCADE;
