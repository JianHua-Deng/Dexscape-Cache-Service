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

const __dirname = path.resolve();
app.use(express.static(path.join(__dirname, 'dist')));


app.use((req, res, next) => {
    console.log('Incoming request:', req.method, req.url);
    next();
});

app.use("/covers", (req, res, next) => {
    req.headers = { "user-agent": "Mangasite/1.0.0" };
    if (req.headers.referer) {
        delete req.headers.referer; // Remove the referer header
      }
      if (req.headers.origin) {
        delete req.headers.origin; // Remove the origin header
      }
    next(); 
  });

  app.use("/manga", (req, res, next) => {
    req.headers = { "user-agent": "Mangasite/1.0.0" };
    if (req.headers.referer) {
        delete req.headers.referer; // Remove the referer header
      }
      if (req.headers.origin) {
        delete req.headers.origin; // Remove the origin header
      }
    next(); 
  });


app.use(morgan('dev'));

const mangaCoversProxy = createProxyMiddleware({
    target: 'https://uploads.mangadex.org/covers/',
    changeOrigin: true,
    pathRewrite: {
        "^/covers": "/covers",
    },
    logLevel: 'debug',
    logger: console,
    onProxyReq: (proxyReq, req, res) => {
        console.log('Proxying request:' + req.url);
    },
    onProxyRes: (proxyRes, req, res) => {

        console.log('Received response for:' + req.url);
    },

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
        console.log('Proxying request:' + req.url);
    },
    onProxyRes: (proxyRes, req, res) => {

        console.log('Received response for:' + req.url);
    },

})

app.use('/manga', mangaSearchProxy);
app.use('/covers', mangaCoversProxy);


app.listen(PORT, () => {
    console.log("It is currently running on PORT: " + PORT);
})