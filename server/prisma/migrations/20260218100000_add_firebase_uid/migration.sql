-- AlterTable
ALTER TABLE "admin_users" ADD COLUMN "firebase_uid" TEXT;

-- AlterTable
ALTER TABLE "customers" ADD COLUMN "firebase_uid" TEXT;

-- AlterTable (make password optional for admin)
ALTER TABLE "admin_users" ALTER COLUMN "password" DROP NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "admin_users_firebase_uid_key" ON "admin_users"("firebase_uid");

-- CreateIndex
CREATE UNIQUE INDEX "customers_firebase_uid_key" ON "customers"("firebase_uid");
