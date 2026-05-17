import { ethers } from 'ethers';
import { prisma } from '../config/database';
import { env } from '../config/env';
import AuctionPlatformABI from '../abi/AuctionPlatform.json';
import { eventEmitter, Events } from '../shared/utils/event-emitter';
import { activityService } from '../modules/users/activity.service';

/**
 * Auction Events Listener
 * 
 * Lắng nghe các sự kiện từ smart contract:
 * - AuctionCreated: Đồng bộ auction mới.
 * - AuctionEnded: Cập nhật kết quả và thông báo cho winner/seller.
 */

let provider: ethers.JsonRpcProvider;
let contract: ethers.Contract;
let isListening = false;

export function startAuctionCreatedListener() {
  if (isListening) {
    console.log('[AuctionListener] Already listening');
    return;
  }

  try {
    // Initialize provider
    provider = new ethers.JsonRpcProvider(env.RPC_URL);
    
    // Initialize contract
    contract = new ethers.Contract(
      env.CONTRACT_ADDRESS,
      AuctionPlatformABI.abi,
      provider
    );

    // Listen to AuctionCreated events
    contract.on('AuctionCreated', async (
      auctionId: bigint,
      seller: string,
      startingPrice: bigint,
      endTime: bigint,
      productCid: string,
      event: ethers.EventLog
    ) => {
      try {
        console.log('[AuctionListener] AuctionCreated event received:', {
          auctionId: auctionId.toString(),
          seller,
          txHash: event.transactionHash,
        });

        // Find PENDING auction by createTxHash
        const auction = await prisma.auctionMetadata.findUnique({
          where: { createTxHash: event.transactionHash },
        });

        if (!auction) {
          console.warn('[AuctionListener] No PENDING auction found for TX:', event.transactionHash);
          return;
        }

        if (auction.status !== 'PENDING') {
          console.warn('[AuctionListener] Auction already processed:', auction.id);
          return;
        }

        // Update auction with on-chain data
        const now = new Date();
        const startTime = auction.startTime;
        const initialStatus = startTime > now ? 'UPCOMING' : 'ACTIVE';

        await prisma.auctionMetadata.update({
          where: { id: auction.id },
          data: {
            onChainAuctionId: auctionId,
            status: initialStatus,
            // Verify data matches
            startingPriceWei: startingPrice.toString(),
            endTime: new Date(Number(endTime) * 1000),
          },
        });

        console.log('[AuctionListener] Auction synced successfully:', {
          auctionId: auction.id,
          onChainAuctionId: auctionId.toString(),
          status: initialStatus,
        });
      } catch (error) {
        console.error('[AuctionListener] Error processing AuctionCreated event:', error);
      }
    });

    // Listen to AuctionEnded events
    contract.on('AuctionEnded', async (
      auctionId: bigint,
      winner: string,
      winningBid: bigint,
      event: ethers.EventLog
    ) => {
      try {
        console.log('[AuctionListener] AuctionEnded event received:', {
          auctionId: auctionId.toString(),
          winner,
          winningBid: winningBid.toString(),
        });

        // 1. Update auction status in DB
        const auction = await prisma.auctionMetadata.findUnique({
          where: { onChainAuctionId: auctionId },
          include: { seller: true }
        });

        if (!auction) return;

        // Resolve winner user
        const winnerUser = winner !== ethers.ZeroAddress 
          ? await prisma.user.findUnique({ where: { walletAddress: winner.toLowerCase() } })
          : null;

        await prisma.auctionMetadata.update({
          where: { id: auction.id },
          data: {
            status: 'ENDED',
            winnerId: winnerUser?.id ?? null,
            escrowStatus: winner !== ethers.ZeroAddress ? 'AWAITING_SHIPMENT' : 'REFUNDED',
          },
        });

        // 2. Mark winning bid
        if (winnerUser) {
          await prisma.bid.updateMany({
            where: {
              auctionId: auction.id,
              bidderId: winnerUser.id,
              amountWei: winningBid.toString(),
            },
            data: { isWinning: true },
          });

          // 3. Phát sự kiện thắng cuộc
          await activityService.logActivity(winnerUser.id, 'AUCTION_WON', auction.id, 'AUCTION', {
            amount: winningBid.toString(),
          });

          eventEmitter.emit(Events.BID.WON, {
            auctionId: auction.id,
            winnerId: winnerUser.id,
            title: auction.title,
            amount: ethers.formatEther(winningBid),
          });
        }

        // 4. Phát sự kiện kết thúc đấu giá (để thông báo cho Seller)
        eventEmitter.emit(Events.AUCTION.ENDED, {
          auctionId: auction.id,
          sellerId: auction.sellerId,
          title: auction.title,
          hasWinner: !!winnerUser,
        });

      } catch (error) {
        console.error('[AuctionListener] Error processing AuctionEnded event:', error);
      }
    });

    // Listen to AuctionCanceled events
    contract.on('AuctionCanceled', async (
      auctionId: bigint,
      event: ethers.EventLog
    ) => {
      try {
        console.log('[AuctionListener] AuctionCanceled event received:', auctionId.toString());

        const auction = await prisma.auctionMetadata.findUnique({
          where: { onChainAuctionId: auctionId },
        });

        if (!auction) return;

        await prisma.auctionMetadata.update({
          where: { id: auction.id },
          data: {
            status: 'CANCELED',
            escrowStatus: 'REFUNDED',
          },
        });

        // Phát sự kiện AUCTION.CANCELED
        eventEmitter.emit(Events.AUCTION.CANCELED, {
          auctionId: auction.id,
          sellerId: auction.sellerId,
          title: auction.title,
        });
      } catch (error) {
        console.error('[AuctionListener] Error processing AuctionCanceled event:', error);
      }
    });

    // Listen to WinnerForfeited events
    contract.on('WinnerForfeited', async (
      auctionId: bigint,
      winner: string,
      penalty: bigint,
      winnerRefund: bigint,
      event: ethers.EventLog
    ) => {
      try {
        console.log('[AuctionListener] WinnerForfeited event received:', {
          auctionId: auctionId.toString(),
          winner,
        });

        const auction = await prisma.auctionMetadata.findUnique({
          where: { onChainAuctionId: auctionId },
          include: { seller: true }
        });

        if (!auction) return;

        const winnerUser = await prisma.user.findUnique({
          where: { walletAddress: winner.toLowerCase() }
        });

        await prisma.auctionMetadata.update({
          where: { id: auction.id },
          data: {
            status: 'FORFEITED',
            escrowStatus: 'REFUNDED',
          },
        });

        // Phát sự kiện AUCTION.FORFEITED
        eventEmitter.emit(Events.AUCTION.FORFEITED, {
          auctionId: auction.id,
          sellerId: auction.sellerId,
          winnerId: winnerUser?.id,
          title: auction.title,
          penalty: ethers.formatEther(penalty),
        });

      } catch (error) {
        console.error('[AuctionListener] Error processing WinnerForfeited event:', error);
      }
    });

    contract.on('ShippingFeeSet', async (auctionId: bigint, fee: bigint) => {
      try {
        console.log('[AuctionListener] ShippingFeeSet event received:', { auctionId: auctionId.toString(), fee: fee.toString() });
        await prisma.auctionMetadata.update({
          where: { onChainAuctionId: auctionId },
          data: { shippingCostWei: fee.toString() },
        });
      } catch (error) {
        console.error('[AuctionListener] Error processing ShippingFeeSet event:', error);
      }
    });

    contract.on('ShippingFeePaid', async (auctionId: bigint, buyer: string, amount: bigint) => {
      try {
        console.log('[AuctionListener] ShippingFeePaid event received:', { auctionId: auctionId.toString(), buyer });
        // Cập nhật Database để đồng bộ trạng thái thanh toán
        await prisma.shippingLog.create({
          data: {
            auctionId: (await prisma.auctionMetadata.findUnique({ where: { onChainAuctionId: auctionId }, select: { id: true } }))?.id || '',
            status: 'SHIPPED', // Giả định: sau khi pay fee thì seller ship, hoặc có thể thêm trạng thái mới
            updatedById: (await prisma.user.findUnique({ where: { walletAddress: buyer.toLowerCase() }, select: { id: true } }))?.id || '',
            notes: `Buyer paid shipping fee: ${ethers.formatEther(amount)} ETH`,
          },
        });
      } catch (error) {
        console.error('[AuctionListener] Error processing ShippingFeePaid event:', error);
      }
    });

    isListening = true;
    console.log('[AuctionListener] Started listening for Auction events');

    // Tự động đồng bộ các đấu giá bị kẹt khi khởi động
    syncPendingAuctions().catch(err => console.error('[AuctionListener] Auto-sync failed:', err));
  } catch (error) {
    console.error('[AuctionListener] Failed to start listener:', error);
    throw error;
  }
}

/**
 * Kiểm tra các auction đang ở trạng thái PENDING trong DB
 * và đối soát với Blockchain để tránh bị kẹt.
 */
async function syncPendingAuctions() {
  const pendingAuctions = await prisma.auctionMetadata.findMany({
    where: { status: 'PENDING' }
  });

  if (pendingAuctions.length === 0) return;

  console.log(`[AuctionListener] Found ${pendingAuctions.length} pending auctions. Checking blockchain...`);

  for (const auction of pendingAuctions) {
    if (!auction.createTxHash) continue;
    
    try {
      const receipt = await provider.getTransactionReceipt(auction.createTxHash);
      if (receipt && receipt.status === 1) {
        // Tìm event AuctionCreated
        const interface_ = new ethers.Interface(AuctionPlatformABI.abi);
        for (const log of receipt.logs) {
          const parsedLog = interface_.parseLog(log);
          if (parsedLog?.name === 'AuctionCreated') {
            const [onChainId, , startingPrice, endTime] = parsedLog.args;
            
            const now = new Date();
            const startTimeDate = new Date(auction.startTime);
            const status = startTimeDate > now ? 'UPCOMING' : 'ACTIVE';

            await prisma.auctionMetadata.update({
              where: { id: auction.id },
              data: {
                onChainAuctionId: onChainId,
                status: status,
                startingPriceWei: startingPrice.toString(),
                endTime: new Date(Number(endTime) * 1000),
              }
            });
            console.log(`[AuctionListener] Auto-synced auction: ${auction.title} -> ${status}`);
            break;
          }
        }
      }
    } catch (e) {
      console.error(`[AuctionListener] Failed to sync auction ${auction.id}:`, e);
    }
  }
}

export function stopAuctionCreatedListener() {
  if (contract && isListening) {
    contract.removeAllListeners('AuctionCreated');
    contract.removeAllListeners('AuctionEnded');
    contract.removeAllListeners('AuctionCanceled');
    contract.removeAllListeners('WinnerForfeited');
    isListening = false;
    console.log('[AuctionListener] Stopped listening');
  }
}

// Graceful shutdown
process.on('SIGINT', () => {
  stopAuctionCreatedListener();
  process.exit(0);
});

process.on('SIGTERM', () => {
  stopAuctionCreatedListener();
  process.exit(0);
});
