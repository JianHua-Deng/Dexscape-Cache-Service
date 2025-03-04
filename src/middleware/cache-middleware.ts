import { Request, Response, NextFunction } from 'express';
import cacheService from '../services/cache-service';
import { CACHE_TTL } from '../services/aws-config';
import { NestedFilter } from 'aws-sdk/clients/quicksight';
import { matchChapterImageDomain, stripBeforeData } from '../utils/utils';

export function isCacheAble(req: Request): boolean {
  if (req.method !== 'GET'){
    console.log("Not a GET method, returning")
    return false;
  }

  return true;
}


export async function coverImageCacheMiddleware(req: Request, res: Response, next: NextFunction) {
    
  if(!isCacheAble(req)) {
    console.log("Not cachable");
    return next();
  }

  try {
    const coverUrl = `https://uploads.mangadex.org/covers${req.url}`;

    // Get or cache the image
    const cachedImageUrl = await cacheService.getImageUrl(coverUrl);

    // Redirect to the cached image URL
    if (cachedImageUrl && cachedImageUrl !== coverUrl) {
      console.log(`Finished fetching cover from S3 Bucket. Url: ${cachedImageUrl}`)
      return res.redirect(cachedImageUrl);
    }
      
    //console.log("Cover image doesn't exist in S3 Bucket, continuing to proxy");


    next();

  } catch (error) {
    console.error('Error in cover image cache middleware:', error);
    next();
  }



}


export async function chapterImageCacheMiddleware(req: Request, res: Response, next: NextFunction) {

  if (!isCacheAble(req)){
    console.log("Not cachable, returning")
    return next();
  }

  try {
    const mangadexDomainUrl = matchChapterImageDomain(req); // Extract the domain that we get from Mangadex
    const path = stripBeforeData(req.url);
    if (!mangadexDomainUrl) {
      return next();
    }

    const mangadexImageUrl = `${mangadexDomainUrl}${path}`;
    //console.log(`OriginalImageUrl: ${originalImageUrl}`);

    // Get or cache the image
    const cachedImageUrl = await cacheService.getImageUrl(mangadexImageUrl);

    // Redirect to the cached image URL
    if (cachedImageUrl && cachedImageUrl !== mangadexImageUrl) {
      console.log(`Finished fetching chapter-image from S3 Bucket. Url: ${cachedImageUrl}`);
      return res.redirect(cachedImageUrl);
    }
    
    // If we couldn't cache, continue to proxy
    //console.log("Chapter image doesn't exist in S3 Bucket, continuing to proxy");
    next();

  } catch (error) {
    console.error('Error in chapter image cache middleware', error);
    next();
  }
  
}


export async function jsonCacheMiddleware(req: Request, res: Response, next: NextFunction) {
  if (!isCacheAble(req)) {
    console.log("Json not cachable, returning");
    return next();
  }

  try {

    // Since we can't directly get the full url from the req object, we can concat it
    // Using the url as the key
    const fullUrl = req.url; // `${req.protocol}://${req.get('host')}${req.originalUrl}`
    //console.log(`Finding cached data for the url: ${fullUrl}`);
    const cachedData = await cacheService.getJsonData(fullUrl);

    if(cachedData) {
      console.log("Found cached data, returning cached data from Dynamodb to client");
      res.json(cachedData);
      return;
    }

    //console.log("No cache found in DynamoDB, proceeding to proxy middleware");
    next();

  } catch (error) {
    console.error("Error in JSON cache middleware", error);
    next();
  }

}