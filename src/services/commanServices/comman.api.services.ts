import { Request, Response } from 'express';

import status from '../../helper/status';
import config from '../../Config/config';
import logger from '../../Config/logging';
import { v4 as uuidv4 } from 'uuid';
import { UploadedFile } from 'express-fileupload';
import RequestResponse from '../../helper/responseClass';
import { apiMessage } from '../../helper/api-message';
import { gets3SignedUrls } from '../../helper/common-function';
import { exceptionHandler, AddExceptionIntoDB } from '../../helper/responseHandler';
// AWS SDK removed – we use hostinger/local filesystem instead
const fs = require('fs');
const path = require('path');

const resolveUploadDirectory = () => {
    const configured = String(process.env.HOSTINGER_UPLOAD_DIR || config.folderpath || 'upload').trim();
    if (!configured) {
        return path.resolve(process.cwd(), 'upload');
    }
    return path.isAbsolute(configured) ? configured : path.resolve(process.cwd(), configured);
};

export const FileDelete = async (req: Request, res: Response) => {
    try {
        // delete from local hostinger upload directory
        const filename = String(req.body.file_name || '').trim();
        if (filename) {
            const uploadDirectory = resolveUploadDirectory();
            const filePath = path.join(uploadDirectory, filename);
            fs.unlink(filePath, (err: NodeJS.ErrnoException | null) => {
                if (err && err.code !== 'ENOENT') {
                    return RequestResponse.success(res, 'file not deleted ', status.error, err);
                }
                return RequestResponse.success(res, apiMessage.filerDelete, status.success, null);
            });
        } else {
            return RequestResponse.validationError(res, apiMessage.invalidRequest, status.error, []);
        }
    } catch (error: any) {
        AddExceptionIntoDB(req, error);
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
        AddExceptionIntoDB(req, error);
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
        const uniqueFileName = `${id}.${filename[0]}.${filetype}`;
        // will always use hostinger/local filesystem
        if (['pdf', 'doc', 'docx', 'xlsx', 'xls', 'png', 'jpg', 'jpeg', 'mp4'].includes(filetype)) {
            const uploadDirectory = resolveUploadDirectory();

            fs.mkdir(uploadDirectory, { recursive: true }, (mkdirError: Error) => {
                if (mkdirError) {
                    return reject(mkdirError);
                }

                const localFilePath = path.join(uploadDirectory, uniqueFileName);
                fs.writeFile(localFilePath, file?.data, (writeError: Error) => {
                    if (writeError) {
                        return reject(writeError);
                    }

                    logger.info(`File uploaded to: ${localFilePath}`);

                    resolve({
                        unique_file_name: uniqueFileName,
                        file_name: original_file_name,
                        getSingedUrl: gets3SignedUrls(uniqueFileName)
                    });
                });
            });
            return;
        } else {
            resolve(null);
        }
    });
};
