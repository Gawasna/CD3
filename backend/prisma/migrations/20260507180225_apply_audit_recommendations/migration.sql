/*
  Warnings:

  - A unique constraint covering the columns `[create_tx_hash]` on the table `auction_metadata` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[resolve_tx_hash]` on the table `dispute_logs` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateEnum
CREATE TYPE "EscrowStatus" AS ENUM ('NONE', 'AWAITING_DELIVERY', 'DISPUTED', 'COMPLETED', 'REFUNDED');

-- AlterTable
ALTER TABLE "auction_metadata" ADD COLUMN     "escrow_status" "EscrowStatus" NOT NULL DEFAULT 'NONE';

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "old_name" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "auction_metadata_create_tx_hash_key" ON "auction_metadata"("create_tx_hash");

-- CreateIndex
CREATE UNIQUE INDEX "dispute_logs_resolve_tx_hash_key" ON "dispute_logs"("resolve_tx_hash");

-- AddForeignKey
ALTER TABLE "auction_metadata" ADD CONSTRAINT "auction_metadata_winner_id_fkey" FOREIGN KEY ("winner_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Custom SQL CHECK constraints --
ALTER TABLE "auction_metadata" ADD CONSTRAINT "auction_metadata_starting_price_wei_check" CHECK ("starting_price_wei" ~ '^[0-9]+$');
ALTER TABLE "auction_metadata" ADD CONSTRAINT "auction_metadata_collateral_wei_check" CHECK ("collateral_wei" ~ '^[0-9]+$');
ALTER TABLE "auction_metadata" ADD CONSTRAINT "auction_metadata_duration_seconds_check" CHECK ("duration_seconds" > 0);

ALTER TABLE "bids" ADD CONSTRAINT "bids_amount_wei_check" CHECK ("amount_wei" ~ '^[0-9]+$');

-- Partial Unique Index for winning bid --
CREATE UNIQUE INDEX "bids_winning_bid_unique_idx" ON "bids"("auction_id") WHERE "is_winning" = true;
