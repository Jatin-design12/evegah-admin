// AWS SDK no longer used for storage; keep only if SES/email is required
const qr = require('qrcode');
import jwt from 'jsonwebtoken';
import config from '../Config/config';
import { client } from '../Config/db.connection';
import { DB_CONFIGS } from '../Config/db.queries';

import CryptoJS from 'crypto-js';
import adminProduceBikeServices from '../services/adminServices/admin.produceBike.services';
import logger from '../Config/logging';

import RequestResponse from '../helper/responseClass';
import { apiMessage } from '../helper/api-message';

import  CommonMessage  from '../helper/common.validation';
import InwardServices from '../services/inwardServices/inward.services';
import { getUTCdate } from '../helper/datetime';
import  Dateformats from '../helper/utcdate';
import { NextFunction, Request, Response } from 'express';
import adminControllers from '../Controller/adminController/admin.controller';
import axios from 'axios';
const { parse } = require('querystring');
import { exceptionHandler,AddExceptionIntoDB  } from '../helper/responseHandler';
import status from '../helper/status';
import { error } from 'winston';
const key = 'eb119edbbbcf6a111ab54ddd8c23354cccb3be6d9534857a7849b18229497efa'; //crypto.randomBytes(32).toString('hex');

function getStorageProvider(): 'hostinger' {
    // storage is now exclusively hostinger/local; ignore AWS
    return 'hostinger';
}

function encodePathKeepingSlash(pathValue: string) {
    return String(pathValue)
        .split('/')
        .map((segment) => encodeURIComponent(segment))
        .join('/');
}

function getHostingerAssetBaseUrl() {
    const configuredBase = String(process.env.HOSTINGER_ASSET_BASE_URL || process.env.IMAGE_BASE_URL || '')
        .trim()
        .replace(/\/$/, '');

    if (configuredBase) {
        return configuredBase;
    }

    return `${getLocalAssetBaseUrl()}/api/upload`;
}

function getHostingerAssetUrl(filename: any) {
    if (!filename) {
        return null;
    }

    const filenameText = String(filename).trim();
    if (!filenameText) {
        return null;
    }

    if (/^https?:\/\//i.test(filenameText)) {
        return filenameText;
    }

    const hostingerBaseUrl = getHostingerAssetBaseUrl();
    if (!hostingerBaseUrl) {
        return null;
    }

    const normalizedPath = filenameText.replace(/^\/+/, '');
    return `${hostingerBaseUrl}/${encodePathKeepingSlash(normalizedPath)}`;
}

function getLocalAssetBaseUrl() {
    const explicitImageBase = String(process.env.IMAGE_BASE_URL || '').trim().replace(/\/$/, '');
    if (explicitImageBase) {
        return explicitImageBase;
    }

    const explicitServerBase = String(process.env.SERVER_BASE_URL || '').trim().replace(/\/$/, '');
    if (explicitServerBase) {
        return explicitServerBase;
    }

    const serverPort = String(config.server?.port || process.env.SERVER_PORT || '9002').trim();
    const isDev = String(process.env.NODE_ENV || '').toLowerCase() === 'development';
    const protocol = isDev ? 'http' : (String(process.env.SERVER_PROTOCOL || 'https').toLowerCase());
    const host = isDev
        ? (String(process.env.LOCAL_SERVER_HOST || 'localhost').trim())
        : (String(config.server?.hostname || process.env.SERVER_HOSTNAME || 'admin.evegah.com').trim());

    return `${protocol}://${host}${serverPort ? `:${serverPort}` : ''}`;
}

function getFallbackAssetUrl(filename: any) {
    if (!filename) {
        return null;
    }

    const hostingerUrl = getHostingerAssetUrl(filename);
    if (hostingerUrl) {
        return hostingerUrl;
    }

    const baseUrl = getLocalAssetBaseUrl();
    const encodedFileName = encodePathKeepingSlash(String(filename));
    return `${baseUrl}/api/assets/${encodedFileName}`;
}

// aws signing removed; no longer relevant
function isAwsSigningConfigured() {
    return false;
}

function gets3SignedUrls(filename: any) {
    // storage now always delivered via hostinger/local backend URL
    if (filename == null || filename === '' || filename === 'undefined' || filename === 'null') {
        return null;
    }

    const filenameText = String(filename).trim();
    if (/^https?:\/\//i.test(filenameText)) {
        return filenameText;
    }

    // simply return fallback/local asset URL
    return getFallbackAssetUrl(filenameText);
}

function getFileName(filename: string) {
    let filepath = null;
    if (filename != null && filename != '' && filename != 'undefined' && filename != 'null') {
        filepath = filename;
    }
    return filepath;
}

function getOriginalFileName(fileName: string) {
    let fileUrl = null;
    if (fileName == null || fileName == '' || fileName == 'undefined' || fileName == 'null' || fileName == undefined) {
        return fileUrl;
    }
    let filenameArray = fileName.split('.');
    const originalFileName = filenameArray[filenameArray.length - 2] + '.' + filenameArray[filenameArray.length - 1];
    return originalFileName;
}

function checkFileExist(filename: string) {
    // simply return fallback URL; hostinger assumes file exists if key provided
    return Promise.resolve(getFallbackAssetUrl(filename));
}

function covertJsonArrayToDBarray(jsonArray: any) {
    let dbArray = null;
    if (jsonArray != null) {
        dbArray = `ARRAY ${jsonArray}`;
    }
    return dbArray;
}

function generatedQrCodeForVehicles(data: any) {
    let strData = JSON.stringify(data);


    return new Promise(async (resolve, reject) => {
        qr.toDataURL(strData, function (err: any, code: any) {
            if (err) return logger.error(err);

            resolve(code);
        });
    });
}

async function createAuthToken(user_id: Number) {
    return new Promise((resolve, reject) => {
        let token = jwt.sign({ id: user_id }, config.jwt.ACCESS_TOKEN_SECRET_KEY, { expiresIn: '10d' });
        if (token) {
            resolve(token);
        } else {
            reject('token not generated by jwt');
        }
    });
}

async function getTokenDetail(token: any) 
{
    let result: any = jwt.verify(token, config.jwt.ACCESS_TOKEN_SECRET_KEY);
   // console.log('check token',result);
    return result;
}





async function verifyToken(req: any, res :any) {
    return new Promise(async (resolve, reject) => {
        try {
            let token :any =req.query.access_token;

            let result: any = jwt.verify(token, config.jwt.ACCESS_TOKEN_SECRET_KEY);
            req.query.access_token
            if (result) {
                let query: any = DB_CONFIGS.adminQueries.getAuthToken(result.id);
                req.query.custumNodeLoginUserId = result.id;
                
                let userToken: any = await client.query(query);             
                if (userToken.rows[0].admin_auth_token) {
                    
                    for (let i = 0; i <= userToken.rows[0].admin_auth_token.length; i++) {
                        
                        if (userToken.rows[0].admin_auth_token[i] === token) {
                           
                            //#####Request Table entry with user id
                               await insertApiRequest(req)                               
                            return resolve(result);
                        }
                    }
                  
                } else {
                    
                    if (userToken.rows[0].user_auth_token === token) {
                        //#####Request Table entry with user id
                        await insertApiRequest(req)
                        resolve(result);
                    } else {  
                                            
                        // commend  for api testing on locl 
                        //#####Request Table entry without user id
                        req.query.createdbyLoginUserId ='0';
                        await insertApiRequest(req)
                       reject({ message: 'token is not valid', status: 'ERROR', statusCode: 401 });
                    }
                }
            } else {
                //#####Request Table entry without user id
                req.query.createdbyLoginUserId ='0';
                await insertApiRequest(req)
                reject({ message: 'token is not valid', status: 'ERROR', statusCode: 401 });
            }
        } catch (error) {
              //#####Request Table entry without user id
              req.query.createdbyLoginUserId ='0';
              await insertApiRequest(req)
            reject({ message: 'token is not valid', status: 'ERROR', statusCode: 401 });
        }
    });
}

async function calculateMin(firstTime: any, secondTime: any) {
    return new Promise((resolve, reject) => {
        let fromTime = new Date(firstTime);
        let toTime = new Date(secondTime);

        let difference = toTime.getTime() - fromTime.getTime(); // This will give difference in milliseconds
      //  let sec = difference * 0.001;
        //let minutes = difference / 60000;
        let minutes = Math.round(difference /(60 * 1000));
      //  console.log('check minutes ',minutes);

        resolve(minutes);
    });
}

async function calculateSecond(firstTime: any, secondTime: any) {
    return new Promise((resolve, reject) => {
        let fromTime = new Date(firstTime);
        let toTime = new Date(secondTime);
        
        let difference = toTime.getTime() - fromTime.getTime(); // This will give difference in milliseconds
      //  let sec = difference * 0.001;
        //let minutes = difference / 60000;
        let seconds = Math.round(difference /1000);


        resolve(seconds);
    });
}
//Encrypting text
function encrypt(text: string) {
    let cipher: any = CryptoJS.AES.encrypt(text, key);
    cipher = cipher.toString();
    return cipher;
}

// Decrypting text
async function decrypt(text: any) {
    try {
               
        let result: any ;
        if(text.qrString !=null)
        {
             result = await adminProduceBikeServices.getEncryptedData(text);       
            if (result.rowCount <= 0)
             {
                return [];
            }             
        }

        if(text.lockNumber !=null)
        {
            result = await adminProduceBikeServices.getBikeQRData(text);                 
            if (result.rowCount <= 0)
             {
                return [];
            }                                    
        }                          
                                                       

        let check :any =[];
         check.push({
        bikeId : result.rows[0].id ,
        vehicleId  :result.rows[0].model_id,
        uId :result.rows[0].uid_id,
        lockId : result.rows[0].lock_id,
        userId : text.userId,
         })       
         
         
        return check;
        
    } catch (error) {
        return error;
    }
}


 function isObjectEmpty(obj :any ): boolean{
    return Object.keys(obj).length ===0
        }
function generateUniqueNumber() {
    const max = 999999999;
    const min=  111111111;

    return String(new Date().getTime())+''+Math.floor(Math.random()*(max - min) + min);
    }

    function generateOrderNumber( OrderType :any) {
        const max = 99;
        const min=  11;  
        const max1 = 9;
        const min1=  1; 
        
        return OrderType + '' + (String( Math.floor(Math.random()*(max - min) + min) + '-' + new Date().getTime())+''+Math.floor(Math.random()*(max1 - min1) + min1));
        }

async function fromDateTodateValidations(fromDate:any,fromDateTextName:any, toDate:any,toDateTextName:any,res: Response) 
{    
    
    if ( CommonMessage.IsValid(fromDate)==false ) 
    {
         RequestResponse.validationError(res,CommonMessage.ErrorMessage(4,fromDateTextName), status.success, []);
         //RequestResponse.validationError(res, apiMessage.validFromDate, status.info, []);
         return false ;
    }
    if ( CommonMessage.IsValid(toDate)==false  ) 
    {
        RequestResponse.validationError(res,CommonMessage.ErrorMessage(4,toDateTextName), status.success, []);
        // RequestResponse.validationError(res, apiMessage.validToDate, status.info, []);
         return false ;
    }

    if(CommonMessage.IsValidDateYYYYMMDDFormate(fromDate)==false)
    {           
        RequestResponse.validationError(res,CommonMessage.ErrorMessage(5,fromDateTextName), status.success, []);
       //  RequestResponse.validationError(res, apiMessage.validFromDateFormat, status.info, []); 
         return false ;            
    }

    if(CommonMessage.IsValidDateYYYYMMDDFormate(toDate)==false)
    {            
        RequestResponse.validationError(res,CommonMessage.ErrorMessage(5,toDateTextName), status.success, []);
         return false ;           
    }

    let dateTextName :any =[];
    
    dateTextName.from = fromDateTextName;
    
    dateTextName.to = toDateTextName;

    
    if (Dateformats.ConvertUTCtoDateformatWithoutTime(fromDate) > Dateformats.ConvertUTCtoDateformatWithoutTimeAddEndTime(toDate))
        {
            
            RequestResponse.validationError(res,CommonMessage.ErrorMessage(6 , dateTextName), status.success, []);
            return false;
        }


    return true ;
    
}

async function  setBeepOnInstructionCommon  ( requstData:any,res: any,req: any) 
 {
    let requestBody = requstData;        
    requestBody.beepInstructionEnumId = '56',// beep on
    requestBody.beepStatusEnumId = null;   
    requestBody.beepInstructionEnumIdLog = requestBody.beepInstructionEnumId,
    requestBody.geofence_inout_enum_id =63;
    
     await adminControllers.setDeviceInstructionBeepOnOffController(requestBody,res, req);
}

async function setBeepOffInstructionCommon  (requstData:any,  res : any,req: any) {
    let requestBody = requstData;
    
    requestBody.beepInstructionEnumId = '57',// beep off
    requestBody.beepStatusEnumId = null;
    requestBody.beepInstructionEnumIdLog = requestBody.beepInstructionEnumId,
    requestBody.geofence_inout_enum_id =62;
    
     await adminControllers.setDeviceInstructionBeepOnOffController(requestBody, res, req);
}


async function checkGeoInOout(beep_status_enum_id:any,beep_instruction_enum_id:any)
{
    let geoFenceInOut :any =''
    if((beep_status_enum_id)== '54' || (beep_instruction_enum_id)== '56')
      {        
       geoFenceInOut ='GeoOut';
      }
      else 
      {                        
          geoFenceInOut ='GeoIn'
      }
      return geoFenceInOut;
}

async function checkVaidLatLong(Latitude:any,Longitude:any)
{
    
    let msg ='';
  if(isFinite(Latitude) && Math.abs(Latitude) <=90 )
  {
        
    msg ='correct';      
  }
  else
  {    
    msg='incorrect Latitude'
    return msg;
         
  }

if(isFinite(Longitude) && Math.abs(Longitude) <= 180)
  {
    msg ='correct';  
    
  }
  else
  {    
    msg='incorrect Longitude'     
    return msg;   
  }
 
  return msg;
  
}


async function getAddressFromLatLong(lat:any,long:any)
{
    let apiResponse:any
        let latLongAddress:any='';        
        try {
            apiResponse = await axios.get('https://maps.googleapis.com/maps/api/geocode/json?latlng='+ lat +','+long+'&key=' + config.GOOGLE_MAP_KEY);
         } catch (error: any) 
         {
           logger.error(error);
          }        
if (CommonMessage.IsValid(apiResponse) && CommonMessage.IsValid(apiResponse.data) && CommonMessage.IsValid(apiResponse.data.results) && apiResponse.data.results.length>0) 
{
    
    latLongAddress=apiResponse.data.results[0].formatted_address;
}
      return latLongAddress;
}

async function insertApiRequest ( requestData :any) 
{
    
        if(CommonMessage.IsValid(requestData.customDBApiRequestId) == true && Number(requestData.customDBApiRequestId) !=0) 
       {    
          return requestData.customDBApiRequestId;
       }  
    
       
        
      
                

        let method = requestData.method;          
        let requestBody : any;        
        if(CommonMessage.IsValid(requestData.customApiUrl) == false )
        {
            requestData.query.apiUrl  =await getApiUrl(requestData) 
            requestData.query.requestIpAddress= requestData.headers['x-forwarded-for'] || requestData.ip|| requestData.socket?.remoteAddress; 
            if(method == 'POST')
            {
                requestBody = requestData.body
                requestData.query.apiMethodEnumId  = '80'// post             
            }       
            else if(method == 'GET')
            {
                requestBody =requestData.query;
                requestData.query.apiMethodEnumId  = '81'//  get 
            }  
        }
        else 
        {
            requestData.query.apiUrl = requestData.customApiUrl ;      
            requestData.query.frontendOptionName =requestData.frontendOptionName;
            requestData.query.frontendPageName = requestData.frontendPageName ;
            requestData.query.frontendActionName =requestData.frontendActionName ;
            requestData.query.apiRequestFromEnumId = requestData.apiRequestFromEnumId ;
            requestData.query.access_token = requestData.access_token ;            
            requestData.method = requestData.customMethod;
            requestBody = requestData.query
            requestData.query.apiMethodEnumId  = '81';// get  
            requestData.query.requestIpAddress= 'local Machine';   
        }

               
        
        if(CommonMessage.IsValid(requestData.query.frontendOptionName) == false) 
        {
            requestData.query.frontendOptionName =''           
        }  

        if(CommonMessage.IsValid(requestData.query.frontendPageName) == false) 
        {
            requestData.query.frontendPageName =''           
        } 
     
        if(CommonMessage.IsValid(requestData.query.frontendActionName) == false) 
        {
            requestData.query.frontendActionName =''           
        }
        
        if(CommonMessage.IsValid(requestData.query.apiRequestFromEnumId) == false) 
        {
            requestData.query.apiRequestFromEnumId ='0'         
        }

        if(CommonMessage.IsValid(requestData.query.access_token) == false) 
        {
            requestData.query.access_token =''           
        } 

        if(CommonMessage.IsValid(requestData.query.access_token) == false) 
        {
            requestData.query.custumNodeLoginUserId ='0'           
        } 

        
        if(CommonMessage.IsValid(requestData.query.dId) == true) 
        {
            requestData.query.customeNodelockNumber =requestData.query.dId ;   
            
        } 
        else
        {
            requestData.query.customeNodelockNumber ='' ;
        }

       //   requestData.query.custumNodeLoginUserId = requestData.query.custumNodeLoginUserId ;

    try {           
                    
        let request_data :any= JSON.stringify(requestBody)        
        
        let result:any = await InwardServices.insertApiRequestService( requestData.query ,request_data);
                
        if (result) 
        {                                                   
            requestData.customDBApiRequestId =  result.rows[0].id
            
        } else {  
            requestData.customDBApiRequestId =0;               
        }    
        return requestData.customDBApiRequestId;    
    } catch (error: any) {
        AddExceptionIntoDB(requestData,error);  
        requestData.customDBApiRequestId =0;      
         return requestData.customDBApiRequestId;
    }
};

async function updateApiResponce (requestResponseId:any ,responseData :any,
    responseStatusEnumId:any ,
    exceptionFull:any,
    exceptionName:any ,
    exceptionMessage:any) {
    try {
       
       let request_data :any= JSON.stringify(responseData)
                       
        let result = await InwardServices.updateApiResponceDataService(requestResponseId,request_data ,
            responseStatusEnumId ,
            exceptionFull,
            exceptionName ,
            exceptionMessage);        
        if (result) {            
             //RequestResponse.success(res, apiMessage.success, status.success, []);
             return true;
            
        } else {
            // RequestResponse.validationError(res, apiMessage.error, status.success, []); 
            return false;           
        }
    } catch (error: any) {
        AddExceptionIntoDB(responseData,error);
        // RequestResponse.successForTest(res, apiMessage.error);
         return false;
    }
};

async function insertApiResponceData (requestData :any,requestReponceId :any, res: Response) {
    try {
        
                 
        let request_data :any= JSON.stringify(requestData)        
        let actionDate :any = getUTCdate()
        let result = await InwardServices.insertApiResponceDataService(requestReponceId,request_data);
        
        if (result) {            
             //RequestResponse.success(res, apiMessage.success, status.success, []);
             return true;
            
        } else {
            // RequestResponse.validationError(res, apiMessage.error, status.success, []); 
            return false;           
        }
    } catch (error: any) {
        AddExceptionIntoDB(requestData,error);
        // RequestResponse.successForTest(res, apiMessage.error);
         return false;
    }
};


async function insertApiExceptionData (requestData :any) {
    try {
                      
         
        
        if(CommonMessage.IsValid(requestData.customDBApiRequestId) == false) 
        {
            requestData.query.customDBApiRequestId ='0'           
        } 
        else 
        {
            requestData.query.customDBApiRequestId = requestData.customDBApiRequestId ;
        }
        

        if(CommonMessage.IsValid(requestData.customNodeExceptionValue) ==false)
        {
            requestData.query.exceptionFull ='';
            requestData.query.exceptionName ='';
            requestData.query.exceptionMessage =''; 
            requestData.query.exceptionStack ='';
        }
        else 
        {
            requestData.query.exceptionFull =requestData.customNodeExceptionValue ;
            
            if(CommonMessage.IsValid(requestData.customNodeExceptionValue.name) == false) 
            {
                requestData.query.exceptionName =''          
            } 
            else
            {
                requestData.query.exceptionName =requestData.customNodeExceptionValue.name ;
            }
    
            if(CommonMessage.IsValid(requestData.customNodeExceptionValue.message) == false) 
            {
                requestData.query.exceptionMessage ='' ;         
            } 
            else
            {
                requestData.query.exceptionMessage =requestData.customNodeExceptionValue.message ;
            }
            
            
            if(CommonMessage.IsValid(requestData.customNodeExceptionValue.stack) == false) 
            {
                requestData.query.exceptionStack ='' ;         
            } 
            else
            {
                requestData.query.exceptionStack =requestData.customNodeExceptionValue.stack ;
            }
                        
        }
       

        if(CommonMessage.IsValid(requestData.dbquery) == false) 
        {
            requestData.query.dbquery =''           
        } 
        else
        {
            requestData.query.dbquery   = requestData.dbquery
        }
        if(CommonMessage.IsValid(requestData.dbqueryParameters) == false) 
        {
            requestData.query.dbqueryParameters =''           
        } 
        else
        {
            requestData.query.dbqueryParameters   = requestData.dbqueryParameters
        }

        if(CommonMessage.IsValid(requestData.resolvedStatusEnumId) == false) 
        {
            
            requestData.query.resolvedStatusEnumId ='0'           
        } 
        else
        {
            requestData.query.resolvedStatusEnumId   = requestData.resolvedStatusEnumId
        }
        
        if(CommonMessage.IsValid(requestData.resolvedRemarks) == false) 
        {
            requestData.query.resolvedRemarks =''           
        }    
        else
        {
            requestData.query.resolvedRemarks   = requestData.resolvedRemarks
        }

        if(CommonMessage.IsValid(requestData.createdbyLoginUserId) == false) 
        {
            requestData.query.createdbyLoginUserId ='0'           
        } 
        else
        {
            requestData.query.createdbyLoginUserId   = requestData.createdbyLoginUserId
        }

        if(CommonMessage.IsValid(requestData.customError) == false) 
        {
            requestData.query.customError = '';          
        } 
        
                      
        let result = await InwardServices.insertApiExceptionService( requestData.query);    
        if (result) {                        
             return true;            
        } else {             
            return false;           
        }
    } catch (error: any) {
        logger.error(error);
      //  AddExceptionIntoDB(requestData,error);
        // RequestResponse.successForTest(res, apiMessage.error);
         return false;
    }
};

async function getApiUrl(req: Request)
{
    let apiFullUrl :any =''    
    apiFullUrl =  req.protocol +'//:' + req.get('Host') +req.originalUrl
      return apiFullUrl;
}

async function calculateHr(firstTime: any, secondTime: any) {
    return new Promise((resolve, reject) => {
        let fromTime = new Date(firstTime);
        let toTime = new Date(secondTime);

        let difference = toTime.getTime() - fromTime.getTime(); // This will give difference in milliseconds
    
        let hours = Math.round(difference / (60 * 60 * 1000));
        console.log('check hours ',hours);

        resolve(hours);
    });
}


//

export { gets3SignedUrls, getFileName, getOriginalFileName, checkFileExist, covertJsonArrayToDBarray,
     generatedQrCodeForVehicles, createAuthToken, verifyToken, calculateMin, encrypt, decrypt ,
     getTokenDetail,fromDateTodateValidations ,generateUniqueNumber,generateOrderNumber ,
     setBeepOnInstructionCommon,setBeepOffInstructionCommon ,checkGeoInOout ,
     getAddressFromLatLong,checkVaidLatLong,insertApiRequest,insertApiResponceData,
     getApiUrl,updateApiResponce,insertApiExceptionData ,calculateSecond,isObjectEmpty,calculateHr};
