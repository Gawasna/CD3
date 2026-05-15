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
  
  const baseUrl = process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') || 'http://localhost:3001';
  return `${baseUrl}/uploads/auctions/${filename}`;
};

export const getThumbnail = (ipfsCid: string | null): string => {
  if (!ipfsCid) return '';
  
  try {
    const media = JSON.parse(ipfsCid);
    if (Array.isArray(media)) {
      // Tìm ảnh đầu tiên để làm thumbnail
      const firstImage = media.find(item => !isVideo(item));
      if (firstImage) {
        return getMediaUrl(firstImage);
      }
      // Nếu không có ảnh, lấy item đầu tiên (có thể là video)
      if (media.length > 0) {
        return getMediaUrl(media[0]);
      }
    }
  } catch (e) {
    console.error('Failed to parse ipfsCid for thumbnail:', e);
  }
  
  return '';
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
