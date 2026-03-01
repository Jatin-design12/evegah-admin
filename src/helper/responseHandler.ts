import { Request, Response } from 'express';
import { ResponseStatusCode } from './response.status.code';
import RequestResponse from './responseClass';
import status from './status';
import dotenv from 'dotenv';
import { apiMessage } from './api-message';
import { insertApiExceptionData } from '../helper/common-function';
import logger from '../Config/logging';
import  CommonMessage  from '../helper/common.validation';
dotenv.config();

let responsestatuscode = new ResponseStatusCode();

function validHandler(res: Response, messagenumber: number) {
    switch (messagenumber) {
        case 1:
            return res.status(responsestatuscode.SUCCESS).json({ message: 'Not valid id Please Enter valid id', status: status.error, statusCode: 422, data: null });
        case 2:
            return res.status(responsestatuscode.SUCCESS).json({ message: 'Please Enter Valid E-mail Id', status: status.error, statusCode: 422, data: null });
        case 3:
            return res.status(responsestatuscode.SUCCESS).json({ message: 'Please Enter Valid Password', status: status.error, statusCode: 422, data: null });
            case 4:
            return res.status(responsestatuscode.SUCCESS).json({ message: 'Please Enter Valid New Password', status: status.error, statusCode: 422, data: null });

    }
}
function exceptionHandler(res: Response, messageNumber: number, error: any) {

   // return RequestResponse.serverError(res, error, status.exception);   
    switch (messageNumber) {
        
        case 1:
            if (process.env.NODE_ENV === 'development') {

               
                return RequestResponse.serverError(res, error, status.exception);
            } else {
                return RequestResponse.serverError(res, apiMessage.somethingWentWrong, status.exception);
            }
        case 2:
            return RequestResponse.serverError(res, 'Error in function', status.error);
    }
}

function AddExceptionIntoDB(req : any, error: any ) {
       
    let requestQuery :any;
    if (CommonMessage.IsValid(req) == false)
    {
        requestQuery={};
        requestQuery.query={};
    }
    else{
        requestQuery=req;
        if (CommonMessage.IsValid(req.query) == false)
        {
            requestQuery.query={};
        } 
    }           
try
{  
    
    requestQuery.customNodeExceptionValue = error;    
    insertApiExceptionData(requestQuery)

}catch (innererror: any) {
    logger.error(innererror);
    logger.error(error);    
}
}

function apiResponseHandler(res: Response, messagenumber: number) {
    switch (messagenumber) {
        case 1:
            return res.status(responsestatuscode.SUCCESS).json({ message: 'Data Not Available', status: status.success, statusCode: 200, data: null });
        case 2:
            return res.status(responsestatuscode.SUCCESS).json({ message: 'Data Not Available', status: status.error, statusCode: 422, data: null });
    }
}

function check(res: Response, messagenumber: string) {
    return 'test'; //res.status(responsestatuscode.SUCCESS).json({ message: 'Data Not Available', status: status.success, statusCode: 200, data: null });
}
export { validHandler, exceptionHandler, apiResponseHandler, check,AddExceptionIntoDB };
