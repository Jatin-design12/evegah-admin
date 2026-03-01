import { buildDevLogger } from '../helper/dev.logger';
import { buildProdLogger } from '../helper/prod.logger';
import dotenv from 'dotenv';

dotenv.config();

let logger: any = null;
if (process.env.NODE_ENV === 'development') {
    logger = buildDevLogger();
} else {
    logger = buildProdLogger();
}

export default logger;
