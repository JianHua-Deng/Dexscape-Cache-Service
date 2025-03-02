import { Request, Response, NextFunction } from 'express';
import cacheService from '../services/cache-service';
import { CACHE_TTL } from '../services/aws-config';

export function isCacheAble(req: Request): boolean {
  if (req.method !== 'GET'){
    console.log("Not a GET method, returning")
    return false;
  }

  return true;
}


// returning a function because they middleware factories, such so that we can pass params into it
export function coverImageCacheMiddleware(ttl: number = CACHE_TTL) {
  return async (req: Request, res: Response, next: NextFunction) => {
    
    if(!isCacheAble(req)) {
      console.log("Not cachable");
      return next();
    }

    try {
      const coverUrl = `https://uploads.mangadex.org/covers${req.url}`;

      // Get or cache the image
      const cachedImageUrl = await cacheService.getOrCacheImage(coverUrl, { ttl });

      // Redirect to the cached image URL
      if (cachedImageUrl !== coverUrl) {
        console.log(`Finished fetching cover from S3 Bucket. Url: ${cachedImageUrl}`)
        return res.redirect(cachedImageUrl);
      }

      next();

    } catch (error) {
      console.error('Error in cover image cache middleware:', error);
      next();
    }


  }
}

// returning a function because they middleware factories, such so that we can pass params into it
export function chapterImageCacheMiddleware(ttl: number = CACHE_TTL) {
  return async (req: Request, res: Response, next: NextFunction) => {
    if (!isCacheAble(req)){
      console.log("Not cachable, returning")
      return next();
    }

    try {
      const mangadexDomainUrl = req.url.match(/(?<=https?:\/\/)[^/]+(?=\/data)/); // Extract the domain that we get from Mangadex
      if (!mangadexDomainUrl) {
        return next();
      }

      const originalImageUrl = `https://${mangadexDomainUrl[0]}${req.url.replace(/^.*(?=\/data)/, '')}`;

      // Get or cache the image
      const cachedImageUrl = await cacheService.getOrCacheImage(originalImageUrl, { ttl });

      // Redirect to the cached image URL
      if (cachedImageUrl !== originalImageUrl) {
        console.log(`Finished fetching chapter-image from S3 Bucket. Url: ${cachedImageUrl}`);
        return res.redirect(cachedImageUrl);
      }
      
      // If we couldn't cache, continue to proxy
      console.log("Somehow couldn't cache it, proceeding to proxy middleware")
      next();

    } catch (error) {
      console.error('Error in chapter image cache middleware', error);
      next();
    }
  }
}