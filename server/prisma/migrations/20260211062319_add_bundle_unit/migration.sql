-- AlterEnum
ALTER TYPE "UnitType" ADD VALUE 'BUNDLE';

-- AlterTable
ALTER TABLE "prices" ADD COLUMN     "price_per_bundle" DECIMAL(10,2);
