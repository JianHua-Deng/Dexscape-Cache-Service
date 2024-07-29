import express from 'express';
import cors from 'cors';
import {createProxyMiddleware} from 'http-proxy-middleware';
import dotenv from 'dotenv';
import morgan from 'morgan';
import path from 'path';
dotenv.config({path: './.env'})

const PORT = process.env.PORT || 3000;
const app = express();

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

});

const mangaSearchProxy = createProxyMiddleware({
    target: 'https://api.mangadex.org/manga',
    changeOrigin: true,
    logLevel: 'debug',
    logger: console,

});


app.use((req, res, next) => {
    console.log('Incoming request:', req.method, req.url);
    next();
});

app.use(cors());

app.use(morgan('dev'));

app.use('/manga', mangaSearchProxy);
app.use('/covers', mangaCoversProxy);

const __dirname = path.resolve();
app.use(express.static(path.join(__dirname, 'dist')));


app.listen(PORT, () => {
    console.log("It is currently running on PORT: " + PORT);
})