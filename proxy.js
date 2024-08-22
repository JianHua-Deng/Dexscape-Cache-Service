import express from 'express';
import cors from 'cors';
import {createProxyMiddleware} from 'http-proxy-middleware';
import dotenv from 'dotenv';
import morgan from 'morgan';
import path from 'path';
dotenv.config({path: './.env'})

const PORT = process.env.PORT || 3000;
const app = express();
app.use(cors());

app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
    next();
  });

//removing headers except user-agent, didn't work if I don't include user-agent
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
    onProxyRes: (proxyRes, req, res) => {
      res.setHeader('Access-Control-Allow-Origin', '*');
    }

});

const mangaSearchProxy = createProxyMiddleware({
    target: 'https://api.mangadex.org/manga',
    changeOrigin: true,
    logLevel: 'debug',
    logger: console,
    onProxyRes: (proxyRes, req, res) => {
      res.setHeader('Access-Control-Allow-Origin', '*');
    }

});

const chapterMetaDataProxy = createProxyMiddleware({
  target: 'https://api.mangadex.org/at-home/',
  changeOrigin: true,
  logLevel: 'debug',
  logger: console,
  onProxyRes: (proxyRes, req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
  } 
});

const chapterImageProxy = createProxyMiddleware({
  target: 'https://uploads.mangadex.org',
  changeOrigin: true,
  logLevel: 'debug',
  logger: console,
  router: (req) => {
    const baseUrl = req.url.match(/(?<=https?:\/\/)[^\/]+(?=\/data)/); // Matching the baseUrl and only the baseUrl from the request
    if (baseUrl){
      //console.log(`Original URL: ${req.url}, BaseUrl: ${baseUrl}`);
      return baseUrl.includes('https://') ? `${baseUrl}` : `https://${baseUrl}`;
    }
    return 'https://uploads.mangadex.org';
  },
  pathRewrite: (path, req) => {
    // Empty out anything before /data, and take that as the path
    return path.replace(/^.*(?=\/data)/, "");
  },
  onProxyRes: (proxyRes, req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
  }  

});

app.use('/manga', mangaSearchProxy);
app.use('/covers', mangaCoversProxy);
app.use('/at-home', chapterMetaDataProxy);
app.use('/chapter-image', chapterImageProxy);


app.listen(PORT, () => {
    console.log("It is currently running on PORT: " + PORT);
})

//const __dirname = path.resolve();
//app.use(express.static(path.join(__dirname, 'dist')));