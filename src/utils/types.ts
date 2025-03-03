export interface CacheItem {
  key: string;
  data: any;
  createdAt: string;
  ttl: number;
}

export interface CacheOptions {
  ttl?: number; // Time to live in seconds
}