import S3CacheClient from './cache/s3-cache-service';
import { CacheOptions } from '../utils/types';

class CacheService {
  async getImageUrl(url: string): Promise<string | null> {
    return S3CacheClient.getUrl(url);
  }

  // Cache the image and return the cached URL
  async cacheImage(url: string, options: CacheOptions = {}): Promise<string | null> {
    return S3CacheClient.cacheImage(url, options);
  }

  // Get image, return cached URL if it exists, otherwise fetch from Mangadex, cache it and return the url
  async getOrCacheImage(url: string, options: CacheOptions = {}): Promise<string> {
    const cachedUrl = await this.getImageUrl(url);

    if (cachedUrl) {
      return cachedUrl;
    }

    const newCachedUrl = await this.cacheImage(url, options);
    return newCachedUrl || url;

  }

  // Clear cache for specific url in either the bucket or dynamoDB
  // TODO

}

export default new CacheService();