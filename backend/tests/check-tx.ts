import { ethers } from 'ethers';
import dotenv from 'dotenv';
import path from 'path';

// Load env từ backend/.env
dotenv.config({ path: path.join(__dirname, '.env') });

const RPC_URL = process.env.RPC_URL || 'http://127.0.0.1:8545';
const TX_HASH = '0x01f05d40eb03df539b45f4e053160ff06aca42bb85a0a7e5b9ba3c220a23659c';

async function checkTx() {
  console.log('--- KIỂM TRA TRANSACTION ON-CHAIN ---');
  try {
    const provider = new ethers.JsonRpcProvider(RPC_URL);
    
    console.log(`Checking TX: ${TX_HASH} on ${RPC_URL}`);
    
    const receipt = await provider.getTransactionReceipt(TX_HASH);
    
    if (!receipt) {
      console.log('❌ Transaction KHÔNG TỒN TẠI trên blockchain này.');
      console.log('Có thể node Hardhat đã bị restart và dữ liệu local đã mất.');
    } else {
      console.log('✅ Transaction tìm thấy!');
      console.log(`Status: ${receipt.status === 1 ? 'SUCCESS' : 'FAILED'}`);
      console.log(`Block: ${receipt.blockNumber}`);
      console.log(`Events: ${receipt.logs.length} logs found`);
    }

    const currentBlock = await provider.getBlockNumber();
    console.log(`Current Block Height: ${currentBlock}`);

  } catch (error: any) {
    console.error('❌ Lỗi khi kết nối RPC:', error.message);
  }
}

checkTx();
