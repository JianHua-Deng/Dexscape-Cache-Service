import { Request, Response, NextFunction } from 'express';
import cacheService from '../services/cache-service';
import { CACHE_TTL } from '../services/aws-config';
import { NestedFilter } from 'aws-sdk/clients/quicksight';

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
    const cachedImageUrl = await cacheService.getOrCacheImage(coverUrl);

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


export async function chapterImageCacheMiddleware(req: Request, res: Response, next: NextFunction) {

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
    const cachedImageUrl = await cacheService.getOrCacheImage(originalImageUrl);

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


export async function jsonCacheMiddleware(req: Request, res: Response, next: NextFunction) {
  console.log("Running Json middleware");
  if (!isCacheAble(req)) {
    console.log("Json not cachable, returning");
    return next();
  }

  try {

    // Since we can't directly get the full url from the req object, we can concat it
    // Using the url as the key
    const fullUrl = req.url; // `${req.protocol}://${req.get('host')}${req.originalUrl}`
    console.log(`Finding cached data of url: ${fullUrl}`);
    const cachedData = await cacheService.getJsonData(fullUrl);

    if(cachedData) {
      console.log("Found cached data, returning cached data from Dynamodb to client");
      res.json(cachedData);
      return;
    }

    // Now since there are no cached json responses stored in DynamoDB
    // We are going to change the res.send function since it's mutable
    // This is so that we can move on to the next middleware, which actually fetches from Mangadex
    // But since we changed the res.send function, we essentially intercepted the response
    // And it will cache the response before actually sending the response back to the client side

    // Store the original send method
    /*
    const originalSend = res.send;

    res.send = function(body: any): Response {
      try {
        console.log("Intercepted response");
        const data = typeof body === 'string' ? JSON.parse(body) : body;
        cacheService.cacheJsonData(fullUrl, data);
      } catch (error) {
        console.error("Error when intercepting JSON response", error);
      }

      return originalSend.call(this, body);
      
    }
    */
    console.log("No cache found in DynamoDB, proceeding to next middleware");
    next();

  } catch (error) {
    console.error("Error in JSON cache middleware", error);
    next();
  }

}