import { Options } from 'http-proxy-middleware';

export interface CacheItem {
  key: string;
  data: any;
  createdAt: string;
  ttl: number;
}

export interface CacheOptions {
  ttl?: number; // Time to live in seconds
}

export interface MangadexProxyOptions {
  target: string;
  pathRewrite?: Options['pathRewrite'];
  customRouter?: Options['router'];
}