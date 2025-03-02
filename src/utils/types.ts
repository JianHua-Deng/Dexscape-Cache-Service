export interface CacheItem {
  key: string;
  data: any;
  expiresAt: number;
}

export interface CacheOptions {
  ttl?: number; // Time to live in seconds
}