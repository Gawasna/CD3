'use client';

import { useState } from 'react';
import Image from 'next/image';
import { getMediaUrl } from '@/features/auction/utils/media';

interface AuctionImageProps {
  /** Tên file ảnh gốc (không phải thumb, không phải full URL) */
  filename: string;
  alt: string;
  fill?: boolean;
  width?: number;
  height?: number;
  sizes?: string;
  className?: string;
  priority?: boolean;
}

/**
 * Wrapper around next/image cho auction media.
 * Tự động thử _thumb.webp trước, fallback về ảnh gốc nếu 404.
 * Đảm bảo backward compat với các auction upload trước khi có thumbnail generation.
 */
export function AuctionImage({
  filename,
  alt,
  fill,
  width,
  height,
  sizes,
  className,
  priority,
}: AuctionImageProps) {
  const ext = filename.split('.').pop()?.toLowerCase() ?? '';
  const base = filename.slice(0, filename.length - ext.length - 1);
  const thumbUrl = getMediaUrl(`${base}_thumb.webp`);
  const originalUrl = getMediaUrl(filename);

  const [src, setSrc] = useState(thumbUrl || originalUrl);

  const handleError = () => {
    // Thumbnail không tồn tại (auction upload trước khi có thumbnail gen)
    // → fallback về ảnh gốc full-size
    if (src !== originalUrl) {
      setSrc(originalUrl);
    }
  };

  const isLocal = src.includes('localhost') || src.includes('127.0.0.1');

  return (
    <Image
      src={src}
      alt={alt}
      fill={fill}
      width={!fill ? width : undefined}
      height={!fill ? height : undefined}
      sizes={sizes}
      className={className}
      priority={priority}
      onError={handleError}
      unoptimized={isLocal}
    />
  );
}
