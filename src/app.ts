import express from 'express';
import cors from 'cors';
import { createProxyMiddleware, RequestHandler, Options } from 'http-proxy-middleware';
import dotenv from 'dotenv';
import morgan from 'morgan';
import path from 'path';
import { IncomingMessage } from 'http';
import { coverImageCacheMiddleware, chapterImageCacheMiddleware } from './middleware/cache-middleware';

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

/**
 * Proxy for Specific Manga search
 */
const mangaSearchProxy = createMangadexProxy({
  target: 'https://api.mangadex.org/manga/',
});

/**
 * Proxy for Chapter MetaData
 */
const chapterMetaDataProxy = createMangadexProxy({
  target: 'https://api.mangadex.org/at-home',
});

/**
 * Proxy for Chapter Info
 */
const chapterInfoProxy = createMangadexProxy({
  target: 'https://api.mangadex.org/chapter'
});

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
app.use('/mangaList', cleanHeaders, mangaListProxy);
app.use('/manga', cleanHeaders, mangaSearchProxy);
//app.use('/covers', cleanHeaders, mangaCoversProxy);
app.use('/covers', cleanHeaders, coverImageCacheMiddleware(), mangaCoversProxy);
app.use('/at-home', cleanHeaders, chapterMetaDataProxy);
app.use('/chapter', cleanHeaders, chapterInfoProxy);
//app.use('/chapter-image', cleanHeaders, chapterImageProxy);
app.use('/chapter-image', cleanHeaders, chapterImageCacheMiddleware(), chapterImageProxy);

app.listen(PORT, () => {
  console.log("It is currently running on PORT: " + PORT);
});
