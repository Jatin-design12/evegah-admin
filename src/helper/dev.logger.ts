import winston from 'winston';
import moment from 'moment';


function buildDevLogger() {
    

    return winston.createLogger({
        format: winston.format.combine(winston.format.label({ label: 'ERROR' }), winston.format.timestamp(), winston.format.errors({ stack: true }), winston.format.json()),
        defaultMeta: { service: 'errorInfo' },
        transports: [new winston.transports.File({ filename: 'ErrorLog/errorlog'+ moment(new Date()).format('YYYYMMDD') +'.log', level: 'error' })]
    });
   }
// error log file

export { buildDevLogger };
