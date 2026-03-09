-- AlterTable
ALTER TABLE "prices" ADD COLUMN     "original_price_per_kg" DECIMAL(10,2);

-- AlterTable
ALTER TABLE "vegetables" ADD COLUMN     "featured" BOOLEAN NOT NULL DEFAULT false;
