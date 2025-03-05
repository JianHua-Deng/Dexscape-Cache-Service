# Dexscape-Caching-Service

**Dexscape-Caching-Service** is a Node.js/TypeScript based caching proxy for MangaDex and is used for my Dexscape project. It intercepts requests for MangaDex images and JSON data, caches the images in an Amazon S3 bucket, caches JSON responses in Amazon DynamoDB, and serves proxied contents or from S3 bucket through CloudFront for fast and reliable delivery.

## Features

- **Reverse Proxy:**  
  Uses [http-proxy-middleware](https://github.com/chimurai/http-proxy-middleware) with Express to forward requests to MangaDex endpoints.

- **Caching Middleware:**  
  - Caches cover and chapter images retrieved from MangaDex into S3.  
  - Caches JSON responses (such as manga lists and metadata) into DynamoDB with a configurable TTL.

- **CloudFront Integration:**  
  Generates URLs pointing to a CloudFront distribution to serve cached content quickly from edge locations.


## Architecture Overview

1. **Incoming Request:**  
   When a client requests a resource (e.g. `/covers`, `/chapter-image`), the Express server first processes the request with custom middleware (e.g. `coverImageCacheMiddleware`).

2. **Cache Lookup:**  
   The caching service checks if the requested resource exists in S3 (for images) or in DynamoDB (for JSON data).

3. **Cache Miss / Hit:**  
   - **Cache Miss:** The service fetches the resource from the original MangaDex endpoint, caches it, and then returns the response to the client.  
   - **Cache Hit:** The service immediately returns a CloudFront URL pointing to the cached resource, ensuring faster delivery.

4. **CloudFront Delivery:**  
   Clients always receive a URL from CloudFront once the content is cached, which benefits from global edge caching.
