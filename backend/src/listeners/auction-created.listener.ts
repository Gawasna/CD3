import { ethers } from 'ethers';
import { prisma } from '../config/database';
import { env } from '../config/env';
import AuctionPlatformABI from '../abi/AuctionPlatform.json';

/**
 * Auction Created Event Listener
 * 
 * Lắng nghe sự kiện AuctionCreated từ smart contract và đồng bộ vào database.
 * 
 * Flow:
 * 1. Lắng nghe event AuctionCreated(auctionId, seller, startingPrice, endTime, productCid)
 * 2. Tìm record PENDING trong DB bằng createTxHash
 * 3. Update onChainAuctionId và chuyển status sang ACTIVE
 * 
 * Giải quyết vấn đề: Frontend relay có thể fail, listener đảm bảo data sync.
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
        await prisma.auctionMetadata.update({
          where: { id: auction.id },
          data: {
            onChainAuctionId: auctionId,
            status: 'ACTIVE',
            // Verify data matches
            startingPriceWei: startingPrice.toString(),
            endTime: new Date(Number(endTime) * 1000),
          },
        });

        console.log('[AuctionListener] Auction synced successfully:', {
          auctionId: auction.id,
          onChainAuctionId: auctionId.toString(),
        });
      } catch (error) {
        console.error('[AuctionListener] Error processing AuctionCreated event:', error);
      }
    });

    isListening = true;
    console.log('[AuctionListener] Started listening for AuctionCreated events');
  } catch (error) {
    console.error('[AuctionListener] Failed to start listener:', error);
    throw error;
  }
}

export function stopAuctionCreatedListener() {
  if (contract && isListening) {
    contract.removeAllListeners('AuctionCreated');
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
