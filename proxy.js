import express from 'express';
import cors from 'cors';
import {createProxyMiddleware, responseInterceptor} from 'http-proxy-middleware';
import dotenv from 'dotenv';
import morgan from 'morgan';
import path from 'path';
dotenv.config({path: './.env'})

const PORT = process.env.PORT || 3000;
const app = express();
app.use(cors());

function createMangadexProxy({target, pathRewrite, customRouter}){
  return createProxyMiddleware({
    target: target,
    changeOrigin: true,
    router: customRouter,
    pathRewrite: pathRewrite,

    logLevel: 'debug',
    logger: console,
  });
}

/**
 * Covers Proxy
 * /covers -> https://uploads.mangadex.org/covers
 */
const mangaCoversProxy = createMangadexProxy({
  target: 'https://uploads.mangadex.org/covers',
});

/**
 * Note that express automatically strips the initial matching prefix from the request path
 * For example: Requesting -> /mangaList/manga?<searchParameters> Ends up with -> /manga?<searchParameters>
 */

/**
 * Proxy for searching list of Mangas
 * /mangaList/manga?<searchParameters> -> https://api.mangadex.org/manga?<searchParameters>
 */
const mangaListProxy = createMangadexProxy({
  target: 'https://api.mangadex.org',
});

/**
 * Proxy for specific Manga search
 * /manga/<mangaId> -> https://api.mangadex.org/manga/<mangaId>
 */
const mangaSearchProxy = createMangadexProxy({
  target: 'https://api.mangadex.org/manga/',
});

/**
 * Chapter MetaData
 * /at-home -> https://api.mangadex.org/at-home
 */
const chapterMetaDataProxy = createMangadexProxy({
  target: 'https://api.mangadex.org/at-home',
});

/**
 * Chapter Image
 * Custom router logic for rewriting baseUrl from the request path
 */
const chapterImageProxy = createMangadexProxy({
  target: 'https://uploads.mangadex.org',
  customRouter: (req) => {
    console.log(req.url);
    const baseUrl = req.url.match(/(?<=https?:\/\/)[^/]+(?=\/data)/); // Matching the baseUrl and only the baseUrl from the request
    if (baseUrl) {
      return `https://${baseUrl}`;
    }
    return 'https://uploads.mangadex.org';
  },
  pathRewrite: (path, req) => {
    // Empty out anything before /data, and take that as the path
    return path.replace(/^.*(?=\/data)/, '');
  },
});

// These are necessary to set the user-agent header for the request, otherwise it will return mangadex's default wrong image
app.use("/covers", (req, res, next) => {
  req.headers = { "user-agent": "MangaDex Proxy/1.0.0" };
  next(); 
});

app.use("/chapter-image", (req, res, next) => {
  req.headers = { "user-agent": "MangaDex Proxy/1.0.0" };
  next(); 
});

// Setting proxy middlewares
app.use('/mangaList', mangaListProxy);
app.use('/manga', mangaSearchProxy);
app.use('/covers', mangaCoversProxy);
app.use('/at-home', chapterMetaDataProxy);
app.use('/chapter-image', chapterImageProxy);


app.listen(PORT, () => {
    console.log("It is currently running on PORT: " + PORT);
})

//const __dirname = path.resolve();
//app.use(express.static(path.join(__dirname, 'dist')));