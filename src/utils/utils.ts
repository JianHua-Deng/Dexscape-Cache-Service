import { URL } from "url";
import path from "path";
import crypto from 'crypto';
import { CACHE_TTL } from "../services/aws-config";
import { IncomingMessage } from "http";
import { Request, Response, NextFunction } from 'express';

// Generate a cache key from a URL
export function generateCacheKey(url: string): string {
  return crypto.createHash('md5').update(url).digest('hex');
}

// Determine if a cached item is still valid
export function isCacheValid(expiresAt: number): boolean {
  return Date.now() < expiresAt;
}

export function getExpirationTime(ttl: number = CACHE_TTL): number {
  // Current seconds + ttl = expireTime
  return Math.floor(Date.now() / 1000) + ttl; // Turning it into unix timestamp in seconds
}

// Extract the dyanmic domain we get from Mangadex for chapter image
export function matchChapterImageDomain(req: IncomingMessage | Request ): string {
  //console.log(`Original req url: ${req.url}`);
  const match = req.url?.match(/(?<=https?:\/\/)[^/]+(?=\/data)/); // This extract the domain url we get from mangadex
  return match ? `https://${match[0]}` : 'https://uploads.mangadex.org';
}

// It strips everything that is before '/data'
export function stripBeforeData(path: string | undefined) : string {
  if (path){
    //console.log(`Original path url: ${path}`);
    return path?.replace(/^.*(?=\/data)/, '');
  }

  console.error("Undefined url when trying to stripping everything before '/data', ");
  return '';

}

export function generateS3ImageKey(url: string): string {
  try {
    //console.log(`GenerateS3ImageKey original Url: ${url}`);
    const parsedUrl = new URL(url);
    const urlPath = parsedUrl.pathname;
    //console.log(`GenerateS3ImageKey Url: ${urlPath}`)

    // create a structured path based on endpoint
    if (urlPath.includes('/covers/')) {
      const paths = urlPath.split('/'); //['', 'cover', 'mangaID', 'coverID']
      return `covers/${paths[2]}/${paths[3]}`;

    } else if (urlPath.includes('/data/')) {
      // for chapter images, preserve more of the path strucutre
      const pathParts = urlPath.split('/data/');
      if (pathParts.length > 1) {
        return `chapter-images/${pathParts[1]}`
      }
    }

    // Fallback - use MD5 hash as filename
    console.error("Error in generating correct directory path for Caching in S3 Bucket");
    return `other/${generateCacheKey(url)}`;

  } catch (error) {
    console.error("Error in generating correct directory path for Caching in S3 Bucket", error);
    return `other/${generateCacheKey(url)}`;
  }
}