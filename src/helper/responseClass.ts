import { Request, Response } from 'express';
import { ResponseStatusCode } from '../helper/response.status.code';
import inwardServices from '../services/inwardServices/inward.services';
import { getApiUrl, insertApiRequest, updateApiResponce } from '../helper/common-function';
let responseStatusCode = new ResponseStatusCode();

class RequestResponse {
    constructor() {}

    static success(res: Response, message: any, status: any, data: any) {
        if (res.headersSent == false) {
            res.status(responseStatusCode.SUCCESS).json({
                message: message || 'success',
                status: status || 'success',
                statusCode: 200,
                data: data
            });
        }
    }

    static successForTest(res: Response, message: any) {
        if (res.headersSent == false) {
            res.status(responseStatusCode.SUCCESS).json({
                message: message || 'success'
            });
        }
    }

    static validationErrorForTest(res: Response, message: any) {
        if (res.headersSent == false) {
            res.status(responseStatusCode.SUCCESS).json({
                message: message || 'error'
            });
        }
    }

    static validationError(res: Response, message: any, status: any, data: any) {
        if (res.headersSent == false) {
            res.status(responseStatusCode.SUCCESS).json({
                message: message || 'error',
                status: status || 'error',
                statusCode: 422,
                data: data
            });
        }
    }

    static serverError(res: Response, message: any, status: any) {
        if (res.headersSent == false) {
            res.status(responseStatusCode.ERROR).json({
                message: message || 'error',
                status: status || 'error',
                statusCode: 500
            });
        }
    }

    static unauthorized(res: Response, message: any, status: any, data: any) {
        if (res.headersSent == false) {
            res.status(responseStatusCode.AUTHORIZED).json({
                message: message || 'unauthorized',
                status: status || 'error',
                statusCode: 401,
                data: data
            });
        }
    }

    static forbidden(res: Response, message: any, status: any, data: any) {
        if (res.headersSent == false) {
            res.status(responseStatusCode.FORBIDDEN).json({
                message: message || 'forbidden',
                status: status || 'error',
                statusCode: 403,
                data: data
            });
        }
    }
}
export default RequestResponse;
