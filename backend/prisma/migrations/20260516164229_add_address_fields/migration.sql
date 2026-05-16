/*
  Warnings:

  - The values [PLATFORM] on the enum `ShippingPayer` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "ShippingPayer_new" AS ENUM ('BUYER', 'SELLER');
ALTER TABLE "public"."auction_metadata" ALTER COLUMN "shipping_payer" DROP DEFAULT;
ALTER TABLE "auction_metadata" ALTER COLUMN "shipping_payer" TYPE "ShippingPayer_new" USING ("shipping_payer"::text::"ShippingPayer_new");
ALTER TYPE "ShippingPayer" RENAME TO "ShippingPayer_old";
ALTER TYPE "ShippingPayer_new" RENAME TO "ShippingPayer";
DROP TYPE "public"."ShippingPayer_old";
ALTER TABLE "auction_metadata" ALTER COLUMN "shipping_payer" SET DEFAULT 'BUYER';
COMMIT;

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "address_1" TEXT,
ADD COLUMN     "address_2" TEXT,
ADD COLUMN     "last_address_update" TIMESTAMP(3);
