import dotenv from 'dotenv';
import path from 'path';
import { createClient } from 'redis';

const envFile = process.env.NODE_ENV === 'production' ? '.env.prod' : process.env.NODE_ENV === 'development' ? '.env.dev' : '.env';
dotenv.config({ path: path.resolve(process.cwd(), envFile) });
dotenv.config({ path: path.resolve(process.cwd(), '.env') }); // .env overrides (e.g. local overrides)
import logger from '../../src/Config/logging';

const POSTGRE_HOST = process.env.POSTGRE_HOST;
const POSTGRE_DATABASE = process.env.POSTGRE_DATABASE || process.env.POSTGRE_DATBASE;
const POSTGRE_USER = process.env.POSTGRE_USER; // ;
const POSTGRE_PASSWORD = process.env.POSTGRE_PASSWORD; // ;
const FRONT_END_REDIRECT_URL = process.env.FRONT_END_REDIRECT_URL || 'https://admin.evegah.com';
const FRONT_END_USER_REDIRECT_URL = process.env.FRONT_END_USER_REDIRECT_URL || FRONT_END_REDIRECT_URL;
const GOOGLE_MAP_KEY = process.env.GOOGLE_MAP_KEY;
const POSTGRE = {
    host: POSTGRE_HOST,
    database: POSTGRE_DATABASE,
    user: POSTGRE_USER,
    password: POSTGRE_PASSWORD
};
let SERVER_HOSTNAME: string | undefined;
let SERVER_PORT: any;
let PREFIX_FILE_PATH: string;
let SERVER_PROTOCOL: string;
let PUBLIC_BASE_URL: string | undefined;
let IS_LOCAL_SERVER = false;

const ACCESS_TOKEN_SECRET_KEY = 'f1889cd5d0dd8cfbef7d58dbf9140619cc2c9ad6f85c9bee98506fa2643ccc50';
const REFRESH_TOKEN_SECRET_KEY = process.env.REFRESH_TOKEN_SECRET_KEY;
const RESET_TOKEN_SECRET_KEY = process.env.RESET_TOKEN_SECRET_KEY || 'edad5d6faf763eb0535cdd62ce8b9ba04fa8f7cbda3cdf2c158e29bf7bd14f2d';
const WEBHOOKS_RESPONSE = '4b6a015ada4693a592399c511746b51e63ae6742f5500c3d7a6e740a60c1f3bd8ed3a31760fa7d9a5ba0ecda34edb4904d8d52a7c10f3e3f985fbe52290832d0';
const JWT_TOKEN = {
    ACCESS_TOKEN_SECRET_KEY: ACCESS_TOKEN_SECRET_KEY,
    REFRESH_TOKEN_SECRET_KEY: REFRESH_TOKEN_SECRET_KEY,
    RESET_TOKEN_SECRET_KEY: RESET_TOKEN_SECRET_KEY
};

const normalizeHostName = (hostValue: any) => {
    return String(hostValue || '')
        .trim()
        .replace(/^https?:\/\//i, '')
        .replace(/\/$/, '');
};

SERVER_HOSTNAME = normalizeHostName(process.env.SERVER_HOSTNAME || 'admin.evegah.com');
SERVER_PROTOCOL = String(process.env.SERVER_PROTOCOL || 'https').toLowerCase();
SERVER_PORT = process.env.SERVER_PORT;
PUBLIC_BASE_URL = process.env.PUBLIC_BASE_URL;
IS_LOCAL_SERVER = /^(localhost|127\.0\.0\.1)$/i.test(SERVER_HOSTNAME);

if (PUBLIC_BASE_URL && PUBLIC_BASE_URL.trim() !== '') {
    PREFIX_FILE_PATH = PUBLIC_BASE_URL.trim().replace(/\/$/, '') + '/';
} else {
    const defaultPortForProtocol = SERVER_PROTOCOL === 'https' ? '443' : '80';
    const normalizedHostName = normalizeHostName(SERVER_HOSTNAME);
    const isLocalHost = /^(localhost|127\.0\.0\.1)$/i.test(normalizedHostName);
    const allowNonStandardHttpsPort = String(process.env.ALLOW_HTTPS_NONSTANDARD_PORT || '').toLowerCase() === 'true';
    const shouldHideHttpsPort = SERVER_PROTOCOL === 'https' && !isLocalHost && !allowNonStandardHttpsPort;
    const shouldAppendPort = SERVER_PORT && String(SERVER_PORT) !== defaultPortForProtocol && !shouldHideHttpsPort;
    const portPart = shouldAppendPort ? `:${SERVER_PORT}` : '';
    PREFIX_FILE_PATH = `${SERVER_PROTOCOL}://${SERVER_HOSTNAME}${portPart}/`;
}

const SERVER = {
    hostname: SERVER_HOSTNAME,
    port: SERVER_PORT
};
//Zaakpay api keys
const zaakpayApiPrefix = process.env.ZAAKPAY_API_PREFIX || '';
const zaakpayApiResponsePage = process.env.ZAAKPAY_RESPONSEPAGE || 'response';
const zaakpayResponseUrl = new URL(`${zaakpayApiPrefix}/${zaakpayApiResponsePage}`, PREFIX_FILE_PATH);
//const zaakpayResponseUrl=new URL("https://metroemobility.kritin.in/api");

let zaakPaymentConfigKeys;

zaakPaymentConfigKeys = {
    ZAAKPAY_SECRETKEY: process.env.ZAAKPAY_SECRETKEY,
    ZAAKPAY_TRANSACTAPI: process.env.ZAAKPAY_TRANSACTAPI,
    ZAAKPAY_UPDATEAPI: process.env.ZAAKPAY_UPDATEAPI,
    ZAAKPAY_CHECKSTATUSAPI: process.env.ZAAKPAY_CHECKSTATUSAPI,
    ZAAKPAY_MERCHANTKEY: process.env.ZAAKPAY_MERCHANTKEY,

    ZAAKPAY_RESPONSEURL: zaakpayResponseUrl.href,

    ZAAKPAY_API_PREFIX: zaakpayApiPrefix,

    ZAAKPAY_TRANSACTIONPAGE: process.env.ZAAKPAY_TRANSACTIONPAGE,
    ZAAKPAY_CHECKTRANSACTIONSTATUSPAGE: process.env.ZAAKPAY_CHECKTRANSACTIONSTATUSPAGE,
    ZAAKPAY_REFUNDTRANSACTIONPAGE: process.env.ZAAKPAY_REFUNDTRANSACTIONPAGE,
    ZAAKPAY_RESPONSEPAGE: process.env.ZAAKPAY_RESPONSEPAGE
};
// check image issue
const UPOLAD_FILE = process.env.FILEPATHS || 'upload/';

// AWS configuration removed – no longer used by backend.  Remove these variables
// from your environment if they are no longer needed.
const AWS = {} as const; // placeholder export to avoid breaking existing imports

//var memcached = new redis('localhost:11211', { retries: 5, retry: 30000, remove: false });
const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';
let redisClint = createClient({ url: REDIS_URL });

/** Call once at app startup to connect Redis (required for redis v4+) */
export async function connectRedis(): Promise<void> {
    try {
        await redisClint.connect();
        logger.info('Redis connected');
    } catch (err) {
        logger.error('Redis connection failed: ' + (err instanceof Error ? err.message : String(err)));
    }
}

let razorPay;
const normalizedNodeEnv = String(process.env.NODE_ENV || '')
    .trim()
    .replace(/^['"]|['"]$/g, '')
    .toLowerCase();
const defaultRazorpayMode = normalizedNodeEnv === 'production' && !IS_LOCAL_SERVER ? 'live' : 'test';
const configuredRazorpayMode = String(process.env.RAZORPAY_MODE || defaultRazorpayMode).trim().toLowerCase();
const useLiveRazorpay = configuredRazorpayMode === 'live' || configuredRazorpayMode === 'production';

const cleanEnv = (value: any): string =>
    String(value ?? '')
        .trim()
        .replace(/^['"]|['"]$/g, '');

const razorpayLive = {
    key: cleanEnv(
        process.env.RAZORPAY_LIVE_KEY_ID ||
            process.env.RAZORPAY_KEY_ID_LIVE ||
            process.env.RAZORPAY_KEY_ID ||
            process.env.RAZORPAY_KEY
    ),
    secret: cleanEnv(
        process.env.RAZORPAY_LIVE_KEY_SECRET ||
            process.env.RAZORPAY_SECRET_KEY_LIVE ||
            process.env.RAZORPAY_KEY_SECRET ||
            process.env.RAZORPAY_SECRET_KEY
    )
};

const razorpayTest = {
    key: cleanEnv(
        process.env.RAZORPAY_TEST_KEY_ID ||
            process.env.RAZORPAY_KEY_ID_TEST ||
            process.env.RAZORPAY_KEY_ID ||
            process.env.RAZORPAY_KEY
    ),
    secret: cleanEnv(
        process.env.RAZORPAY_TEST_KEY_SECRET ||
            process.env.RAZORPAY_SECRET_KEY_TEST ||
            process.env.RAZORPAY_KEY_SECRET ||
            process.env.RAZORPAY_SECRET_KEY
    )
};

const selectedRazorpay = useLiveRazorpay ? razorpayLive : razorpayTest;

if (!selectedRazorpay.key || !selectedRazorpay.secret) {
    logger.warn(`Razorpay ${useLiveRazorpay ? 'live' : 'test'} credentials are not fully configured. Set mode-specific env keys on server.`);
}

razorPay = {
    key: selectedRazorpay.key,
    SECRET_KEY: selectedRazorpay.secret,
    payoutApi: String(process.env.RAZORPAY_PAYOUT_API || 'https://api.razorpay.com/v1/payouts').trim(),
    mode: useLiveRazorpay ? 'live' : 'test'
};

const Expire = '15m';
const THINGS_UP_API_KEY = process.env.THINGS_UP_API_KEY;
const THINGS_URL = process.env.THINGS_URL;
const CLIENT_NAME = process.env.CLIENT_NAME;

const config = {
    postgre: POSTGRE,
    server: SERVER,
    folderpath: UPOLAD_FILE,
    prefix_filpath: PREFIX_FILE_PATH,
    jwt: JWT_TOKEN,
    frontend_Redirect_Url: FRONT_END_REDIRECT_URL,
    frontend_Redirect_user_Url: FRONT_END_USER_REDIRECT_URL,
    aws: AWS,
    redisClint,
    razorPay,
    WEBHOOKS_RESPONSE,
    zaakPaymentConfigKeys,
    GOOGLE_MAP_KEY,
    THINGS_UP_API_KEY,
    THINGS_URL,
    CLIENT_NAME
};

export default config;
