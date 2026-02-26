-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "FridgeOrderStatus" ADD VALUE 'CONFIRMED';
ALTER TYPE "FridgeOrderStatus" ADD VALUE 'READY';

-- AlterTable
ALTER TABLE "fridge_pickup_orders" ADD COLUMN     "assigned_to_id" TEXT,
ADD COLUMN     "cancelled_at" TIMESTAMP(3),
ADD COLUMN     "confirmed_at" TIMESTAMP(3),
ADD COLUMN     "notes" TEXT,
ADD COLUMN     "picked_up_at" TIMESTAMP(3),
ADD COLUMN     "ready_at" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "producer_fridge_assignments" (
    "id" TEXT NOT NULL,
    "staff_user_id" TEXT NOT NULL,
    "refrigerator_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "producer_fridge_assignments_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "producer_fridge_assignments_staff_user_id_refrigerator_id_key" ON "producer_fridge_assignments"("staff_user_id", "refrigerator_id");

-- AddForeignKey
ALTER TABLE "fridge_pickup_orders" ADD CONSTRAINT "fridge_pickup_orders_assigned_to_id_fkey" FOREIGN KEY ("assigned_to_id") REFERENCES "staff_users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "producer_fridge_assignments" ADD CONSTRAINT "producer_fridge_assignments_staff_user_id_fkey" FOREIGN KEY ("staff_user_id") REFERENCES "staff_users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "producer_fridge_assignments" ADD CONSTRAINT "producer_fridge_assignments_refrigerator_id_fkey" FOREIGN KEY ("refrigerator_id") REFERENCES "refrigerators"("id") ON DELETE CASCADE ON UPDATE CASCADE;
