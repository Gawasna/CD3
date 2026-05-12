import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { ApiError } from '../utils/api-error';

// Cấu hình các thư mục lưu trữ
const AVATAR_DIR = path.join(process.cwd(), '../storage/avatars');
const AUCTION_DIR = path.join(process.cwd(), '../storage/auctions');

// Đảm bảo các thư mục tồn tại
[AVATAR_DIR, AUCTION_DIR].forEach((dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

// ── Avatar Upload Configuration ──────────────────────────────────────────

const avatarStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, AVATAR_DIR);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `avatar-${req.user?.id || 'anon'}-${uniqueSuffix}${ext}`);
  },
});

const avatarFilter = (req: any, file: any, cb: any) => {
  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(ApiError.badRequest('INVALID_FILE_TYPE', 'Avatar chỉ hỗ trợ JPEG, PNG, WEBP'));
  }
};

export const uploadAvatarMiddleware = multer({
  storage: avatarStorage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: avatarFilter,
});

// ── Auction Media Upload Configuration ───────────────────────────────────

const auctionStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, AUCTION_DIR);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `auction-${uniqueSuffix}${ext}`);
  },
});

const auctionFilter = (req: any, file: any, cb: any) => {
  const imageTypes = ['image/jpeg', 'image/png', 'image/webp'];
  const videoTypes = ['video/mp4', 'video/quicktime'];
  
  if (imageTypes.includes(file.mimetype) || videoTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(ApiError.badRequest('INVALID_FILE_TYPE', 'Chỉ hỗ trợ ảnh (JPG, PNG, WEBP) và video (MP4, MOV)'));
  }
};

/**
 * P2 Consensus Gap UI-5: Hỗ trợ upload đa phương tiện cho đấu giá.
 * Giới hạn file được xử lý linh hoạt trong route:
 * - Image < 5MB
 * - Video < 50MB (handled by dynamic limit or separate check if needed)
 * Ở đây set limit 50MB chung, validation cụ thể hơn sẽ ở controller hoặc custom filter.
 */
export const uploadAuctionMiddleware = multer({
  storage: auctionStorage,
  limits: {
    fileSize: 50 * 1024 * 1024, // Max overall limit 50MB (cho video)
  },
  fileFilter: auctionFilter,
});