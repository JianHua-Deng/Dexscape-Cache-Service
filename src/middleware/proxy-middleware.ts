
import { createProxyMiddleware, RequestHandler, Options, responseInterceptor } from 'http-proxy-middleware';
import cacheService from '../services/cache-service';
import { matchChapterImageDomain, stripBeforeData } from '../utils/utils';
import { MangadexProxyOptions } from '../utils/types';


export function createMangadexImageProxy({ target, pathRewrite, customRouter}: MangadexProxyOptions): RequestHandler {
  return createProxyMiddleware({
    target,
    changeOrigin: true,
    selfHandleResponse: true,
    router: customRouter,
    pathRewrite,
    logger: console,
    on: {
      proxyRes: responseInterceptor(async (responseBuffer, proxyRes, req, res) => {

        let finalPath: string;
        //console.log(`target: ${target}`);

        if (target.includes('/covers')){
          finalPath = `https://uploads.mangadex.org/covers${req.url}`
        } else {
          // Get the target URL that was sent to Mangadex

          // There is currently a bug for the domain variable here. Where the domain isn't correct
          // I assume it is because the req varaible gets the domain from the "target" object
          // But it is fine even if the domain isn't the correct dynamic domain that Mangadex return. We don't use it to fetch when caching anyway
          // All we need is to make sure that it is in a url format and it can turn into a URL object in the generateS3ImageKey function
          const domain = matchChapterImageDomain(req);
          const path = stripBeforeData(req.url);
          finalPath = `${domain}${path}`;
        }

        //console.log(`Final url in image proxy middleware: ${finalPath}`);

        try {
          const contentType = proxyRes.headers['content-type'] || 'image/jpeg';
          await cacheService.cacheImage(finalPath, responseBuffer, contentType);
          console.log("Image Cached to S3 Bucket, now returning response from Mangadex");
          return responseBuffer;

        } catch (error) {
          console.error("Error intercepting image response from Mangadex", error);
          return responseBuffer;
        }
        
      })
    }
  })
}


export function createMangadexJsonProxy({ target, pathRewrite, customRouter }: MangadexProxyOptions): RequestHandler {
  return createProxyMiddleware({
    target,
    changeOrigin: true,
    selfHandleResponse: true,
    on: {

      proxyRes: responseInterceptor(async (responseBuffer, proxyRes, req, res) => {
        const fullUrl = req.url as string; // `${req.protocol}://${req.get('host')}${req.originalUrl}`
        try {

          console.log(`Intercepting JSON response from Mangadex, caching response for url: ${fullUrl}`);
          const responseText = responseBuffer.toString('utf8');
          const data = JSON.parse(responseText);
          await cacheService.cacheJsonData(fullUrl, data);

          console.log("Cache complete, returning Mangadex's response to client");
          return responseText;

        } catch (error) {
          console.error("Error intercepting and caching JSON response", error);
          return responseBuffer;
        }
      })
    }
  });

}