import express, { response } from 'express';
import cors from 'cors';
import { createProxyMiddleware, RequestHandler, Options, responseInterceptor } from 'http-proxy-middleware';
import dotenv from 'dotenv';
import morgan from 'morgan';
import path from 'path';
import { IncomingMessage } from 'http';
import { coverImageCacheMiddleware, chapterImageCacheMiddleware, jsonCacheMiddleware } from './middleware/cache-middleware';
import cacheService from './services/cache-service';

dotenv.config({ path: './.env' });

const PORT: number = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;
const app = express();
app.use(cors());

interface MangadexProxyOptions {
  target: string;
  pathRewrite?: Options['pathRewrite'];
  customRouter?: Options['router'];
}

function createMangadexProxy({ target, pathRewrite, customRouter }: MangadexProxyOptions): RequestHandler {
  return createProxyMiddleware({
    target,
    changeOrigin: true,
    router: customRouter,
    pathRewrite,
    logger: console,
  });
}

function createMangadexJsonProxy({ target, pathRewrite, customRouter }: MangadexProxyOptions): RequestHandler {
  return createProxyMiddleware({
    target,
    changeOrigin: true,
    selfHandleResponse: true,
    on: {
      proxyRes: responseInterceptor(async (responseBuffer, proxyRes, req, res) => {
        const fullUrl = req.url as string; // `${req.protocol}://${req.get('host')}${req.originalUrl}`
        try {

          console.log(`Intercepting JSON response from Mangadex, caching response from url ${fullUrl}`);
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

// Middleware to remove/override extra headers
function cleanHeaders(req: express.Request, res: express.Response, next: express.NextFunction): void {
  req.headers['user-agent'] = 'MangaDex Proxy/1.0.0';
  delete req.headers.referer;
  delete req.headers.origin;
  next();
}

/**
 * Proxy for Manga Covers
 */
const mangaCoversProxy = createMangadexProxy({
  target: 'https://uploads.mangadex.org/covers',
});

/**
 * Proxy for Manga List search
 */
const mangaListProxy = createMangadexProxy({
  target: 'https://api.mangadex.org',
});

const mangaListCacheProxy = createMangadexJsonProxy({
  target: 'https://api.mangadex.org',
});

/**
 * Proxy for Specific Manga search
 */
const mangaSearchProxy = createMangadexProxy({
  target: 'https://api.mangadex.org/manga/',
});

const mangaSearchCacheProxy = createMangadexJsonProxy({
  target: 'https://api.mangadex.org/manga/',
});

/**
 * Proxy for Chapter MetaData
 */
const chapterMetaDataProxy = createMangadexProxy({
  target: 'https://api.mangadex.org/at-home',
});

const chapterMetaDataCacheProxy = createMangadexJsonProxy({
  target: 'https://api.mangadex.org/at-home',
});

/**
 * Proxy for Chapter Info
 */
const chapterInfoProxy = createMangadexProxy({
  target: 'https://api.mangadex.org/chapter'
});

const chapterInfoCacheProxy = createMangadexJsonProxy({
  target: 'https://api.mangadex.org/chapter'
})

/**
 * Proxy for Chapter Images with custom routing and path rewriting
 */
const chapterImageProxy = createMangadexProxy({
  target: 'https://uploads.mangadex.org',
  customRouter: (req) => {
    console.log(req.url);
    const match = req.url?.match(/(?<=https?:\/\/)[^/]+(?=\/data)/); // This extract the domain url we get from mangadex
    return match ? `https://${match[0]}` : 'https://uploads.mangadex.org';
  },
  pathRewrite: (path: string, req: IncomingMessage): string => {
    return path.replace(/^.*(?=\/data)/, '');
  },
});

// Setting up proxy middlewares
app.use('/mangaList', cleanHeaders, jsonCacheMiddleware, mangaListCacheProxy);
//app.use('/manga', cleanHeaders, mangaSearchProxy);
app.use('/manga', cleanHeaders,jsonCacheMiddleware, mangaSearchCacheProxy);
//app.use('/covers', cleanHeaders, mangaCoversProxy);
app.use('/covers', cleanHeaders, coverImageCacheMiddleware, mangaCoversProxy);
//app.use('/at-home', cleanHeaders, chapterMetaDataProxy);
app.use('/at-home', cleanHeaders, jsonCacheMiddleware, chapterMetaDataCacheProxy);
//app.use('/chapter', cleanHeaders, chapterInfoProxy);
app.use('/chapter', cleanHeaders, jsonCacheMiddleware, chapterInfoCacheProxy);
//app.use('/chapter-image', cleanHeaders, chapterImageProxy);
app.use('/chapter-image', cleanHeaders, chapterImageCacheMiddleware, chapterImageProxy);

app.listen(PORT, () => {
  console.log("It is currently running on PORT: " + PORT);
});
