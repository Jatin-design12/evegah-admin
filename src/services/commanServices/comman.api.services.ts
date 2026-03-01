import { Request, Response } from 'express';

import status from '../../helper/status';
import config from '../../Config/config';
import logger from '../../Config/logging';
import { v4 as uuidv4 } from 'uuid';
import { UploadedFile } from 'express-fileupload';
import RequestResponse from '../../helper/responseClass';
import { apiMessage } from '../../helper/api-message';
import { gets3SignedUrls } from '../../helper/common-function';
import {  exceptionHandler,AddExceptionIntoDB  } from '../../helper/responseHandler';
const aws = require('aws-sdk');

let s3 = new aws.S3({
    credentials: {
        accessKeyId: config.aws.AWS_ID,
        secretAccessKey: config.aws.SECRET_ACCESS_KEY
    }
});
export const FileDelete = async (req: Request, res: Response) => {
    try {
        const params = {
            Bucket: config.aws.AWS_BUCKET,
            Key: req.body.file_name
        };

        s3.deleteObject(params, async (error: Error, data: any) => {
            if (error) {
                //   console.log(error);
                return RequestResponse.success(res, 'file not deleted ', status.error, error);
            } else {
                return RequestResponse.success(res, apiMessage.filerDelete, status.success, null);
            }
        });
    } catch (error: any) {
        AddExceptionIntoDB(req,error);
        return exceptionHandler(res, 1, error.message);
    }
};

export const FileUpload = async (req: Request, res: Response) => {
    try {
        const fileArray: any = [];

        let file = req.files?.file as UploadedFile[];
        let result: any;
        if (file.length === undefined) {
            result = await uploadFileToS3(file);
            if (result === null) {
                return RequestResponse.validationError(res, apiMessage.wrongUpload, status.error, []);
            }

            fileArray.push(result);
            return RequestResponse.success(res, apiMessage.fileUpload, status.success, fileArray);
        } else {
            for (let i = 0; i < file.length; i++) {
                result = await uploadFileToS3(file[i]);
                fileArray.push(result);
            }
            return RequestResponse.success(res, apiMessage.fileUpload, status.success, fileArray);
        }
    } catch (error: any) {
        AddExceptionIntoDB(req,error);
        return exceptionHandler(res, 1, error.message);
    }
};

export const setMemcached = async (key: any, values: any) => {
    let _redisClint = config.redisClint;
    await _redisClint.set(key, values);
    return;
};
export const getMemcached = async (key: any) => {
    return new Promise(async (resolve, reject) => {
        let _redisClint = config.redisClint;
        let result = await _redisClint.get(key);

        resolve(result);
    });
};

const uploadFileToS3 = async (file: any) => {
    //  const fileArray: any = [];
    return new Promise((resolve, reject) => {
        let original_file_name = file?.name;
        let filename = file?.name.split('.');
        let filetype = filename[filename.length - 1].toLowerCase();
        let id = uuidv4();
        const params = {
            // this parma for store file in s3 bucket
            Bucket: config.aws.AWS_BUCKET,
            Key: `${id}.${filename[0]}.${filetype}`,
            Body: file?.data
        };

        if (filetype === 'pdf' || filetype === 'doc' || filetype === 'docx' ||  filetype ==='xlsx'
       || filetype === 'xls' ||  filetype === 'png' || filetype === 'jpg' 
        || filetype === 'jpeg' || filetype === 'mp4') {
            s3.upload(params, async (error: Error, data: any) => {
                if (error) {
                    
                    // throw error;
                }
                resolve({
                    unique_file_name: data.Key,
                    file_name: original_file_name,
                    getSingedUrl: gets3SignedUrls(data.key)
                });
            });
        } else {
            resolve(null);
        }
    });
};

