import { URL } from "url";
import path from "path";
import crypto from 'crypto';
import { CACHE_TTL } from "../services/aws-config";

// Generate a cache key from a URL
export function generateCacheKey(url: string): string {
  return crypto.createHash('md5').update(url).digest('hex');
}

// Determine if a cached item is still valid
export function isCacheValid(expiresAt: number): boolean {
  return Date.now() < expiresAt;
}

export function getExpirationTime(ttl: number = CACHE_TTL): number {
  return Date.now() + (ttl * 1000);
}

export function generateS3ImageKey(url: string): string {
  try {
    const parsedUrl = new URL(url);
    const urlPath = parsedUrl.pathname;

    // create a structured path based on endpoint
    if (urlPath.includes('/covers/')) {
      return `covers/${path.basename(urlPath)}`;

    } else if (urlPath.includes('/data/')) {
      // for chapter images, preserve more of the path strucutre
      const pathParts = urlPath.split('/data/');
      if (pathParts.length > 1) {
        return `chapter-images/${pathParts[1]}`
      }
    }

    // Fallback - use MD5 hash as filename
    return `other/${generateCacheKey(url)}`;

  } catch (error) {
    return `other/${generateCacheKey(url)}`;
  }
}