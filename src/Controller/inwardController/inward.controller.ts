

import { Request, Response } from 'express';
let nodeSchedule = require('node-cron');
import { apiMessage } from '../../helper/api-message';
import RequestResponse from '../../helper/responseClass';
import { exceptionHandler,AddExceptionIntoDB  } from '../../helper/responseHandler';
import InwardServices from '../../services/inwardServices/inward.services';
import status from '../../helper/status';
import logger from '../../Config/logging';
import { client } from '../../Config/db.connection';
import { getUTCdate } from '../../helper/datetime';
import { calculateMin ,calculateSecond} from '../../helper/common-function';
import AddLog from '../../services/adminServices/admin.logDeviceInformation.services';
import { masterMessage } from '../../constant/master-constant';
import { instruction, instructionName ,powerInstruction,powerInstructionName} from '../../constant/device-instruction';
import  Dateformats from '../../helper/utcdate';
import AreaMasters from '../../services/adminServices/admin.area.services';
import  CommonMessage  from '../../helper/common.validation';
import utcdate from '../../helper/utcdate';
import moment from 'moment';
import RideBooking from '../../services/rideBookingServices/ride.booking.services';
import adminDashboardServices from '../../services/adminServices/admin.dashboard.services';
import config from '../../Config/config';
import axios from 'axios';
import { insertApiRequest} from '../../helper/common-function';
import adminLogDeviceInformationServices from '../../services/adminServices/admin.logDeviceInformation.services';
import { kClientName } from '../../constant/kritin-client-name';
import adminController from '../../Controller/adminController/admin.controller';
import { json } from 'body-parser';

const missingStatusPacketAudit: any = {
    totalCount: 0,
    apiCount: 0,
    mqttCount: 0
};

const addMissingStatusPacketAudit = (source: any, requestBody: any, data: any) => {
    missingStatusPacketAudit.totalCount = Number(missingStatusPacketAudit.totalCount || 0) + 1;
    if (source === 'mqtt') {
        missingStatusPacketAudit.mqttCount = Number(missingStatusPacketAudit.mqttCount || 0) + 1;
    } else {
        missingStatusPacketAudit.apiCount = Number(missingStatusPacketAudit.apiCount || 0) + 1;
    }

    const auditPayload: any = {
        tag: 'IOT_MISSING_STATUS_PACKET',
        source: source,
        totalCount: missingStatusPacketAudit.totalCount,
        apiCount: missingStatusPacketAudit.apiCount,
        mqttCount: missingStatusPacketAudit.mqttCount,
        deviceId: requestBody?.deviceid || requestBody?.dId || null,
        lockNumber: data?.dId || null,
        createdAt: getUTCdate()
    };

    logger.error(JSON.stringify(auditPayload));
};

const addUpdateBikeInwardController = async (req: Request, res: Response) => {
    try {
        /* 	#swagger.tags = ['Admin-Inward']
              #swagger.description = 'Only user can add type all Parameter are mandatory in swagger for testing purpose' */

        /*	#swagger.parameters['obj'] = {
                    in: 'body',
                    description: 'add add update zone details.',
                    required: true,
                    schema: { $ref: "#/definitions/addUpdateBikeInwardController" }
            } */

        /* #swagger.security = [{
                    "apiKeyAuth": []
            }] */

        let requestBody = req.body;
        let actionDate:any =  getUTCdate()   
 
        // console.log('check bike requestBody.inwardDate 111', CommonMessage.IsValidDate(requestBody.inwardDate))
      

       // console.log('Dateformats.ConvertUTCtoDateformatWithoutTime(actionDate) < Dateformats.ConvertUTCtoDateformatWithoutTime(requestBody.inwardDate)',
       // Dateformats.ConvertUTCtoDateformatWithoutTime(actionDate) , Dateformats.ConvertUTCtoDateformatWithoutTime(requestBody.inwardDate))
                 
        if (CommonMessage.IsValid(requestBody.bikeInwardId) == false ) {
            return RequestResponse.validationError(res, apiMessage.bikeProduct, status.info, []);
        }

        if (CommonMessage.IsValid(requestBody.inwardDate) == false  ) {
            return RequestResponse.validationError(res, apiMessage.validDate, status.info, []);
        }

        if(CommonMessage.IsValidDate(requestBody.inwardDate)==false)
        {
            return RequestResponse.validationError(res, apiMessage.validDate, status.info, []);             
        }

        if (Dateformats.ConvertUTCtoDateformatWithoutTime(actionDate) < Dateformats.ConvertUTCtoDateformatWithoutTime(requestBody.inwardDate)) {
            return RequestResponse.validationError(res, apiMessage.inwardDateValidation, status.info, []);
        }

        if (CommonMessage.IsValid(requestBody.vehicleId) == false ) {
            return RequestResponse.validationError(res, apiMessage.validVehicle, status.info, []);
        }
        if (!requestBody.vehicleModelUId || requestBody.vehicleModelUId.trim() === '' ) {
            return RequestResponse.validationError(res, apiMessage.validUid, status.info, []);
        }
        let modelResult : any  = await AreaMasters.getModelData(requestBody.vehicleId, req);
       
        
        if (modelResult.rowCount == 0)
        {
             RequestResponse.validationError(res, 'This Model Not Found.', status.error, []);
             return false ;
        }
        requestBody.uId=requestBody.vehicleModelUId;
        
//    let UidModelResult : any  = await AreaMasters.getUidModelData(requestBody.uId,requestBody.vehicleId);
       
//    console.log('check model data  modelResult',UidModelResult)
//    if (UidModelResult.rowCount == 0)
//    {
//         RequestResponse.validationError(res, 'This uId Not Found.', status.error, []);
//         return false ;
//    }

        let result: any = '';

        result = await InwardServices.checkDuplicateUIdForBike(requestBody);
        if (result.rowCount > 0) {
            return RequestResponse.validationError(res, apiMessage.checkUiD, status.info, []);
        } else if (requestBody.bikeInwardId === 0) {
            client
                .query('BEGIN')
                .then(async (res) => {
                    result = await InwardServices.insertBikeUId(requestBody);
                    return result;
                })               
                .then((res) => {
                    return client.query('commit');
                })
                .then((r) => {
                    if (result) {
                        let bikeInwardId = [{ bikeInwardId: result.rows[0].id }];
                        return RequestResponse.success(res, apiMessage.addBikeInward, status.info, bikeInwardId);
                    } else {
                        return RequestResponse.success(res, apiMessage.somethingWentWrong, status.info, []);
                    }
                })
                .catch((err) => {
                    //  console.error('error while querying:', err);
                    client.query('rollback');
                    AddExceptionIntoDB(req,err);
                    return exceptionHandler(res, 1, err.message);
                })
                .catch((err) => {
                    AddExceptionIntoDB(req,err);
                    return exceptionHandler(res, 1, err.message);
                });
        } else if (requestBody.bikeInwardId > 0) {
            client
                .query('BEGIN')
                .then(async (res) => {
                    result = await InwardServices.updateUIdNumber(requestBody);

                    return result;
                })               
                .then((res) => {
                    return client.query('commit');
                })
                .then((r) => {
                    if (result) {
                        let bikeInwardId = [{ bikeInwardId: requestBody.bikeInwardId }];
                        return RequestResponse.success(res, apiMessage.updateBikeInward, status.info, bikeInwardId);
                    } else {
                        return RequestResponse.success(res, apiMessage.somethingWentWrong, status.info, []);
                    }
                })
                .catch((err) => {
                  //  console.error('error while querying:', err);
                    client.query('rollback');
                    AddExceptionIntoDB(req,err);
                    return exceptionHandler(res, 1, err.message);
                })
                .catch((err) => {
                    AddExceptionIntoDB(req,err);                    
                    return RequestResponse.success(res, apiMessage.somethingWentWrong, status.info, err);
                   // console.error('error while rolling back transaction:', err);
                });
        } else {
            return RequestResponse.success(res, apiMessage.somethingWentWrong, status.info, []);
        }
    } catch (error: any) {
        AddExceptionIntoDB(req,error);
        return exceptionHandler(res, 1, error.message);
    }
};

const getBikeInwardDetailsController = async (req: Request, res: Response) => {
    try {
        // #swagger.tags = ['Admin-Inward']
        // #swagger.description = 'Pass bikeInwardId and statusEnumId  '

        /*#swagger.parameters[ {
                        "name": "bikeInwardId",
                        "in": "query",
                        "description": "bikeInwardId",
                        "required": true,
                        "type": "integer"
                    }] 
        } */
        /*#swagger.parameters[ {
                        "name": "statusEnumId",
                        "in": "query",
                        "description": "statusEnumId",
                        "required": true,
                        "type": "integer"
                    }] 
        } */
        /*#swagger.parameters[ {
                        "name": "itemPerPage",
                        "in": "query",
                        "description": "itemPerPage",
                        "required": true,
                        "type": "integer"
                    }] 
        } */
        /*#swagger.parameters[ {
                        "name": "page",
                        "in": "query",
                        "description": "page",
                        "required": true,
                        "type": "integer"
                    }] 
        } */
        let requestQuery = req.query;
        let result: any = await InwardServices.getBikeInwardDetails(requestQuery);
        let bikeInwardArray: any = [];
        for (let row of result.rows) {
            bikeInwardArray.push({
                bikeInwardId: row.id,
                inwardDate: row.inward_date,
                vehicleId: row.model_id,
                modelId: row.model_id,
                modelName: row.model_name,
                vehicleModelUId: row.uid,
                statusEnumId: row.status_enum_id,
                statusName: row.status_name,
                remarks: row.remarks,
                actionRemarks: row.action_remarks,
                createdOnDate: row.createdon_date,
                createdByLoginUserId: row.createdby_login_user_id,
                createdByUserName: row.created_by_user_name,
                createdByUserTypeEnumId: row.createdby_user_type_enum_id,
                createdByUserTypeName: row.created_by_user_type_name,
                updatedLoginUserId: row.updated_login_user_id,
                updatedLoginUserName: row.updated_login_user_name,
                updatedOnDate: row.updatedon_date,
                updatedByUserTypeEnumId: row.updatedby_user_type_enum_id,
                updatedByUserTypeName: row.updated_by_user_type_name,
                bikeStatusEnumId: row.bike_status_enum_id,
                bikeStatusName: row.bike_status_name
            });
        }
        if (result.rowCount > 0) {
            return RequestResponse.success(res, apiMessage.success, status.success, bikeInwardArray);
        } else {
            return RequestResponse.success(res, apiMessage.dataNotAvailable, status.info, []);
        }
    } catch (error: any) {
        AddExceptionIntoDB(req,error);
        return exceptionHandler(res, 1, error.message);
    }
};



const addUpdateLockInwardController = async (req: Request, res: Response) => {
    try {
        /* 	#swagger.tags = ['Admin-Inward']
              #swagger.description = 'Only user can add type all Parameter are mandatory in swagger for testing purpose' */

        /*	#swagger.parameters['obj'] = {
                    in: 'body',
                    description: 'add add update zone details.',
                    required: true,
                    schema: { $ref: "#/definitions/addUpdateLockInwardController" }
            } */

        /* #swagger.security = [{
                    "apiKeyAuth": []
            }] */

        let requestBody = req.body;

       
        let actionDate:any =  getUTCdate()  

        if(CommonMessage.IsValid(requestBody.lockInwardId)==false)
        {
            return RequestResponse.validationError(res, apiMessage.lockInwardId, status.info, []);   
        }
        if ( CommonMessage.IsValid(requestBody.inwardDate)==false) {
            return RequestResponse.validationError(res, apiMessage.validDate, status.info, []);
        }
   
        if(CommonMessage.IsValidDate(requestBody.inwardDate)==false)
        {
            return RequestResponse.validationError(res, apiMessage.validDate, status.info, []);             
        }

        if (Dateformats.ConvertUTCtoDateformatWithoutTime(actionDate) < Dateformats.ConvertUTCtoDateformatWithoutTime(requestBody.inwardDate)) 
        {
            return RequestResponse.validationError(res, apiMessage.inwardDateValidation, status.info, []);
        }


        if (CommonMessage.IsValid(requestBody.lockNumber)==false) 
        {
            return RequestResponse.validationError(res, apiMessage.validLockNumber, status.info, []);
        }
        if (  CommonMessage.IsValid(requestBody.lockIMEINumber)==false ) 
        {
            return RequestResponse.validationError(res, apiMessage.checkLockIMEINumber, status.info, []);
        }

        


    //    if (requestBody.lockInwardId > 0) 
    //     {// if you want edit lock inward detail then you have to again call  device register from device
    //        return  RequestResponse.validationError(res, apiMessage.cannotUpdate, status.info, []);
    //     }

        let result: any = '';

        requestBody.lastDistanceInMeters ='0';
        requestBody.totalDistanceInMeters ='0';  

   // check conditions for uodate 

       if (requestBody.lockInwardId > 0) 
       {

        let checkLockId: any = await InwardServices.checkLockIdervice(requestBody);


        if (checkLockId.rowCount == 0)
        {
            return RequestResponse.validationError(res, apiMessage.checkLockIdNotexit, status.info, []);
        }

            if(checkLockId.rows[0].registartion_status==true)
              {
                return RequestResponse.validationError(res, apiMessage.cannotUpdate, status.info, []);
              }                 
    }

    
    let checkLockNumber: any = await InwardServices.checkLockNumberExitService(requestBody);
        
        if (checkLockNumber.rowCount > 0) 
        {
            return RequestResponse.validationError(res, apiMessage.checkLockNumber, status.info, []);
        }      


        let checimeiNumberExit: any = await InwardServices.checimeiNumberExitService(requestBody);
        
        if (checimeiNumberExit.rowCount > 0) 
        {
            return RequestResponse.validationError(res, apiMessage.checkIMEiNumber, status.info, []);
        }

        
        if (requestBody.lockInwardId === 0) {
            requestBody.deviceLightStatusEnumId = 42;//light off 
            requestBody.deviceLightInstructionEnumId = 45;// light intractions off
            requestBody.deviceLockAndUnlockStatus = 2;// for device lock

            requestBody.beepStatusEnumId = 55;//beep off 
            requestBody.beepInstructionEnumId = 58;// beep intractions off
            client
                .query('BEGIN')
                .then(async (res) => {
                    result = await InwardServices.insertLockDetails(requestBody);

                    return result;
                })                                           
                .then(async (r) => {
                    if (result) {
                        let lockInwardId = [{ lockInwardId: result.rows[0].id }];
                        let prepareLogData = {
                            lockId: requestBody.lockId,
                            lockNumber: requestBody.lockNumber,
                            deviceLockAndUnlockStatus: masterMessage.inactiveStatus,
                            deviceLockAndUnlockStatusName: apiMessage[2],
                            instructionId: instruction.deviceRegistration,
                            instructionName: instructionName[1],
                            statusEnumId: masterMessage.activeStatus,
                            actionRemarks: apiMessage.addDeviceLog,
                            createdByLoginUserId: requestBody.actionByLoginUserId,
                            createdByUserTypeEnumId: requestBody.actionByUserTypeEnumId,
                            device_lock_unlock_communication_enum_id : '93',// online 
                        };
                        result = await AddLog.addDeviceInstructionLog(prepareLogData);
                        return RequestResponse.success(res, apiMessage.addLockInward, status.info, lockInwardId);
                    } else {
                        return RequestResponse.success(res, apiMessage.somethingWentWrong, status.info, []);
                    }
                }).then((res) => {
                    return client.query('commit');
                })
                .catch((err) => {                    
                    client.query('rollback');
                    AddExceptionIntoDB(req,err);
                    return exceptionHandler(res, 1, err.message);
                })
                .catch((err) => {
                    AddExceptionIntoDB(req,err);
                    return exceptionHandler(res, 1, err.message);
                });
        } 
        
        else if (requestBody.lockInwardId > 0) {
            client
                .query('BEGIN')
                .then(async (res) => {
                    
                    result = await InwardServices.updateLockDetailsSever(requestBody);
                    return result;
                })
                             
                .then((res) => {
                    return client.query('commit');
                })
                .then((r) => {
                    if (result) {
                        let lockInwardId = [{ bikeInwardId: requestBody.lockInwardId }];
                        return RequestResponse.success(res, apiMessage.updateLockInward, status.info, lockInwardId);
                    } else {
                        return RequestResponse.success(res, apiMessage.somethingWentWrong, status.info, []);
                    }
                })
                .catch((err) => {

                    client.query('rollback'); 
                    AddExceptionIntoDB(req,err);                        
                    return exceptionHandler(res, 1, err.message);
                    
                                 
                })
                .catch((err) => {
                    AddExceptionIntoDB(req,err);
                    return exceptionHandler(res, 1, err.message);
                });
        } else {
            return RequestResponse.success(res, apiMessage.somethingWentWrong, status.info, []);
        }
    } catch (error: any) {
        AddExceptionIntoDB(req,error);
        return exceptionHandler(res, 1, error.message);
    }
};

const addUpdateValidations = async (requestBody: any, res: Response, req :any) => {
    try {
        /* 	#swagger.tags = ['Admin-Inward']
              #swagger.description = 'Only user can add type all Parameter are mandatory in swagger for testing purpose' */

        /*	#swagger.parameters['obj'] = {
                    in: 'body',
                    description: 'add add update zone details.',
                    required: true,
                    schema: { $ref: "#/definitions/addUpdateLockInwardController" }
            } */

        /* #swagger.security = [{
                    "apiKeyAuth": []
            }] */

       // let requestBody = req.body;
        
        let actionDate:any =  getUTCdate()  

        if(CommonMessage.IsValid(requestBody.lockInwardId)==false)
        {
            return RequestResponse.validationError(res, apiMessage.lockInwardId, status.info, []);   
        }
        if ( CommonMessage.IsValid(requestBody.inwardDate)==false) {
            return RequestResponse.validationError(res, apiMessage.validDate, status.info, []);
        }
   
        if(CommonMessage.IsValidDate(requestBody.inwardDate)==false)
        {
            return RequestResponse.validationError(res, apiMessage.validDate, status.info, []);             
        }

        if (Dateformats.ConvertUTCtoDateformatWithoutTime(actionDate) < Dateformats.ConvertUTCtoDateformatWithoutTime(requestBody.inwardDate)) {
            return RequestResponse.validationError(res, apiMessage.inwardDateValidation, status.info, []);
        }


        if (CommonMessage.IsValid(requestBody.lockNumber)==false) {
            return RequestResponse.validationError(res, apiMessage.validLockNumber, status.info, []);
        }
        if (  CommonMessage.IsValid(requestBody.lockIMEINumber)==false ) {
            return RequestResponse.validationError(res, apiMessage.checkLockIMEINumber, status.info, []);
        }

       
    //    if (requestBody.lockInwardId > 0) 
    //     {// if you want edit lock inward detail then you have to again call  device register from device
    //        return  RequestResponse.validationError(res, apiMessage.cannotUpdate, status.info, []);
    //     }

        let result: any = '';

        let checkLockNumber: any = await InwardServices.checkLockNumberExitService(requestBody);
        
        if (checkLockNumber.rowCount > 0) {
             RequestResponse.validationError(res, apiMessage.checkLockNumber, status.info, []);
             return false;
        }
       

// check conditions for uodate 

       if (requestBody.lockInwardId > 0) 
       {

        let checkLockId: any = await InwardServices.checkLockIdervice(requestBody);
        
        if (checkLockId.rowCount == 0)
        {
             RequestResponse.validationError(res, apiMessage.checkLockIdNotexit, status.info, []);
             return false;
        }

            if(checkLockId.rows[0].registartion_status==true)
              {
                 RequestResponse.validationError(res, apiMessage.cannotUpdate, status.info, []);
                 return false;
              }       
///        
          
    }
     
            return  true;
    } catch (error: any) {
        AddExceptionIntoDB(req,error);
         exceptionHandler(res, 1, error.message);
         return false;
    }
};

const getLockInwardDetailsController = async (req: Request, res: Response) => {
    try {
        // #swagger.tags = ['Admin-Inward']
        // #swagger.description = 'Pass lockInwardId and statusEnumId '

        /*#swagger.parameters[ {
                        "name": "lockInwardId",
                        "in": "query",
                        "description": "bikeInwardId",
                        "required": true,
                        "type": "integer"
                    }] 
        } */
        /*#swagger.parameters[ {
                        "name": "statusEnumId",
                        "in": "query",
                        "description": "statusEnumId",
                        "required": true,
                        "type": "integer"
                    }] 
        } */
        /*#swagger.parameters[ {
                        "name": "itemPerPage",
                        "in": "query",
                        "description": "itemPerPage",
                        "required": true,
                        "type": "integer"
                    }] 
        } */
        /*#swagger.parameters[ {
                        "name": "page",
                        "in": "query",
                        "description": "page",
                        "required": true,
                        "type": "integer"
                    }] 
        } */
        let requestQuery = req.query;
        let result: any = await InwardServices.getLockInwardDetails(requestQuery);
        let lockInwardArray: any = [];
        let currentTime = getUTCdate();
        for (let row of result.rows) {
            //     let fromTime = new Date(row.createdon_date);
            //     let toTime = new Date(currentTime);
            //     let difference = toTime.getTime() - fromTime.getTime(); // This will give difference in milliseconds
            
            let difference: any = await calculateMin(row.createdon_date, currentTime); // This will give difference in milliseconds
            let minutes = difference;

            lockInwardArray.push({
                lockInwardId: row.id,
                inwardDate: row.inward_date,
                lockId: row.lock_number_id,
                lockNumber: row.lock_number,
                lockIMEIId: row.lock_number_imei_id,
                lockIMEINumber: row.lock_number_imei,
                statusEnumId: row.status_enum_id,
                statusName: row.status_name,
                remarks: row.remarks,
                actionRemarks: row.action_remarks,
                createdOnDate: row.createdon_date,
                createdByLoginUserId: row.createdby_login_user_id,
                createdByUserName: row.created_by_user_name,
                createdByUserTypeEnumId: row.createdby_user_type_enum_id,
                createdByUserTypeName: row.created_by_user_type_name,
                updatedLoginUserId: row.updated_login_user_id,
                updatedLoginUserName: row.updated_login_user_name,
                updatedOnDate: row.updatedon_date,
                updatedByUserTypeEnumId: row.updatedby_user_type_enum_id,
                updatedByUserTypeName: row.updated_by_user_type_name,
                instruction_id: row.instruction_id,
                registrationStatus: row.registration_status,
                allottedStatusId: row.allotment_status_id,
                allottedStatusName: row.allotment_status_id === '5' ? 'Allocated' : 'UnAllocated',
                minutes: minutes
            });
        }
        if (result.rowCount > 0) {
            return RequestResponse.success(res, apiMessage.success, status.success, lockInwardArray);
        } else {
            return RequestResponse.success(res, apiMessage.dataNotAvailable, status.info, []);
        }
    } catch (error: any) {
        AddExceptionIntoDB(req,error);
        return exceptionHandler(res, 1, error.message);
    }
};

const getUidListByVehicleIdController = async (req: Request, res: Response) => {
    try {
        // #swagger.tags = ['Admin-Bike-Produce']
        // #swagger.description = 'Pass  vehicleId '

        /*#swagger.parameters[ {
                        "name": "vehicleId",
                        "in": "query",
                        "description": "vehicleId",
                        "required": true,
                        "type": "integer"
                    }] 
        } */
        let requestQuery = req.query;
        let result: any = await InwardServices.getUidList(requestQuery);
        let uIdArray: any = [];
        for (let row of result.rows) {
            uIdArray.push({
                uid: row.id,
                vehicleModelUId: row.model_uid
            });
        }
        if (result.rowCount > 0) {
            return RequestResponse.success(res, apiMessage.success, status.success, uIdArray);
        } else {
            return RequestResponse.success(res, apiMessage.dataNotAvailable, status.info, []);
        }
    } catch (error: any) {
        AddExceptionIntoDB(req,error);
        return exceptionHandler(res, 1, error.message);
    }
};

const getUidListWithBiekAndLockController = async (req: Request, res: Response) => {
    try {
        // #swagger.tags = ['Admin-Bike-Produce']
        // #swagger.description = 'Pass  vehicleId '

        /*#swagger.parameters[ {
                        "name": "vehicleId",
                        "in": "query",
                        "description": "vehicleId",
                        "required": true,
                        "type": "integer"
                    }] 
        } */
        let requestQuery = req.query;
        let result: any = await InwardServices.getUidListWithBiekAndLockList(requestQuery);
        let uIdArray: any = [];
        for (let row of result.rows) {
            uIdArray.push({
                uid: row.id,
                vehicleModelUId: row.model_uid ,

                bikeId : row.bike_id,
                bike_name : row.bike_name ,
                
                lockId : row.lock_id,
                lockNumber : row.lock_number,

                 displayName :'' + row.id +' '+ row.model_uid + ' ' + row.bike_id+ ' '+ row.bike_name + ' '+ row.lock_id +' '+ row.lock_number +'', 
            });
        }
        if (result.rowCount > 0) {
            return RequestResponse.success(res, apiMessage.success, status.success, uIdArray);
        } else {
            return RequestResponse.success(res, apiMessage.dataNotAvailable, status.info, []);
        }
    } catch (error: any) {
        AddExceptionIntoDB(req,error);
        return exceptionHandler(res, 1, error.message);
    }
};


const getLockListController = async (req: Request, res: Response) => {
    try {
        // #swagger.tags = ['Admin-Bike-Produce']
        // #swagger.description = 'Pass  '

        let requestQuery = req.query;
        let result: any = await InwardServices.getLockList();
        let lockArray: any = [];
        for (let row of result.rows) {
            lockArray.push({
                lockId: row.id,
                lockNumber: row.lock_number
            });
        }
        if (result.rowCount > 0) {
            return RequestResponse.success(res, apiMessage.success, status.success, lockArray);
        } else {
            return RequestResponse.success(res, apiMessage.dataNotAvailable, status.info, []);
        }
    } catch (error: any) {
        AddExceptionIntoDB(req,error);
        return exceptionHandler(res, 1, error.message);
    }
};

const activeInactiveLockInwardController = async (req: Request, res: Response) => {
    try {
        /* 	#swagger.tags = ['Admin-Inward']
              #swagger.description = 'Only user can add type all Parameter are mandatory in swagger for testing purpose'

        /*	#swagger.parameters['obj'] = {
                    in: 'body',
                    description: 'status updated.',
                    required: true,
                    schema: { $ref: "#/definitions/activeInactiveLockInwardController" }
            } */

        /* #swagger.security = [{
                    "apiKeyAuth": []
            }] */

        let requestBody = req.body;
        let result: any;
        let lockInwardData = { lockInwardId: requestBody.lockInwardId, statusEnumId: 0 };
        let getLockInwardDetails: any = await InwardServices.getLockInwardDetails(lockInwardData);
        if (getLockInwardDetails.rowCount <= 0) {
            return RequestResponse.validationError(res, 'Lock Inward Details Not Found', status.info, []);
        }
        
        client
            .query('BEGIN')           
            .then(async (res) => {
                requestBody.lockId = getLockInwardDetails.rows[0].id;
                result = await InwardServices.activeInactiveLockNumber(requestBody);
                return result;
            })
           
            .then((res) => {
                return client.query('commit');
            })
            .then((r) => {
                if (result) {
                    return RequestResponse.success(res, apiMessage.InwardStatusUpdate, status.info, []);
                } else {
                    return RequestResponse.success(res, apiMessage.somethingWentWrong, status.info, []);
                }
            })
            .catch((err) => {
                
                client.query('rollback');
                AddExceptionIntoDB(req,err);
                return exceptionHandler(res, 1, err.message);
            })
            .catch((err) => {
                AddExceptionIntoDB(req,err);
                return exceptionHandler(res, 1, 'error while rolling back transaction');
            });
    } catch (error: any) {
        AddExceptionIntoDB(req,error);
        return exceptionHandler(res, 1, error.message);
    }
};

const activeInactiveBikeInwardController = async (req: Request, res: Response) => {
    try {
        /* 	#swagger.tags = ['Admin-Inward']
              #swagger.description = 'Only user can add type all Parameter are mandatory in swagger for testing purpose' 

        /*	#swagger.parameters['obj'] = {
                    in: 'body',
                    description: 'status updated.',
                    required: true,
                    schema: { $ref: "#/definitions/activeInactiveBikeInwardController" }
            } */

        /* #swagger.security = [{
                    "apiKeyAuth": []
            }] */

        let requestBody = req.body;
        let result: any;
        let bikeInwardData = { bikeInwardId: requestBody.bikeInwardId, statusEnumId: 0, bikeStatusEnumId: 0 };
        let getBikeInwardDetails: any = await InwardServices.getBikeInwardDetails(bikeInwardData);
        if (getBikeInwardDetails.rowCount <= 0) {
            return RequestResponse.validationError(res, 'Bike Inward Details Not Found', status.info, []);
        }
        client
            .query('BEGIN')
          
            .then(async (res) => {               
                result = await InwardServices.activeInactiveUid(requestBody);

                return result;
            })
            .then((res) => {
                return client.query('commit');
            })
            .then((r) => {
                if (result) {
                    return RequestResponse.success(res, apiMessage.InwardStatusUpdate, status.info, []);
                } else {
                    return RequestResponse.success(res, apiMessage.somethingWentWrong, status.info, []);
                }
            })
            .catch((err) => {
                
                client.query('rollback');
                AddExceptionIntoDB(req,err);
                return exceptionHandler(res, 1, err.message);
            })
            .catch((err) => {
                AddExceptionIntoDB(req,err);
                return exceptionHandler(res, 1, 'error while rolling back transaction');
            });
    } catch (error: any) {
        AddExceptionIntoDB(req,error);
        return exceptionHandler(res, 1, error.message);
    }
};

const getLockDetailsFromDeviceController = async (req: Request, res: Response) => {
    try {
        /* 	#swagger.tags = ['Admin-Inward']
              #swagger.description = 'Only user can add type all Parameter are mandatory in swagger for testing purpose'

        /*	#swagger.parameters['obj'] = {
                    in: 'body',
                    description: 'status updated.',
                    required: true,
                    schema: { $ref: "#/definitions/getLockDetailsFromDeviceController" }
            } */

        /* #swagger.security = [{
                    "apiKeyAuth": []
            }] */
        let requestBody = req.body;

        let data = { requestBody: req.body, requestQuery: req.query };
        let result = await InwardServices.getLockDetailsFromDevice(data);
        if (result) {
            return RequestResponse.success(res, apiMessage.success, status.info, result);
        } else {
            return RequestResponse.success(res, apiMessage.noDataFound, status.info, []);
        }
    } catch (error: any) {
        AddExceptionIntoDB(req,error);
        return exceptionHandler(res, 1, error.message);
    }
};

const deleteLockInwardController = async (req: Request, res: Response) => {
    try {
        /* 	#swagger.tags = ['Admin-Inward']
              #swagger.description = 'Only user can add type all Parameter are mandatory in swagger for testing purpose' 

        /*	#swagger.parameters['obj'] = {
                    in: 'body',
                    description: 'status updated.',
                    required: true,
                    schema: { $ref: "#/definitions/deleteLockInwardController" }
            } */

        /* #swagger.security = [{
                    "apiKeyAuth": []
            }] */

        let requestBody = req.body;
        let result: any;

        if(CommonMessage.IsValid(requestBody.lockId)==false)
        {
            return RequestResponse.validationError(res, apiMessage.lockIdset, status.info, []);   
        }
        


        
       
        let checkLockId: any = await InwardServices.checkLockIdervice(requestBody);
        
        if (checkLockId.rowCount == 0)
        {
            return RequestResponse.validationError(res, apiMessage.checkLockIdNotexit, status.info, []);
        }

            if(checkLockId.rows[0].registartion_status==true)
              {
                return RequestResponse.validationError(res, apiMessage.cannotDelete, status.info, []);
              }

              requestBody.lockNumber =  requestBody.lockId ;


        client
            .query('BEGIN')                        
            .then(async (res) => {
                result = await InwardServices.deleteLock(requestBody);
                return result;
            })
            .then((res) => {
                return client.query('commit');
            })
            .then((r) => {
                if (result) {
                    return RequestResponse.success(res, apiMessage.deleteDevice, status.info, []);
                } else {
                    return RequestResponse.success(res, apiMessage.somethingWentWrong, status.info, []);
                }
            })
            .catch((err) => {
                
                client.query('rollback');
                AddExceptionIntoDB(req,err);
                return exceptionHandler(res, 1, err.message);
            })
            .catch((err) => {
                AddExceptionIntoDB(req,err);
                return exceptionHandler(res, 1, 'error while rolling back transaction');
            });
    } catch (error: any) {
        AddExceptionIntoDB(req,error);
        return exceptionHandler(res, 1, error.message);
    }
};



const insertGetBodyData = async (req: Request, res: Response) => {
    try {
        /* 	#swagger.tags = ['Admin-Inward']
              #swagger.description = 'Only user can add type all Parameter are mandatory in swagger for testing purpose'

        /*	#swagger.parameters['obj'] = {
                    in: 'body',
                    description: 'status updated.',
                    required: true,
                    schema: { $ref: "#/definitions/getLockDetailsFromDeviceController" }
            } */

        /* #swagger.security = [{
                    "apiKeyAuth": []
            }] */
            let requestBody = req.query;

            let data :any= JSON.stringify(requestBody)
        let actionDate :any = getUTCdate()
        let result = await InwardServices.insertGetBodyDataService(data,actionDate);
        if (result) {
           return RequestResponse.successForTest(res, apiMessage.success);            
        } else {
            return RequestResponse.validationErrorForTest(res, apiMessage.error);
        }
    } catch (error: any) {
        AddExceptionIntoDB(req,error);
        return RequestResponse.validationErrorForTest(res, apiMessage.error);;
    }
};


const insertPostBodyData= async (req: Request, res: Response) => {
    try {
        /* 	#swagger.tags = ['Admin-Inward']
              #swagger.description = 'Only user can add type all Parameter are mandatory in swagger for testing purpose'

        /*	#swagger.parameters['obj'] = {
                    in: 'body',
                    description: 'status updated.',
                    required: true,
                    schema: { $ref: "#/definitions/getLockDetailsFromDeviceController" }
            } */

        /* #swagger.security = [{
                    "apiKeyAuth": []
            }] */
        let requestBody = req.body;
              
        let data :any= JSON.stringify(requestBody)
        let actionDate :any = getUTCdate()
        let result = await InwardServices.insertPostBodyDataService(data,actionDate);
        
        if (result) {            
            return RequestResponse.successForTest(res, apiMessage.success);
            
        } else {
            return RequestResponse.successForTest(res, apiMessage.error);
        }
    } catch (error: any) {
        AddExceptionIntoDB(req,error);
        return RequestResponse.successForTest(res, apiMessage.error);
    }
};

// nodeSchedule.schedule('*/1 * * * *', async () => {
    
//     let result: any = await InwardServices.getLockInwardDetails({ lockInwardId: 0, statusEnumId: 0 });
//     let currentTime = getUTCdate();
 
//     for (let row of result.rows) {
//         // let fromTime = new Date(row.createdon_date);
//         // let toTime = new Date(currentTime);
//         // let difference = toTime.getTime() - fromTime.getTime(); // This will give difference in milliseconds
//         // let minutes = Math.round(difference / 60000);
//         let difference: any = await calculateMin(row.createdon_date, currentTime); // This will give difference in milliseconds
//         let minutes = Math.round(difference);
       
//         if (minutes >= 5 && row.registration_status === false) {
//             client
//                 .query('BEGIN')
//                 .then(async (res) => {
//                     result = await InwardServices.deleteLockIMEI({ lockNumber: row.lock_number_id });
//                     return result;
//                 })
//                 .then(async (res) => {
//                     result = await InwardServices.deleteLockInward({ lockId: row.lock_number_id });
//                     return result;
//                 })
//                 .then(async (res) => {
//                     let prepareLogData = {
//                         lockId: row.lock_number_id,
//                         lockNumber: row.lock_number,
//                         deviceLockAndUnlockStatus: masterMessage.inactiveStatus,
//                         deviceLockAndUnlockStatusName: apiMessage[2],
//                         instructionId: row.instruction_id,
//                         instructionName: instructionName[1],
//                         statusEnumId: masterMessage.inactiveStatus,
//                         actionRemarks: apiMessage.deviceDeleted,
//                         createdByLoginUserId: row.createdby_login_user_id,
//                         createdByUserTypeEnumId: row.createdby_user_type_enum_id
//                     };
//                     result = await InwardServices.deleteLock({ lockId: row.lock_number_id });

//                     result = await AddLog.addDeviceInstructionLog(prepareLogData);

//                     return result;
//                 })
//                 .then((res) => {
//                     return client.query('commit');
//                 })
//                 .then((r) => {
                    
//                 })
//                 .catch((err) => {
                   
//                     client.query('rollback');
//                 })
//                 .catch((err) => {
                    
//                 });
//         }
//     }
// });




const bikeProduceValidations = async (requestBody: any, res: Response,req:any) => {
    try {
        
              
        let bike :any =requestBody.bikeId;

        let bikeResult: any = await RideBooking.getBikeDetails({bike});

        

        if(bikeResult.rowCount <= 0) 
        {
             RequestResponse.validationError(res, apiMessage.bikeNotFound, status.success, []); 
             return false ;           
        }

        if (bikeResult.rows[0].bike_booked_status === '13') 
        {
           RequestResponse.validationError(res, 'This is booked can not be deactive.', status.success, []); 
           return false ;  
        }

        
            requestBody.allotmentStatusId =6
              
        
        requestBody.vehicleId=bikeResult.rows[0].model_id ;
        requestBody.lockId=bikeResult.rows[0].lock_id ;
        requestBody.uId=bikeResult.rows[0].uid_id;
        requestBody.status_enum_id=1;


        if(requestBody.statusEnumId =='1')
        {
            requestBody.allotmentStatusId =5
        
        let getBikeOther: any = await RideBooking.getBikeOtherBikeAtSameLocke(requestBody);

        

        if(getBikeOther.rowCount > 0) 
        {
             RequestResponse.validationError(res, apiMessage.checkLockNumber, status.success, []);  
             return false ;          
        }


        let getBikeOtherUId: any = await RideBooking.getBikeOtherBikeAtSameUId(requestBody);
        

        if(getBikeOtherUId.rowCount > 0) 
        {
             RequestResponse.validationError(res, apiMessage.uidAssociated, status.success, []);   
             return false ;         
        }         
    }
    return true ;          
       
    } catch (error: any) {
        AddExceptionIntoDB(req,error);
         exceptionHandler(res, 1, error.message);
         return false ;
    }
};

const bikeProduceActiveDeactive = async (req: Request, res: Response) => {
    try {
        /* 	#swagger.tags = ['Admin-Inward']
              #swagger.description = 'Only user can add type all Parameter are mandatory in swagger for testing purpose' 

        /*	#swagger.parameters['obj'] = {
                    in: 'body',
                    description: 'status updated.',
                    required: true,
                    schema: { $ref: "#/definitions/deleteLockInwardController" }
            } */

        /* #swagger.security = [{
                    "apiKeyAuth": []
            }] */

        let requestBody = req.body;
        let result: any;

        if(CommonMessage.IsValid(requestBody.bikeId)==false)
        {
            return RequestResponse.validationError(res, apiMessage.lockIdset, status.info, []);   
        }  
                            
          let validationResult = await bikeProduceValidations(requestBody,res,req)
          if(validationResult== false)
          {
            return;
          }
          let msg :any ;
            if (requestBody.statusEnumId == '1')
            {
                msg=  apiMessage.bikeActive ;
            }
            else if(requestBody.statusEnumId == '2')
            {
                msg=  apiMessage.bikedeActive ;
            }
              //               
        client
            .query('BEGIN')
            .then(async (res) => {
                result = await InwardServices.updateBikeLockAllotmentStatus(requestBody);
                return result;
            })
            .then(async (res) => {
                result = await InwardServices.updateBikeAllocatedToInward(requestBody);

                return result;
            })
            .then(async (res) => {
                result = await InwardServices.updateBikeUIdStatusFromBikeProduce(requestBody);
                return result;
            })
            .then(async (res) => {
                result = await InwardServices.activeDeactiveBikeService(requestBody);
                return result;
            })
            .then((res) => {
                return client.query('commit');
            })
            .then((r) => {
                if (result) {
                    return RequestResponse.success(res, msg, status.info, []);
                } else {
                    return RequestResponse.success(res, apiMessage.somethingWentWrong, status.info, []);
                }
            })
            .catch((err) => {
                
                AddExceptionIntoDB(req,err);
                return exceptionHandler(res, 1, err.message);
            })
            .catch((err) => {
                AddExceptionIntoDB(req,err);
                return exceptionHandler(res, 1, 'error while rolling back transaction');
            });
    } catch (error: any) {
        AddExceptionIntoDB(req,error);
        return exceptionHandler(res, 1, error.message);
    }
};


const deviceRegistrationByAdmin= async (req: Request, res: Response) => {
    try {
        /* 	#swagger.tags = ['Admin-Inward']
              #swagger.description = 'Only user can add type all Parameter are mandatory in swagger for testing purpose'

        /*	#swagger.parameters['obj'] = {
                    in: 'body',
                    description: 'status updated.',
                    required: true,
                    schema: { $ref: "#/definitions/getLockDetailsFromDeviceController" }
            } */

        /* #swagger.security = [{
                    "apiKeyAuth": []
            }] */
        let requestBody = req.body;
             
        
        let result = await adminDashboardServices.deviceRegistrationByAdmin(requestBody,req);
        
        if (result) {            
            return RequestResponse.success(res, apiMessage.success, status.success, []);
            
        } else {
            return RequestResponse.validationError(res, apiMessage.dataNotAvailable, status.success, []);
        }
    } catch (error: any) {
        AddExceptionIntoDB(req,error);
        return exceptionHandler(res, 1, error.message);
    }
};



 

    
  
async  function addDeviceDataFromTest(data: any) {
        try {
            /* 	#swagger.tags = ['Admin-Inward']
                  #swagger.description = 'Only user can add type all Parameter are mandatory in swagger for testing purpose'
    
            /*	#swagger.parameters['obj'] = {
                        in: 'body',
                        description: 'status updated.',
                        required: true,
                        schema: { $ref: "#/definitions/getLockDetailsFromDeviceController" }
                } */
    
            /* #swagger.security = [{
                        "apiKeyAuth": []
                }] */
            let requestBody :any =data;
          //  requestBody.device_lock_unlock_communication_enum_id = '93';// online 
            let actionOnDate = getUTCdate();
            let res :any;
            for( let i =0 ; i < requestBody.length; i++)
                {   
                    
                    requestBody[i].apiCallingFrom = requestBody.apiCallingFrom;  
                    
                 //  console.log('loop wroking or not',requestBody[i])
                     
                   await addDeviceDataUDIMAndDeviceFrom(requestBody[i])   
                 //  await updateLockDetailFromMQTT(requestBody[i])                          
              //   }                                                                                                                                          
                }
                       
                return 0;
        let a :any ='';
        } catch (error: any) {
            AddExceptionIntoDB(data,error);
            return 0;
        }
    };

    async  function addDeviceDataUDIMAndDeviceFrom(dataDetail: any) {
        try {
            /* 	#swagger.tags = ['Admin-Inward']
                  #swagger.description = 'Only user can add type all Parameter are mandatory in swagger for testing purpose'
    
            /*	#swagger.parameters['obj'] = {
                        in: 'body',
                        description: 'status updated.',
                        required: true,
                        schema: { $ref: "#/definitions/getLockDetailsFromDeviceController" }
                } */
    
            /* #swagger.security = [{
                        "apiKeyAuth": []
                }] */
                let requestBody :any =dataDetail;
            let actionOnDate = getUTCdate();
                 
            
                    let data :any=[] ;   
                if (CommonMessage.IsValid(requestBody.name)== false || CommonMessage.IsValid(requestBody.deviceid)== false || CommonMessage.IsValid(requestBody.uniqueid)== false)
                 {  
                  return 0;
                 }
                   

                 
                    if (CommonMessage.IsValid(requestBody.type)== false)
                    {
                        data.type =null
                        data.em_devece_type =null; 
                    } 
                    else 
                    {
                        data.em_devece_type = requestBody.type;
                        if(requestBody.type.toLowerCase()=='scooter')
                        {
                            data.type ='89'
                        }
                        else if(requestBody.type.toLowerCase()=='bicycle')
                        {
                            data.type ='90'
                        }
                         
                        else if(requestBody.type.toLowerCase()=='truck')
                        {
                            data.type ='91'
                        }
                        else 
                        {
                            data.type ='92'// other
                        }
                    }
                  
                    if (CommonMessage.IsValid(requestBody.moving)== false)
                    {
                        data.moving =null
                    } 
                    else 
                    {
                    if(requestBody.moving=='0')
                    {
                        data.moving =false;
                    }else 
                    {
                        data.moving = true;
                    }
                }

                if (CommonMessage.IsValid(requestBody.ignition)== false)
                    {
                        data.ignition =null                                                          
                   }
                   else 
                   {
                    data.ignition = requestBody.ignition ;  
                   }

                if (CommonMessage.IsValid(requestBody.valid)== false)
                {
                    data.valid =null
                } 
                else 
                {  
                    if(requestBody.valid=='0')
                    {
                        data.valid =false;
                    }else 
                    {
                        data.valid = true;
                    }
                }
                   //status: 1, online off line -- 1 == online 
                   // state: 'stopped' me_state_enum_id offline,moving,idle,stopped
                   if (CommonMessage.IsValid(requestBody.status)== false)
                   {
                       addMissingStatusPacketAudit('api', requestBody, data);
                       data.status =null;
                       data.deveice_state_enum_id = '23';// online (heartbeat packet received)
                   } 
                   else 
                   {  
                    if (requestBody.status == '1')
                    {
                        data.deveice_state_enum_id  = '23';// online
                    }
                    else if  (requestBody.status == '0') 
                    {
                        data.deveice_state_enum_id  = '24';// offline
                    }
                }                                                                                     

                data.statusEnumId  ='1' ;// add condtions

              
              
                if (CommonMessage.IsValid(requestBody.disabled)== false)
                { 
                    data.disabled = null
                }
                else { 
                    data.disabled  =requestBody.disabled;
                 }

              if (CommonMessage.IsValid(requestBody.created_at)== false)
              { 
                  data.created_at = null
              }
              else 
              { 
              data.created_at_date  =requestBody.created_at;
              }
              if (CommonMessage.IsValid(requestBody.accountid)== false)
              {
                  data.accountid = null
              }
              else 
              { 
              data.accountid =requestBody.accountid;
              }
              if (CommonMessage.IsValid(requestBody.statesince)== false)
              { 
                  data.statesince = null;
                  data.statesince_date = null;
              }
              else { 
              data.statesince_date =requestBody.statesince;
              data.statesince = requestBody.statesince;
              }
             
              if (CommonMessage.IsValid(requestBody.protocol)== false)
              { 
                  data.protocol = null
              }
              else 
              { 
              data.protocol = requestBody.protocol;
            }
              
              if (CommonMessage.IsValid(requestBody.servertime)== false)
              { 
                  data.servertime = null
              }
              else 
              { 
              data.servertime = requestBody.servertime;
              }

              if (CommonMessage.IsValid(requestBody.devicetime)== false)
              { 
                  data.devicetime =null
              }
              else
            { 
              data.devicetime = requestBody.devicetime;
            }

              if (CommonMessage.IsValid(requestBody.fixtime)== false)
              { 
                  data.fixtime = null
              }
              else
              { 
              data.fixtime = requestBody.fixtime;  
              }
             

              if (CommonMessage.IsValid(requestBody.course)== false)
              { 
                  data.course = null
              }
              else 
              { 
              data.course = requestBody.course
              }

              if (CommonMessage.IsValid(requestBody.address)== false)
              { 
                  data.address = null
              }
              else 
              { 
              data.address = requestBody.address
            }
              if (CommonMessage.IsValid(requestBody.accuracy)== false)
              { 
                  data.accuracy = null
              }
              else 
              { 
              data.accuracy = requestBody.accuracy
              }

              if (CommonMessage.IsValid(requestBody.network)== false)
              { 
                  data.network = null
              }
              else 
              { 
              data.network = requestBody.network
            }
              
              data.location  = ''
              if (CommonMessage.IsValid(requestBody.latitude)== false)
                { 
                    data.latitude = null
                }
                else 
                {  
                 data.latitude =  requestBody.latitude
                }
                if (CommonMessage.IsValid(requestBody.longitude)== false)
                { 
                    data.longitude = null
                }
                else 
                { 
                 data.longitude  = requestBody.longitude
               }

               if (CommonMessage.IsValid(requestBody.attributes.out1)== false)
               { 
                
                   data.powerOnOff = '97' // set values for 0 off
               }
               else if (requestBody.attributes.out1 == '1')
               { 
                
                data.powerOnOff = '96' ;// set values for 1  on
               }
               else if (requestBody.attributes.out1 == '0')
               { 
                
                data.powerOnOff = '97' ;// set values for 0 off
               }

               

              if (CommonMessage.IsValid(requestBody.altitude)== false)
              { 
                  data.altitude = null
              }
              else 
              { 
                data.altitude = requestBody.altitude;
             }
               if (CommonMessage.IsValid(requestBody.speed)== false)
              { 
                  data.speed = null
              }
              else 
              { 
              data.speed = requestBody.speed
            }


            //soc
            if (CommonMessage.IsValid(requestBody.attributes.SOC)== false)
                { 
                    data.battery = '0';
                }
                else 
                {  
                    data.battery = requestBody.attributes.SOC
                }


            if (CommonMessage.IsValid(requestBody.attributes.power)== false)
            { 
                data.external_batt_v = '0';
            }
            else 
            {  
                data.external_batt_v = requestBody.attributes.power ;
            }

            data.lastdevicerequesttime= actionOnDate;
            data.name =requestBody.name ;
            data.uniqueid = requestBody.uniqueid;   
            data.deviceid =requestBody.deviceid; 
              
              data.internal_batt_v = '0',
              
              data.device_lock_and_unlock_status = '2' // unlock,
              data.instruction_id = '4',
              data.registartion_status = true ,
              data.imei_number =requestBody.uniqueid ,    
              data.allotment_status_id = '6',
              
              data.device_last_request_time = actionOnDate,
              data.lock_number =requestBody.uniqueid
              data.status_enum_id ='1';
              data.createdon_date =actionOnDate,
              data.remarks = 'Device added from third party server.'
                    
              data.lastdevicerequesttime =getUTCdate()
              data.me_state_name =requestBody.state;
              
             if(requestBody.apiCallingFrom =='Device')
                {
                let checkDeviceState :any ;
                if (CommonMessage.IsValid(requestBody.state)== false)
                { 
                    data.statesEnumId = '0'
                }
                else 
                { 
                    checkDeviceState = await InwardServices.checkDeviceStateExitService(requestBody.state); 
                    
                    if(checkDeviceState.rowCount == '0')
                    {
                        checkDeviceState = await InwardServices.insertDeviceStateService(requestBody.state); 
                    }
                    
                    
                    data.statesEnumId = checkDeviceState.rows[0].id ;                                                             
                }
              
                    let checkLockName: any = await InwardServices.checkLockNameExitService(data); 

                    let checkUniqueIdExit :any =  await InwardServices.checkUniqueIdExitService(data.uniqueid);                    
                    let checkdeviceidExit :any =  await InwardServices.checkdeviceidExitService(data.deviceid);
                    
                    if (checkLockName.rowCount == '0' && checkUniqueIdExit.rowCount =='0' && checkdeviceidExit.rowCount =='0')
                    {              
                                                   
                        await InwardServices.insertDeviceDetailForUserAPIService(data)                        
                    }   
            }                                                 
                
                       
                return 0;
        
        } catch (error: any) {
            AddExceptionIntoDB(dataDetail,error);
            return 0;
        }
    };


    async  function deviceLockForThirdParty (req: Request, res: Response) 
    {
        let requestBody = req.body;  
        let validationResult =await ValidationCheckForLockNumber(requestBody, res)
        if (validationResult.result != '200') 
        {
            return ;
        } 

        requestBody.deviceLockAndUnlockStatus =  masterMessage.inactiveStatus ;
        requestBody.deviceLockAndUnlockStatusName =apiMessage[2] ;
        requestBody.instructionId =instruction.deviceLock,//change deviceLock to completedLockRequest
        requestBody.instructionName =instructionName[3] ;// change 3 to 5 
        requestBody.statusEnumId = '1';//masterMessage.activeStatus;
        requestBody.createdByLoginUserId = requestBody.userId ;
        if( CommonMessage.IsValid( requestBody.device_lock_unlock_communication_enum_id)==false)
        {          
          requestBody.apiCallFun =  'deviceLockAndUnlockByThirdParty';
          requestBody.device_lock_unlock_communication_enum_id = '93';// online 
        }
        if( CommonMessage.IsValid( requestBody.actionRemarks)==false)
        {      
           requestBody.actionRemarks = 'deveice lock for third party request'; 

        }    
        requestBody.remarks =JSON.stringify(requestBody);
        requestBody.actionRemarks = 'deveice lock by third party request'; 
        return  await  deviceLockAndUnlockByThirdParty(requestBody,res)   
       // console.log('check result apicall',apicall)                   
    }

    async  function deviceUnlockForThirdParty (req: Request, res: Response) 
    {
        let requestBody = req.body;   
        let validationResult =await ValidationCheckForLockNumber(requestBody, res)
      //  console.log('check validationResult.result',validationResult.result)
        if (validationResult.result != '200') 
        {
            console.log('check result on line 1770')
            return ;
        }   
        requestBody.deviceLockAndUnlockStatus = masterMessage.activeStatus ;
        requestBody.deviceLockAndUnlockStatusName =apiMessage[1] ;
        requestBody.instructionId =instruction.deviceUnlock,//change deviceLock to completedLockRequest
        requestBody.instructionName =instructionName[2] ;// change 3 to 5 
        requestBody.statusEnumId = '1';//masterMessage.inactiveStatus;  
        requestBody.createdByLoginUserId = requestBody.userId ;
        if( CommonMessage.IsValid( requestBody.device_lock_unlock_communication_enum_id)==false)
        {                 
           requestBody.apiCallFun =  'deviceLockAndUnlockByThirdParty'
           requestBody.device_lock_unlock_communication_enum_id = '93';// online
        } 

        if( CommonMessage.IsValid( requestBody.actionRemarks)==false)
        {      
           requestBody.actionRemarks = 'deveice unlock for third party'; 

        }
        requestBody.remarks =JSON.stringify(requestBody);
        requestBody.actionRemarks = 'deveice unlock by third party request';  

        let userId :any = requestBody.userId;
        let usersId :any =requestBody.userId;
        let getUserTypeEnumId: any = await RideBooking.getUserTypeEnumId({usersId});
        if(getUserTypeEnumId.rowCount <=0)
            {                           
                 RequestResponse.success(res, 'User Type Is not found.', status.success, []);
                 return
            }
              requestBody.userTypeEnumId = getUserTypeEnumId.rows[0].user_type_enum_id;
    
    if(requestBody.userTypeEnumId == '4')      {

                   
       let walletAmount :any = await RideBooking.getWalletAmount({userId});
    
           if (walletAmount.rowCount <=0)        
        {
          //  console.log('check walletAmount 979')
            return  RequestResponse.validationError(res, 'user wallet amount not found.', status.success, []);
        }
    
        requestBody.currentWalletAmount =walletAmount.rows[0].min_wallet_amount; // recharge amount
        requestBody.depositAmount =walletAmount.rows[0].deposit_amount; // user deposit amount 
        
   
       let walletAmountFromEnum :any= await RideBooking.getWalletAmountToEnumTbl();
        
    
        if (walletAmountFromEnum.rowCount <=0)        
        {
           // console.log('check walletAmountFromEnum 986')
            return RequestResponse.validationError(res, 'Set Minimum Ride Amount.', status.success, []);            
        }
        let rechargeAmountTblEnum:any= (walletAmountFromEnum.rows[0].enum_key).toFixed(2)
       let currentWallet =(walletAmount.rows[0].min_wallet_amount -walletAmountFromEnum.rows[0].enum_key).toFixed(2);
        
        console.log('walletAmount.rows[0].min_wallet_amount  1086',walletAmount.rows[0].min_wallet_amount)

        }
    return await  deviceLockAndUnlockByThirdParty(requestBody,res)  ;       
                                
    }
       


    async  function deviceLockByBle (req: Request, res: Response) 
    {

        let requestBody = req.body;     
          
        requestBody.actionRemarks = 'deveice lock By Ble'; 
        requestBody.apiCallFun =  'deviceLockByBle';
        requestBody.device_lock_unlock_communication_enum_id = '94';// Ble 
        requestBody.createdByLoginUserId = requestBody.userId ;
        let  deviceLockAndUnlockResult :any= await  deviceLockForThirdParty (req, res)

        // let  deviceLockAndUnlockResult :any=  await  deviceLockAndUnlockByThirdParty(requestBody,res)  ;  

           

        if(deviceLockAndUnlockResult.result == 'SUCCESS')
        {
         return RequestResponse.success(res, deviceLockAndUnlockResult.massage, status.success,deviceLockAndUnlockResult);
        }
 
         return RequestResponse.validationError(res, deviceLockAndUnlockResult.massage, status.error,deviceLockAndUnlockResult);
           
                     
    }
    async  function deviceUnlockByBle (req: Request, res: Response) 
    {
        let requestBody = req.body;                  
        requestBody.actionRemarks = 'deveice unlock By Ble';         
        requestBody.apiCallFun =  'deviceLockByBle'
        requestBody.device_lock_unlock_communication_enum_id = '94';// Ble 
        requestBody.createdByLoginUserId = requestBody.userId ;
        
      //  console.log('requestBody.createdByLoginUserId',requestBody.createdByLoginUserId,requestBody.userId);
       let  deviceLockAndUnlockResult :any=  await  deviceLockAndUnlockByThirdParty(requestBody,res)  ;  
       
       
       
       if(deviceLockAndUnlockResult.result == 'SUCCESS')
       {
         return RequestResponse.success(res, deviceLockAndUnlockResult.massage, status.success,deviceLockAndUnlockResult);
       }
   
        return RequestResponse.validationError(res, deviceLockAndUnlockResult.massage, status.error,deviceLockAndUnlockResult);
                         
    }


     async  function deviceLockAndUnlockByThirdParty (req: any, res: Response) {
        let apiDeveiceResponseData :any ;
        try {
            /* 	#swagger.tags = ['Admin-Inward']
                  #swagger.description = 'Only user can add type all Parameter are mandatory in swagger for testing purpose'
    
            /*	#swagger.parameters['obj'] = {
                        in: 'body',
                        description: 'status updated.',
                        required: true,
                        schema: { $ref: "#/definitions/getLockDetailsFromDeviceController" }
                } */
    
            /* #swagger.security = [{
                        "apiKeyAuth": []
                }] */
            let requestBody = req;

          //  console.log('date defejsfs vn',requestBody)
            
            requestBody.deviceId =requestBody.lockNumber ;
            
            let apiDeveiceResponseData :any ;
            let msg :any ='';
            let apiCallingRemainingTime:any = '11';

             requestBody.apiCallingTime ='10';

            let deviceInternalCallingTimeResult :any  = await InwardServices.deviceInternalCallingTime();
            if(deviceInternalCallingTimeResult.rows.count > 0)
            {
                requestBody.apiCallingTime =deviceInternalCallingTimeResult.rows[0]?.enum_key; 
            }
            
           let deviceCurrentStatus :any  = await InwardServices.getRegistrationStatusOfLock(requestBody.lockNumber);
        
        if (deviceCurrentStatus.rowCount == 0) 
        {    
            apiDeveiceResponseData =
            {
                apiCalledTime  : apiCallingRemainingTime,
                IntervalTime : requestBody.apiCallingTime ,                
                lastdevicerequesttime : null ,                
              massage :apiMessage.deviceIsNotExist,
              result :'deviceIsNotExist'
           }
         if(requestBody.apiCallFun ==  'deviceLockAndUnlockByThirdParty')
         {
            RequestResponse.success(res, apiMessage.deviceIsNotExist, status.success, apiDeveiceResponseData);
         } 
         //console.log('check result on line 1892')                                                           
         return apiDeveiceResponseData ;                                   
        }
        
           requestBody.lockId =deviceCurrentStatus.rows[0]?.id; 

           requestBody.thirdPartydeviceid =deviceCurrentStatus.rows[0].device_id; 

           //----------------
           requestBody.lastdevicerequesttime_DB =deviceCurrentStatus.rows[0].lastdevicerequesttime; 
           
           requestBody.lastUpdateTime = getUTCdate()   
           let timeDifference: any = await calculateSecond(requestBody.lastdevicerequesttime_DB, requestBody.lastUpdateTime);           
           apiCallingRemainingTime =  timeDifference ;

           let apicallingResult :any =await apiCallingRemainingTimevalidtions(requestBody,res)        
                              
           if(apicallingResult.result!= '200')
           {
           // console.log('check result on line 1911')
            return ;
           }
           //----------------

            let rideingIdResult: any = await adminLogDeviceInformationServices.getRideingIdByLockNumberService(requestBody);

            
            
            
            requestBody.rideBookingId =null;
            requestBody.createdByUserTypeEnumId =null;
            if(rideingIdResult.rowCount > 0)// for device unlock lock instruction ride booking id
            {
                requestBody.rideBookingId = rideingIdResult.rows[0].id;   
            }
           // console.log('start deviceCurrentStatus.rows[0]?.id 1865',deviceCurrentStatus.rows[0]?.id)
            

            requestBody.beepInstructionEnumIdLog =null ;
            requestBody.beepStatusEnumId =null ;
            requestBody.latitude =null ;
            requestBody.longitude ==null ;
            requestBody.mapCityId =null ;
            requestBody.areaId  =null ;
          
            
            await AddLog.addDeviceInstructionLog(requestBody);
            await adminLogDeviceInformationServices.addDeviceLightInformationslog(requestBody);
            
            
            //third part api
            let dbLockUnlockCommondid :any ='0';
            let SetLockUnlockResult :any ;
            // this code not for device lock / unlock by ble 
            if(requestBody.device_lock_unlock_communication_enum_id == '93') 
            {

            if(requestBody.instructionId == instruction.deviceLock)// for device lock commond
            {
               // console.log('check condond lock')
                dbLockUnlockCommondid = '1';// get lock commonds
            }else if(requestBody.instructionId == instruction.deviceUnlock) // for device unlock complited
            {
                //console.log('check condond unlock')
                dbLockUnlockCommondid = '2';// get unlock commonds
            }
                
            let getLockUnLockCommodsResult :any =  await adminLogDeviceInformationServices.getLockUnLockCommodsService(dbLockUnlockCommondid);
    
            
    
                
                if(getLockUnLockCommodsResult.rowCount == 0)// 
                {
                apiDeveiceResponseData =
                {
                    apiCalledTime  : apiCallingRemainingTime,
                    IntervalTime : requestBody.apiCallingTime ,
                    lastdevicerequesttime : requestBody.lastdevicerequesttime_DB ,
                  massage :apiMessage.commondDataNotAvailble,
                  result :'commondDataNotAvailable'
                }
    
                    if(requestBody.apiCallFun ==  'deviceLockAndUnlockByThirdParty')
                    { 
                    RequestResponse.validationError(res,apiMessage.commondDataNotAvailble, status.success,apiDeveiceResponseData);
                    }
                  //  console.log('check result on line 1979')
                    return apiDeveiceResponseData ;
                }
                                      
                requestBody.command_id = getLockUnLockCommodsResult.rows[0].commandid,
                requestBody.isqueuing = getLockUnLockCommodsResult.rows[0].isqueuing ,
                requestBody.timeout = getLockUnLockCommodsResult.rows[0].timeout ; 
                
                if(requestBody.autoActionType==false)
                {
                    SetLockUnlockResult = await ThingsupAPISetLockUnlockApiCalling(requestBody,res)
                  //  console.log('check data SetLockUnlockResult',SetLockUnlockResult);
                    requestBody.remarks =await thirdPartyApiExcuteCommondJson(requestBody)
                }

               
                else if(requestBody.autoActionType==true)
                {
                    SetLockUnlockResult= {

                        status: 200,
                        statusText: 'Success', 
                      data: { status: 'Success' }
                      }
                     // console.log('check result on line 2000')
                      requestBody.remarks ='this operation perform by auto lock/unlock';          
                }

            }            
            // this code not for device lock / unlock by ble 
         //   console.log('requestBody.device_lock_unlock_communication_enum_id',requestBody.device_lock_unlock_communication_enum_id)
            if(requestBody.device_lock_unlock_communication_enum_id == '94') // for Ble
            {
                SetLockUnlockResult= {
                    status: 200,
                    statusText: 'Success', 
                  data: { status: 'Success' }
                  }
                  requestBody.remarks ='this operation perform by auto lock/unlock';
                  //console.log('check result on line 2015')
            }
          
            
         //   console.log('check result on line 2022',SetLockUnlockResult.data.status)

            if (CommonMessage.IsValid(SetLockUnlockResult) && CommonMessage.IsValid(SetLockUnlockResult.data))
            {

              //  console.log('check result on line 2027',SetLockUnlockResult.data.status)

                
                if(SetLockUnlockResult.data.status=='Success'){
                    
                   // console.log('check result on line 2027')
                    // for success                  
                    if(requestBody.instructionId == instruction.deviceLock)// for device lock complited
                    {
                        requestBody.deviceLockAndUnlockStatusName =apiMessage[2] ;
                        requestBody.instructionId = instruction.completedLockRequest,//change deviceLock to completedLockRequest
                        requestBody.instructionName =instructionName[5] ;//
                        msg = apiMessage.lockRequest;
                    }
                    else if(requestBody.instructionId == instruction.deviceUnlock) // for device unlock complited
                    {
                        requestBody.deviceLockAndUnlockStatusName =apiMessage[1] ;
                        requestBody.instructionId = instruction.deviceUnlock,//change deviceLock to completedLockRequest
                        requestBody.instructionName =instructionName[6] ;//
                        msg = apiMessage.unlockRequest;
                    }
                                     
                    requestBody.actionRemarks = SetLockUnlockResult.data;                      
                       AddLog.addDeviceInstructionLog(requestBody);
                       adminLogDeviceInformationServices.addDeviceLightInformationslog(requestBody);
                       // function call for device lock unlock
                       adminDashboardServices.lockUnlockDeviceForThirdPartyApi(requestBody,req);

                       apiDeveiceResponseData =
                       {
                        apiCalledTime  : apiCallingRemainingTime,
                        IntervalTime : requestBody.apiCallingTime ,
                        lastdevicerequesttime : requestBody.lastdevicerequesttime_DB ,
                         massage :msg,
                         result :'SUCCESS'
                      }
                    if(requestBody.apiCallFun ==  'deviceLockAndUnlockByThirdParty')
                    {
                         RequestResponse.success(res, msg, status.success,apiDeveiceResponseData);
                        
                    }   
                  //  console.log('check result on line 2063')                                                         
                    return apiDeveiceResponseData ;
                }else{
                    // for error
                    
                    if(requestBody.instructionId == instruction.deviceLock)// for device lock error
                    {
                       requestBody.deviceLockAndUnlockStatusName =apiMessage[3] ;
                        requestBody.instructionId = instruction.LockError,//change deviceLock to completedLockRequest
                        requestBody.instructionName =instructionName[7] ;//
                    }
                    else if(requestBody.instructionId == instruction.deviceUnlock) // for device unlock error
                    {
                       requestBody.deviceLockAndUnlockStatusName =apiMessage[4] ;
                        requestBody.instructionId = instruction.unLockError,//change deviceLock to completedLockRequest
                        requestBody.instructionName =instructionName[8] ;//
                    }

                     
                    
                    requestBody.actionRemarks = SetLockUnlockResult.data;  
                    
             
                    AddLog.addDeviceInstructionLog(requestBody);
                    adminLogDeviceInformationServices.addDeviceLightInformationslog(requestBody);

                   
                    if(SetLockUnlockResult.data.status=='Device Not Online')
                    {
                      //device lock/unlock by Bluetooth / BLE
                    
                     apiDeveiceResponseData =
                     {
                        apiCalledTime  : apiCallingRemainingTime,
                        IntervalTime : requestBody.apiCallingTime ,
                        lastdevicerequesttime : requestBody.lastdevicerequesttime_DB ,
                       massage : apiMessage.lockunlockBybluetoot,
                       result :'lockunlockBybluetooth'
                    }
                   
                     if(requestBody.apiCallFun ==  'deviceLockAndUnlockByThirdParty')
                     {
                        
                      RequestResponse.validationError(res, apiMessage.lockunlockBybluetoot, status.success,apiDeveiceResponseData);
                     }
                    
                      return apiDeveiceResponseData ;
                    }                
                    else if(SetLockUnlockResult.data.status=='No Device Found')
                    {
                  
                  apiDeveiceResponseData =
                  {
                    apiCalledTime  : apiCallingRemainingTime,
                    IntervalTime : requestBody.apiCallingTime ,
                    lastdevicerequesttime : requestBody.lastdevicerequesttime_DB ,
                    massage :apiMessage.noDeveiceAvailable,
                    result :'NoDeviceFound'
                 }
                  if(requestBody.apiCallFun ==  'deviceLockAndUnlockByThirdParty')
                    {
                      RequestResponse.validationError(res, apiMessage.noDeveiceAvailable, status.success,apiDeveiceResponseData);
                    }
                    
                      return apiDeveiceResponseData ;
                    }
                    else if(SetLockUnlockResult.data.status=='Invalid Data')
                    {
                   //console.log('* 3 Some data/parameters are missing ');
                   apiDeveiceResponseData =
                   {
                    apiCalledTime  : apiCallingRemainingTime,
                    IntervalTime : requestBody.apiCallingTime ,
                    lastdevicerequesttime : requestBody.lastdevicerequesttime_DB ,
                     massage :apiMessage.InvalidData,
                     result :'InvalidData'
                  }
                   if(requestBody.apiCallFun ==  'deviceLockAndUnlockByThirdParty')
                    {
                      RequestResponse.validationError(res,apiMessage.InvalidData, status.success,apiDeveiceResponseData);
                    }
                    
                      return apiDeveiceResponseData ;
                    }
                    else if(SetLockUnlockResult.data.status=='Command not found')
                    {
                      //console.log('* 4 Lock/unlock command is not found/match ');
                      
                      apiDeveiceResponseData =
                      {
                        apiCalledTime  : apiCallingRemainingTime,
                        IntervalTime : requestBody.apiCallingTime ,
                        lastdevicerequesttime : requestBody.lastdevicerequesttime_DB ,
                        massage :apiMessage.LUCommandNotFound,
                        result :'LockUnlockCommondNotFound'
                     }
                    
                     if(requestBody.apiCallFun =='deviceLockAndUnlockByThirdParty')
                     {                        
                         RequestResponse.validationError(res,apiMessage.LUCommandNotFound, status.success,apiDeveiceResponseData);
                     }
                     
                     return apiDeveiceResponseData ;
                    }
                    else if(SetLockUnlockResult.data.status=='Invalid timeout')
                    {
                     
                     apiDeveiceResponseData =
                     {
                        apiCalledTime  : apiCallingRemainingTime,
                        IntervalTime : requestBody.apiCallingTime ,
                        lastdevicerequesttime : requestBody.lastdevicerequesttime_DB ,
                       massage :apiMessage.timeNotCorrect,
                       result :'TimeoutValueIsNotCorrect'
                    }
                     if(requestBody.apiCallFun ==  'deviceLockAndUnlockByThirdParty')
                    {
                      RequestResponse.validationError(res,apiMessage.timeNotCorrect, status.success,apiDeveiceResponseData);
                    }
                    
                      return apiDeveiceResponseData ;
                    }
                    else if(SetLockUnlockResult.data.status=='Command Execution Failed')
                    {
                      //Please try again
                     

                     apiDeveiceResponseData =
                     {
                        apiCalledTime  : apiCallingRemainingTime,
                        IntervalTime : requestBody.apiCallingTime ,
                        lastdevicerequesttime : requestBody.lastdevicerequesttime_DB ,
                       massage :apiMessage.CommandExecutionFailed,
                       result :'CommandExecutionFailed'
                    }
                     if(requestBody.apiCallFun ==  'deviceLockAndUnlockByThirdParty')
                    {
                      RequestResponse.validationError(res,apiMessage.CommandExecutionFailed, status.success,apiDeveiceResponseData);
                    }
                    
                      return apiDeveiceResponseData ;
                    }
                    else if(SetLockUnlockResult.data.status=='Unauthorized')
                    {
                      
                      apiDeveiceResponseData =
                      {
                        apiCalledTime  : apiCallingRemainingTime,
                        IntervalTime : requestBody.apiCallingTime ,
                        lastdevicerequesttime : requestBody.lastdevicerequesttime_DB ,
                        massage :apiMessage.Unauthorized,
                        result :'Unauthorized'
                     }
                     
                      if(requestBody.apiCallFun ==  'deviceLockAndUnlockByThirdParty')
                      { RequestResponse.validationError(res,apiMessage.Unauthorized, status.success,apiDeveiceResponseData);}
                      
                      return apiDeveiceResponseData ;
                    }
                    else if(SetLockUnlockResult.data.status=='Missing Authorization Header')
                    {
                      
                      apiDeveiceResponseData =
                      {
                        apiCalledTime  : apiCallingRemainingTime,
                        IntervalTime : requestBody.apiCallingTime ,
                        lastdevicerequesttime : requestBody.lastdevicerequesttime_DB ,
                        massage :apiMessage.Unauthorized,
                        result :'Unauthorized'
                     }
                      if(requestBody.apiCallFun ==  'deviceLockAndUnlockByThirdParty')
                      {  RequestResponse.validationError(res,apiMessage.Unauthorized, status.success,apiDeveiceResponseData);}
                      
                      return apiDeveiceResponseData ;
                    }
               }          
                
             }
            else{
                
                     // for error
                     requestBody.actionRemarks =  'error in lock and unlock' 
                     if(requestBody.instructionId == instruction.deviceLock)// for device lock error
                     {
                        requestBody.deviceLockAndUnlockStatusName =apiMessage[3] ;
                         requestBody.instructionId = instruction.LockError,//change deviceLock to completedLockRequest
                         requestBody.instructionName =instructionName[7] ;//
                         requestBody.actionRemarks ='Error in lock'
                     }
                     else if(requestBody.instructionId == instruction.deviceUnlock) // for device unlock error
                     {
                        requestBody.deviceLockAndUnlockStatusName =apiMessage[4] ;
                         requestBody.instructionId = instruction.unLockError,//change deviceLock to completedLockRequest
                         requestBody.instructionName =instructionName[8] ;//
                         requestBody.actionRemarks ='Error in unlock'
                     }
                     
                     requestBody.remarks =await thirdPartyApiExcuteCommondJson(requestBody) 
                      
                   //SetLockUnlockResult.data;  
                     
                     AddLog.addDeviceInstructionLog(requestBody);
                     adminLogDeviceInformationServices.addDeviceLightInformationslog(requestBody);
                     apiDeveiceResponseData =
                     {
                        apiCalledTime  : apiCallingRemainingTime,
                        IntervalTime : requestBody.apiCallingTime ,
                        lastdevicerequesttime : requestBody.lastdevicerequesttime_DB ,
                       massage :apiMessage.ErrorInThirdpartyLockUnlockAPI,
                       result :'ErrorInThirdpartyLockUnlockAPI'
                    }
                    if(requestBody.apiCallFun ==  'deviceLockAndUnlockByThirdParty')
                    {
                   RequestResponse.validationError(res,apiMessage.ErrorInThirdpartyLockUnlockAPI, status.success,apiDeveiceResponseData);
                    }
                    
                   return apiDeveiceResponseData ;
                }

      
        } catch (error: any) {
            
            AddExceptionIntoDB(req,error);
             exceptionHandler(res, 1, error.message);
             apiDeveiceResponseData =
             {
               massage :error.message,
               result :'500'
            }
            
             return  apiDeveiceResponseData;
        }
    };

    async function thirdPartyApiExcuteCommondJson(deveieData :any) {
              
        let data:any =JSON.stringify({    
                "id": deveieData.command_id, //"76", // it is ID of the command that need to get executed on device
                "deviceid": deveieData.thirdPartydeviceid, // ID of the device. You are getting it in the getDevices API.
                "queuing": deveieData.isqueuing, // Set always to true
                "timeout": deveieData.timeout // It will be a timeout to receive a response from the device. It will be in milliseconds. You can set  any value as per your requirement.
               
        });   
          
        //data.apiName = config.THINGS_URL+'api/button/command/execute'; 
        return data;        
    }
    async function ThingsupAPISetLockUnlockApiCalling(deveieData :any, res: Response) {
       
      let dataResult:any =await thirdPartyApiExcuteCommondJson(deveieData)  ; 

         let data:any =dataResult;
         let SetLockUnlockResult :any ;  
        

        return new Promise((resolve, reject) => {

           axios.post(config.THINGS_URL+'api/button/command/execute',data, {
                headers: {
                    'x-api-key': config.THINGS_UP_API_KEY,
                    'Content-Type': 'application/json'
                },
                
               
            }  
            ).then(function(result) {   
                                            
                resolve(result);            
             } ).catch((error) => {      
                                     
                logger.error(error);
            //     SetLockUnlockResult =
            //     {
            //       massage :error.message,
            //       result :'500',
            //       data: { status:error.response.data.status  }
            //    } 
            
               resolve(error.response);
              
            });
        });


        }
    

        async  function updateLockDetailFromMQTT (req: any, res : Response) 
        {
            let requestBody = req;     
          

           // console.log('check mqqt data jsonMessage',req)
            //console.log('check body request requestBody',requestBody)
               let data : any ={}; 
            requestBody.statusEnumId = '1';//masterMessage.inactiveStatus;  
            requestBody.apiCallFun =  'updateLockDetailFromMQTT';                    
            requestBody.actionRemarks = 'update lock detail from device data'; 
                
           
            data.device_lock_unlock_communication_enum_id= '93';// online 
           
           
            let checkdeviceidExit :any =  await InwardServices.checkdeviceidExitService(requestBody.deviceid);
                             
            if (checkdeviceidExit.rowCount =='0')
            {              
               RequestResponse.validationError(res,apiMessage.commondDataNotAvailble, status.success,[]);
                return false;
                        
               
            }   
             data.dId =checkdeviceidExit.rows[0].lock_number;
             let deviceLastRequestTimeFromDataBaseCustume : any = checkdeviceidExit.rows[0].device_last_request_time
             
            //console.log('let lastUpdateTimeForCustemCalculation :any  ',deviceLastRequestTimeFromDataBaseCustume)     
           //  requestBody.lastdevicerequesttime_DB =deviceCurrentStatus.rows[0].lastdevicerequesttime; 
           
           if (CommonMessage.IsValid(deviceLastRequestTimeFromDataBaseCustume)== false)
            {      
                  //    console.log('let lastUpdateT if')
                deviceLastRequestTimeFromDataBaseCustume = getUTCdate() 
            }
            let lastUpdateTimeForCustemCalculation :any = getUTCdate() ;
           //// console.log('let lastUpdateTimeForCustemCalculation :any = getUTCdate() ',lastUpdateTimeForCustemCalculation)    

                        let timeDifference: any = await calculateSecond(deviceLastRequestTimeFromDataBaseCustume, lastUpdateTimeForCustemCalculation); 
           
            let DEVICE_LAST_REQUEST_TIME_CUS_fromCon :any= ''
          //  console.log('check time differnce DEVICE_LAST_REQUEST_TIME_CUS rhkjhds',DEVICE_LAST_REQUEST_TIME_CUS_fromCon)
//console.log('check if conddtions timeDifference' ,timeDifference);
  if (timeDifference < DEVICE_LAST_REQUEST_TIME_CUS_fromCon){
 //console.log('check if conddtions timeDifference' ,timeDifference);
    return data;
  }
  
  //console.log('check if conddtions timeDifference @hfjshfshfdh' ,checkdeviceidExit.rows[0].lock_number, timeDifference);
           if (CommonMessage.IsValid(requestBody.valid)== false)
                {
                    data.valid =null
                } 
                else 
                {  
                    if(requestBody.valid=='0')
                    {
                        data.valid =false;
                    }else 
                    {
                        data.valid = true;
                    }
                }
                   //status: 1, online off line -- 1 == online 
                   // state: 'stopped' me_state_enum_id offline,moving,idle,stopped

                  // console.log('Check device status ',requestBody.status)
                   if (CommonMessage.IsValid(requestBody.status)== false)
                   {
                       addMissingStatusPacketAudit('mqtt', requestBody, data);
                       data.status =null;
                       data.deveice_state_enum_id = '23';// online (heartbeat packet received)
                   } 
                   else 
                   {  
                    if (requestBody.status == '1')
                    {
                        data.deveice_state_enum_id  = '23';// online
                    }
                    else if  (requestBody.status == '0') 
                    {
                        data.deveice_state_enum_id  = '24';// offline
                    }
                }                                                                                     

                data.statusEnumId  ='1' ;// add condtions

              
              
                if (CommonMessage.IsValid(requestBody.disabled)== false)
                { 
                    data.disabled = null
                }
                else { 
                    data.disabled  =requestBody.disabled;
                 }


          if (CommonMessage.IsValid(requestBody.statesince)== false)
              { 
                  data.statesince = null
              }
              else { 
              data.statesince_date =requestBody.statesince;              
              data.statesince =requestBody.statesince;
              }
            if (CommonMessage.IsValid(requestBody.servertime)== false)
              { 
                  data.servertime = null
              }
              else 
              { 
              data.servertime = requestBody.servertime;
              }

              if (CommonMessage.IsValid(requestBody.deviceTime)== false)
              { 
                  data.devicetime =null
              }
              else
            { 
              data.devicetime = requestBody.deviceTime;
            }

            //console.log('requestBody.moving',requestBody)
            if (CommonMessage.IsValid(requestBody.moving)== false)
              { 
                  data.moving =null
              }
              else
            { 
              data.moving = requestBody.moving;
            }
             

              if (CommonMessage.IsValid(requestBody.fixTime)== false)
              { 
                  data.fixtime = null
              }
              else
              { 
              data.fixtime = requestBody.fixTime;  
              }


             
//if(requestBody.apiCallingFrom =='Device')
                
                let checkDeviceState :any ;
                if (CommonMessage.IsValid(requestBody.state)== false)
                { 
                    data.statesEnumId = '0'
                }
                else 
                { 
                    checkDeviceState = await InwardServices.checkDeviceStateExitService(requestBody.state);                                                            
                    data.statesEnumId = checkDeviceState.rows[0].id ;                                                             
                }
     

                if (CommonMessage.IsValid(requestBody.attributes.SOC)== false)
                { 
                    data.battery = '0';
                }
                else 
                {  
                    data.battery = requestBody.attributes.SOC
                }

           data.lastupdate = requestBody.lastupdate ;
         

          
        //  data.motion  =requestBody.motion ;

        //   //error from paramter
       //  data.distanceInMeters =requestBody.odometer ; 
         
       //  data.pebv =requestBody.power;     
       data.motion  =requestBody.attributes.motion ;

       //   //error from paramter
        data.distanceInMeters =requestBody.attributes.odometer ; 
        
        data.pebv =data.battery;
        data.ebv =requestBody.attributes.power;
           data.lat =requestBody.latitude;
          data.long =requestBody.longitude;
          data.sp =requestBody.speed;
          data.powerOnOffStatusEnumId ='97'; // default power off 
        
        //   console.log('requestBody.attributes.out1 ',requestBody.attributes.out1 )
        //   console.log('requestBody.attributes ',requestBody.attributes )
       // console.log('check requestBody.attributes.out1 2514',requestBody.attributes)
        //console.log('check requestBody.attributes.out1 2514',requestBody.attributes.out1)
          if(requestBody.attributes.out1 == '0') 
          {
          //  console.log('check requestBody.attributes.out1 2517',requestBody.attributes.out1)
            //console.log('requestBody.attributes.out1 if ')
            data.powerOnOffStatusEnumId ='97'; // power off 
          }
          else if(requestBody.attributes.out1 == '1')
          {           
            //console.log('check requestBody.attributes.out1 2523',requestBody.attributes.out1)
           //// console.log('requestBody.attributes.out1 else ') 
            data.powerOnOffStatusEnumId ='96';// power on 
          }
          
     

         // console.log('check data from mqtt ',data)
         await  adminController.udimAPiCallForThirdParty(data,res) 

          
          return data;//  data  ;    

        }


        

        async function ThingsupAPIMQTTCalling(deveieData :any) {
              
            let data:any =JSON.stringify({
                    "id": deveieData.command_id, //"76", // it is ID of the command that need to get executed on device
                    "deviceid": deveieData.thirdPartydeviceid, // ID of the device. You are getting it in the getDevices API.
                    "queuing": deveieData.isqueuing, // Set always to true
                    "timeout": deveieData.timeout  // It will be a timeout to receive a response from the device. It will be in milliseconds. You can set  any value as per your requirement.
                   
            });
                         
            return new Promise((resolve, reject) => {
    
                axios.post(config.THINGS_URL+'api/button/command/execute',data, {
                    headers: {
                        'x-api-key': config.THINGS_UP_API_KEY,
                        'Content-Type': 'application/json'
                    },
                   
                }  
                ).then(function(result) {                                   
                    resolve(result);            
                 } ).catch((error) => {                             
                    logger.error(error);
                    resolve(error.response);
                  
                });
            });
    
    
            }
 
    async function ValidationCheckForLockNumber(requestBody :any, res :Response)
    {
       // console.log('check validation reuslt2827',CommonMessage.IsValid(requestBody.lockNumber))
        let apiDeveiceResponseData :any ;
        let msg :any ='';
        if (CommonMessage.IsValid(requestBody.lockNumber) ==false)
        {
            apiDeveiceResponseData =
            {
               massage :apiMessage.lockNumberset,
               result :'LockNumberNotSet'
            }
        //   if(requestBody.apiCallFun ==  'PowerOnOffByThirdParty')
        //   {
             RequestResponse.success(res, apiMessage.lockNumberset, status.success, apiDeveiceResponseData);
         // }  
       //  console.log('check validation reuslt2840')                                                          
          return apiDeveiceResponseData ; 
        }
       // console.log('check validation reuslt2827',CommonMessage.IsValid(requestBody.autoActionType))
        if (CommonMessage.IsValid(requestBody.autoActionType ) ==false)
        {
            apiDeveiceResponseData =
            {
               massage :apiMessage.autoActionType,
               result :'autoActionTypeNotSet'
            }
        //   if(requestBody.apiCallFun ==  'PowerOnOffByThirdParty')
        //   {
             RequestResponse.success(res, apiMessage.autoActionType, status.success, apiDeveiceResponseData);
         // }    
        // console.log('check validation reuslt2853')                                                        
          return apiDeveiceResponseData ; 
 
        }
       // console.log('check validation 2860')
        apiDeveiceResponseData =
        {
           massage :'success',
           result :'200'
        }     
        
       // console.log('check validation reuslt2863')
        return apiDeveiceResponseData ;
    }

   async function apiCallingRemainingTimevalidtions(requestBody :any, res :Response)
    {        
       let apiCallingRemainingTime:any = '11';
        let apiDeveiceResponseData :any;
        let msg :any ='';

        
        let deviceInternalCallingTimeResult :any  = await InwardServices.deviceInternalCallingTime();
        if (deviceInternalCallingTimeResult.rowCount == 0) 
        {    
            apiDeveiceResponseData =
           {
            apiCalledTime  : apiCallingRemainingTime,
             
             IntervalTime : 0 ,
             lastdevicerequesttime : null ,
              massage :apiMessage.deviceIsNotExist,
              result :'internalCallingTimeNotSet'
           }
          if(requestBody.apiCallFun ==  'PowerOnOffByThirdParty'  )
          {
            RequestResponse.success(res, apiMessage.internalCallingTimeNotSet, status.success, apiDeveiceResponseData);
        }                                                            
         return apiDeveiceResponseData ;                                   
        }

        requestBody.apiCallingTime =deviceInternalCallingTimeResult.rows[0]?.enum_key; 

        
        
        if(CommonMessage.IsValid(requestBody.lastdevicerequesttime_DB)== false)
        {
            
            apiDeveiceResponseData =
            {
               massage :'Success',
               apiCalledTime  : apiCallingRemainingTime ,
               IntervalTime : requestBody.apiCallingTime ,
               lastdevicerequesttime : requestBody.lastdevicerequesttime_DB ,
               result :'200'
            }
            return apiDeveiceResponseData ;
        
        }
        
        
        let timeDifference: any = await calculateSecond(requestBody.lastdevicerequesttime_DB, requestBody.lastUpdateTime);


        let remainingTime:any =  timeDifference ;

        if( timeDifference < requestBody.apiCallingTime)
        {
                          
         apiDeveiceResponseData =
         {
        
          IntervalTime : requestBody.apiCallingTime ,
          lastdevicerequesttime : requestBody.lastdevicerequesttime_DB ,
           massage :apiMessage.intervalTime,
           result :'waitForInterval' ,
           apiCalledTime  : remainingTime
         }
         

            //  if(requestBody.apiCallFun ==  'PowerOnOffByThirdParty')
            //  { 
                  RequestResponse.validationError(res,apiMessage.intervalTime +' '+ remainingTime +' ' + 'seconds.', status.success,apiDeveiceResponseData);
            // }
             return apiDeveiceResponseData ;

             
        }   
            else 
            {
                
            
                apiDeveiceResponseData =
                {
                   massage :'Success',
                   apiCalledTime  : apiCallingRemainingTime ,
                   IntervalTime : requestBody.apiCallingTime ,
                   lastdevicerequesttime : requestBody.lastdevicerequesttime_DB ,
                   result :'200'
                }
                return apiDeveiceResponseData ;
            }   
   
    }
  
    async  function powerOnForThirdParty (req: Request, res: Response) 
    {
        
        let requestBody = req.body; 
        let validationResult =await ValidationCheckForLockNumber(requestBody, res)
        
        if (validationResult.result != '200') 
        {
          //  console.log('check result apicall 2963')  
            return ;
        }              
        requestBody.powerOnOffStatusEnumId = '96' ;        
        requestBody.powerInstructionEnumId =powerInstruction.powerOn,//change deviceLock to 
        requestBody.instructionName =powerInstructionName[1] ;// 
        requestBody.statusEnumId = '1';//masterMessage;
        requestBody.createdByLoginUserId = requestBody.userId ; 
        if( CommonMessage.IsValid( requestBody.device_lock_unlock_communication_enum_id)==false)
        {          
          requestBody.apiCallFun =  'PowerOnOffByThirdParty';
          requestBody.device_lock_unlock_communication_enum_id = '93';// online 
        }
        if( CommonMessage.IsValid( requestBody.actionRemarks)==false)
        {      
           requestBody.actionRemarks = 'power on for third party test'; 

        }   
        requestBody.remarks =JSON.stringify(requestBody);
        requestBody.actionRemarks = 'deveice power on by third party request';  
        //console.log('check result apicall 2983')   
        return  await  powerOnOffByThirdParty(requestBody,res)   
        
                        
    }



    async  function powerOffForThirdParty (req: Request, res: Response) 
    {
       // console.log('check requestBody erj')
        let requestBody = req.body;   
       // console.log('check requestBody',requestBody)
        let validationResult = await ValidationCheckForLockNumber(requestBody, res)
       // console.log('ValidationCheckForLockNumber ',validationResult.result)
        if (validationResult.result != '200') 
        {
            return ;
        }     

        requestBody.powerOnOffStatusEnumId = '97' ;        
        requestBody.powerInstructionEnumId =powerInstruction.powerOff,//change deviceLock to 
        requestBody.instructionName =powerInstructionName[2] ;// 
        requestBody.statusEnumId = '1';//masterMessage; 
        requestBody.createdByLoginUserId = requestBody.userId ;
        if( CommonMessage.IsValid( requestBody.device_lock_unlock_communication_enum_id)==false)
        {          
          requestBody.apiCallFun =  'PowerOnOffByThirdParty';
          requestBody.device_lock_unlock_communication_enum_id = '93';// online 
        }
        if( CommonMessage.IsValid( requestBody.actionRemarks)==false)
        {      
           requestBody.actionRemarks = 'power off for third party'; 
           requestBody.remarks = requestBody.actionRemarks ;          

        }    
        requestBody.remarks =JSON.stringify(requestBody);
        requestBody.actionRemarks = 'deveice power off by third party request';  


        return  await  powerOnOffByThirdParty(requestBody,res)       
       
                         
    }
        

    async  function powerOnOffByThirdParty (req: any, res: Response) {
        let apiDeveiceResponseData :any ;
     //   console.log('check apt start powerOnOffByThirdParty')
        try {
            /* 	#swagger.tags = ['Admin-Inward']
                  #swagger.description = 'Only user can add type all Parameter are mandatory in swagger for testing purpose'
    
            /*	#swagger.parameters['obj'] = {
                        in: 'body',
                        description: 'status updated.',
                        required: true,
                        schema: { $ref: "#/definitions/getLockDetailsFromDeviceController" }
                } */
    
            /* #swagger.security = [{
                        "apiKeyAuth": []
                }] */

                       // console.log('check values for req', req )
            let requestBody = req;
            let apiCallingRemainingTime : any ='0';
            
            requestBody.deviceId =requestBody.lockNumber ;
           
            let apiDeveiceResponseData :any ;
            let msg :any ='';   
            requestBody.apiCallingTime ='10';
            let deviceInternalCallingTimeResult :any  = await InwardServices.deviceInternalCallingTime();
            if(deviceInternalCallingTimeResult.rows.count > 0)
            {
                requestBody.apiCallingTime =deviceInternalCallingTimeResult.rows[0]?.enum_key; 
            }
            let deviceCurrentStatus :any  = await InwardServices.getRegistrationStatusOfLock(requestBody.lockNumber);

          //  console.log('check apt start deviceCurrentStatus')

        if (deviceCurrentStatus.rowCount == 0) 
        {    
            apiDeveiceResponseData =
            {
                apiCalledTime  : apiCallingRemainingTime,
                IntervalTime : requestBody.apiCallingTime ,
                lastdevicerequesttime : null ,
              massage :apiMessage.deviceIsNotExist,
              result :'deviceIsNotExist'
           }
         if(requestBody.apiCallFun ==  'PowerOnOffByThirdParty')
         {
            RequestResponse.success(res, apiMessage.deviceIsNotExist, status.success, apiDeveiceResponseData);
         }                                                                                                   
         return apiDeveiceResponseData ;                                   
        }                                                                                                   
        
           requestBody.lockId =deviceCurrentStatus.rows[0]?.id; 
           requestBody.thirdPartydeviceid =deviceCurrentStatus.rows[0].device_id; 
           requestBody.lastdevicerequesttime_DB =deviceCurrentStatus.rows[0].lastdevicerequesttime ; 
           requestBody.lastUpdateTime = getUTCdate()

           let timeDifference: any = await calculateSecond(requestBody.lastdevicerequesttime_DB, requestBody.lastUpdateTime);
           apiCallingRemainingTime =  timeDifference ;

           let apicallingResult :any =await apiCallingRemainingTimevalidtions(requestBody,res)        
    
           if(apicallingResult.result !='200')
           {
            apiDeveiceResponseData =
                    {
                        apiCalledTime  : apiCallingRemainingTime,
                        IntervalTime : requestBody.apiCallingTime ,
                        lastdevicerequesttime : null ,
                      massage :apiMessage.intervalTime,
                      result :'waitForInterval'
                   }
                // RequestResponse.success(res, apiMessage.internalCallingTimeNotSet, status.success, apiDeveiceResponseData);                                                                                                     
                 return apiDeveiceResponseData ;                                           
           }           

            let rideingIdResult: any = await adminLogDeviceInformationServices.getRideingIdByLockNumberService(requestBody);                                    
            requestBody.rideBookingId =null;
            requestBody.createdByUserTypeEnumId =null;
            if(rideingIdResult.rowCount > 0)// for device unlock lock instruction ride booking id
            {
                requestBody.rideBookingId = rideingIdResult.rows[0].id;   
            }
         //  console.log('start deviceCurrentStatus.rows[0]?.id 1865',deviceCurrentStatus.rows[0]?.id)
            

            requestBody.beepInstructionEnumIdLog =null ;
            requestBody.beepStatusEnumId =null ;
            requestBody.latitude =null ;
            requestBody.longitude ==null ;
            requestBody.mapCityId =null ;
            requestBody.areaId  =null ;
            requestBody.createdByLoginUserId  =requestBody.userId ;
            
         //   console.log('check apt start abbc')
            await AddLog.addInstructionPowerOnOffLog(requestBody);
            await adminLogDeviceInformationServices.addDeviceLightInformationslog(requestBody);
            
            
            //third part api
            let dbLockUnlockCommondid :any ='0';
            let SetLockUnlockResult :any ;
            // this code not for device lock / unlock by ble 
        if(requestBody.device_lock_unlock_communication_enum_id == '93') 
        {                
           
           if(requestBody.powerInstructionEnumId ==powerInstruction.powerOn)// for device lock commond
            {
                
                dbLockUnlockCommondid = '3';// get power On  commonds change krna h 
            }else if(requestBody.powerInstructionEnumId ==powerInstruction.powerOff) // for device unlock complited
            {
                
                dbLockUnlockCommondid = '4';// get power Off  commonds change krna h
            }
            
                
            let getLockUnLockCommodsResult :any =  await adminLogDeviceInformationServices.getLockUnLockCommodsService(dbLockUnlockCommondid);
                          
                if(getLockUnLockCommodsResult.rowCount == 0)// 
                {
                    
                apiDeveiceResponseData =
                {
                    apiCalledTime  : apiCallingRemainingTime,
                    IntervalTime : requestBody.apiCallingTime ,
                    lastdevicerequesttime : requestBody.lastdevicerequesttime_DB ,
                  massage :apiMessage.commondDataNotAvailble,
                  result :'commondDataNotAvailable'
                }
    
                    if(requestBody.apiCallFun ==  'PowerOnOffByThirdParty')
                    { 
                         RequestResponse.validationError(res,apiMessage.commondDataNotAvailble, status.success,apiDeveiceResponseData);
                    }
                    return apiDeveiceResponseData ;
                }
                                      
                requestBody.command_id   = getLockUnLockCommodsResult.rows[0].commandid,
                requestBody.isqueuing    = getLockUnLockCommodsResult.rows[0].isqueuing ,
                requestBody.timeout      = getLockUnLockCommodsResult.rows[0].timeout ; 
                
                if(requestBody.autoActionType==false)
                {
                    SetLockUnlockResult = await ThingsupAPISetLockUnlockApiCalling(requestBody,res) 
                    requestBody.remarks =await thirdPartyApiExcuteCommondJson(requestBody)
                }
               else if(requestBody.autoActionType==true)
                { 
                    SetLockUnlockResult= {
                    status: 200,
                    statusText: 'Success', 
                    data: { status: 'Success' }
                  }
                  requestBody.remarks ='this operation perform by auto powerOn/powerOff';  
                }
                
        } 
                          
            // this code not for device lock / unlock by ble                                                       
            if(requestBody.device_lock_unlock_communication_enum_id == '94') // for Ble
            {
                SetLockUnlockResult= {
                    status: 200,
                    statusText: 'Success', 
                  data: { status: 'Success' }
                  }
                  requestBody.remarks ='this operation perform by auto powerOn/powerOff';  
            }                          
            if (CommonMessage.IsValid(SetLockUnlockResult) && CommonMessage.IsValid(SetLockUnlockResult.data))
            {
                if(SetLockUnlockResult.data.status=='Success'){                                                       
                    // for success                  
                    if(requestBody.powerInstructionEnumId ==powerInstruction.powerOn)// for device lock complited
                    {
                        requestBody.powerStatusEnumId =96 ;
                        requestBody.powerInstructionEnumId = powerInstruction.requestComplitedPowerOn,//change deviceLock to completedLockRequest
                        requestBody.powerInstructionName =powerInstructionName[5] ;//
                        msg = apiMessage.powerOnRequest;
                    }
                    else if(requestBody.powerInstructionEnumId == powerInstruction.powerOff) // for device unlock complited
                    {
                        requestBody.powerStatusEnumId = 96;
                        requestBody.powerInstructionEnumId = powerInstruction.requestComplitedPowerOff,//change deviceLock to completedLockRequest
                        requestBody.powerInstructionName =powerInstructionName[4] ;//
                        msg = apiMessage.powerOffRequest;
                    }

                    requestBody.actionRemarks = SetLockUnlockResult.data; 

                       AddLog.addInstructionPowerOnOffLog(requestBody);
                       adminLogDeviceInformationServices.addDeviceLightInformationslog(requestBody);
                       // function call for device lock unlock
                       adminDashboardServices.powerOnOffForThirdPartyApi(requestBody,req);

                       apiDeveiceResponseData =
                       {
                        apiCalledTime  : apiCallingRemainingTime,
                        IntervalTime : requestBody.apiCallingTime ,
                        lastdevicerequesttime : requestBody.lastdevicerequesttime_DB ,
                         massage :msg,
                         result :'SUCCESS'
                      }
                    if(requestBody.apiCallFun ==  'PowerOnOffByThirdParty')
                    {
                         RequestResponse.success(res, msg, status.success,apiDeveiceResponseData);
                        
                    }                                                            
                    return apiDeveiceResponseData ;
                }else{
                    // for error
                    
                    if(requestBody.powerInstructionEnumId ==powerInstruction.powerOn)// for device lock error
                    {
                        requestBody.powerStatusEnumId =96 ;
                        requestBody.powerInstructionEnumId = powerInstruction.errorPowerOn,//change deviceLock to completedLockRequest
                        requestBody.powerInstructionName =powerInstructionName[3] ;//
                        
                    }
                    else if(requestBody.powerInstructionEnumId ==powerInstruction.powerOff) // for device unlock error
                    {
                        requestBody.powerStatusEnumId =97 ;
                        requestBody.powerInstructionEnumId = powerInstruction.errorPowerOff,//change deviceLock to completedLockRequest
                        requestBody.powerInstructionName =powerInstructionName[4] ;//
                        msg = apiMessage.powerOnRequest;
                    }
             requestBody.actionRemarks = SetLockUnlockResult.data; 
                    await AddLog.addInstructionPowerOnOffLog(requestBody);
                    adminLogDeviceInformationServices.addDeviceLightInformationslog(requestBody);

                    if(SetLockUnlockResult.data.status=='Device Not Online')
                    {
                      //device lock/unlock by Bluetooth / BLE
                     
                     apiDeveiceResponseData =
                     {
                        apiCalledTime  : apiCallingRemainingTime,
                        IntervalTime : requestBody.apiCallingTime ,
                        lastdevicerequesttime : requestBody.lastdevicerequesttime_DB ,
                       massage : apiMessage.powerOnOffBybluetoot,
                       result :'PowerOnOffBybluetooth'
                    }
                     if(requestBody.apiCallFun ==  'PowerOnOffByThirdParty')
                     {
                      RequestResponse.validationError(res, apiMessage.lockunlockBybluetoot, status.success,apiDeveiceResponseData);
                     }
                      return apiDeveiceResponseData ;
                    }                
                    else if(SetLockUnlockResult.data.status=='No Device Found')
                    {
                  //console.log('* 2 device is not available ');
                  apiDeveiceResponseData =
                  {
                    apiCalledTime  : apiCallingRemainingTime,
                    IntervalTime : requestBody.apiCallingTime ,
                    lastdevicerequesttime : requestBody.lastdevicerequesttime_DB ,
                    massage :apiMessage.noDeveiceAvailable,
                    result :'NoDeviceFound'
                 }
                  if(requestBody.apiCallFun ==  'PowerOnOffByThirdParty')
                    {
                      RequestResponse.validationError(res, apiMessage.noDeveiceAvailable, status.success,apiDeveiceResponseData);
                    }
                      return apiDeveiceResponseData ;
                    }
                    else if(SetLockUnlockResult.data.status=='Invalid Data')
                    {
                   //console.log('* 3 Some data/parameters are missing ');
                   apiDeveiceResponseData =
                   {
                    apiCalledTime  : apiCallingRemainingTime,
                    IntervalTime : requestBody.apiCallingTime ,
                    lastdevicerequesttime : requestBody.lastdevicerequesttime_DB ,
                     massage :apiMessage.InvalidData,
                     result :'InvalidData'
                  }
                   if(requestBody.apiCallFun ==  'PowerOnOffByThirdParty')
                    {
                      RequestResponse.validationError(res,apiMessage.InvalidData, status.success,apiDeveiceResponseData);
                    }
                      return apiDeveiceResponseData ;
                    }
                    else if(SetLockUnlockResult.data.status=='Command not found')
                    {
                      //console.log('* 4 power on/off command is not found/match ');
                      
                      apiDeveiceResponseData =
                      {
                        apiCalledTime  : apiCallingRemainingTime,
                        IntervalTime : requestBody.apiCallingTime ,
                        lastdevicerequesttime : requestBody.lastdevicerequesttime_DB ,
                        massage :apiMessage.LUCommandNotFound,
                        result :'PowerOnOffCommondNotFound'
                     }
                    
                     if(requestBody.apiCallFun =='PowerOnOffByThirdParty')
                     {                        
                         RequestResponse.validationError(res,apiMessage.LUCommandNotFound, status.success,apiDeveiceResponseData);
                     }
                     return apiDeveiceResponseData ;
                    }
                    else if(SetLockUnlockResult.data.status=='Invalid timeout')
                    {
                     
                     apiDeveiceResponseData =
                     {
                        apiCalledTime  : apiCallingRemainingTime,
                        IntervalTime : requestBody.apiCallingTime ,
                        lastdevicerequesttime : requestBody.lastdevicerequesttime_DB ,
                       massage :apiMessage.timeNotCorrect,
                       result :'TimeoutValueIsNotCorrect'
                    }
                     if(requestBody.apiCallFun ==  'PowerOnOffByThirdParty')
                    {
                      RequestResponse.validationError(res,apiMessage.timeNotCorrect, status.success,apiDeveiceResponseData);
                    }
                      return apiDeveiceResponseData ;
                    }
                    else if(SetLockUnlockResult.data.status=='Command Execution Failed')
                    {

                    //Please try again                    
                     apiDeveiceResponseData =
                     {
                        apiCalledTime  : apiCallingRemainingTime,
                        IntervalTime : requestBody.apiCallingTime ,
                        lastdevicerequesttime : requestBody.lastdevicerequesttime_DB ,
                       massage :apiMessage.CommandExecutionFailed,
                       result :'CommandExecutionFailed'
                    }
                     if(requestBody.apiCallFun ==  'PowerOnOffByThirdParty')
                    {
                      RequestResponse.validationError(res,apiMessage.CommandExecutionFailed, status.success,apiDeveiceResponseData);
                    }
                      return apiDeveiceResponseData ;
                    }
                    else if(SetLockUnlockResult.data.status=='Unauthorized')
                    {
                      
                      apiDeveiceResponseData =
                      {
                        apiCalledTime  : apiCallingRemainingTime,
                        IntervalTime : requestBody.apiCallingTime ,
                        lastdevicerequesttime : requestBody.lastdevicerequesttime_DB ,
                        massage :apiMessage.Unauthorized,
                        result :'Unauthorized'
                     }
                     
                      if(requestBody.apiCallFun ==  'PowerOnOffByThirdParty')
                      { RequestResponse.validationError(res,apiMessage.Unauthorized, status.success,apiDeveiceResponseData);}
                      return apiDeveiceResponseData ;
                    }
                    else if(SetLockUnlockResult.data.status=='Missing Authorization Header')
                    {
                      
                      apiDeveiceResponseData =
                      {
                        apiCalledTime  : apiCallingRemainingTime,
                        IntervalTime : requestBody.apiCallingTime ,
                        lastdevicerequesttime : requestBody.lastdevicerequesttime_DB ,
                        massage :apiMessage.Unauthorized,
                        result :'Unauthorized'
                     }
                      if(requestBody.apiCallFun ==  'PowerOnOffByThirdParty')
                      {  RequestResponse.validationError(res,apiMessage.Unauthorized, status.success,apiDeveiceResponseData);}
                      return apiDeveiceResponseData ;
                    }
               }          
                
             }
            else{
                     // for error
                     requestBody.actionRemarks =  'error in power on off.' ;// SetLockUnlockResult.data; 
                     if(requestBody.powerInstructionEnumId ==powerInstruction.powerOn)// for device lock error
                     {
                         requestBody.powerStatusEnumId =96 ;
                         requestBody.powerInstructionEnumId = powerInstruction.errorPowerOn,//change deviceLock to completedLockRequest
                         requestBody.powerInstructionName =powerInstructionName[3] ;//
                         requestBody.actionRemarks =  'error in power on.' ;
                         msg = apiMessage.powerOffRequest;
                     }
                     else if(requestBody.powerInstructionEnumId ==powerInstruction.powerOff) // for device unlock error
                     {
                         requestBody.powerStatusEnumId =97 ;
                         requestBody.powerInstructionEnumId = powerInstruction.errorPowerOff,//change deviceLock to completedLockRequest
                         requestBody.powerInstructionName =powerInstructionName[4] ;//
                         msg = apiMessage.powerOnRequest;
                         requestBody.actionRemarks =  'error in power off.' ;
                     }
                    
                     await AddLog.addInstructionPowerOnOffLog(requestBody);
                     adminLogDeviceInformationServices.addDeviceLightInformationslog(requestBody);
                     apiDeveiceResponseData =
                     {
                        apiCalledTime  : apiCallingRemainingTime,
                        IntervalTime : requestBody.apiCallingTime ,
                        lastdevicerequesttime : requestBody.lastdevicerequesttime_DB ,
                       massage :apiMessage.ErrorInThirdpartyPowerONOffAPI,
                       result :'ErrorInThirdpartyPowerONOffAPI'
                    }
                    if(requestBody.apiCallFun == 'PowerOnOffByThirdParty')
                    {
                   RequestResponse.validationError(res,apiMessage.ErrorInThirdpartyLockUnlockAPI, status.success,apiDeveiceResponseData);
                    }
                   return apiDeveiceResponseData ;
                }

      
        } catch (error: any) {
            
            AddExceptionIntoDB(req,error);
             exceptionHandler(res, 1, error.message);
             apiDeveiceResponseData =
             {
               massage :error.message,
               result :'500'
            }
             return  //apiDeveiceResponseData;
        }
    };
  



    async  function clearInstructionForLockUnlock (req: Request, res: Response) 
    {
        let requestBody = req.body;                  
       
        if(CommonMessage.IsValid(requestBody.lockId)== false)
        {
            return RequestResponse.validationError(res, apiMessage.lockIdset, status.error,[]);
        }
        requestBody.instructionId = '4';// no istructions
       let  deviceLockAndUnlockResult :any=  await  adminDashboardServices.clearInstructionForLockUnlock(requestBody,res)  ;  

       if(deviceLockAndUnlockResult)
                    {
                       return RequestResponse.success(res, apiMessage.success, status.success,[]);                        
                    }  else
                    {
                        return RequestResponse.validationError(res, apiMessage.somethingWentWrong, status.error,[]);
                    }

       
                  
    }
   
    async  function clearInstructionForLightOnOff(req: Request, res: Response) 
    {
        let requestBody = req.body;                  
       
        if(CommonMessage.IsValid(requestBody.lockId)== false)
        {
            return RequestResponse.validationError(res, apiMessage.lockIdset, status.error,[]);
        }
        requestBody.deviceLightInstructionEnumId = '45';// no istructions
       let  deviceLockAndUnlockResult :any=  await  adminDashboardServices.clearInstructionForLightOnOffDevice(requestBody,res)  ;  

       if(deviceLockAndUnlockResult)
                    {
                       return RequestResponse.success(res, apiMessage.success, status.success,[]);                        
                    }  else
                    {
                        return RequestResponse.validationError(res, apiMessage.somethingWentWrong, status.error,[]);
                    }                         
    }
 
 


export default {
    addUpdateBikeInwardController,
    getBikeInwardDetailsController,
    addUpdateLockInwardController,
    getLockInwardDetailsController,
    getUidListByVehicleIdController,
    getLockListController,
    activeInactiveLockInwardController,
    activeInactiveBikeInwardController,
    getLockDetailsFromDeviceController,
    deleteLockInwardController ,
    getUidListWithBiekAndLockController,
    insertPostBodyData,
    insertGetBodyData,
    bikeProduceActiveDeactive ,
    deviceRegistrationByAdmin ,
    addDeviceDataFromTest,
    deviceLockForThirdParty,
    deviceUnlockForThirdParty,
    deviceUnlockByBle,
    deviceLockByBle ,
    updateLockDetailFromMQTT,
    powerOnForThirdParty ,
    powerOffForThirdParty ,
    apiCallingRemainingTimevalidtions ,
    clearInstructionForLockUnlock,
    clearInstructionForLightOnOff
};
