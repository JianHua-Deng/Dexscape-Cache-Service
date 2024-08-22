import express from 'express';
import cors from 'cors';
import {createProxyMiddleware} from 'http-proxy-middleware';
import dotenv from 'dotenv';
import morgan from 'morgan';
import path from 'path';
dotenv.config({path: './.env'});

//const PORT = process.env.PORT || 3000;
const PORT = 4000;
const app = express();

app.use(cors());

//removing headers except user-agent, It wouldn't work if I don't do this
app.use("/covers", (req, res, next) => {
    req.headers = { "user-agent": "Mangasite/1.0.0" };
    next(); 
  });

app.use("/manga", (req, res, next) => {
    req.headers = { "user-agent": "Mangasite/1.0.0" };
    next(); 
  });

const mangaCoversProxy = createProxyMiddleware({
    target: 'https://uploads.mangadex.org/covers/',
    changeOrigin: true,
    logLevel: 'debug',
    logger: console,
    /*
    onProxyRes(proxyRes, req, res) {
        // Enable CORS
        const origin = req.headers.origin
        proxyRes.headers['Access-Control-Allow-Origin'] = origin
        proxyRes.headers['Access-Control-Allow-Credentials'] = true
    }
    */
});

const mangaSearchProxy = createProxyMiddleware({
    target: 'https://api.mangadex.org/manga',
    changeOrigin: true,
    logLevel: 'debug',
    logger: console,
    /*
    onProxyRes(proxyRes, req, res) {
        // Enable CORS
        const origin = req.headers.origin
        proxyRes.headers['Access-Control-Allow-Origin'] = origin
        proxyRes.headers['Access-Control-Allow-Credentials'] = true
    }
    */
});

const chapterFeedProxy = createProxyMiddleware({
    target: 'https://api.mangadex.org/manga',
    changeOrigin: true,
    logLevel: 'debug',
    logger: console,
});

const chapterHashProxy = createProxyMiddleware({
    target: 'https://api.mangadex.org/at-home/server',
    changeOrigin: true,
    logLevel: 'debug',
    logger: console,
});

const chapterImageProxy = createProxyMiddleware({
    target: 'https://uploads.mangadex.org/data',
    changeOrigin: true,
    logLevel: 'debug',
    logger: console,
     
});

app.use('/manga', mangaSearchProxy);
app.use('/covers', mangaCoversProxy);
app.use('/feed', chapterFeedProxy);

app.listen(4000, () => {
    console.log("It is currently running on PORT: " + PORT);
});

//const __dirname = path.resolve();
//app.use(express.static(path.join(__dirname, 'dist')));

/*
const corsOption = {
    credentials: true,
    origin: ['http://localhost:5000', 'http://localhost:5173'],
    optionsSuccessStatus: 200,
    origin: true
}


onProxyRes(proxyRes, req, res) {
    // Enable CORS
    const origin = req.headers.origin;
    proxyRes.headers['Access-Control-Allow-Origin'] = origin;
    proxyRes.headers['Access-Control-Allow-Credentials'] = true;
    }
*/