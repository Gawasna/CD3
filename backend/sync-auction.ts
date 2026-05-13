import { ethers } from 'ethers';
import { PrismaClient } from '@prisma/client';
import AuctionPlatformABI from './src/abi/AuctionPlatform.json';
import * as dotenv from 'dotenv';

dotenv.config();

const prisma = new PrismaClient();

async function sync() {
  const RPC_URL = process.env.RPC_URL || 'http://127.0.0.1:7545';
  const CONTRACT_ADDRESS = process.env.CONTRACT_ADDRESS;

  if (!CONTRACT_ADDRESS) {
    console.error('CONTRACT_ADDRESS not found in .env');
    return;
  }

  console.log('--- MANUAL AUCTION SYNC ---');
  console.log('RPC:', RPC_URL);
  console.log('Contract:', CONTRACT_ADDRESS);

  const provider = new ethers.JsonRpcProvider(RPC_URL);
  const contract = new ethers.Contract(CONTRACT_ADDRESS, AuctionPlatformABI.abi, provider);

  const auction = await prisma.auctionMetadata.findFirst({
    where: { status: 'PENDING' },
    orderBy: { createdAt: 'desc' }
  });

  if (!auction || !auction.createTxHash) {
    console.log('Không có auction PENDING nào cần sync.');
    return;
  }

  console.log(`Đang kiểm tra TX: ${auction.createTxHash}`);

  try {
    const receipt = await provider.getTransactionReceipt(auction.createTxHash);
    if (!receipt) {
      console.log('Transaction chưa được mine hoặc không tồn tại.');
      return;
    }

    // Tìm event AuctionCreated trong receipt
    const interface_ = new ethers.Interface(AuctionPlatformABI.abi);
    let auctionIdOnChain: bigint | null = null;
    let startingPrice: bigint | null = null;
    let endTime: bigint | null = null;

    for (const log of receipt.logs) {
      try {
        const parsedLog = interface_.parseLog(log);
        if (parsedLog?.name === 'AuctionCreated') {
          auctionIdOnChain = parsedLog.args[0];
          startingPrice = parsedLog.args[2];
          endTime = parsedLog.args[3];
          break;
        }
      } catch (e) {
        // Not our event
      }
    }

    if (auctionIdOnChain !== null) {
      console.log(`Tìm thấy Event! ID On-chain: ${auctionIdOnChain.toString()}`);
      
      await prisma.auctionMetadata.update({
        where: { id: auction.id },
        data: {
          onChainAuctionId: auctionIdOnChain,
          status: 'ACTIVE',
          startingPriceWei: startingPrice?.toString(),
          endTime: new Date(Number(endTime) * 1000)
        }
      });
      console.log('Đã cập nhật DB thành ACTIVE.');
    } else {
      console.log('Không tìm thấy event AuctionCreated trong Transaction này.');
    }
  } catch (error) {
    console.error('Lỗi khi sync:', error);
  } finally {
    await prisma.$disconnect();
  }
}

sync();
