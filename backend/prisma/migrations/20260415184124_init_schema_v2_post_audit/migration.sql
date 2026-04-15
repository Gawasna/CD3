-- CreateEnum
CREATE TYPE "KycStatus" AS ENUM ('NONE', 'PENDING', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "Role" AS ENUM ('USER', 'ADMIN');

-- CreateEnum
CREATE TYPE "AuctionCategory" AS ENUM ('ELECTRONICS', 'FASHION', 'FURNITURE', 'COLLECTIBLES', 'OTHER');

-- CreateEnum
CREATE TYPE "AuctionStatus" AS ENUM ('PENDING', 'ACTIVE', 'ENDED', 'CANCELED');

-- CreateEnum
CREATE TYPE "ShippingStatus" AS ENUM ('PENDING', 'SHIPPED', 'CONFIRMED', 'CANCELED');

-- CreateEnum
CREATE TYPE "DisputeOutcome" AS ENUM ('BUYER_WIN', 'SELLER_WIN');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "wallet_address" TEXT NOT NULL,
    "display_name" TEXT,
    "avatar_url" TEXT,
    "kyc_status" "KycStatus" NOT NULL DEFAULT 'NONE',
    "role" "Role" NOT NULL DEFAULT 'USER',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "kyc_approved_at" TIMESTAMP(3),
    "kyc_approved_by" TEXT,
    "deleted_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "auction_metadata" (
    "id" TEXT NOT NULL,
    "seller_id" TEXT NOT NULL,
    "on_chain_auction_id" BIGINT,
    "status" "AuctionStatus" NOT NULL DEFAULT 'PENDING',
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "ipfs_cid" TEXT,
    "category" "AuctionCategory" NOT NULL DEFAULT 'OTHER',
    "starting_price_wei" TEXT NOT NULL,
    "collateral_wei" TEXT NOT NULL,
    "end_time" TIMESTAMP(3) NOT NULL,
    "duration_seconds" INTEGER NOT NULL,
    "winner_id" TEXT,
    "create_tx_hash" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "auction_metadata_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bids" (
    "id" TEXT NOT NULL,
    "auction_id" TEXT NOT NULL,
    "bidder_id" TEXT NOT NULL,
    "amount_wei" TEXT NOT NULL,
    "tx_hash" TEXT NOT NULL,
    "block_number" BIGINT,
    "is_winning" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "bids_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "shipping_logs" (
    "id" TEXT NOT NULL,
    "auction_id" TEXT NOT NULL,
    "status" "ShippingStatus" NOT NULL,
    "updated_by_id" TEXT NOT NULL,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "shipping_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "auth_nonces" (
    "id" TEXT NOT NULL,
    "wallet_address" TEXT NOT NULL,
    "nonce" TEXT NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "used_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "auth_nonces_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "dispute_logs" (
    "id" TEXT NOT NULL,
    "auction_id" TEXT NOT NULL,
    "raised_by_id" TEXT NOT NULL,
    "resolved_by_id" TEXT,
    "reason" TEXT NOT NULL,
    "resolution" TEXT,
    "outcome" "DisputeOutcome",
    "resolve_tx_hash" TEXT,
    "raised_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolved_at" TIMESTAMP(3),

    CONSTRAINT "dispute_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "admin_action_logs" (
    "id" TEXT NOT NULL,
    "admin_id" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "target_id" TEXT NOT NULL,
    "target_type" TEXT NOT NULL,
    "metadata" JSONB,
    "ip_address" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "admin_action_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_wallet_address_key" ON "users"("wallet_address");

-- CreateIndex
CREATE INDEX "users_kyc_status_idx" ON "users"("kyc_status");

-- CreateIndex
CREATE UNIQUE INDEX "auction_metadata_on_chain_auction_id_key" ON "auction_metadata"("on_chain_auction_id");

-- CreateIndex
CREATE INDEX "auction_metadata_seller_id_created_at_idx" ON "auction_metadata"("seller_id", "created_at" DESC);

-- CreateIndex
CREATE INDEX "auction_metadata_status_end_time_idx" ON "auction_metadata"("status", "end_time");

-- CreateIndex
CREATE UNIQUE INDEX "bids_tx_hash_key" ON "bids"("tx_hash");

-- CreateIndex
CREATE INDEX "bids_auction_id_created_at_idx" ON "bids"("auction_id", "created_at" DESC);

-- CreateIndex
CREATE INDEX "bids_bidder_id_idx" ON "bids"("bidder_id");

-- CreateIndex
CREATE INDEX "shipping_logs_auction_id_idx" ON "shipping_logs"("auction_id");

-- CreateIndex
CREATE UNIQUE INDEX "auth_nonces_nonce_key" ON "auth_nonces"("nonce");

-- CreateIndex
CREATE INDEX "auth_nonces_wallet_address_idx" ON "auth_nonces"("wallet_address");

-- CreateIndex
CREATE INDEX "auth_nonces_expires_at_idx" ON "auth_nonces"("expires_at");

-- CreateIndex
CREATE INDEX "dispute_logs_auction_id_idx" ON "dispute_logs"("auction_id");

-- CreateIndex
CREATE INDEX "admin_action_logs_admin_id_idx" ON "admin_action_logs"("admin_id");

-- CreateIndex
CREATE INDEX "admin_action_logs_target_type_target_id_idx" ON "admin_action_logs"("target_type", "target_id");

-- AddForeignKey
ALTER TABLE "auction_metadata" ADD CONSTRAINT "auction_metadata_seller_id_fkey" FOREIGN KEY ("seller_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bids" ADD CONSTRAINT "bids_auction_id_fkey" FOREIGN KEY ("auction_id") REFERENCES "auction_metadata"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bids" ADD CONSTRAINT "bids_bidder_id_fkey" FOREIGN KEY ("bidder_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "shipping_logs" ADD CONSTRAINT "shipping_logs_auction_id_fkey" FOREIGN KEY ("auction_id") REFERENCES "auction_metadata"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "shipping_logs" ADD CONSTRAINT "shipping_logs_updated_by_id_fkey" FOREIGN KEY ("updated_by_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dispute_logs" ADD CONSTRAINT "dispute_logs_auction_id_fkey" FOREIGN KEY ("auction_id") REFERENCES "auction_metadata"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dispute_logs" ADD CONSTRAINT "dispute_logs_raised_by_id_fkey" FOREIGN KEY ("raised_by_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dispute_logs" ADD CONSTRAINT "dispute_logs_resolved_by_id_fkey" FOREIGN KEY ("resolved_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "admin_action_logs" ADD CONSTRAINT "admin_action_logs_admin_id_fkey" FOREIGN KEY ("admin_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
