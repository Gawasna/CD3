import { prisma } from '../../config/database';
import { ApiError } from '../../shared/utils/api-error';
import { ethers, Contract, Wallet } from 'ethers';
import { notificationService } from '../notification/notification.service';
import { env } from '../../config/env';
import AuctionPlatformABI from '../../abi/AuctionPlatform.json';

/**
 * Mock Shipping Provider Service
 */
export const shippingService = {
  /**
   * Giả lập việc tính phí ship từ một đơn vị vận chuyển bên thứ 3.
   * Logic: Tính dựa trên độ dài chuỗi địa chỉ (demo) hoặc random.
   */
  async getQuote(userId: string, auctionId: string, fromAddress: string, toAddress: string) {
    const auction = await prisma.auctionMetadata.findUnique({
      where: { id: auctionId },
      select: { id: true, sellerId: true, title: true, shippingPayer: true, onChainAuctionId: true },
    });

    if (!auction) throw ApiError.notFound('AUCTION_NOT_FOUND', 'Auction not found');
    if (auction.sellerId !== userId) throw ApiError.forbidden('NOT_SELLER', 'Only seller can request shipping quote');

    // Logic giả lập phí ship: (độ dài địa chỉ * 0.0001 ETH)
    const baseFee = BigInt(fromAddress.length + toAddress.length);
    const feeWei = baseFee * BigInt(10 ** 14); // 0.0001 ETH mỗi ký tự

    // ── Blockchain Update ──────────────────────────────────────────────────
    // Admin gọi setShippingFee lên chuỗi để "chốt" mức phí này vào Escrow
    if (auction.onChainAuctionId) {
      try {
        const provider = new ethers.JsonRpcProvider(env.RPC_URL);
        const wallet = new Wallet(env.ADMIN_PRIVATE_KEY, provider);
        const contract = new Contract(env.CONTRACT_ADDRESS, AuctionPlatformABI.abi, wallet);

        console.log(`[ShippingProvider] Setting on-chain fee for auction ${auction.onChainAuctionId}: ${feeWei} wei`);
        const tx = await contract.setShippingFee(auction.onChainAuctionId, feeWei);
        await tx.wait();
        console.log(`[ShippingProvider] On-chain fee confirmed: ${tx.hash}`);
      } catch (error) {
        console.error('[ShippingProvider] Blockchain sync failed:', error);
        // Trong môi trường đồ án, chúng ta vẫn cho phép tiếp tục lưu DB nếu chuỗi lỗi (e.g. hết gas)
      }
    }

    // Cập nhật phí ship vào Database
    await prisma.auctionMetadata.update({
      where: { id: auctionId },
      data: {
        shippingCostWei: feeWei.toString(),
      },
    });

    // Tạo log vận chuyển
    await prisma.shippingLog.create({
      data: {
        auctionId,
        status: 'PENDING',
        updatedById: userId,
        notes: `Shipping quote requested from ${fromAddress} to ${toAddress}`,
        carrierName: 'CD3 Mock Logistics',
      },
    });

    // Gửi thông báo cho bên chịu phí
    const feeEth = ethers.formatEther(feeWei);
    if (auction.shippingPayer === 'BUYER') {
      // Tìm winner để thông báo (nếu auction đã kết thúc)
      const winningBid = await prisma.bid.findFirst({
        where: { auctionId, isWinning: true },
        select: { bidderId: true },
      });

      if (winningBid) {
        await notificationService.createNotification(winningBid.bidderId, {
          type: 'INFO',
          title: 'Cập nhật phí vận chuyển',
          message: `Phí vận chuyển cho sản phẩm "${auction.title}" đã được xác định là ${feeEth} ETH. Bạn là người chi trả khoản này.`,
          actionUrl: `/auctions/${auctionId}`,
        });
      }
    } else if (auction.shippingPayer === 'SELLER') {
      await notificationService.createNotification(auction.sellerId, {
        type: 'INFO',
        title: 'Báo giá vận chuyển',
        message: `Phí vận chuyển cho sản phẩm "${auction.title}" là ${feeEth} ETH. Khoản này sẽ được khấu trừ vào số tiền bạn nhận được.`,
        actionUrl: `/auctions/${auctionId}`,
      });
    }

    return {
      auctionId,
      feeWei: feeWei.toString(),
      feeEth,
      carrier: 'CD3 Mock Logistics',
    };
  },

  async getShippingDetails(auctionId: string) {
    const logs = await prisma.shippingLog.findMany({
      where: { auctionId },
      orderBy: { createdAt: 'desc' },
      include: {
        updatedBy: {
          select: { displayName: true, walletAddress: true },
        },
      },
    });

    return logs;
  }
};
