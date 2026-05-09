-- P1 Consensus Sync Migration
-- Date: 2026-05-09
-- Ref: docs/artifacts/final_consensus_direction.md
-- Changes:
--   1. EscrowStatus: thêm AWAITING_SHIPMENT (Gap DB-1)
--   2. AuctionStatus: thêm FORFEITED (Consensus C-04)
--   3. ShippingPayer enum mới (Consensus C-02)
--   4. AuctionMetadata: thêm buyNowPriceWei, shippingCostWei, shippingPayer (Consensus C-01, C-02)
--   5. ShippingLog: thêm carrierName, trackingCode (Consensus C-02)
-- Status: CHƯA APPLY -- chờ DB up sau khi fix Hyper-V port reservation

-- Step 1: Thêm giá trị mới vào EscrowStatus enum
-- AWAITING_SHIPMENT phải đứng trước AWAITING_DELIVERY để mirror thứ tự on-chain
ALTER TYPE "EscrowStatus" ADD VALUE IF NOT EXISTS 'AWAITING_SHIPMENT' BEFORE 'AWAITING_DELIVERY';

-- Step 2: Thêm FORFEITED vào AuctionStatus enum
ALTER TYPE "AuctionStatus" ADD VALUE IF NOT EXISTS 'FORFEITED';

-- Step 3: Tạo enum ShippingPayer mới
DO $$ BEGIN
    CREATE TYPE "ShippingPayer" AS ENUM ('BUYER', 'SELLER', 'PLATFORM');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Step 4: Thêm columns mới vào auction_metadata
ALTER TABLE "auction_metadata"
    ADD COLUMN IF NOT EXISTS "buy_now_price_wei"  TEXT,
    ADD COLUMN IF NOT EXISTS "shipping_cost_wei"  TEXT NOT NULL DEFAULT '0',
    ADD COLUMN IF NOT EXISTS "shipping_payer"     "ShippingPayer" NOT NULL DEFAULT 'BUYER';

-- Step 5: Thêm columns mới vào shipping_logs
ALTER TABLE "shipping_logs"
    ADD COLUMN IF NOT EXISTS "carrier_name"   TEXT,
    ADD COLUMN IF NOT EXISTS "tracking_code"  TEXT;

-- Step 6: Validation constraint cho shipping_cost_wei (đồng nhất với wei format hiện có)
ALTER TABLE "auction_metadata"
    ADD CONSTRAINT "auction_metadata_shipping_cost_wei_check"
    CHECK ("shipping_cost_wei" ~ '^[0-9]+$');
