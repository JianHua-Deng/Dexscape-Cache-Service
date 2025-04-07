import express, { response } from 'express';
import cors from 'cors';
import { createProxyMiddleware } from 'http-proxy-middleware';
import dotenv from 'dotenv';
import { IncomingMessage } from 'http';
import { coverImageCacheMiddleware, chapterImageCacheMiddleware, jsonCacheMiddleware } from './middleware/cache-middleware';
import { matchChapterImageDomain, stripBeforeData } from './utils/utils';
import { createMangadexImageProxy, createMangadexJsonProxy } from './middleware/proxy-middleware';

dotenv.config({ path: './.env' });

const PORT: number = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;
const allowedOrigins = ["http://localhost:5173", "http://localhost:3000", "http://localhost:4173", "https://dexscape.vercel.app"]

const app = express();
app.use(cors({
  origin: (origin, callback) => {
    // Allow requests from same origin
    if(!origin) {
      return callback(null, true);
    }
    // Check if origin is allowed
    if(allowedOrigins.includes(origin)) {
      return callback(null, true);
    } else {
      return callback(new Error("Origin not allowed"));
    }
  }
}));


// Middleware to remove/override extra headers
function cleanHeaders(req: express.Request, res: express.Response, next: express.NextFunction): void {
  req.headers['user-agent'] = 'MangaDex Proxy/1.0.0';
  delete req.headers.referer;
  delete req.headers.origin;
  next();
}

/**
 * Proxy for checking Mangadex server's health
 */

const mangadexHealthProxy = createProxyMiddleware({
  target: 'https://api.mangadex.org',
  pathRewrite: {'^/' : '/ping'},
  changeOrigin: true,
  logger: console,
});

/**
 * Proxy for Manga Covers
 */
const mangaCoversProxy = createMangadexImageProxy({
  target: 'https://uploads.mangadex.org/covers',
});

/**
 * Proxy for Manga List search
 */
const mangaListCacheProxy = createMangadexJsonProxy({
  target: 'https://api.mangadex.org',
});

/**
 * Proxy for Specific Manga search
 */
const mangaSearchCacheProxy = createMangadexJsonProxy({
  target: 'https://api.mangadex.org/manga/',
});

/**
 * Proxy for Chapter MetaData
 */

const chapterMetaDataCacheProxy = createMangadexJsonProxy({
  target: 'https://api.mangadex.org/at-home',
});

/**
 * Proxy for Chapter Info
 */

const chapterInfoCacheProxy = createMangadexJsonProxy({
  target: 'https://api.mangadex.org/chapter'
})

/**
 * Proxy for Chapter Images with custom routing and path rewriting
 */
const chapterImageProxy = createMangadexImageProxy({
  target: 'https://uploads.mangadex.org',
  customRouter: (req) => {
    return matchChapterImageDomain(req);
    
  },
  pathRewrite: (path: string, req: IncomingMessage): string => {
    return stripBeforeData(path);
  },
});

// Setting up proxy middlewares
app.use('/ping', cleanHeaders, mangadexHealthProxy);

app.use('/mangaList', cleanHeaders, jsonCacheMiddleware, mangaListCacheProxy);

app.use('/manga', cleanHeaders,jsonCacheMiddleware, mangaSearchCacheProxy);

app.use('/covers', cleanHeaders, coverImageCacheMiddleware, mangaCoversProxy);

app.use('/at-home', cleanHeaders, jsonCacheMiddleware, chapterMetaDataCacheProxy);

app.use('/chapter', cleanHeaders, jsonCacheMiddleware, chapterInfoCacheProxy);

app.use('/chapter-image', cleanHeaders, chapterImageCacheMiddleware, chapterImageProxy);

app.listen(PORT, () => {
  console.log("It is currently running on PORT: " + PORT);
});
