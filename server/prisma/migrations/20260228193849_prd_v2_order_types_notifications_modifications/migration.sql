-- CreateEnum
CREATE TYPE "OrderType" AS ENUM ('FRIDGE_PICKUP', 'HOME_DELIVERY');

-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('ORDER_MODIFIED', 'ORDER_CONFIRMED', 'ORDER_READY', 'ORDER_CANCELLED', 'LOW_STOCK');

-- DropForeignKey
ALTER TABLE "fridge_pickup_orders" DROP CONSTRAINT "fridge_pickup_orders_refrigerator_id_fkey";

-- AlterTable
ALTER TABLE "fridge_pickup_items" ADD COLUMN     "is_removed" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "original_quantity" DECIMAL(10,3),
ADD COLUMN     "removal_reason" TEXT;

-- AlterTable
ALTER TABLE "fridge_pickup_orders" ADD COLUMN     "address_id" TEXT,
ADD COLUMN     "order_type" "OrderType" NOT NULL DEFAULT 'FRIDGE_PICKUP',
ALTER COLUMN "refrigerator_id" DROP NOT NULL;

-- AlterTable
ALTER TABLE "payments" ADD COLUMN     "screenshot_url" TEXT;

-- CreateTable
CREATE TABLE "notifications" (
    "id" TEXT NOT NULL,
    "customer_id" TEXT NOT NULL,
    "order_id" TEXT,
    "type" "NotificationType" NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "is_read" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "notifications_customer_id_is_read_idx" ON "notifications"("customer_id", "is_read");

-- AddForeignKey
ALTER TABLE "fridge_pickup_orders" ADD CONSTRAINT "fridge_pickup_orders_refrigerator_id_fkey" FOREIGN KEY ("refrigerator_id") REFERENCES "refrigerators"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fridge_pickup_orders" ADD CONSTRAINT "fridge_pickup_orders_address_id_fkey" FOREIGN KEY ("address_id") REFERENCES "addresses"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE CASCADE ON UPDATE CASCADE;
