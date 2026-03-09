-- AlterEnum
ALTER TYPE "FridgeOrderStatus" ADD VALUE 'DELIVERED';

-- AlterTable
ALTER TABLE "fridge_pickup_orders" ADD COLUMN     "delivered_at" TIMESTAMP(3);
