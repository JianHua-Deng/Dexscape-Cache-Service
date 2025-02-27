import express from 'express';
import cors from 'cors';
import { createProxyMiddleware } from 'http-proxy-middleware';
import dotenv from 'dotenv';
dotenv.config({ path: './.env' });
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;
const app = express();
app.use(cors());
function createMangadexProxy({ target, pathRewrite, customRouter }) {
    return createProxyMiddleware({
        target,
        changeOrigin: true,
        router: customRouter,
        pathRewrite,
        logger: console,
    });
}
// Middleware to remove/override extra headers
function cleanHeaders(req, res, next) {
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
        var _a;
        console.log(req.url);
        const match = (_a = req.url) === null || _a === void 0 ? void 0 : _a.match(/(?<=https?:\/\/)[^/]+(?=\/data)/);
        return match ? `https://${match[0]}` : 'https://uploads.mangadex.org';
    },
    pathRewrite: (path, req) => {
        return path.replace(/^.*(?=\/data)/, '');
    },
});
// Setting up proxy middlewares
app.use('/mangaList', cleanHeaders, mangaListProxy);
app.use('/manga', cleanHeaders, mangaSearchProxy);
app.use('/covers', cleanHeaders, mangaCoversProxy);
app.use('/at-home', cleanHeaders, chapterMetaDataProxy);
app.use('/chapter', cleanHeaders, chapterInfoProxy);
app.use('/chapter-image', cleanHeaders, chapterImageProxy);
app.listen(PORT, () => {
    console.log("It is currently running on PORT: " + PORT);
});
