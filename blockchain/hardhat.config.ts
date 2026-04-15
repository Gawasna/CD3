import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import * as dotenv from "dotenv";

dotenv.config();

// Private key của Ganache account dùng để deploy
// Lấy từ Ganache UI (tab Accounts) hoặc ganache-cli output
// Để vào .env, KHÔNG hardcode ở đây
const DEPLOYER_PRIVATE_KEY =
  process.env.DEPLOYER_PRIVATE_KEY ??
  // Fallback: Hardhat default account #0 — chỉ dùng cho hardhat network
  "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80";

const config: HardhatUserConfig = {
  solidity: {
    version: "0.8.28",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
    },
  },

  networks: {
    // Hardhat in-process network — dùng cho unit test (nhanh nhất)
    hardhat: {
      chainId: 31337,
    },

    // Ganache Desktop / ganache-cli
    // Default port: 7545 (Desktop UI), 8545 (CLI) — đổi theo môi trường
    ganache: {
      url: process.env.GANACHE_URL ?? "http://127.0.0.1:7545",
      chainId: parseInt(process.env.GANACHE_CHAIN_ID ?? "1337"),
      accounts: [DEPLOYER_PRIVATE_KEY],
    },

    // Placeholder cho tương lai — Sepolia testnet
    sepolia: {
      url: process.env.SEPOLIA_RPC_URL ?? "",
      chainId: 11155111,
      accounts: process.env.DEPLOYER_PRIVATE_KEY ? [process.env.DEPLOYER_PRIVATE_KEY] : [],
    },
  },

  // Hardhat default paths — giữ chuẩn
  paths: {
    sources: "./contracts",
    tests: "./test",
    cache: "./cache",
    artifacts: "./artifacts",
  },
};

export default config;
