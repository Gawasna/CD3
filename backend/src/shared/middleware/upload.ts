import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { ApiError } from '../utils/api-error';

// Lưu trữ ảnh vào thư mục root của dự án (ngang hàng frontend, backend)
const uploadDir = path.join(process.cwd(), '../storage/avatars');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Cấu hình storage lưu vào ổ cứng
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    // Tạo tên file ngẫu nhiên để tránh trùng lặp
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `${req.user?.id || 'anon'}-${uniqueSuffix}${ext}`);
  },
});

// Validator chặn định dạng và dung lượng file
const fileFilter = (req: Express.Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/webp'];
  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(ApiError.badRequest('INVALID_FILE_TYPE', 'Chỉ cho phép định dạng JPEG, PNG, WEBP'));
  }
};

// Limit 5MB
export const uploadAvatarMiddleware = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
  },
  fileFilter,
});