import { Pool } from 'pg';
import config from './config';
import { AddExceptionIntoDB } from '../helper/responseHandler';

const parseTimeout = (value: string | undefined, fallback: number) => {
    const parsedValue = Number(String(value || '').trim());
    return Number.isFinite(parsedValue) && parsedValue > 0 ? parsedValue : fallback;
};

const dbPort = parseTimeout(process.env.POSTGRE_PORT, 5432);
const connectTimeoutMillis = parseTimeout(process.env.POSTGRE_CONNECT_TIMEOUT_MS, 10000);
const queryTimeoutMillis = parseTimeout(process.env.POSTGRE_QUERY_TIMEOUT_MS, connectTimeoutMillis);

const pgOptions = {
    user: config.postgre.user,
    host: config.postgre.host,
    database: config.postgre.database,
    password: config.postgre.password,
    port: dbPort,
    connectionTimeoutMillis: connectTimeoutMillis,
    query_timeout: queryTimeoutMillis,
    statement_timeout: queryTimeoutMillis,
    ssl: process.env.POSTGRE_HOST?.includes('rds.amazonaws.com') ? { rejectUnauthorized: false } : false
};

export const pool = new Pool(pgOptions);
class DB_Connection {
    pool: any;
    constructor() {
        this.pool = new Pool(pgOptions);
    }
    query(query: string) {
        return new Promise<string>(async (resolve: any, reject: any) => {
            let client: any;

            try {
                client = await this.pool.connect();
            } catch (e: any) {
                reject(e);
                return;
            }

            try {
                await client
                    .query(query)
                    .then((cursor: any) => {
                        client.release();
                        resolve(cursor);
                    })
                    .catch((e: any) => {
                        client.release();
                        reject(e);
                    });
            } catch (e: any) {
                client.release();
                reject(e);
            }
        });
    }

    query1(query: any, req: any) {
        return new Promise<string>(async (resolve: any, reject: any) => {
            let client: any;

            try {
                client = await this.pool.connect();
            } catch (e: any) {
                reject(e);
                return;
            }

            try {
                await client
                    .query(query)
                    .then((cursor: any) => {
                        client.release();
                        resolve(cursor);
                    })
                    .catch((e: any) => {
                        client.release();
                        reject(e);
                    });
            } catch (e: any) {
                // req.dbquery = query.text;
                // req.dbqueryParameters =query.values ;
                //AddExceptionIntoDB(req,e);
                client.release();
                reject(e);
            }
        });
    }
}

export const client = new DB_Connection();
