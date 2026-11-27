-- AlterEnum
ALTER TYPE "InventoryItemType" ADD VALUE 'CONTACT_LENS';

-- AlterTable
ALTER TABLE "stocks" ADD COLUMN     "is_published" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "selling_price" DECIMAL(12,3);

