/*
  Warnings:

  - You are about to drop the column `client_id` on the `appointments` table. All the data in the column will be lost.
  - You are about to drop the column `notes` on the `appointments` table. All the data in the column will be lost.
  - You are about to drop the column `paymentMethod` on the `appointments` table. All the data in the column will be lost.
  - You are about to drop the column `paymentStatus` on the `appointments` table. All the data in the column will be lost.
  - You are about to drop the column `price` on the `appointments` table. All the data in the column will be lost.
  - You are about to drop the column `client_id` on the `services` table. All the data in the column will be lost.
  - You are about to drop the column `maxAdvanceBooking` on the `services` table. All the data in the column will be lost.
  - You are about to drop the column `minAdvanceBooking` on the `services` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "appointments" DROP CONSTRAINT "appointments_client_id_fkey";

-- DropForeignKey
ALTER TABLE "services" DROP CONSTRAINT "services_client_id_fkey";

-- AlterTable
ALTER TABLE "appointments" DROP COLUMN "client_id",
DROP COLUMN "notes",
DROP COLUMN "paymentMethod",
DROP COLUMN "paymentStatus",
DROP COLUMN "price";

-- AlterTable
ALTER TABLE "services" DROP COLUMN "client_id",
DROP COLUMN "maxAdvanceBooking",
DROP COLUMN "minAdvanceBooking";
