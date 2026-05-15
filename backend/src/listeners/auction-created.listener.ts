import { ethers } from 'ethers';
import { prisma } from '../config/database';
import { env } from '../config/env';
import AuctionPlatformABI from '../abi/AuctionPlatform.json';
import { notificationService } from '../modules/notification/notification.service';

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

          // 3. Thông báo cho Winner
          await notificationService.createNotification(winnerUser.id, {
            type: 'SUCCESS',
            title: 'Chúc mừng! Bạn đã thắng đấu giá!',
            message: `Bạn đã thắng sản phẩm "${auction.title}" với giá ${ethers.formatEther(winningBid)} ETH. Vui lòng chờ người bán gửi hàng.`,
            actionUrl: `/auctions/${auction.id}`,
          });
        }

        // 4. Thông báo cho Seller
        await notificationService.createNotification(auction.sellerId, {
          type: winnerUser ? 'SUCCESS' : 'INFO',
          title: winnerUser ? 'Sản phẩm đã được bán!' : 'Đấu giá kết thúc',
          message: winnerUser 
            ? `Sản phẩm "${auction.title}" của bạn đã có người thắng cuộc. Vui lòng chuẩn bị gửi hàng.`
            : `Sản phẩm "${auction.title}" đã kết thúc mà không có ai đặt giá.`,
          actionUrl: `/auctions/${auction.id}`,
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

        // Thông báo cho Seller (Người thực hiện cancel)
        await notificationService.createNotification(auction.sellerId, {
          type: 'INFO',
          title: 'Đã hủy phiên đấu giá',
          message: `Phiên đấu giá cho sản phẩm "${auction.title}" đã được hủy thành công. Tài sản thế chấp đã được hoàn trả.`,
          actionUrl: `/auctions/${auction.id}`,
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

        // Thông báo cho Winner (người forfeit)
        if (winnerUser) {
          await notificationService.createNotification(winnerUser.id, {
            type: 'WARNING',
            title: 'Bạn đã hủy quyền nhận sản phẩm',
            message: `Bạn đã thực hiện từ bỏ quyền nhận sản phẩm "${auction.title}". Phí phạt 10% (${ethers.formatEther(penalty)} ETH) đã được khấu trừ.`,
            actionUrl: `/auctions/${auction.id}`,
          });
        }

        // Thông báo cho Seller
        await notificationService.createNotification(auction.sellerId, {
          type: 'ERROR',
          title: 'Người thắng cuộc đã từ bỏ sản phẩm',
          message: `Rất tiếc, người thắng cuộc phiên đấu giá "${auction.title}" đã từ bỏ sản phẩm. Bạn nhận được bồi thường từ phí phạt của người thắng.`,
          actionUrl: `/auctions/${auction.id}`,
        });

      } catch (error) {
        console.error('[AuctionListener] Error processing WinnerForfeited event:', error);
      }
    });

    isListening = true;
    console.log('[AuctionListener] Started listening for Auction events');
  } catch (error) {
    console.error('[AuctionListener] Failed to start listener:', error);
    throw error;
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
