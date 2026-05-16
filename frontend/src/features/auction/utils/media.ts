/**
 * Media Utilities for Auction
 */

export const isVideo = (filename: string): boolean => {
  if (!filename) return false;
  const ext = filename.split('.').pop()?.toLowerCase();
  return ['mp4', 'mov', 'quicktime', 'webm', 'avi', 'mkv'].includes(ext || '');
};

export const getMediaUrl = (filename: string): string => {
  if (!filename) return '';
  if (filename.startsWith('http') || filename.startsWith('/')) return filename;
  
  const baseUrl = process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') || 'http://127.0.0.1:3001';
  return `${baseUrl}/uploads/auctions/${filename}`;
};

export const getFirstImageFilename = (ipfsCid: string | null): string | null => {
  if (!ipfsCid) return null;
  try {
    const media: string[] = JSON.parse(ipfsCid);
    if (!Array.isArray(media)) return null;
    const firstImage = media.find((f) => !isVideo(f));
    return firstImage ?? media[0] ?? null;
  } catch {
    return null;
  }
};

/**
 * Trả về URL ảnh gốc của auction (backward compatible).
 * Để sử dụng thumbnail tự sinh (có fallback), hãy dùng getFirstImageFilename() kết hợp với <AuctionImage />.
 */
export const getThumbnail = (ipfsCid: string | null): string => {
  const filename = getFirstImageFilename(ipfsCid);
  if (!filename) return '';
  return getMediaUrl(filename);
};

export const getReorderedMedia = (ipfsCid: string | null): string[] => {
  if (!ipfsCid) return [];
  
  try {
    const media = JSON.parse(ipfsCid);
    if (Array.isArray(media)) {
      const videos = media.filter(item => isVideo(item));
      const images = media.filter(item => !isVideo(item));
      return [...videos, ...images];
    }
  } catch (e) {
    console.error('Failed to parse ipfsCid for reordered media:', e);
  }
  
  return [];
};
