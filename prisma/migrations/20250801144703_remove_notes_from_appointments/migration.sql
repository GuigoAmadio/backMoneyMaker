/*
  Warnings:

  - You are about to drop the column `description` on the `appointments` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "appointments" DROP CONSTRAINT "appointments_employee_id_fkey";

-- DropForeignKey
ALTER TABLE "appointments" DROP CONSTRAINT "appointments_service_id_fkey";

-- DropForeignKey
ALTER TABLE "appointments" DROP CONSTRAINT "appointments_user_id_fkey";

-- AlterTable
ALTER TABLE "appointments" DROP COLUMN "description",
ALTER COLUMN "employee_id" DROP NOT NULL;

-- CreateIndex
CREATE INDEX "appointments_client_id_startTime_idx" ON "appointments"("client_id", "startTime");

-- CreateIndex
CREATE INDEX "appointments_client_id_status_idx" ON "appointments"("client_id", "status");

-- CreateIndex
CREATE INDEX "appointments_user_id_idx" ON "appointments"("user_id");

-- CreateIndex
CREATE INDEX "appointments_employee_id_idx" ON "appointments"("employee_id");

-- CreateIndex
CREATE INDEX "appointments_startTime_idx" ON "appointments"("startTime");

-- CreateIndex
CREATE INDEX "employees_client_id_isActive_idx" ON "employees"("client_id", "isActive");

-- CreateIndex
CREATE INDEX "employees_email_idx" ON "employees"("email");

-- CreateIndex
CREATE INDEX "orders_client_id_createdAt_idx" ON "orders"("client_id", "createdAt");

-- CreateIndex
CREATE INDEX "orders_client_id_status_idx" ON "orders"("client_id", "status");

-- CreateIndex
CREATE INDEX "orders_client_id_paymentStatus_idx" ON "orders"("client_id", "paymentStatus");

-- CreateIndex
CREATE INDEX "orders_user_id_idx" ON "orders"("user_id");

-- CreateIndex
CREATE INDEX "orders_createdAt_idx" ON "orders"("createdAt");

-- CreateIndex
CREATE INDEX "products_client_id_isActive_idx" ON "products"("client_id", "isActive");

-- CreateIndex
CREATE INDEX "products_client_id_category_id_idx" ON "products"("client_id", "category_id");

-- CreateIndex
CREATE INDEX "products_stock_idx" ON "products"("stock");

-- CreateIndex
CREATE INDEX "products_price_idx" ON "products"("price");

-- CreateIndex
CREATE INDEX "services_client_id_isActive_idx" ON "services"("client_id", "isActive");

-- CreateIndex
CREATE INDEX "services_price_idx" ON "services"("price");

-- CreateIndex
CREATE INDEX "users_client_id_role_idx" ON "users"("client_id", "role");

-- CreateIndex
CREATE INDEX "users_email_idx" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_status_idx" ON "users"("status");

-- AddForeignKey
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "employees"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_service_id_fkey" FOREIGN KEY ("service_id") REFERENCES "services"("id") ON DELETE CASCADE ON UPDATE CASCADE;
