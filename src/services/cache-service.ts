import S3CacheClient from './cache/s3-cache-service';
import DynamoDBClient from './cache/dynamo-cache-service';

class CacheService {
  async getImageUrl(url: string): Promise<string | null> {
    return S3CacheClient.getUrl(url);
  }

  // Cache the image and return the cached URL
  async cacheImage(url: string): Promise<string | null> {
    return S3CacheClient.cacheImage(url);
  }

  // Get image, return cached URL if it exists, otherwise fetch from Mangadex, cache it and return the url
  async getOrCacheImage(url: string): Promise<string> {
    const cachedUrl = await this.getImageUrl(url);

    if (cachedUrl) {
      return cachedUrl;
    }

    const newCachedUrl = await this.cacheImage(url);
    return newCachedUrl || url;

  }

  async getJsonData(key: string): Promise<any | null> {
    return DynamoDBClient.get(key);
  }

  async cacheJsonData(key: string, data: any): Promise<void>{
    return DynamoDBClient.set(key, data);
  }

}

export default new CacheService();