import http from 'http';
import express from 'express';
import bodyParser from 'body-parser';
import logger from './src/Config/logging';
import config, { connectRedis } from './src/Config/config';
import routes from './src/routes/routes';
import compression from 'compression';
//import swaggerUi from 'swagger-ui-express';
//import swaggerDoc from './swagger_output.json';
import upload from 'express-fileupload';
import path from 'path';
import dateclass from './src/helper/utcdate';
import {getUTCdate} from './src/helper/datetime';
import { NextFunction, Request, Response } from 'express';
import zaakpayment from './src/Controller/paymentgatewayZaakpay/zaakpay.payment.routes' ;
//import zaakpayroutes from './src/Controller/paymentgatewayZaakpay/zaakpay.payment.routes'
/*
var index = require('./routes/index');
var transactAPI = require('./routes/posttozaakpay');
var response = require('./routes/response');
var checkAPI = require('./routes/poststatuschecktozaakpay');
var refundAPI = require('./routes/postmtxupdatetozaakpay');
*/
//var response = require('./src/Controller/paymentgatewayZaakpay/routes/response');
var cookieParser = require('cookie-parser');

const router = express();
const allowedOrigins = String(process.env.CORS_ALLOWED_ORIGINS || 'https://admin.evegah.com,http://localhost:4200,http://127.0.0.1:4200')
    .split(',')
    .map((origin) => origin.trim())
    .filter((origin) => origin.length > 0);

const defaultAllowedOrigins = [
    'https://admin.evegah.com',
    'http://localhost:4200',
    'http://127.0.0.1:4200',
    'http://localhost:8100',
    'http://127.0.0.1:8100',
    'capacitor://localhost',
    'ionic://localhost'
];

const effectiveAllowedOrigins = Array.from(new Set([...defaultAllowedOrigins, ...allowedOrigins]));

const isDevAppOrigin = (origin: string): boolean => {
    if (!origin) return false;
    if (origin === 'capacitor://localhost' || origin === 'ionic://localhost') return true;
    return /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/i.test(origin);
};

router.set('view engine', 'ejs');

let stringify = require('json-stringify-safe');
process.env.API_PREFIX = '/api';
const NAMESPACE = 'Server';

// Prevent process exit on unhandled promise rejections (e.g. DB connection timeout)
process.on('unhandledRejection', (reason: any, promise) => {
    logger.error('Unhandled Rejection at: ' + (promise && promise.toString()) + ' reason: ' + (reason && (reason.message || reason)));
});


router.use(process.env.API_PREFIX + '/assets', express.static(path.join(__dirname, 'upload')));
router.use(process.env.API_PREFIX + '/upload', express.static('upload'));
router.use(compression());
router.use(upload());
//router.set('trust proxy',true)
router.set('trust proxy', ['loopback', 'linklocal', 'uniquelocal'])
//router.use(process.env.API_PREFIX + '/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDoc, { explorer: true }));

router.use((req, res, next) => {
    console.log('Got Request');
    logger.info(`METHOD: [${req.method}]- URL: [${req.url}] -IP : [${req.socket.remoteAddress}]`);

    res.on('finish', () => {
        logger.info(
            `METHOD: [${req.method}]-URL:[${req.url}] -IP: 
          [${req.socket.remoteAddress}], STATUS - [${res.statusCode}]`
        );
    });
    next();
});

router.use((req, res, next) => {
    const apiPrefix = process.env.API_PREFIX || '/api';
    const normalizedPrefix = apiPrefix.endsWith('/') ? apiPrefix.slice(0, -1) : apiPrefix;
    const versionPrefix = `${normalizedPrefix}/v1/`;
    const legacyVersionPrefix = `${normalizedPrefix}${normalizedPrefix}/v1/`;

    if (req.url.startsWith(versionPrefix) && !req.url.startsWith(legacyVersionPrefix)) {
        req.url = `${normalizedPrefix}${req.url}`;
    }

    next();
});

/** Parser the body of the request */

router.use(express.urlencoded({ extended: true }));
router.use(express.json());
router.use(express.text());

/** rules of ourAPI  */

router.use((req, res, next) => {
    const requestOrigin = String(req.headers.origin || '');
    if (requestOrigin) {
        if (effectiveAllowedOrigins.includes(requestOrigin) || isDevAppOrigin(requestOrigin)) {
            res.header('Access-Control-Allow-Origin', requestOrigin);
        } else {
            logger.warn(`CORS request from non-whitelisted origin: ${requestOrigin}`);
            res.header('Access-Control-Allow-Origin', requestOrigin);
        }
    } else {
        res.header('Access-Control-Allow-Origin', '*');
    }
    res.header('Vary', 'Origin');

    if(req.path != config.zaakPaymentConfigKeys.ZAAKPAY_API_PREFIX +'/'+ config.zaakPaymentConfigKeys.ZAAKPAY_TRANSACTIONPAGE && 
       req.path !=config.zaakPaymentConfigKeys.ZAAKPAY_API_PREFIX +'/'+ config.zaakPaymentConfigKeys.ZAAKPAY_RESPONSEPAGE && 
       req.path !=config.zaakPaymentConfigKeys.ZAAKPAY_API_PREFIX +'/'+ config.zaakPaymentConfigKeys.ZAAKPAY_CHECKTRANSACTIONSTATUSPAGE && 
       req.path !=config.zaakPaymentConfigKeys.ZAAKPAY_API_PREFIX +'/'+ config.zaakPaymentConfigKeys.ZAAKPAY_REFUNDTRANSACTIONPAGE)
     {
        res.header(`Content-Type`, `application/json`);
     }
    res.header(`Access-Control-Allow-Headers`, `Origin,X-Requested-With,Content-Type,Accept,Authorization`);
  
    if (req.method == `OPTIONS`) {
        res.header(`Access-Control-Allow-Methods`, `GET, PATCH, DELETE, POST ,PUT`);
       return res.status(200).jsonp({});
    }
   
    next();
});


//zaakpayment.set('views', path.join(__dirname, 'views'));

router.use(process.env.API_PREFIX + '/', routes);
router.use(config.zaakPaymentConfigKeys.ZAAKPAY_API_PREFIX +'/',zaakpayment);

console.log(getUTCdate());

console.log('Shri Ram');
console.log('DB host:', config.postgre?.host || 'not set');
// router.use((error: any, req: any, res: any, next: any) => {
//     res.status(error.status || 500);
//     res.json({ error: error.message });
// });
/** Create the server */
const httpServer = http.createServer(router);

(async () => {
    try {
        await connectRedis();
    } catch (e) {
        logger.warn('Redis connect skipped or failed');
    }
    httpServer.listen(config.server.port, () => logger.info(`Server running on ${config.server.hostname}:${config.server.port}`));
})();
