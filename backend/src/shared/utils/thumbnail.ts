import sharp from 'sharp';
import path from 'path';

/**
 * Kích thước thumbnail chuẩn cho auction media.
 * 300x300 cover đủ rõ cho card, dropdown, list view.
 */
const THUMB_SIZE = 300;
const THUMB_QUALITY = 80;
const THUMB_SUFFIX = '_thumb.webp';

/**
 * Trả về tên file thumbnail tương ứng với file gốc.
 * Ví dụ: "auction-123.jpg" → "auction-123_thumb.webp"
 */
export function toThumbFilename(originalFilename: string): string {
  const ext = path.extname(originalFilename);
  const base = path.basename(originalFilename, ext);
  return `${base}${THUMB_SUFFIX}`;
}

/**
 * Sinh thumbnail từ ảnh gốc.
 * - Resize theo cover 300×300, không upscale nếu nhỏ hơn
 * - Lưu cùng thư mục với ảnh gốc
 * - Trả về tên file thumbnail đã tạo
 *
 * @param originalPath - Đường dẫn tuyệt đối đến ảnh gốc
 * @returns Tên file thumbnail (không phải full path)
 */
export async function generateThumbnail(originalPath: string): Promise<string> {
  const dir = path.dirname(originalPath);
  const originalFilename = path.basename(originalPath);
  const thumbFilename = toThumbFilename(originalFilename);
  const thumbPath = path.join(dir, thumbFilename);

  await sharp(originalPath)
    .resize(THUMB_SIZE, THUMB_SIZE, {
      fit: 'cover',
      position: 'centre',
      withoutEnlargement: true, // không upscale ảnh nhỏ hơn THUMB_SIZE
    })
    .webp({ quality: THUMB_QUALITY })
    .toFile(thumbPath);

  return thumbFilename;
}

/**
 * Kiểm tra mimetype có phải ảnh tĩnh không (không xử lý video).
 */
export function isImageMimetype(mimetype: string): boolean {
  return ['image/jpeg', 'image/png', 'image/webp', 'image/gif'].includes(mimetype);
}
