-- CreateEnum
CREATE TYPE "RefrigeratorStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'MAINTENANCE');

-- CreateEnum
CREATE TYPE "TransactionType" AS ENUM ('LOAD', 'PICKUP', 'ADJUSTMENT');

-- CreateEnum
CREATE TYPE "FridgeOrderStatus" AS ENUM ('PENDING', 'PICKED_UP', 'CANCELLED');

-- DropForeignKey
ALTER TABLE "payments" DROP CONSTRAINT "payments_order_id_fkey";

-- AlterTable
ALTER TABLE "payments" ADD COLUMN     "fridge_pickup_order_id" TEXT,
ALTER COLUMN "order_id" DROP NOT NULL;

-- CreateTable
CREATE TABLE "locations" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "latitude" DECIMAL(10,7),
    "longitude" DECIMAL(10,7),
    "active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "locations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "refrigerators" (
    "id" TEXT NOT NULL,
    "location_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "status" "RefrigeratorStatus" NOT NULL DEFAULT 'ACTIVE',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "refrigerators_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "refrigerator_inventory" (
    "id" TEXT NOT NULL,
    "refrigerator_id" TEXT NOT NULL,
    "vegetable_id" TEXT NOT NULL,
    "quantity_available" DECIMAL(10,3) NOT NULL DEFAULT 0,
    "minimum_threshold" DECIMAL(10,3) NOT NULL DEFAULT 2,
    "last_updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "refrigerator_inventory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "refrigerator_transactions" (
    "id" TEXT NOT NULL,
    "refrigerator_id" TEXT NOT NULL,
    "vegetable_id" TEXT NOT NULL,
    "quantity" DECIMAL(10,3) NOT NULL,
    "type" "TransactionType" NOT NULL,
    "user_id" TEXT NOT NULL,
    "user_role" TEXT NOT NULL,
    "note" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "refrigerator_transactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fridge_pickup_orders" (
    "id" TEXT NOT NULL,
    "order_number" TEXT NOT NULL,
    "customer_id" TEXT NOT NULL,
    "refrigerator_id" TEXT NOT NULL,
    "status" "FridgeOrderStatus" NOT NULL DEFAULT 'PENDING',
    "total_amount" DECIMAL(10,2) NOT NULL,
    "paid_amount" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "payment_status" "PaymentStatus" NOT NULL DEFAULT 'UNPAID',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "fridge_pickup_orders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fridge_pickup_items" (
    "id" TEXT NOT NULL,
    "pickup_order_id" TEXT NOT NULL,
    "vegetable_id" TEXT NOT NULL,
    "quantity" DECIMAL(10,3) NOT NULL,
    "unit" "UnitType" NOT NULL,
    "unit_price" DECIMAL(10,2) NOT NULL,
    "total_price" DECIMAL(10,2) NOT NULL,

    CONSTRAINT "fridge_pickup_items_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "locations_name_key" ON "locations"("name");

-- CreateIndex
CREATE UNIQUE INDEX "refrigerator_inventory_refrigerator_id_vegetable_id_key" ON "refrigerator_inventory"("refrigerator_id", "vegetable_id");

-- CreateIndex
CREATE UNIQUE INDEX "fridge_pickup_orders_order_number_key" ON "fridge_pickup_orders"("order_number");

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_fridge_pickup_order_id_fkey" FOREIGN KEY ("fridge_pickup_order_id") REFERENCES "fridge_pickup_orders"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "refrigerators" ADD CONSTRAINT "refrigerators_location_id_fkey" FOREIGN KEY ("location_id") REFERENCES "locations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "refrigerator_inventory" ADD CONSTRAINT "refrigerator_inventory_refrigerator_id_fkey" FOREIGN KEY ("refrigerator_id") REFERENCES "refrigerators"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "refrigerator_inventory" ADD CONSTRAINT "refrigerator_inventory_vegetable_id_fkey" FOREIGN KEY ("vegetable_id") REFERENCES "vegetables"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "refrigerator_transactions" ADD CONSTRAINT "refrigerator_transactions_refrigerator_id_fkey" FOREIGN KEY ("refrigerator_id") REFERENCES "refrigerators"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "refrigerator_transactions" ADD CONSTRAINT "refrigerator_transactions_vegetable_id_fkey" FOREIGN KEY ("vegetable_id") REFERENCES "vegetables"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fridge_pickup_orders" ADD CONSTRAINT "fridge_pickup_orders_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fridge_pickup_orders" ADD CONSTRAINT "fridge_pickup_orders_refrigerator_id_fkey" FOREIGN KEY ("refrigerator_id") REFERENCES "refrigerators"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fridge_pickup_items" ADD CONSTRAINT "fridge_pickup_items_pickup_order_id_fkey" FOREIGN KEY ("pickup_order_id") REFERENCES "fridge_pickup_orders"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fridge_pickup_items" ADD CONSTRAINT "fridge_pickup_items_vegetable_id_fkey" FOREIGN KEY ("vegetable_id") REFERENCES "vegetables"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
