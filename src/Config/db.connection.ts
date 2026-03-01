import { Pool } from 'pg';
import config from './config';
import { AddExceptionIntoDB } from '../helper/responseHandler';
const pgOptions = {
    user: config.postgre.user,
    host: config.postgre.host,
    database: config.postgre.database,
    password: config.postgre.password,
    port: 5432,
    connectionTimeoutMillis: 30000,
    ssl: process.env.POSTGRE_HOST?.includes('rds.amazonaws.com') ? { rejectUnauthorized: false } : false
};

export const pool = new Pool(pgOptions);
class DB_Connection {
    pool: any;
    constructor() {
        this.pool = new Pool(pgOptions);
    }
    query(query: string) {
        return new Promise<string>(async (resolve: any, reject: any) => 
        {
            const client = await this.pool.connect();
           
           try{
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
       
        }catch(e: any) 
        {

            client.release();
            reject(e);
        }
       
       
       
        });
    
    }

    query1(query: any, req :any) {
        return new Promise<string>(async (resolve: any, reject: any) => 
        {
            const client = await this.pool.connect();
           
           try{
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
       
        }catch(e: any) 
        {
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
