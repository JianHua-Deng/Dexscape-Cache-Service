import express from 'express'
import cors from 'cors'
import { createProxyMiddleware } from 'http-proxy-middleware';
import dotenv from 'dotenv';
import morgan from 'morgan';
import path from 'path';

dotenv.config({path: './.env'})

const PORT = process.env.PORT || 3000;
const app = express();
app.use(cors());
app.options('*', cors());

const __dirname = path.resolve();
app.use(express.static(path.join(__dirname, 'dist')));


app.use((req, res, next) => {
    console.log('Incoming request:', req.method, req.url);
    next();
});


app.use(morgan('dev'));

const setHeaders = (proxyRes, req, res) => {
    proxyRes.headers['Access-Control-Allow-Origin'] = '*';
    proxyRes.headers['Access-Control-Allow-Methods'] = 'GET, POST, PUT, DELETE';
    proxyRes.headers['Access-Control-Allow-Headers'] = 'Content-Type';
    console.log('Received response for:' + req.url);
};

const mangaCoversProxy = createProxyMiddleware({
    target: 'https://uploads.mangadex.org/covers/',
    changeOrigin: true,
    pathRewrite: {
        "^/covers": "/covers",
    },
    logLevel: 'debug',
    logger: console,
    onProxyReq: (proxyReq, req, res) => {
        proxyReq.removeHeader('Origin');
        proxyReq.removeHeader('Referer');
        console.log('Proxying request:' + req.url);
    },
    onProxyRes: setHeaders,

});

const mangaSearchProxy = createProxyMiddleware({
    target: 'https://api.mangadex.org/manga',
    changeOrigin: true,
    pathRewrite: {
        "^/manga": "/manga",
    },
    logLevel: 'debug',
    logger: console,
    onProxyReq: (proxyReq, req, res) => {
        proxyReq.removeHeader('Origin');
        proxyReq.removeHeader('Referer');
        console.log('Proxying request:' + req.url);
    },
    onProxyRes: setHeaders,

})

app.use('/manga', mangaSearchProxy);
app.use('/covers', mangaCoversProxy);


app.listen(PORT, () => {
    console.log("It is currently running on PORT: " + PORT);
})