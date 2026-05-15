-- AlterEnum
ALTER TYPE "AuctionStatus" ADD VALUE 'UPCOMING';

-- AlterTable
ALTER TABLE "auction_metadata" ADD COLUMN     "start_time" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- CreateTable
CREATE TABLE "watchlists" (
    "user_id" TEXT NOT NULL,
    "auction_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "watchlists_pkey" PRIMARY KEY ("user_id","auction_id")
);

-- AddForeignKey
ALTER TABLE "watchlists" ADD CONSTRAINT "watchlists_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "watchlists" ADD CONSTRAINT "watchlists_auction_id_fkey" FOREIGN KEY ("auction_id") REFERENCES "auction_metadata"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
