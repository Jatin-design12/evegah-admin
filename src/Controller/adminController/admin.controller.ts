import { NextFunction, Request, Response } from 'express';
const { parse } = require('querystring');
import { adminLogin, updateAdminPassword, ResetpasswordEMailGeneration, updateAdminPasswordByEmail, GetEnumDetail, logOutAdmin } from '../../services/adminServices/admin.services';
import status from '../../helper/status';
import DashboardServices from '../../services/adminServices/admin.dashboard.services';
import BikeProduceServices from '../../services/adminServices/admin.produceBike.services';
import AllotmentServices from '../../services/adminServices/admin.allotment.services';
import AddLog from '../../services/adminServices/admin.logDeviceInformation.services';
import { check, exceptionHandler,AddExceptionIntoDB  } from '../../helper/responseHandler';
import RequestResponse from '../../helper/responseClass';
import { apiMessage } from '../../helper/api-message';
import { adminMessage } from '../../constant/admin-constant';
import logger from '../../Config/logging';
import { instruction, instructionName, disconectTime } from '../../constant/device-instruction';
import InwardServices from '../../services/inwardServices/inward.services';
import { decrypt, verifyToken } from '../../helper/common-function';
import { masterMessage } from '../../constant/master-constant';
import { zoneValidation } from '../../helper/admin.validation';
import adminDashboardServices from '../../services/adminServices/admin.dashboard.services';
import { getUTCdate } from '../../helper/datetime';
import CommonMessage from '../../helper/common.validation';
import RideBooking from '../../services/rideBookingServices/ride.booking.services';
import Dateformats from '../../helper/utcdate';
let nodeSchedule = require('node-cron');
import AreaMasters from '../../services/adminServices/admin.area.services';
import adminLogDeviceInformationServices from '../../services/adminServices/admin.logDeviceInformation.services';
import areaController from './area.Controller';
import { getTokenDetail } from '../../helper/common-function';
import { kClientName } from '../../constant/kritin-client-name';
import { client } from '../../Config/db.connection';
import { Message } from '@aws-sdk/client-ses';
import geofence from '../../helper/geofence';  
import { setBeepOnInstructionCommon,setBeepOffInstructionCommon ,checkGeoInOout,insertApiRequest, insertApiResponceData } from '../../helper/common-function';
import utcdate from '../../helper/utcdate';
import { stringify } from 'uuid';
import  geoFance  from '../../helper/geofence';
import config from '../../Config/config';

const ONLINE_DEVICE_STATE_ENUM_ID = 23;
const OFFLINE_DEVICE_STATE_ENUM_ID = 24;
const DEVICE_STATUS_RECENT_WINDOW_SECONDS = Number(process.env.DEVICE_STATUS_RECENT_WINDOW_SECONDS || 900);
const DASHBOARD_CARD_CACHE_WINDOW_MS = Number(process.env.DASHBOARD_CARD_CACHE_WINDOW_MS || 10000);
let dashboardCardCacheData: any = null;
let dashboardCardCacheAt = 0;

const buildDefaultDashboardCard = () => {
    return [
        {
            bookedBike: 0,
            availableBike: 0,
            underMaintenanceBike: 0,
            totalBike: 0,
            totalEarning: 0,
            battery0To30: 0,
            battery30To50: 0,
            batteryMore50: 0,
            bikeOutSideOfGeoFance: 0,
            unlockOrPowerOnCount: 0,
            availableUnlockOrPowerOnCount: 0,
            pendingWithdrawRequest: 0
        }
    ];
};

const resolveDeviceStatus = (deveiceStateEnumId: any, deviceLastRequestTime: any, dbDeviceStatus: any) => {
    const stateEnumId = Number(deveiceStateEnumId);

    if (stateEnumId === ONLINE_DEVICE_STATE_ENUM_ID) {
        return 'Online';
    }

    if (stateEnumId === OFFLINE_DEVICE_STATE_ENUM_ID) {
        if (CommonMessage.IsValid(deviceLastRequestTime) === true) {
            const nowTime = new Date().getTime();
            const lastRequestTime = new Date(deviceLastRequestTime).getTime();
            const timeDifferenceInSeconds = Math.floor((nowTime - lastRequestTime) / 1000);

            if (Number.isFinite(timeDifferenceInSeconds) && timeDifferenceInSeconds >= 0 && timeDifferenceInSeconds <= DEVICE_STATUS_RECENT_WINDOW_SECONDS) {
                return 'Online';
            }
        }

        return 'Offline';
    }

    if (CommonMessage.IsValid(dbDeviceStatus) === true) {
        return dbDeviceStatus;
    }

    return 'Offline';
};

const getDeviceStatusDebugController = async (req: Request, res: Response) => {
    try {
        const requestQuery: any = req.query;
        const searchRef: any = requestQuery.searchRef || requestQuery.ref || requestQuery.lockNumber || requestQuery.deviceId;

        if (CommonMessage.IsValid(searchRef) == false) {
            return RequestResponse.validationError(res, 'Please provide searchRef (lock number / device id / imei / bike name)', status.info, []);
        }

        const deviceQuery: any = {
            text: `select
                    tld.id as lock_id,
                    tld.lock_number,
                    tld.device_id,
                    tld.imei_number,
                    tld.deveice_state_enum_id,
                    (select tenum.enum_key from public.tbl_enum tenum where tenum.enum_id = tld.deveice_state_enum_id limit 1) as deveice_status,
                    tld.device_last_request_time,
                    tld.lastdevicerequesttime,
                    case when tld.device_last_request_time is null then null
                    else extract(epoch from ((now() at time zone 'utc') - tld.device_last_request_time))::bigint end as seconds_since_last_request,
                    tpb.id as bike_id,
                    tpb.bike_name
                from inventory.tbl_lock_detail tld
                left join inventory.tbl_product_bike tpb on tpb.lock_id = tld.id and tpb.status_enum_id = 1
                where upper(trim(coalesce(tld.lock_number, ''))) = upper(trim($1))
                or upper(trim(coalesce(tld.device_id, ''))) = upper(trim($1))
                or upper(trim(coalesce(tld.imei_number, ''))) = upper(trim($1))
                or upper(trim(coalesce(tpb.bike_name, ''))) = upper(trim($1))
                limit 1;`,
            values: [String(searchRef)]
        };

        const timeoutQuery: any = {
            text: `select coalesce(enum_key::integer, 0) as offline_timeout_minutes from public.tbl_enum where enum_id = 49 limit 1`,
            values: []
        };

        const [deviceResult, timeoutResult]: any = await Promise.all([client.query(deviceQuery), client.query(timeoutQuery)]);

        if (deviceResult.rowCount == 0) {
            return RequestResponse.success(res, 'Device reference not found', status.info, []);
        }

        const row: any = deviceResult.rows[0];
        const computedStatus: any = resolveDeviceStatus(row.deveice_state_enum_id, row.device_last_request_time, row.deveice_status);
        const secondsSinceLastRequest: any = CommonMessage.IsValid(row.seconds_since_last_request) ? Number(row.seconds_since_last_request) : null;
        const offlineTimeoutMinutesFromDb: any = timeoutResult.rowCount > 0 ? Number(timeoutResult.rows[0].offline_timeout_minutes) : 0;
        const offlineTimeoutSecondsFromDb: any = offlineTimeoutMinutesFromDb * 60;

        let reason: any = 'fallback_from_db_status';
        if (Number(row.deveice_state_enum_id) === ONLINE_DEVICE_STATE_ENUM_ID) {
            reason = 'state_enum_online';
        } else if (Number(row.deveice_state_enum_id) === OFFLINE_DEVICE_STATE_ENUM_ID) {
            reason = computedStatus === 'Online' ? 'recent_heartbeat_override' : 'state_enum_offline';
        }

        const responseData: any = {
            searchRef: String(searchRef),
            raw: {
                bikeId: row.bike_id,
                bikeName: row.bike_name,
                lockId: row.lock_id,
                lockNumber: row.lock_number,
                deviceId: row.device_id,
                imeiNumber: row.imei_number,
                deveiceStateEnumId: row.deveice_state_enum_id,
                deveiceStatusFromDb: row.deveice_status,
                deviceLastRequestTime: row.device_last_request_time,
                lastDeviceRequestTime: row.lastdevicerequesttime,
                secondsSinceLastRequest: secondsSinceLastRequest
            },
            computed: {
                status: computedStatus,
                reason: reason,
                recentWindowSeconds: DEVICE_STATUS_RECENT_WINDOW_SECONDS,
                offlineTimeoutMinutesFromDb: offlineTimeoutMinutesFromDb,
                offlineTimeoutSecondsFromDb: offlineTimeoutSecondsFromDb,
                exceedsDbOfflineTimeout: CommonMessage.IsValid(secondsSinceLastRequest) ? secondsSinceLastRequest > offlineTimeoutSecondsFromDb : null
            }
        };

        return RequestResponse.success(res, apiMessage.success, status.success, responseData);
    } catch (error: any) {
        AddExceptionIntoDB(req,error);
        return exceptionHandler(res, 1, error.message);
    }
};

const GetEnumDetailService = async (req: Request, res: Response) => {
    try {
        // #swagger.tags = ['Master-Get']
        // #swagger.description = 'Endpoint to get a specific user.'

        /*	#swagger.parameters[ {
                        "name": "Enum_type",
                        "in": "query",
                        "description": "Enum_type",
                        "required": true,
                        "type": "string"
                    }] 
    } */
        await GetEnumDetail(req, res);
        return Promise.resolve({
            message: 'success',
            user: 200
        });
    } catch (error) {
        return Promise.reject({
            message: 'error',
            user: error
        });
    }
};
const adminLoginService = async (req: Request, res: Response) => {
    try {
        /* 	#swagger.tags = ['Admin']
            #swagger.description = 'Endpoint to sign in a specific user' */

        /*	#swagger.parameters['obj'] = {
                in: 'body',
                description: 'User information.',
                required: true,
                schema: { $ref: "#/definitions/adminLoginService" }
        } */

        /* #swagger.security = [{
                "apiKeyAuth": []
        }] */

        await adminLogin(req, res);
        return Promise.resolve({
            message: 'success',
            user: 200
        });
    } catch (error) {
        return Promise.reject({
            message: 'error',
            user: error
        });
    }
};
const AdminUpdatePasswordService = async (req: Request, res: Response) => {
    try {
        /* 	#swagger.tags = ['Admin']
            #swagger.description = 'Endpoint to sign in a specific user' */

        /*	#swagger.parameters['obj'] = {
                in: 'body',
                description: 'User information.',
                required: true,
                schema: { $ref: "#/definitions/AdminUpdatePasswordService" }
        } */

        /* #swagger.security = [{
                "apiKeyAuth": []
        }] */
        await updateAdminPassword(req, res);
        return Promise.resolve({
            message: 'success',
            user: 200
        });
    } catch (error) {
        return Promise.reject({
            message: 'error',
            user: error
        });
    }
};
const updateAdminPasswordByEmailService = async (req: Request, res: Response) => {
    try {
        /* 	#swagger.tags = ['Admin']
            #swagger.description = 'Endpoint to sign in a specific user' */

        /*	#swagger.parameters['obj'] = {
                in: 'body',
                description: 'User information.',
                required: true,
                schema: { $ref: "#/definitions/updateAdminPasswordByEmailService" }
        } */

        /* #swagger.security = [{
                "apiKeyAuth": []
        }] */
        await updateAdminPasswordByEmail(req, res);
        return Promise.resolve({
            message: 'success',
            user: 200
        });
    } catch (error) {
        return Promise.reject({
            message: 'error',
            user: error
        });
    }
};
const ResetpasswordEMailGenerationService = async (req: Request, res: Response) => {
    try {
        /* 	#swagger.tags = ['Admin']
            #swagger.description = 'Endpoint to sign in a specific user' */

        /*	#swagger.parameters['obj'] = {
                in: 'body',
                description: 'User information.',
                required: true,
                schema: { $ref: "#/definitions/ResetpasswordEMailGenerationService" }
        } */

        /* #swagger.security = [{
                "apiKeyAuth": []
        }] */
        await ResetpasswordEMailGeneration(req, res);
        return Promise.resolve({
            message: 'success',
            user: 200
        });
    } catch (error) {
        return Promise.reject({
            message: 'error',
            user: error
        });
    }
};

const addUpdateZoneController = async (req: Request, res: Response) => {
    try {
        /* 	#swagger.tags = ['Admin-Dashboard']
              #swagger.description = 'Only user can add type all Parameter are mandatory in swagger for testing purpose' */

        /*	#swagger.parameters['obj'] = {
                    in: 'body',
                    description: 'add add update zone details.',
                    required: true,
                    schema: { $ref: "#/definitions/addUpdateZoneController" }
            } */

        /* #swagger.security = [{
                    "apiKeyAuth": []
            }] */
        let requestBody = req.body;

        // let validation = await zoneValidation(requestBody);
        // if (validation) {
        //     return RequestResponse.success(res, validation, status.error, []);
        // }//
        if(CommonMessage.IsValid(requestBody.areaId)==false)
        {
            return RequestResponse.success(res, 'Please enter valid area id', status.error, []);   
        }

        if(CommonMessage.IsValid(requestBody.name)==false)
        {
            return RequestResponse.success(res, 'Please enter valid zone name', status.error, []);   
        }

        if(CommonMessage.IsValid(requestBody.latitude)==false)
        {
            return RequestResponse.success(res, 'Please enter valid latitude', status.error, []);   
        }

        if(CommonMessage.IsValid(requestBody.longitude)==false)
        {
            return RequestResponse.success(res, 'Please enter valid longitude', status.error, []);   
        }
        

        if(CommonMessage.IsValid(requestBody.zoneAddress)==false)
        {
            return RequestResponse.success(res, 'Please enter valid zoneAddress', status.error, []);   
        }
        let result: any;
        result = await DashboardServices.addUpdateZoneDetails(requestBody, req);

        if (result.rows[0].fp_output_result === adminMessage.success && requestBody.zoneId === 0) {
            return RequestResponse.success(res, apiMessage.addZoneDetails, status.success, [{ zoneId: result.rows[0].fp_zone_id }]);
        } else if (result.rows[0].fp_output_result === adminMessage.success && requestBody.zoneId > 0) {
            return RequestResponse.success(res, apiMessage.updateZoneDetails, status.success, [{ zoneId: result.rows[0].fp_zone_id }]);
        } else if (result.rows[0].fp_output_result === adminMessage.checkDuplicateData) {
            return RequestResponse.success(res, apiMessage.zoneAlreadyExist, status.success, []);
        } else {
            return RequestResponse.success(res, apiMessage.recordNotFound, status.success, []);
        }
    } catch (error: any) {
        AddExceptionIntoDB(req,error);
        return exceptionHandler(res, 1, error.message);
    }
};
const getZoneController = async (req: Request, res: Response) => {
    try {
        // #swagger.tags = ['Admin-Dashboard']
        // #swagger.description = 'Pass id or 0  and status_enum_id = 0 to see all user '

        /*#swagger.parameters[ {
                        "name": "zoneId",
                        "in": "query",
                        "description": "",
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

        let requestQuery = req.query;
        let result: any = await DashboardServices.getZoneDetails(requestQuery,req);
        
        let zoneDetails = [];

        if (result.rowCount > 0) {
            for (let row of result.rows) {
                zoneDetails.push({
                    id: row.id,
                    name: row.name,
                    areaId: row.area_id,
                    areaName: row.area_name,
                    latitude: row.latitude,
                    longitude: row.longitude,
                    zoneSize: row.zone_size,
                    zoneCapacity: row.zone_capacity,
                    zoneAddress: row.zone_address,
                    stateId: row.state_id,
                    stateName: row.state_name,
                    cityId: row.city_id,
                    cityName: row.city_name,
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
                    areaTypeEnumId : row.area_type_enum_id,
                    areaTypeName : row.area_enum_type_name,
                });
            }


            return RequestResponse.success(res, apiMessage.success, status.success, zoneDetails);
        } else {
            return RequestResponse.success(res, apiMessage.recordNotFound, status.success, []);
        }
    } catch (error: any) {
        AddExceptionIntoDB(req,error);

        return exceptionHandler(res, 1, error.message);
    }
};

const addUpdateBikeProduceController = async (req: Request, res: Response) => {
    try {
        /* 	#swagger.tags = ['Admin-Bike-Produce']
              #swagger.description = 'Only user can add type all Parameter are mandatory in swagger for testing purpose' */

        /*	#swagger.parameters['obj'] = {
                    in: 'body',
                    description: 'add add update zone details.',
                    required: true,
                    schema: { $ref: "#/definitions/addUpdateBikeProduceController" }
            } */

        /* #swagger.security = [{
                    "apiKeyAuth": []
            }] */
        let requestBody = req.body;

        let result: any = '';
      

        

        // result = await BikeProduceServices.checkSameCombinationBikeNotProduce(requestBody);

        // if (result.rowCount > 0) {
        //     return RequestResponse.validationError(res, 'Same Combination Of uID And Lock Id Bike Is Already Exist.', status.error, []);
        // }

        
        // let lockNumberWithBikeNotProduce :any = await BikeProduceServices.checkSameCombinationLockNumberWithBikeNotProduce(requestBody);

        // if (lockNumberWithBikeNotProduce.rowCount > 0) {
        //     return RequestResponse.validationError(res, 'Same Combination Of Lock Id Is Already Exist with bike.', status.error, []);
        // }
        
        // let uIdWithBikeNotProduce :any = await BikeProduceServices.checkSameCombinationUIdWithBikeNotProduce(requestBody);

        // if (uIdWithBikeNotProduce.rowCount > 0) {
        //     return RequestResponse.validationError(res, 'Same Combination Of uId Is Already Exist with bike.', status.error, []);
        // }
      

        if (requestBody.bikeProduceId == 0)
        {
    
            if (CommonMessage.IsValid(requestBody.vehicleId) == false) {
                return RequestResponse.validationError(res, apiMessage.validVehicle, status.error, []);
            }
            if (CommonMessage.IsValid(requestBody.uId) == false) {
                return RequestResponse.validationError(res, apiMessage.validUid, status.error, []);
            }
            if (CommonMessage.IsValid(requestBody.lockId) == false) {
                return RequestResponse.validationError(res, apiMessage.validLockNumber, status.error, []);
            }
        let getLockNumber: any = await AreaMasters.getLockNumber(requestBody.lockId, req );
        requestBody.modelId = requestBody.vehicleId;
        let modelResult: any = await AreaMasters.getModelData(requestBody.modelId, req);
        
        if (modelResult.rowCount == 0) {
            RequestResponse.validationError(res, 'This Model Not Found.', status.error, []);
            return false;
        }

        let UidModelResult: any = await AreaMasters.getUidModelData(requestBody.uId, requestBody.modelId, req);
        
        if (UidModelResult.rowCount == 0) {
            RequestResponse.validationError(res, 'This uId Not Found.', status.error, []);
            return false;
        }
        
        if (getLockNumber.rowCount == 0) {
            RequestResponse.validationError(res, 'This Lock Number Not Found.', status.error, []);
            return false;
        }
               
        let modelNanme: any = modelResult.rows[0].model_name;
        let lockNumber: any = getLockNumber.rows[0].lock_number;

        if (CommonMessage.IsValid(requestBody.bikeName) == false) {
            requestBody.bikeName = modelNanme + '-' + lockNumber;
        }

        
        let checkNameBikeExitOrNot: any = await BikeProduceServices.checkNameBikeExitOrNot(requestBody);

        if (checkNameBikeExitOrNot.rowCount > 0) {
            return RequestResponse.validationError(res, 'This Bike Name is already Exit.', status.error, []);
        }
    }

    if (CommonMessage.IsValid(requestBody.qrNumber) == false) {
        return RequestResponse.validationError(res, apiMessage.qrNumber, status.error, []);
    }
    
    let getQrNumberExistData: any = await AreaMasters.getQrNumberExistDataService(requestBody.bikeProduceId,requestBody.qrNumber, req );                
    if (getQrNumberExistData.rowCount >0) {
        RequestResponse.validationError(res, 'This qr number already exists.', status.error, []);
        return false;
    }

        let bikeProduceId:any ;

        requestBody.geofence_inout_enum_id = 62;
        if (requestBody.bikeProduceId === 0) {

            requestBody.zoneId = 0;

            client
            .query('BEGIN')
            .then(async (res) => {
                result = await BikeProduceServices.insertBikeProduce(requestBody);
                 bikeProduceId = [{ bikeProduceId: result.rows[0].id }];
                return result;
            })  .then(async (res) => {
                result = await InwardServices.updateLockAllotmentStatus(requestBody);
                return result;
            })  
            .then(async (res) => {
                result = await InwardServices.updateBikeAllocatedToProduction(requestBody);                
                return result;
            })   
            .then(async (res) => {
                result = await BikeProduceServices.updateUIdStatusFromBikeProduce(requestBody);
                return result;
            })                
            .then((res) => {
                return client.query('commit');
            })
            .then((r) => {
                if (result) {
                    //let bikeInwardId = [{ bikeInwardId: result.rows[0].id }];
                    return RequestResponse.success(res, apiMessage.addBikeProduce, status.info, bikeProduceId);
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

        }
           else if (requestBody.bikeProduceId > 0) {            
            result = await BikeProduceServices.updateQRcodeForBikeProduce(requestBody);           
            if (result.rowCount > 0) {
                let bikeProduceId = [{ bikeProduceId: requestBody.bikeProduceId }];               
                return RequestResponse.success(res, apiMessage.updateBikeProduce, status.info, bikeProduceId);
            } else {
                return RequestResponse.success(res, apiMessage.somethingWentWrong, status.info, []);
            }
        } else {
            return RequestResponse.success(res, apiMessage.somethingWentWrong, status.info, []);
        }
    } catch (error: any) {
        AddExceptionIntoDB(req,error);
        return exceptionHandler(res, 1, error.message);
    }
};

const getBikeProduceDetailsController = async (req: Request, res: Response) => {
    try {
        // #swagger.tags = ['Admin-Bike-Produce']
        // #swagger.description = 'Pass bikeProduceId or 0  and status_enum_id = 0  '

        /*#swagger.parameters[ {
                        "name": "bikeProduceId",
                        "in": "query",
                        "description": "",
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

        let requestQuery = req.query;
        let result: any = await BikeProduceServices.getBikeProduceDetails(requestQuery);
        let bikeProduceDetails = [];
        for (let row of result.rows) {
            bikeProduceDetails.push({
                id: row.id,
                vehicleId: row.model_id,
                modelId: row.model_id ,
                modelName: row.model_name,
                uid: row.uid_id,
                vehicleModelUId: row.uid_number,
                lockId: row.lock_id,
                lockNumber: row.lock_number,
                lockIMEIId: '0',
                lockIMEINumber: row.lock_imei_number,
                latitude: row.latitude,
                longitude: row.longitude,
                altitude: row.altitude,
                deviceLockAndUnlockStatus: row.device_lock_and_unlock_status,
                qr: row.generated_qr,
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
                allotmentStatusId: row.allotment_status,
                allotmentStatusName: row.allotment_status_name,
                bikeBookedStatus: row.bike_booked_status,
                bikeBookedStatusName: row.bike_booked_status_name,
                deveice_state_enum_id: Number(row.deveice_state_enum_id),
                deveiceState: row.deveice_state,
                device_last_request_time: row.device_last_request_time,
                instruction_id: Number(row.instruction_id) ,
                zoneName : row.zone_name,
                areaId : row.area_id,
                areaName : row.area_name,
                mapCityId : row.map_city_id,
                mapCityName : row.map_city_name,
                mapStateId : row.map_state_id,
                mapStateName : row.map_state_name,
                qrNumber : row.qr_number

            });
        }

        if (result.rowCount > 0) {
            return RequestResponse.success(res, apiMessage.success, status.success, bikeProduceDetails);
        } else {
            return RequestResponse.success(res, apiMessage.recordNotFound, status.success, []);
        }
    } catch (error: any) {
        AddExceptionIntoDB(req,error);
        return exceptionHandler(res, 1, error.message);
    }
};

const addUpdateBikeAllotmentController = async (req: Request, res: Response) => {
    try {
        /* 	#swagger.tags = ['Admin-Allotment-Zone-Wise']
              #swagger.description = 'Only user can add type all Parameter are mandatory in swagger for testing purpose' */

        /*	#swagger.parameters['obj'] = {
                    in: 'body',
                    description: 'add add update zone details.',
                    required: true,
                    schema: { $ref: "#/definitions/addUpdateBikeAllotmentController" }
            } */

        /* #swagger.security = [{
                    "apiKeyAuth": []
            }] */
        let requestBody = req.body;

        let result: any = '';
        if (!requestBody.vehicleId) {
            return RequestResponse.validationError(res, apiMessage.validVehicle, status.error, []);
        }
        if (!requestBody.uId) {
            return RequestResponse.validationError(res, apiMessage.validUid, status.error, []);
        }
        if (!requestBody.zoneId) {
            return RequestResponse.validationError(res, apiMessage.validZone, status.error, []);
        }
        result = await AllotmentServices.checkSameCombinationBikeNotAlloted(requestBody, req);
        if (result.rowCount > 0) {
            return RequestResponse.validationError(res, 'Same Combination Of uID And Vehicle Id  Is Already Alloted To Zone.', status.error, []);
        }

         requestBody.modelId =  requestBody.vehicleId ;

    if (requestBody.bikeAllotmentId > 0) 
    {
        let BikeAllotmentResult: any = await AllotmentServices.getBikeAllotmentDataForEditService(requestBody, req);        
        if(BikeAllotmentResult.rowCount <=0)
        {
            return RequestResponse.validationError(res, 'For this bikeAllotmentId data is not available.', status.success, []); 
                     
        }         
        

        requestBody.uId = BikeAllotmentResult.rows[0].uid;        
        requestBody.vehicleId = BikeAllotmentResult.rows[0].vehicle_model_id;
    }


        let BikeResult: any = await AllotmentServices.getBikeForAllotmentService(requestBody, req);  
             
        if(BikeResult.rowCount <=0)
        {
            return RequestResponse.validationError(res, 'For this uId and vehicleId Bike is not available.', status.success, []);                      
        }          
        
        
        requestBody.bikeId = BikeResult.rows[0].id;        
        requestBody.lockId = BikeResult.rows[0].lock_id;



        if (requestBody.bikeAllotmentId === 0) {
            result = await AllotmentServices.insertBikeAllotment(requestBody, req);
            if (result.rowCount > 0) {
                let bikeAllotmentId = [{ bikeAllotmentId: result.rows[0].id }];
                
                result = await AllotmentServices.updateZoneAllotmentStatusForProduceBike(requestBody, req);
                result = await AllotmentServices.updateUIdStatusFromZoneAllotment(requestBody, req);
                return RequestResponse.success(res, apiMessage.addBikeProduce, status.info, bikeAllotmentId);
            } else {
                return RequestResponse.success(res, apiMessage.somethingWentWrong, status.info, []);
            }
        } else if (requestBody.bikeAllotmentId > 0) {

            let DeactivBikeresult = await AllotmentServices.deActiveAllotmentBike(requestBody, req);
            result = await AllotmentServices.insertBikeAllotment(requestBody, req);
            if (result.rowCount > 0) {
                let bikeAllotmentId = [{ bikeAllotmentId: requestBody.bikeAllotmentId }];
                result = await AllotmentServices.updateZoneAllotmentStatusForProduceBike(requestBody, req);
                //result = await AllotmentServices.updateUIdStatusFromZoneAllotment(requestBody);

                return RequestResponse.success(res, apiMessage.updateBikeProduce, status.success, bikeAllotmentId);
            } else {
                return RequestResponse.success(res, apiMessage.somethingWentWrong, status.info, []);
            }
        } else {
            return RequestResponse.success(res, apiMessage.somethingWentWrong, status.info, []);
        }
    } catch (error: any) {
        AddExceptionIntoDB(req,error);
        return exceptionHandler(res, 1, error.message);
    }
};

const getAllotmentDetailsController = async (req: Request, res: Response) => {
    try {
        // #swagger.tags = ['Admin-Allotment-Zone-Wise']
        // #swagger.description = 'Pass bikeAllotmentId or 0  and statusEnumId = 0 to see all '

        /*#swagger.parameters[ {
                        "name": "bikeAllotmentId",
                        "in": "query",
                        "description": "",
                        "required": true,
                        "type": "integer"
                    }]

        } */
        /*#swagger.parameters[ {
                        "name": "statusEnumId",
                        "in": "query",
                        "description": "",
                        "required": true,
                        "type": "integer"
                    }]

        } */
        let requestQuery = req.query;
        let result: any;
        result = await AllotmentServices.getBikeAllotmentDetails(requestQuery, req);
        let bikeAllotmentArray: any = [];
        for (let row of result.rows) {
            bikeAllotmentArray.push({
                bikeAllotmentId: row.id,
                vehicleId: row.vehicle_model_id,
                modelName: row.model_name,
                uId: row.uid,
                vehicleModelUId: row.uid_number,
                zoneId: row.zone_id,
                zoneName: row.zone_name,
                zoneAddress: row.zone_address,
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
                updatedByUserTypeName: row.updated_by_user_type_name ,
                bikeName : row.bike_name,
                bikeId : row.bike_id,
                lockNumber : row.lock_number,
                lockId :  row.lock_id,
                areaId : row.area_id,
                areaName : row.area_name,
                mapCityId : row.map_city_id,
                mapCityName : row.map_city_name,
                mapStateId : row.map_state_id,
                mapStateName : row.map_state_name,
                areaTypeEnumId : row.area_type_enum_id,
                areaTypeName : row.area_enum_type_name,

            });
        }
        if (result.rowCount > 0) {
            return RequestResponse.success(res, apiMessage.success, status.success, bikeAllotmentArray);
        } else {
            return RequestResponse.success(res, apiMessage.recordNotFound, status.info, []);
        }
    } catch (error: any) {
        AddExceptionIntoDB(req,error);
        return exceptionHandler(res, 1, error.message);
    }
};

const getZoneWiseListController = async (req: Request, res: Response) => {
    try {
        // #swagger.tags = ['Admin-Allotment-Zone-Wise']
        // #swagger.description = 'Pass zoneId = 0 to see all'

        /*#swagger.parameters[ {
                        "name": "zoneId",
                        "in": "query",
                        "description": "",
                        "required": true,
                        "type": "integer"
                    }]

        } */

        let requestQuery = req.query;
        let result: any;

        result = await AllotmentServices.getZoneWiseAllotmentList(requestQuery, req);
        let zoneArray: any = [];
        for (let row of result.rows) {
            zoneArray.push({
                bikeAllotmentId: row.id,
                vehicleId: row.vehicle_model_id,
                modelName: row.model_name,
                uId: row.uid,
                vehicleModelUId: row.uid_number,
                zoneId: row.zone_id,
                zoneName: row.zone_name,
                statusEnumId: row.status_enum_id,
                statusName: row.status_name,
                createdOnDate: row.createdon_date
            });
        }
        if (result.rowCount > 0) {
            return RequestResponse.success(res, apiMessage.success, status.success, zoneArray);
        } else {
            return RequestResponse.success(res, apiMessage.dataNotAvailable, status.info, []);
        }
    } catch (error: any) {
        AddExceptionIntoDB(req,error);
        return exceptionHandler(res, 1, error.message);
    }
};

const getZoneWiseListByBiKeAllotmentController = async (req: Request, res: Response) => {
    try {
        // #swagger.tags = ['Admin-Allotment-Zone-Wise']
        // #swagger.description = 'Pass zoneId = 0 to see all'

        /*#swagger.parameters[ {
                        "name": "zoneId",
                        "in": "query",
                        "description": "",
                        "required": true,
                        "type": "integer"
                    }]

        } */

        let requestQuery = req.query;
        let result: any;

        result = await AllotmentServices.getZoneWiseAllotmentList(requestQuery, req );
        let zoneArray: any = [];
        for (let row of result.rows) {
            zoneArray.push({
                zoneId: row.zone_id,
                zoneName: row.zone_name
            });
        }
        if (result.rowCount > 0) {
            return RequestResponse.success(res, apiMessage.success, status.success, zoneArray);
        } else {
            return RequestResponse.success(res, apiMessage.dataNotAvailable, status.info, []);
        }
    } catch (error: any) {
        AddExceptionIntoDB(req,error);
        return exceptionHandler(res, 1, error.message);
    }
};

const activeInactiveBikeAllotmentController = async (req: Request, res: Response) => {
    try {
        /* 	#swagger.tags = ['Admin-Allotment-Zone-Wise']
              #swagger.description = 'Only user can add type all Parameter are mandatory in swagger for testing purpose' */

        /*	#swagger.parameters['obj'] = {
                    in: 'body',
                    description: 'add add update zone details.',
                    required: true,
                    schema: { $ref: "#/definitions/activeInactiveBikeAllotmentController" }
            } */

        /* #swagger.security = [{
                    "apiKeyAuth": []
            }] */
        let requestBody = req.body;

        let result: any = '';
        result = await AllotmentServices.activeInactiveBikeAllotment(requestBody, req);
        if (result.rowCount > 0) {
            return RequestResponse.success(res, apiMessage.statusUpdate, status.info, []);
        } else {
            return RequestResponse.success(res, apiMessage.somethingWentWrong, status.info, []);
        }
    } catch (error: any) {
        AddExceptionIntoDB(req,error);
        return exceptionHandler(res, 1, error.message);
    }
};

const getDeviceController = async (req: Request, res: Response) => {
    try {
        // #swagger.tags = ['Admin-Dashboard']
        // #swagger.description = 'Pass id or 0  and status_enum_id = 0 to see all user '

        /*#swagger.parameters[ {
                        "name": "deviceName",
                        "in": "query",
                        "description": "",
                        "required": true,
                        "type": "string"
                    }]

        } */

        let requestQuery = req.query;
        let result: any = await DashboardServices.getDeviceDetails(requestQuery, req);
        let deviceDetails: any = [];
        for (let row of result.rows) {
            deviceDetails.push({
                deviceId: row.id,
                deviceName: row.name,
                location: row.location,
                latitude: row.latitude,
                longitude: row.longitude,
                altitude: row.altitude,
                speed: row.speed,
                battery: row.battery,
                internalBatt: row.internal_batt_v,
                externalBatt: row.external_batt_v,
                // deviceStatusEnumId: row.device_status_enum_id,
                deviceStatus: row.device_status
            });
        }
        if (result.rowCount > 0) {
            return RequestResponse.success(res, apiMessage.success, status.success, deviceDetails);
        } else {
            return RequestResponse.success(res, apiMessage.recordNotFound, status.success, []);
        }
    } catch (error: any) {

        AddExceptionIntoDB(req,error);
        return exceptionHandler(res, 1, error.message);
    }
};

const addDeviceController = async (req: Request, res: Response) => {
    try {
        // #swagger.tags = ['Admin-Dashboard']
        // #swagger.description = 'Pass id or 0  and status_enum_id = 0 to see all user kritin.in/api/addDevice?deviceName=fazi&location=indore vijay nage&latitude=22.7496° N&longitude=75.8955° E&deviceStatus=1 '

        /*#swagger.parameters[ {
                        "name": "deviceName",
                        "in": "query",
                        "description": "",
                        "required": true,
                        "type": "string"
                    }]

        } */
        /*#swagger.parameters[ {
                        "name": "location",
                        "in": "query",
                        "description": "",
                        "required": true,
                        "type": "string"
                    }]

        } */
        /*#swagger.parameters[ {
                        "name": "longitude",
                        "in": "query",
                        "description": "",
                        "required": true,
                        "type": "string"
                    }]

        } */
        /*#swagger.parameters[ {
                        "name": "latitude",
                        "in": "query",
                        "description": "",
                        "required": true,
                        "type": "string"
                    }]

        } */
        /*#swagger.parameters[ {
                        "name": "deviceStatus",
                        "in": "query",
                        "description": "",
                        "required": true,
                        "type": "string"
                    }]

        } */
        let requestQuery = req.query;
        let result: any = await DashboardServices.addUpdateDeviceDetails(requestQuery, req);

        if (result.rowCount > 0) {
            return RequestResponse.success(res, apiMessage.addDeviceDetails, status.success, null);
        } else {
            return RequestResponse.success(res, apiMessage.somethingWentWrong, status.success, null);
        }
    } catch (error: any) {
        AddExceptionIntoDB(req,error);
        return exceptionHandler(res, 1, error.message);
    }
};

const lockAndUnlockDeviceController = async (req: Request, res: Response) => {
    try {
        // #swagger.tags = ['Admin-Dashboard']
        // #swagger.description = 'deviceName = fazi ,deviceStatus=2'
        /*#swagger.parameters[ {
                        "name": "deviceName",
                        "in": "query",
                        "description": "",
                        "required": true,
                        "type": "string"
                    }]

        } */
        /*#swagger.parameters[ {
                        "name": "deviceStatus",
                        "in": "query",
                        "description": "",
                        "required": true,
                        "type": "string"
                    }]

        } */
        // 1 = Unlock 
        // 2= lock 
        let requestQuery: any = req.query;
        let result: any = await DashboardServices.lockAndUnlockDevice(requestQuery, req);

        if (result.rows[0].fp_output_result == adminMessage.success && requestQuery.deviceStatus === '2') {
            return RequestResponse.success(res, apiMessage.deviceLocked, status.success, null);
        } else {
            return RequestResponse.success(res, apiMessage.deviceUlLocked, status.success, null);
        }
    } catch (error: any) {
        AddExceptionIntoDB(req,error);
        return exceptionHandler(res, 1, error.message);
    }
};

const getDashboardCardController = async (req: Request, res: Response) => {
    try {
        const now = Date.now();
        if (dashboardCardCacheData && now - dashboardCardCacheAt <= DASHBOARD_CARD_CACHE_WINDOW_MS) {
            return RequestResponse.success(res, apiMessage.success, status.success, dashboardCardCacheData);
        }

        // #swagger.tags = ['Admin-Dashboard']
        // #swagger.description = 'card'
        let result: any = await DashboardServices.getDashboardCount(req);

        const getCountValue = (index: number) => {
            const rawValue: any = result?.rows?.[index]?.count;
            if (CommonMessage.IsValid(rawValue) == false) {
                return 0;
            }

            const numericValue = Number(rawValue);
            return Number.isFinite(numericValue) ? numericValue : 0;
        };
        
        if (result.rowCount > 0) {
            let dashboardArray = buildDefaultDashboardCard();
            dashboardArray[0].bookedBike = getCountValue(0);
            dashboardArray[0].availableBike = getCountValue(1);
            dashboardArray[0].underMaintenanceBike = getCountValue(2);
            dashboardArray[0].totalBike = getCountValue(3);
            dashboardArray[0].totalEarning = getCountValue(4);
            dashboardArray[0].battery0To30 = getCountValue(5);
            dashboardArray[0].battery30To50 = getCountValue(6);
            dashboardArray[0].batteryMore50 = getCountValue(7);
            dashboardArray[0].bikeOutSideOfGeoFance = getCountValue(8);
            dashboardArray[0].unlockOrPowerOnCount = getCountValue(9);
            dashboardArray[0].availableUnlockOrPowerOnCount = getCountValue(10);
            dashboardArray[0].pendingWithdrawRequest = getCountValue(11);
            dashboardCardCacheData = dashboardArray;
            dashboardCardCacheAt = now;
            return RequestResponse.success(res, apiMessage.success, status.success, dashboardArray);
        } else {
            const emptyDashboardArray = buildDefaultDashboardCard();
            dashboardCardCacheData = emptyDashboardArray;
            dashboardCardCacheAt = now;
            return RequestResponse.success(res, apiMessage.success, status.success, emptyDashboardArray);
        }
    } catch (error: any) {
        try {
            AddExceptionIntoDB(req, error);
        } catch (loggingError) {
            logger.error('Failed to persist dashboard exception: ' + loggingError);
        }

        if (dashboardCardCacheData) {
            return RequestResponse.success(res, apiMessage.success, status.success, dashboardCardCacheData);
        }

        const fallbackDashboardArray = buildDefaultDashboardCard();
        dashboardCardCacheData = fallbackDashboardArray;
        dashboardCardCacheAt = Date.now();
        return RequestResponse.success(res, apiMessage.success, status.success, fallbackDashboardArray);
    }
};
// device api using query parameter
const deviceRegistrationController = async (req: Request, res: Response) => {
    try {
        let requestQuery = req.query;
        let result: any;
        result = await DashboardServices.deviceRegistration(requestQuery,req);
        if (result.rowCount > 0) {
            result = [{ deviceId: result.rows[0].id }];
            return RequestResponse.success(res, apiMessage.success, status.success, result);
        } else {
            return RequestResponse.success(res, apiMessage.somethingWentWrong, status.success, []);
        }
    } catch (error: any) {
        AddExceptionIntoDB(req,error);
        return exceptionHandler(res, 1, error.message);
    }
};

// device api using text body  parameter
const deviceRegistrationUsingTextController = async (req: Request, res: Response) => {
    try {
        let requestBody = req.body;
        let result: any;
        let stringData = requestBody.toString();
        let parseData = parse(stringData);
        let checkDuplicatedDeviceName: any = await DashboardServices.checkDeviceRegistrationName(parseData, req);
        if (checkDuplicatedDeviceName.rowCount > 0) {
            return RequestResponse.validationError(res, apiMessage.deviceNameExist, status.error, []);
        } else if (checkDuplicatedDeviceName.rowCount === 0) {
            result = await DashboardServices.deviceRegistration(parseData, req);
            result = [{ deviceId: result.rows[0].id }];
            return RequestResponse.success(res, apiMessage.success, status.success, result);
        } else {
            return RequestResponse.success(res, apiMessage.somethingWentWrong, status.success, []);
        }
    } catch (error: any) {
        AddExceptionIntoDB(req,error);
        return exceptionHandler(res, 1, error.message);
    }
};

const deviceRegistration2Controller = async (req: Request, res: Response) => {
    try {
        let requestQuery = req.query;
        let result: any;

        let checkDuplicatedDeviceName: any = await DashboardServices.checkDeviceRegistrationName(requestQuery, req);
        if (checkDuplicatedDeviceName.rowCount > 0) {
            return RequestResponse.validationError(res, apiMessage.deviceNameExist, status.error, []);
        } else if (checkDuplicatedDeviceName.rowCount === 0) {
            result = await DashboardServices.deviceRegistration2(requestQuery, req);
            result = [{ deviceId: result.rows[0].id }];
            return RequestResponse.success(res, apiMessage.success, status.success, result);
        } else {
            return RequestResponse.success(res, apiMessage.somethingWentWrong, status.success, []);
        }
    } catch (error: any) {
        AddExceptionIntoDB(req,error);
        return exceptionHandler(res, 1, error.message);
    }
};

const deviceRegistration3Controller = async (req: Request, res: Response) => {
    try {
        let requestQuery = req.query;
        let result: any;
        requestQuery.apiRequestFromEnumId = '64';
        await insertApiRequest(req) 

        let checkDuplicatedDeviceName: any = await InwardServices.checkLockNumber(requestQuery);
        if (checkDuplicatedDeviceName.rowCount == 0) {            
            return RequestResponse.validationError(res, apiMessage.deviceNameNotExist, status.error, []);
        } else {
                        
            
            // if(checkDuplicatedDeviceName.rows[0].registartion_status==true)
            //   {
            //     return RequestResponse.validationError(res, apiMessage.cannotUpdate, status.error, []);
            //   }  
    //    let checimeiNumberExit: any = await InwardServices.IMEIAndLockNumberExitService(requestQuery);
        
    //     if (checimeiNumberExit.rowCount == 0) 
    //     {
    //         return RequestResponse.validationError(res, apiMessage.imeiNotExist, status.error, []);
    //     }

            result = await DashboardServices.deviceRegistration4(requestQuery, req);
            
            if (result.rowCount > 0) {
                await DashboardServices.changeDeviceRegistrationStatus(requestQuery, req);

                result = await InwardServices.getRegistrationStatusOfLock(requestQuery.dId);

                requestQuery.lockId = result.rows[0].id;

                await AddLog.addDeviceRegistrationLog(requestQuery);

                return RequestResponse.success(res, 'Device Registration Completed.', status.success, []);
            } else {
                return RequestResponse.validationError(res, 'Registration Not Completed.', status.error, []);
            }
        }
    } catch (error: any) {
        AddExceptionIntoDB(req,error);
        return exceptionHandler(res, 1, error.message);
    }
};

const addDeviceIdAndInstruction = async (req: Request, res: Response) => {
    try {
        // #swagger.tags = ['Admin-Dashboard']
        // #swagger.description = 'Pass id or 0  and status_enum_id = 0 to see all user '

        /*#swagger.parameters[ {
                        "name": "deviceId",
                        "in": "query",
                        "description": "",
                        "required": true,
                        "type": "string"
                    }]

        } */
        /*#swagger.parameters[ {
                        "name": "instructionId",
                        "in": "query",
                        "description": "",
                        "required": true,
                        "type": "integer"
                    }]

        } */

        let requestQuery = req.query;
        let result: any;

        result = await DashboardServices.addDeviceIdAndInstruction(requestQuery, req);

        if (result.rowCount > 0) {
            return RequestResponse.success(res, apiMessage.deviceIdAndIns, status.success, []);
        } else {
            return RequestResponse.success(res, apiMessage.somethingWentWrong, status.error, []);
        }
    } catch (error: any) {
        AddExceptionIntoDB(req,error);
        return exceptionHandler(res, 1, error.message);
    }
};


const getDeviceInstructions = async (req: Request, res: Response) => {
    try {
        let requestQuery: any = req.query;
        let result: any;
        
        let deviceStateEnumId: any = 23;       
        let lastRequestTime:any = getUTCdate();       
        let instructionsName: any='';
       

        requestQuery.apiRequestFromEnumId = '64'; // device  
        await insertApiRequest(req) 
         

        if (CommonMessage.IsValid(requestQuery.dId) == false) 
        {
            return RequestResponse.validationError(res, apiMessage.dIdNotAvailable, status.error, []);
        }
        result = await DashboardServices.getDeviceInstruction(requestQuery, req);

         if (result.rowCount > 0) {
            
            
           //for  no intructions 
            if ( ((result.rows[0].instruction_id) == null || Number(result.rows[0].instruction_id) == 0) && 
            ((result.rows[0].device_light_instruction_enum_id) == null || Number(result.rows[0].device_light_instruction_enum_id) == 0)
            && 
            ((result.rows[0].beep_instruction_enum_id) == null || Number(result.rows[0].beep_instruction_enum_id) == 0)) 
            {          
                    
               instructionsName =''             
            }
            else 
            {
                 // for no instractions 
             if ( (Number(result.rows[0].instruction_id) ==4) && 
             (Number(result.rows[0].device_light_instruction_enum_id) ==45)
             && (Number(result.rows[0].beep_instruction_enum_id) ==58)) 
             {          
                   
             instructionsName =''  ;           
             } 
             else 
             {                 
                if ( (Number(result.rows[0].instruction_id) !=4)) // true 
                 {
                    instructionsName = result.rows[0].instruction_name ; 
                 }

                if (Number(result.rows[0].device_light_instruction_enum_id) !=45) // false  
                 {     

                    if(instructionsName !='')
                    {
                        instructionsName = instructionsName + '$';
                    }                       
            
                        instructionsName =  instructionsName +''+  result.rows[0].device_light_instruction                                                 
                 }
                 

                 if (Number(result.rows[0].beep_instruction_enum_id) !=58)
                 {    
                    if(instructionsName !='')
                    {                      
                        instructionsName = instructionsName + '$';
                    }                   
                        instructionsName  = instructionsName +''+ result.rows[0].beep_instruction ;     // beepInstruction  =''                                                                   
                   }
                }
            }

           

            //  //lock no instraction and light no instractions and beep instruction  on off
        //      if ( (Number(result.rows[0].instruction_id) ==4) && 
        //     (Number(result.rows[0].device_light_instruction_enum_id) ==45)
        //     && (Number(result.rows[0].beep_instruction_enum_id) !=58)) 
               
        //     instructionsName =result.rows[0].beep_status  ;     // beepInstruction  =''  ;           
        //     }
            
        //     //lock no instraction and  beep no instrunction light instractions  on Or off 
        //     else if ( (Number(result.rows[0].instruction_id) ==4) 
        //     && (Number(result.rows[0].beep_instruction_enum_id) ==58)
        //     && 
        //     (Number(result.rows[0].device_light_instruction_enum_id) !=45)) 
        //     {  
              
        //         instructionsName =result.rows[0].device_light_instruction  ;          
        //     }

        //     //lock Or Unlock instraction and light No instractions and beep no instrunction
        //    else  if ( (Number(result.rows[0].instruction_id) !=4) && 
        //     (Number(result.rows[0].device_light_instruction_enum_id) ==45)
        //     && (Number(result.rows[0].beep_instruction_enum_id) ==58)) 
        //     {     
                    
        //         instructionsName = result.rows[0].instruction_name ;        
        //     }

        //           //lock Or Unlock instraction and light  instractions and beep no instrunctiopm 
        //    else  if ( (Number(result.rows[0].instruction_id) !=4) && 
        //    (Number(result.rows[0].device_light_instruction_enum_id) !=45)
        //    && (Number(result.rows[0].beep_instruction_enum_id) ==58)) 
        //    {   
        //     console.log('check line 1126')              
        //     instructionsName = result.rows[0].instruction_name +'$'+result.rows[0].device_light_instruction ;        
        //    }

        //             //lock Or Unlock instraction and light No instractions
        //             else  if ( (Number(result.rows[0].instruction_id) !=4) && 
        //             (Number(result.rows[0].device_light_instruction_enum_id) ==45)
        //             && (Number(result.rows[0].beep_instruction_enum_id) !=58)) 
        //             {      
        //                 console.log('beep',result.rows[0].beep_instruction_enum_id)
        //                 console.log('check line 1135')             
        //                 instructionsName = result.rows[0].instruction_name +'$'+result.rows[0].beep_status ;        
        //             }

        //                //lock Or Unlock instraction and light No instractions
        //                else  if ( (Number(result.rows[0].instruction_id) ==4) && 
        //                (Number(result.rows[0].device_light_instruction_enum_id) !=45)
        //                && (Number(result.rows[0].beep_instruction_enum_id) !=58)) 
        //                {  
        //                 console.log('check line 1143')                      
        //                 instructionsName = result.rows[0].device_light_instruction +'$'+result.rows[0].beep_status ;        
        //                }
   

        //     // ock Or Unlock instraction and light ON And OFF instractions
        //     else if( (Number(result.rows[0].instruction_id) !=4) && 
        //     (Number(result.rows[0].device_light_instruction_enum_id) !=45)
        //     && (Number(result.rows[0].beep_instruction_enum_id) !=58)) 
        //     {    
        //         console.log('check line 1153')               
        //         instructionsName = result.rows[0].instruction_name +'$'+result.rows[0].device_light_instruction +'$'+result.rows[0].beep_status ;       
        //     }  

            await DashboardServices.setDeviceLastRequestTimeAndConnection(lastRequestTime ,deviceStateEnumId,result.rows[0].id, req);

            result =[{ instructionsName: instructionsName}];
                       
            return RequestResponse.success(res, status.success, status.success, result);
                                    
        } else {
            return RequestResponse.validationError(res, apiMessage.deviceNotRegistered , status.error, []);
        }
    } catch (error: any) {
        AddExceptionIntoDB(req,error);
        return exceptionHandler(res, 1, error.message);
    }
};


const deleteDeviceController = async (req: Request, res: Response) => {
    try {
        let requestQuery = req.query;
        let result: any;
        result = await DashboardServices.deleteDevice(requestQuery, req);
        if (result.rowCount > 0) {
            return RequestResponse.success(res, apiMessage.deleteDevice, status.success, []);
        } else {
            return RequestResponse.success(res, apiMessage.deviceNameNotExist, status.error, []);
        }
    } catch (error: any) {
        logger.error(error.message);
        return exceptionHandler(res, 1, error.message);
    }
};



const setInstructionToLockUnlockDeviceController = async (req: Request, res: Response) => {
    try {
        // #swagger.tags = ['Admin-Dashboard']
        // #swagger.description = 'Pass id or 0  and status_enum_id = 0 to see all user '

        /*#swagger.parameters[ {
                        "name": "deviceId",
                        "in": "query",
                        "description": "",
                        "required": true,
                        "type": "string"
                    }]

        } */
        /*#swagger.parameters[ {
                        "name": "instructionId",
                        "in": "query",
                        "description": "",
                        "required": true,
                        "type": "integer"
                    }]

        } */
        let requestQuery = req.query;
        requestQuery.RequetFrom='lockAndUnlcok' ;

        let lockUnlock: any = await setInstructionToLockUnlockDeviceFun(requestQuery,res, req); 
        if(lockUnlock==true)
        {
            return  RequestResponse.success(res, apiMessage.success, status.success, []);; 
        }        
            return  ;                                   
    } catch (error: any) {
        AddExceptionIntoDB(req,error);
        return exceptionHandler(res, 1, error.message);
    }
};

const setInstructionToLockUnlockDeviceFun = async (requestQuery: any, res: Response,req :any) => {
    {
       
        try {
           
        let result: any;
        let RequetFrom :any ='lockAndUnlcok' ;

        requestQuery.instructionLastUpdateDate = getUTCdate();

        let getLockIdByLockNumber: any = await adminLogDeviceInformationServices.getLockIdByLockNumberService(requestQuery);

        if (getLockIdByLockNumber.rowCount == 0)
        {
            if(RequetFrom== requestQuery.RequetFrom){
            RequestResponse.validationError(res, apiMessage.lockNotAvailable, status.error, []);
            return false;
            } 
            return true;
        }
            
    if(config.CLIENT_NAME==kClientName.clientEvegah)// for evegah 
        {

        if(getLockIdByLockNumber.rows[0].instruction_id ==requestQuery.instructionId)// for chech device lock 
        {
                 
            if(RequetFrom== requestQuery.RequetFrom)
            {
            RequestResponse.validationError(res, apiMessage.intractionsAlready, status.error, []);
            return false;
            }
            return true;
        }
    }

   
        
        result = await DashboardServices.setInstructionToLockUnlockDevice(requestQuery,req);
        if (result.rowCount > 0) {

             
            result = await InwardServices.getRegistrationStatusOfLock(requestQuery.deviceId);
            requestQuery.lockId = result.rows[0].id;

            // for ride booking id 
        let rideingIdResult: any = await adminLogDeviceInformationServices.getRideingIdByLockNumberService(requestQuery);

        if (rideingIdResult.rowCount > 0) 
        {            
            requestQuery.rideBookingId = rideingIdResult.rows[0].id;                               
        }
        else
        {
            requestQuery.rideBookingId = '0';
        }
        // for ride booking id    
    
            let prepareLogData = {
                lockId: requestQuery.lockId,
                lockNumber: requestQuery.deviceId,
                deviceLockAndUnlockStatus: Number(requestQuery.instructionId) === 2 ? masterMessage.activeStatus : masterMessage.inactiveStatus,
                deviceLockAndUnlockStatusName: Number(requestQuery.instructionId) === 2 ? apiMessage[1] : apiMessage[2],
                instructionId: requestQuery.instructionId,
                instructionName: Number(requestQuery.instructionId) === 2 ? instructionName[2] : instructionName[3],
                statusEnumId: masterMessage.activeStatus,
                actionRemarks: Number(requestQuery.instructionId) === 2 ? apiMessage.instructionForUnLockDevice : apiMessage.instructionForLockDevice,
                createdByLoginUserId: requestQuery.userId ? requestQuery.userId : 31, // by default admin id
                createdByUserTypeEnumId: requestQuery.userTypeEnumId ? requestQuery.userTypeEnumId : 3 ,//admin enum id,
                userId: requestQuery.userId ? requestQuery.userId : 31, // by default admin id
                rideBookingId : requestQuery.rideBookingId,
                deviceId: requestQuery.deviceId,
                device_lock_unlock_communication_enum_id : '93'// online 
            };
                       
            
            
              result = await AddLog.addDeviceInstructionLog(prepareLogData);

             // this code added for add device log informatins
             //console.log('admin line 1473')
              result = await adminLogDeviceInformationServices.addDeviceLightInformationslog(prepareLogData);            
            // this code added for add device log informatins

            if( requestQuery.instructionId=='3')// if set lock instructions and 2 for unlock
            {
                
                requestQuery.instructionDeviceLightInstructionEnumId = '44';
                requestQuery.statusEnumId = '1';
                requestQuery.deviceLightStatusEnumId == null;
                requestQuery.deviceLightInstructionEnumId = requestQuery.instructionDeviceLightInstructionEnumId;                         
                requestQuery.lightRequetFrom = 'LockUnlock';  
               let setDeviceInstructionLightOnOff : any   =await setDeviceInstructionLightOnOffController(requestQuery, res, req);
               
                if(setDeviceInstructionLightOnOff==false)
                {
                   return false;
                }
            else{            
                   return true;
                }

            }             
            return true;      
                                             
        } else {
            // RequestResponse.success(res, apiMessage.somethingWentWrong, status.success, []);
             return true;
        }
    } catch (error: any) {
        AddExceptionIntoDB(req,error);
        return exceptionHandler(res, 1, error.message);
    }
    }
}

const unlockDeviceController = async (req: Request, res: Response) => {
    try {
        let requestQuery = req.query;  
        
        requestQuery.apiRequestFromEnumId = '64';
        await insertApiRequest(req)  

         requestQuery.lastUpdateTime = getUTCdate();
        if (!requestQuery.dId) {
            return RequestResponse.validationError(res, apiMessage.validDeviceId, status.success, []);
        }
        if (requestQuery.lockStatus === null || requestQuery.lockStatus !== '1') {
            return RequestResponse.validationError(res, apiMessage.validLockStatus, status.success, []);
        }
        let result: any;
        requestQuery.rideBookingId='0';
        result = await InwardServices.getRegistrationStatusOfLock(requestQuery.dId);
        

        if (result.rowCount > 0) {
           
            if(config.CLIENT_NAME==kClientName.clientEvegah) 
            {
             if(result.rows[0].instruction_id !='2'  )// for check set instruction unlock 
            {
                return RequestResponse.success(res, apiMessage.instructionNotSet, status.success, []);               
            }
        }

            requestQuery.lockId =result.rows[0]?.id;           
            let rideingIdResult: any = await adminLogDeviceInformationServices.getRideingIdByLockNumberService(requestQuery);
            if(rideingIdResult.rowCount > 0)// for device unlock lock instruction ride booking id
            {
              requestQuery.rideBookingId = rideingIdResult.rows[0].id;   
            }

          

            let prepareLogData = {
                lockId: result.rows[0]?.id,
                lockNumber: requestQuery.dId,
                deviceLockAndUnlockStatus: masterMessage.inactiveStatus,
                deviceLockAndUnlockStatusName: apiMessage[1],
                // instructionId: instruction.deviceUnlock,
                // instructionName: instructionName[2],
                instructionId: instruction.completedUnLockRequest,//change deviceUnLock to completedUnLockRequest
                instructionName: instructionName[6],// change 2 to 6 
                statusEnumId: masterMessage.activeStatus,
                actionRemarks: apiMessage.instructionForUnLockDevice,
                createdByLoginUserId: null,
                createdByUserTypeEnumId: 17 ,// device enum id
                rideBookingId :requestQuery.rideBookingId,
                device_lock_unlock_communication_enum_id : '93',// online 

            };

            if (result.rows[0].registartion_status) 
            {
                result = await DashboardServices.unlockDevice(requestQuery, req);
                requestQuery.lockId =prepareLogData.lockId;
                if (result.rowCount > 0) {
                   
                                      
                          if(rideingIdResult.rowCount > 0)// for device unlock count rideing wise
                          {                           
                            requestQuery.counts = '1'; 
                            await adminLogDeviceInformationServices.addDeviceUnLockCountService(requestQuery); 
                          }   

                    result = await AddLog.addDeviceInstructionLog(prepareLogData);
                    requestQuery.deviceLockAndUnlockStatus =requestQuery.lockStatus;
                    requestQuery.deviceId= requestQuery.dId;
                    requestQuery.statusEnumId='1';
                    
                    result = await adminLogDeviceInformationServices.addDeviceLightInformationslog(requestQuery);
                    //console.log('admin line 1584')
                    return RequestResponse.success(res, apiMessage.deviceUlLocked, status.success, []);
                } 
                else 
                {
                    return RequestResponse.success(res, apiMessage.somethingWentWrong, status.success, []);
                }
            } else {
                return RequestResponse.validationError(res, apiMessage.deviceIsNotRegister, status.error, []);
            }
        }
        else {
            return RequestResponse.validationError(res, apiMessage.deviceIsNotExist, status.error, []);

        }
    } catch (error: any) {
        AddExceptionIntoDB(req,error);
        
        return exceptionHandler(res, 1, error.message);
    }
};

const lockDeviceController = async (req: Request, res: Response) => {
    try {
        let requestQuery = req.query;

       // console.log('check lock api')
        requestQuery.apiRequestFromEnumId = '64';
        await insertApiRequest(req) 

        requestQuery.lastUpdateTime = getUTCdate();       
        if (!requestQuery.dId) {
            return RequestResponse.validationError(res, apiMessage.validDeviceId, status.success, []);
        }
        if (requestQuery.lockStatus === null || requestQuery.lockStatus !== '2') {
            return RequestResponse.validationError(res, apiMessage.validLockStatus, status.success, []);
        }
        requestQuery.rideBookingId='0';
       
        let result: any;
        result = await InwardServices.getRegistrationStatusOfLock(requestQuery.dId);
        
        if (result.rowCount > 0) {

            if(config.CLIENT_NAME==kClientName.clientEvegah)
            {
            if(result.rows[0].instruction_id !='3'  )// for check set instruction lock 
            {
                return RequestResponse.success(res, apiMessage.instructionNotSet, status.success, []);               
            }
          }
            requestQuery.lockId =result.rows[0]?.id;           
            let rideingIdResult: any = await adminLogDeviceInformationServices.getRideingIdByLockNumberService(requestQuery);
            if(rideingIdResult.rowCount > 0)// for device unlock lock instruction ride booking id
            {
              requestQuery.rideBookingId = rideingIdResult.rows[0].id;   
            }
            let prepareLogData = {
                lockId: result.rows[0].id,
                lockNumber: requestQuery.dId,
                deviceLockAndUnlockStatus: masterMessage.activeStatus,
                deviceLockAndUnlockStatusName: apiMessage[2],
                instructionId: instruction.completedLockRequest,//change deviceLock to completedLockRequest
                instructionName: instructionName[5],// change 3 to 5 
                statusEnumId: masterMessage.activeStatus,
                actionRemarks: apiMessage.instructionForLockDevice,
                createdByLoginUserId: null,
                createdByUserTypeEnumId: 17 ,
                deviceId: requestQuery.dId,
                rideBookingId : requestQuery.rideBookingId,
                device_lock_unlock_communication_enum_id : '93',// online 
              //  device_lock_and_unlock_status : result.rows[0].device_lock_and_unlock_status
            };                      
            
            if (result.rows[0].registartion_status) {
                result = await DashboardServices.lockDevice(requestQuery,req);
                if (result.rowCount > 0) {

                          if(rideingIdResult.rowCount > 0) // for device  lock count rideing wise
                          {                              
                            requestQuery.counts = '1';                            
                            await adminLogDeviceInformationServices.addDeviceLockCountService(requestQuery); 
                          }                                                     
                          
                    result = await AddLog.addDeviceInstructionLog(prepareLogData);
                    requestQuery.deviceLockAndUnlockStatus =requestQuery.lockStatus;
                    requestQuery.deviceId= requestQuery.dId;
                    requestQuery.statusEnumId='1';
                    result = await adminLogDeviceInformationServices.addDeviceLightInformationslog(requestQuery);
                  //  console.log('admin line 1673')
                    return RequestResponse.success(res, apiMessage.deviceLocked, status.success, []);
                } else {
                    return RequestResponse.success(res, apiMessage.somethingWentWrong, status.success, []);
                }
            }
            else {
                return RequestResponse.validationError(res, apiMessage.deviceIsNotRegister, status.error, []);
            }
        }
        else {
            return RequestResponse.validationError(res, apiMessage.deviceIsNotExist, status.error, []);

        }
    } catch (error: any) {
        AddExceptionIntoDB(req,error);
        return exceptionHandler(res, 1, error.message);
    }
};

const updateDeviceInformation = async (req: Request, res: Response) => {
    try {
        let requestQuery = req.query;
       
        let result: any;

        if (CommonMessage.IsValid(requestQuery.deviceId) == false) {
            return RequestResponse.success(res, CommonMessage.ErrorMessage(1, 'dId'), status.success, []);
        }
        requestQuery.distanceInMeters = '0';

        result = await InwardServices.getRegistrationStatusOfLock(requestQuery.deviceId);
        requestQuery.lockId = result.rows[0].id;
        if (result.rows[0].registartion_status === true) {
            result = await DashboardServices.updateDeviceInformationInMultiPart(requestQuery,req);
            
            if (result.rowCount > 0) {
                requestQuery.lockId = result.rows[0].id;
                await AddLog.updateDeviceInformationLog(requestQuery);

                return RequestResponse.success(res, apiMessage.addDeviceDetails, status.success, []);
            } else {
                return RequestResponse.success(res, apiMessage.somethingWentWrong, status.success, []);
            }
        } else {
            return RequestResponse.validationError(res, apiMessage.deviceIsNotRegister, status.error, []);
        }
        //}
    } catch (error: any) {
        AddExceptionIntoDB(req,error);
        return exceptionHandler(res, 1, error.message);
    }
};

const updateWithdrawRequestFromAdminController = async (req: Request, res: Response) => {
    try {
        // #swagger.tags = ['Admin-Dashboard']
        // #swagger.description for 11 =  procession ,12 for completed'
        /*	#swagger.parameters['obj'] = {
                in: 'body',
                description: 'User information.',
                required: true,
                schema: { $ref: "#/definitions/updateWithdrawRequestFromAdminController" }
        } */
        let requestBody = req.body;
        let message;
        let result: any;
        let walletAmount: any;
        walletAmount = await RideBooking.getWalletAmountByUserId(requestBody);

        if (Number(requestBody.withdrawRequestStatusEnumId) === 11) {

            message = apiMessage.processing;
    
          requestBody.processing_user_id= requestBody.userId;

            result = await DashboardServices.updateWithdrawRequestFromAdminSide(requestBody,req);
        }
        else {
            message = apiMessage.completed;
            requestBody.completed_user_id =requestBody.userId;            
            result = await DashboardServices.completeWithdrawRequestFromAdminSide(requestBody,req);
        }

        


        // if (Number(requestBody.withdrawRequestStatusEnumId) === 11) {
        //     result = await DashboardServices.updateWithdrawRequestFromAdminSide(requestBody);
        // } else {
        //     result = await DashboardServices.completeWithdrawRequestFromAdminSide(requestBody);
        // }

        if (result.rowCount <= 0) {
            return RequestResponse.success(res, apiMessage.somethingWentWrong, status.info, []);
        } else {

            return RequestResponse.success(res, message, status.success, []);
        }
    } catch (error: any) {
        AddExceptionIntoDB(req,error);
        return exceptionHandler(res, 1, error.message);
    }
};

const getWithdrawnListController = async (req: Request, res: Response) => {
    try {
        // #swagger.tags = ['Admin-Dashboard']
        // #swagger.description = 'Pass id or 0  and status_enum_id = 0 to see all user '

        let requestQuery = req.query;
        let result: any;

        result = await DashboardServices.getWithdrawRequestFromAdminSide(requestQuery,req);
        const withdrawnArray: any = [];
        for (let row of result.rows) {
            withdrawnArray.push({
                requestId: row.id,
                id: row.user_id,
                userName: row.user_name,
                contactNumber: row.contact_number,
                walletAmount: row.wallet_amount,
                depositAmount :row.deposit_amount ? row.deposit_amount:0,
                withdrawRequestStatusEnumId: row.withdraw_request_status_enum_id,
                withdrawRequestStatus: row.withdraw_request_status,
                amount: row.amount,
                createdOnDate: row.createdon_date,
                updatedOnDate: row.updatedon_date,
                cancelledUserId : row.cancelled_user_id,
                cancelledUserName : row.cancelled_user_name,
                cancelledDate : row.cancelled_date,
                cancelledRemark : row.cancelled_remark,
            });
        }

        if (result.rowCount > 0) {
            return RequestResponse.success(res, apiMessage.success, status.success, withdrawnArray);
        } else {
            return RequestResponse.success(res, apiMessage.somethingWentWrong, status.error, []);
        }
    } catch (error: any) {
        AddExceptionIntoDB(req,error);
        return exceptionHandler(res, 1, error.message);
    }
};

const addLogController = async (req: Request, res: Response) => {
    try {
        let requestBody = req.body;

        let result: any;
        requestBody.device_lock_unlock_communication_enum_id = '93';// online 
        result = await AddLog.addDeviceInstructionLog(requestBody);
        if (result.rowCount > 0) {
            return RequestResponse.success(res, apiMessage.success, status.success, []);
        } else {
            return RequestResponse.success(res, apiMessage.somethingWentWrong, status.info, []);
        }
    } catch (error: any) {
        AddExceptionIntoDB(req,error);
        return exceptionHandler(res, 1, error.message);
    }
};

const verifyTokenController = async (req: Request, res: Response, next: NextFunction) => {
    try {
        
     // let apiRequestResult:any = await insertApiRequest(req)
        if (process.env.NODE_ENV === 'development') {
             
            
            let result = await verifyToken(req,res);
            next();
        } else {
            
            let result = await verifyToken(req,res);
            next();
        }
       
    } catch (error: any) {
        AddExceptionIntoDB(req,error);
        return RequestResponse.unauthorized(res, error.message, status.error, []);
    }
};

const logOutAdminController = async (req: Request, res: Response) => {
    try {
        await logOutAdmin(req, res);
        return Promise.resolve({
            message: 'success',
            user: 200
        });
    } catch (error) {
        return Promise.reject({
            message: 'error',
            user: error
        });
    }
};
const updateDeviceInformationMultipart = async (req: Request, res: Response) => {

    try {

        
        
        let requestQuery = req.query;
        let beepResult :any ;
        let resultCityArea :any =null;
        let deviceDetails :any;
        let distanceInMeters  :any= 0;

        requestQuery.apiRequestFromEnumId = '64';
        await insertApiRequest(req) 

        

    // if(CommonMessage.IsValid(requestQuery.device_lock_unlock_communication_enum_id)==false)//  requestQuery.distanceInMeters
    // {
        
    //    // let data:any =await  updateLockDetailFromMQTT(requestBody) 

    // }

        if (CommonMessage.IsValid(requestQuery.dId) == false) {
            return RequestResponse.success(res, CommonMessage.ErrorMessage(1, 'dId'), status.success, []);
        }

        let result: any;
        result = await InwardServices.getRegistrationStatusOfLock(requestQuery.dId);


        if (result.rowCount == 0) {
            return RequestResponse.success(res, CommonMessage.ErrorMessage(2, 'dId'), status.success, []);
        }

       requestQuery.lockId = result.rows[0].id;  
                            
       requestQuery.latitude = requestQuery.lat
       requestQuery.longitude = requestQuery.long

       requestQuery.latitudeDb= result.rows[0].latitude;
       requestQuery.longitudeDb = result.rows[0].longitude;
       
       requestQuery.distanceInMeters  ;//= attributes.flt-odometer;It comes from a third-party API

       requestQuery.rideBookingId ='0';
       
       let rideingIdResult: any = await adminLogDeviceInformationServices.getRideingIdByLockNumberService(requestQuery);
    
       if (rideingIdResult.rowCount > 0)
       {   
           requestQuery.rideBookingId = rideingIdResult.rows[0].id;
       }
       

    //    if(CommonMessage.IsValid(requestQuery.device_lock_unlock_communication_enum_id)==false)//  requestQuery.distanceInMeters
    //    {
        if  ( CommonMessage.IsValid(requestQuery.latitude)==true  && CommonMessage.IsValid(requestQuery.latitude)==true 
        &&  CommonMessage.IsValid(requestQuery.latitudeDb)==true && CommonMessage.IsValid(requestQuery.longitudeDb)==true) 
        {  
           if(  Number(requestQuery.latitude)!=0  && Number(requestQuery.latitude)!=0 
           &&  Number(requestQuery.latitudeDb)!=0 && Number(requestQuery.longitudeDb)!=0)
           {    
                                  
                distanceInMeters   = geoFance.CalculateDistance(requestQuery.latitude, requestQuery.longitude,requestQuery.latitudeDb,  requestQuery.longitudeDb)
                 
         }
      }
      requestQuery.distanceInMeters =distanceInMeters;

    //  console.log('check  requestQuery.distanceInMeters', requestQuery.distanceInMeters)
   //}

     

       

        if  ( CommonMessage.IsValid(requestQuery.lat)==true && CommonMessage.IsValid(requestQuery.long)==true ) {
        
            resultCityArea  = await AreaMasters.getCityAreaForBeepOnOffService(requestQuery.lockId, req); 
        }
        
        if (result.rows[0].registartion_status === true) {            
            result = await DashboardServices.updateDeviceInformationInMultiPart(requestQuery,req);
            if(result ==false)
            {
                
                return RequestResponse.success(res, CommonMessage.ErrorMessage(7, 'latLong'), status.success, []);
            }
            await AddLog.updateDeviceInformationLogFromMultiPart(requestQuery);
            
           
            
            if (resultCityArea != null) {


                if (resultCityArea.rowCount > 0) {

                    if(resultCityArea.rows[0].area_type_enum_id =='30')//  30 open
                    {
                        requestQuery.map_city_id =resultCityArea.rows[0].map_city_id;
                    }
                    else if(resultCityArea.rows[0].area_type_enum_id =='31')
                    {
                        requestQuery.area_id=  resultCityArea.rows[0].area_id;
                    }

                    adminLogDeviceInformationServices.updateAreaCityInLockDetail(requestQuery);

                 
                    
                    
                    
                    if(resultCityArea != null && resultCityArea.rowCount>0)
                    {

                        deviceDetails = requestQuery;                       
            
                    if(resultCityArea.rows[0].area_type_enum_id =='31')//  31 close
                    {            
                                    
                        
                        if(resultCityArea.rows[0].area_map_draw_object_enum_id ==51)//Circle                        
                        {
                            
                            if( CommonMessage.IsValid(resultCityArea.rows[0].area_api_circle_center) && CommonMessage.IsValid(resultCityArea.rows[0].area_api_circle_redius) && CommonMessage.IsValid(resultCityArea.rows[0].area_api_circle_center.x) && CommonMessage.IsValid(resultCityArea.rows[0].area_api_circle_center.y))
                            {
                                
                            // Not exists/Outside of Polygon                                                        
                               if (await geofence.IsPointExistsInCircle(resultCityArea.rows[0].area_api_circle_center.x,resultCityArea.rows[0].area_api_circle_center.y,resultCityArea.rows[0].area_api_circle_redius,  deviceDetails.latitude,  deviceDetails.longitude)==false) 
                                {
                                    
                                    beepResult= await setBeepOnInstructionCommon(deviceDetails,res, req)
                                }
                                else 
                                {
                                    
                                    if(resultCityArea.rows[0].beep_status_enum_id=='54' || resultCityArea.rows[0].beep_instruction_enum_id =='56')//54	Device_Beep_Status	BeepOn 55	Device_Beep_Status	BeepOff
                                    {
                                        
                                        beepResult=  await setBeepOffInstructionCommon(deviceDetails,res,req)
                                    }
                                   
                                }
                           }   
                        }
            
            
                       if(resultCityArea.rows[0].area_map_draw_object_enum_id ==52)//Polygon
                       {
                        
                        if( CommonMessage.IsValid(resultCityArea.rows[0].area_api_polygon))
                        {
                       // Not exists/Outside of Polygon";
                         if (await geofence.IsPointExistsInPolygon(resultCityArea.rows[0].area_api_polygon,null,deviceDetails.latitude,  deviceDetails.longitude)==false) 
                         {
                            
                            beepResult=  await setBeepOnInstructionCommon(deviceDetails,res, req)
                         }
                         else 
                         {
            
                            
                            if(resultCityArea.rows[0].beep_status_enum_id=='54' || resultCityArea.rows[0].beep_instruction_enum_id =='56')//54	Device_Beep_Status	BeepOn 55	Device_Beep_Status	BeepOff
                            {
                                
                                beepResult=   await setBeepOffInstructionCommon(deviceDetails,res, req)
                            }
                             
                         } 
                        }  
                    }
            
                       if(resultCityArea.rows[0].area_map_draw_object_enum_id ==53)//Rectangle
                       {
                        
                           //Not exists/Outside of Rectangle
                           if( CommonMessage.IsValid(resultCityArea.rows[0].area_api_south_west_point) && CommonMessage.IsValid(resultCityArea.rows[0].area_api_north_east_point)  && CommonMessage.IsValid(resultCityArea.rows[0].area_api_south_west_point.x) && CommonMessage.IsValid(resultCityArea.rows[0].area_api_south_west_point.y)
                            && CommonMessage.IsValid(resultCityArea.rows[0].area_api_north_east_point.x) && CommonMessage.IsValid(resultCityArea.rows[0].area_api_north_east_point.y) )
                           {
                              
                        if (await geofence.IsPointExistsInRectangle( resultCityArea.rows[0].area_api_south_west_point.x, resultCityArea.rows[0].area_api_south_west_point.y,resultCityArea.rows[0].area_api_north_east_point.x,resultCityArea.rows[0].area_api_north_east_point.y, deviceDetails.latitude,  deviceDetails.longitude)==false) 
                        {
                            
                            beepResult=  await setBeepOnInstructionCommon(deviceDetails,res,req)
                        }
                        else 
                        {
                            if(resultCityArea.rows[0].beep_status_enum_id=='54' || resultCityArea.rows[0].beep_instruction_enum_id =='56')//54	Device_Beep_Status	BeepOn 55	Device_Beep_Status	BeepOff
                            {
                                
            
                                beepResult= await setBeepOffInstructionCommon(deviceDetails,res,req)
                            }
                            
                        }  
                    }                            
                    } 
            
                    }
                        
                    else if(resultCityArea.rows[0].area_type_enum_id =='30')// open
                    {
            
                            if(resultCityArea.rows[0].city_map_draw_object_enum_id ==51)//Circle
                            {                                            
                                
                            if( CommonMessage.IsValid(resultCityArea.rows[0].city_api_circle_center)  && CommonMessage.IsValid(resultCityArea.rows[0].city_api_circle_redius)  && CommonMessage.IsValid(resultCityArea.rows[0].city_api_circle_center.x) && CommonMessage.IsValid(resultCityArea.rows[0].city_api_circle_center.y))
                             {
                                    
                                //Not exists/Outside of circle
                                if (await geofence.IsPointExistsInCircle(resultCityArea.rows[0].city_api_circle_center.x,resultCityArea.rows[0].city_api_circle_center.y,resultCityArea.rows[0].city_api_circle_redius,  deviceDetails.latitude,  deviceDetails.longitude)==false) 
                                {
                                   
                                beepResult=   await setBeepOnInstructionCommon(deviceDetails,res, req)
                                }
                                else 
                                {
                                    
                                    if(resultCityArea.rows[0].beep_status_enum_id=='54' || resultCityArea.rows[0].beep_instruction_enum_id =='56')//54	Device_Beep_Status	BeepOn 55	Device_Beep_Status	BeepOff
                                    {
                                        
                                        beepResult=  await setBeepOffInstructionCommon(deviceDetails,res,req)
                                    }
                                    
                                }
                              }
                            }
               
                   
                       if(resultCityArea.rows[0].city_map_draw_object_enum_id ==52)//Polygon
                       {
                        
                        // "Not exists/Outside of Polygon";
                        if(CommonMessage.IsValid(resultCityArea.rows[0].city_api_polygon)){
                        if (await geofence.IsPointExistsInPolygon(resultCityArea.rows[0].city_api_polygon,null,deviceDetails.latitude,  deviceDetails.longitude)==false) 
                        {
                            
                            beepResult= await setBeepOnInstructionCommon(deviceDetails,res,req)
                        }
                        else 
                        {
                            // 56	"Device_Beep_Instruction"	"BeepOn"
                            
                            // 54	"Device_Beep_Status"	"BeepOn" beep_instruction_enum_id ,beep_status_enum_id
                            
                            if(resultCityArea.rows[0].beep_status_enum_id=='54' || resultCityArea.rows[0].beep_instruction_enum_id =='56')//54	Device_Beep_Status	BeepOn 55	Device_Beep_Status	BeepOff
                            {
                                
                                beepResult= await setBeepOffInstructionCommon(deviceDetails,res,req)
                            }
                            
                        }  
                    }
                       }
                    
            
                       if(resultCityArea.rows[0].city_map_draw_object_enum_id ==53)//Rectangle
                       {
            
                        
                        
                        //Not exists/Outside of Rectangle
                        if( CommonMessage.IsValid(resultCityArea.rows[0].city_api_south_west_point) && CommonMessage.IsValid(resultCityArea.rows[0].city_api_north_east_point) && CommonMessage.IsValid(resultCityArea.rows[0].city_api_south_west_point.x) && CommonMessage.IsValid(resultCityArea.rows[0].city_api_south_west_point.y)
                            && CommonMessage.IsValid(resultCityArea.rows[0].city_api_north_east_point.x) && CommonMessage.IsValid(resultCityArea.rows[0].city_api_north_east_point.y))
                        {
                           
                        if (await geofence.IsPointExistsInRectangle( resultCityArea.rows[0].city_api_south_west_point.x, resultCityArea.rows[0].city_api_south_west_point.y,resultCityArea.rows[0].city_api_north_east_point.x,resultCityArea.rows[0].city_api_north_east_point.y, deviceDetails.latitude,  deviceDetails.longitude)==false) 
                        {
                            
                            beepResult= await setBeepOnInstructionCommon(deviceDetails,res, req)
                        }
                        else 
                        {
                            
                            if(resultCityArea.rows[0].beep_status_enum_id=='54' || resultCityArea.rows[0].beep_instruction_enum_id =='56')//54 Device_Beep_Status	BeepOn , 55	Device_Beep_Status	BeepOff
                            {
                                
                                beepResult=  await setBeepOffInstructionCommon(deviceDetails,res,req)
                            }
                            
                           
                        }  
                       } 
                    }
                    }
                        
                    if(beepResult==false)
                    {
                        return ;
                    }
                   }   
                
                   
                    return RequestResponse.success(res, apiMessage.addDeviceDetails, status.success, []);
                } else {
                    return RequestResponse.success(res, apiMessage.somethingWentWrong, status.success, []);
                }
            }
            return RequestResponse.success(res, apiMessage.addDeviceDetails, status.success, []);                    
      } 
      else {
            return RequestResponse.validationError(res, apiMessage.deviceIsNotRegister, status.success, []);
        }
        //}
    } catch (error: any) {

        AddExceptionIntoDB(req,error);
        return exceptionHandler(res, 1, error.message);
    }
};
//check data 

const getProduceBikeBatteryStatusController = async (req: Request, res: Response) => {
    try {
        let requestQuery = req.query;
        let bikeBatterystatus: any=[];
        
         if(requestQuery.bikeBatteryStatus=='20')
         {
            bikeBatterystatus = await adminDashboardServices.bikeBatteryStatusLessThenTwenty(requestQuery,req);
           
         }
         else if(requestQuery.bikeBatteryStatus=='50')
         {
            bikeBatterystatus = await adminDashboardServices.produceBikeBatteryStatusGraterThenTwentyAndLessThenFifty(requestQuery,req)    
                   
         }
         else if(requestQuery.bikeBatteryStatus=='100')
         {
            bikeBatterystatus = await adminDashboardServices.produceBikeBatteryStatusGraterThenFifty(requestQuery,req); 
                             
         }
             
         
         
        
        if (bikeBatterystatus.length > 0 ) {
            //result.push({
                bikeBatterystatus;
                
           // });
            return RequestResponse.success(res, apiMessage.success, status.success, bikeBatterystatus);
        } else {
            return RequestResponse.success(res, apiMessage.somethingWentWrong, status.info, []);
        }
    } catch (error: any) {
        AddExceptionIntoDB(req,error);
        return exceptionHandler(res, 1, error.message);
    }
};

const qrDecrypted = async (req: Request, res: Response) => {
    try {

        // return RequestResponse.validationError(res, 'Sorry you can not start ride all bike is undermantance.', status.error, []);

        
        if ((req.body.qrString == undefined || req.body.qrString == null) && (req.body.lockNumber == undefined || req.body.lockNumber == null)  ) 
       {
    
            return RequestResponse.validationError(res, apiMessage.qrString, status.error, []);
        }
        if ((req.body.qrString != undefined || req.body.qrString != null) && (req.body.lockNumber != undefined || req.body.lockNumber != null))
        {
           
            return RequestResponse.validationError(res, apiMessage.qrStringNot, status.error, []);
        }
        
       
        let data: any = await decrypt(req.body);




        if (data.length <= 0) {

            return RequestResponse.validationError(res, apiMessage.noDataFound, status.error, []);
        }


        //console.log('await rideScanValidationsControllerForCheckFarePlan(data,res)',await rideScanValidationsControllerForCheckFarePlan(data,res));

        //    if( await rideScanValidationsControllerForCheckFarePlan(data,res)==false)
        //     {   
        //        return;           
        //     }     

        let bikeValidation = await rideScanValidationsController(data, res, req);

        return bikeValidation;
    } catch (error: any) {
        AddExceptionIntoDB(req,error);
        return exceptionHandler(res, 1, error.message);
    }

};

const rideScanValidationsControllerForCheckFarePlan = async (requestBody: any, res: Response,req:any) => {
    try {


        let bike = requestBody;
        
        let bikeresult: any = await RideBooking.getBikeDetails({ bike });
        let data: any = [];
        if (bikeresult.rowCount <= 0) {
            RequestResponse.validationError(res, apiMessage.bikeNotFound, status.success, []);
            return false;
        }
        data.modelId = bikeresult.rows[0].model_id;
        data.lockId = bikeresult.rows[0].lock_id;
        data.uId = bikeresult.rows[0].uid_id;

        // console.log('check model id  requestBody.modelId', data.modelId)
        // let zoneResult: any = await RideBooking.getZoneForRideBooking(data);
        // if (zoneResult.rowCount <= 0) {
        //     RequestResponse.validationError(res, 'For this bike zone is not found.', status.success, []);
        //     return false;
        // }
        data.zoneId = bikeresult.rows[0].zone_id;


        let areaAndAreaTypeResult: any = await RideBooking.getAreaAndAreaType(data);
        if (areaAndAreaTypeResult.rowCount <= 0)
        {
            RequestResponse.validationError(res, 'For this  zone area is not found.', status.success, []);
            return false;
        }
        
        data.areaId = areaAndAreaTypeResult.rows[0].area_id;
        data.cityId = areaAndAreaTypeResult.rows[0].map_city_id;
        data.areaTypeEnumId = areaAndAreaTypeResult.rows[0].area_type_enum_id;
        data.apDate = getUTCdate();
        data.aplicableDate = getUTCdate()

        if( data.areaTypeEnumId==30)
        {
            data.areaId =0;
        }

     
        let farePlanResultesult: any = await RideBooking.getFarePlanDataForRideBooking(data);
        if (farePlanResultesult.rowCount <= 0) {
            RequestResponse.validationError(res, 'For this bike no plan availale.', status.success, []);
            return false;
        }
        let todayRate: any = 0;
        let farePlanDetail: any = [];


        if (Dateformats.ConvertUTCtoDayformat() == 'Monday') {
            if (farePlanResultesult.rows[0].per_minute_rate_monday == null || farePlanResultesult.rows[0].per_minute_rate_monday < 0) {
                RequestResponse.validationError(res, apiMessage.planNotActive, status.success, []);
                return false;
            }
            todayRate = farePlanResultesult.rows[0].per_minute_rate_monday;

        }


        if (Dateformats.ConvertUTCtoDayformat() == 'Tuesday') {
            if (farePlanResultesult.rows[0].per_minute_rate_tuesday == null || farePlanResultesult.rows[0].per_minute_rate_tuesday < 0) {
                RequestResponse.validationError(res, apiMessage.planNotActive, status.success, []);
                return false;
            }
            todayRate = farePlanResultesult.rows[0].per_minute_rate_tuesday;
        }

        if (Dateformats.ConvertUTCtoDayformat() == 'Wednesday') {
            if (farePlanResultesult.rows[0].per_minute_rate_wednesday == null || farePlanResultesult.rows[0].per_minute_rate_wednesday < 0) {
                RequestResponse.validationError(res, apiMessage.planNotActive, status.success, []);
                return false;
            }
            todayRate = farePlanResultesult.rows[0].per_minute_rate_wednesday;
        }


        if (Dateformats.ConvertUTCtoDayformat() == 'Thursday') {
            if (farePlanResultesult.rows[0].per_minute_rate_thursday == null || farePlanResultesult.rows[0].per_minute_rate_thursday < 0) {
                RequestResponse.validationError(res, apiMessage.planNotActive, status.success, []);
                return false;
            }
            todayRate = farePlanResultesult.rows[0].per_minute_rate_thursday;
        }


        if (Dateformats.ConvertUTCtoDayformat() == 'Friday') {
            if (farePlanResultesult.rows[0].per_minute_rate_friday == null || farePlanResultesult.rows[0].per_minute_rate_friday < 0) {
                RequestResponse.validationError(res, apiMessage.planNotActive, status.success, []);
                return false;
            }
            todayRate = farePlanResultesult.rows[0].per_minute_rate_friday;
        }


        if (Dateformats.ConvertUTCtoDayformat() == 'Saturday') {
            if (farePlanResultesult.rows[0].per_minute_rate_saturday == null || farePlanResultesult.rows[0].per_minute_rate_saturday < 0) {
                RequestResponse.validationError(res, apiMessage.planNotActive, status.success, []);
                return false;
            }
            todayRate = farePlanResultesult.rows[0].per_minute_rate_saturday;
        }

        if (Dateformats.ConvertUTCtoDayformat() == 'Sunday') {
            if (farePlanResultesult.rows[0].per_minute_rate_sunday == null || farePlanResultesult.rows[0].per_minute_rate_sunday < 0) {
                RequestResponse.validationError(res, apiMessage.planNotActive, status.success, []);
                return false;
            }
            todayRate = farePlanResultesult.rows[0].per_minute_rate_sunday;
        }


        farePlanDetail.push({
            farePlanId: Number(farePlanResultesult.rows[0].id),
            minimumHireMinuts: Number(farePlanResultesult.rows[0].hire_minuts),
            todaysRate: (todayRate),
        })

        // RequestResponse.success(res, 'check success.', status.success,farePlanDetail); 
        return farePlanDetail;
    } catch (error: any) {
        AddExceptionIntoDB(req,error);
        return exceptionHandler(res, 1, error.message);
    }
};

const updateUserMinimumWalletBalanceValuesController = async (req: Request, res: Response) => {
    let requestBody = req.body;
    if (!requestBody.enum_id) {
        return RequestResponse.validationError(res, 'Please Provide Enum Id.', status.error, []);
    }
    if (!requestBody.enum_value) {
        return RequestResponse.validationError(res, 'Please Provide Enum Value.', status.error, []);
    }
    try {
        let result: any = await DashboardServices.updateUserMinimumWalletBalanceValues(requestBody,req);
        if (result.rowCount <= 0) {
            return RequestResponse.success(res, apiMessage.noDataFound, status.success, null);
        } else {
            result = await DashboardServices.addMinimumWalletBalanceHistory(requestBody,req);
            return RequestResponse.success(res, apiMessage.success, status.success, []);
        }
    } catch (error: any) {
        AddExceptionIntoDB(req,error);
        return exceptionHandler(res, 1, error.message);
    }
};

const getMinimumWalletBalanceHistoryController = async (req: Request, res: Response) => {
    try {
        let requestQuery = req.query;
        let result: any = await DashboardServices.getMinimumWalletBalanceHistory(requestQuery,req);
        let walletHistory = [];
        for (let row of result.rows) {
            walletHistory.push({
                id: row.id,
                enum_value: row.amount,
                statusEnumId: row.status_enum_id,
                statusName: row.status_name,
                remarks: row.remarks,
                actionRemarks: row.action_remarks,
                createdonDate: row.createdon_date,
                createdbyLoginUserId: row.createdby_login_user_id,
                createdByUserName: row.created_by_user_name,
                createdbyUserTypeEnumId: row.createdby_user_type_enum_id,
                createdByUserTypeName: row.created_by_user_type_name,
                updatedLoginUserId: row.updated_login_user_id,
                updatedLoginUserName: row.updated_login_user_name,
                updatedonDate: row.updatedon_date,
                updatedByUserTypeEnumId: row.updatedby_user_type_enum_id,
                updatedByUserTypeName: row.updated_by_user_type_name ,
                addAmountFor : row.add_amount_for ,
                addAmountForName : row.add_amount_for_name ,
            });
        }

        if (result.rowCount > 0) {
            return RequestResponse.success(res, apiMessage.success, status.success, walletHistory);
        } else {
            return RequestResponse.success(res, apiMessage.recordNotFound, status.success, []);
        }
    } catch (error: any) {
        AddExceptionIntoDB(req,error);

        return exceptionHandler(res, 1, error.message);
    }
};

// ('*/5 * * * *', async () => {
//     let updateTime: any;  
//     let   insertSchedule : any;

//     let   updateSchedule : any;
//     let actionOnDate = getUTCdate();
//     try {
//         insertSchedule=  await DashboardServices.insertScheduleTime(actionOnDate)  
//         updateTime = await DashboardServices.updateDeviceState(actionOnDate); 

//         if (updateTime.command=='UPDATE')
//         if (insertSchedule.rowCount > 0) {                         
//             updateSchedule= await DashboardServices.updateScheduleTime(actionOnDate,insertSchedule.rows[0].id) 

//         }
//             return 0;            
//     } catch (error: any) {
//         logger.error(error);
//         return 'not work';
//     }


//     });

const getWellcomMSG = async (req: Request, res: Response) => {
    try {
        let requestQuery = req.query;

        let check: any;
        check = 'Test Unlock Detail';

        return RequestResponse.success(res, apiMessage.recordNotFound, status.success, check);

    } catch (error: any) {
        AddExceptionIntoDB(req,error);

        return exceptionHandler(res, 1, error.message);
    }
};


const getRideBookedList = async (req: Request, res: Response) => {
    try {
        let requestQuery = req.query;

        // #swagger.tags = ['Admin-Bike-Produce']
        // #swagger.description = 'Pass bikeProduceId or 0  and status_enum_id = 0  '

        /*#swagger.parameters[ {
                        "name": "bikeProduceId",
                        "in": "query",
                        "description": "",
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
        
        if(CommonMessage.IsValid(requestQuery.rideBookingId)==false)
        {
            
            requestQuery.rideBookingId='0';
        }
        
        let result: any = await BikeProduceServices.getBookedBikeList(requestQuery);
        let bikeProduceDetails = [];
        let geoFenceInOut :any ='';

        for (let row of result.rows) {                       
           // geoFenceInOut =await checkGeoInOout(row.beep_status_enum_id,row.beep_instruction_enum_id) ;
            bikeProduceDetails.push({
                bikeId: row.bike_id,
                bikeName : row.bike_name,
                id: row.user_id,
                booking_id: row.booking_id,
                userName: row.user_name,
                mobileNumber: row.mobile,
                fromRideTime: row.from_ride_time,
                lockId: row.lock_id,
                lockNumber: row.lock_number,
                batteryPercentage: row.battery ,

                deveiceStateEnumId: row.deveice_state_enum_id,
                deveiceStatus: resolveDeviceStatus(row.deveice_state_enum_id, row.device_last_request_time, row.deveice_status),
                device_lock_and_unlock_status: row.device_lock_and_unlock_status,
                device_lock_unlock_status: row.device_lock_unlock_status,
                location: row.location,
                latitude: row.latitude,
                longitude: row.longitude,
                altitude: row.altitude,
                deviceLightStatusEnumId: row.device_light_status_enum_id,
                deviceLightStatus: row.deveice_light_status,
                deviceLightInstructionEnumId : row.device_light_instruction_enum_id,
                deviceLightInstruction : row.device_light_instruction,
                light_off_count  : row.light_off_count,
                light_on_count : row.light_on_count, 
                device_lock_count : row.device_lock_count,
                device_unlock_count : row.device_unlock_count,
                deviceLastRequestTime: row.device_last_request_time,

                beepStatusEnumId : row.beep_status_enum_id,
                beepStatusName : row.beep_status_name,
                beepInstructionEnumId : row.beep_instruction_enum_id,
                beepInstructionName : row.beep_instruction_name,
                instructionId : row.instruction_id,
                instructionName : row.instruction_name,
                geofenceInOutEnumId  : row.geofence_inout_enum_id,
                geoFenceInOut           : row.geofence_inout_name,

                rideBookingNo : row.ride_booking_no,

                bikeBookedStatus: row.bike_booked_status,
                bikeBookedStatusName: row.bike_booked_status_name,
                powerOnOffStatusEnumId : row.power_on_off_status_enum_id,
                powerOnOffStatus: row.power_on_off_status
            });
        }

        if (result.rowCount > 0) {
            return RequestResponse.success(res, apiMessage.success, status.success, bikeProduceDetails);
        } else {
            return RequestResponse.success(res, apiMessage.recordNotFound, status.success, []);
        }
    } catch (error: any) {
        AddExceptionIntoDB(req,error);
        return exceptionHandler(res, 1, error.message);
    }
};

const getLatLog = async (req: Request, res: Response) => {
    try {
        // #swagger.tags = ['Admin-Bike-Produce']
        // #swagger.description = 'Pass bikeProduceId or 0  and status_enum_id = 0  '

        /*#swagger.parameters[ {
                        "name": "bikeProduceId",
                        "in": "query",
                        "description": "",
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

        let requestQuery: any = req.query;
        const searchRef: any = requestQuery.searchRef || requestQuery.deviceId || requestQuery.lockNumber || requestQuery.bikeName || requestQuery.vehicleNo || requestQuery.bikeId;

        if (CommonMessage.IsValid(searchRef) == false) {
            return RequestResponse.validationError(res, 'Please provide searchRef / bikeName / lockNumber / deviceId', status.info, []);
        }

        requestQuery.deviceId = String(searchRef);
        let result: any = await BikeProduceServices.getDeveiceLatLog(requestQuery);
        let bikeProduceDetails = [];


        for (let row of result.rows) {

            bikeProduceDetails.push({
                id: row.bike_id || row.lock_id,
                bikeId: row.bike_id,
                bikeName: row.bike_name,
                lockId: row.lock_id,
                lockNumber: row.lock_number,
                deviceId: row.device_id,
                imeiNumber: row.imei_number,
                location: row.location,
                latitude: row.latitude,
                longitude: row.longitude,
                altitude: row.altitude,

            });
        }

        if (result.rowCount > 0) {
            return RequestResponse.success(res, apiMessage.success, status.success, bikeProduceDetails);
        } else {
            return RequestResponse.success(res, apiMessage.recordNotFound, status.success, []);
        }
    } catch (error: any) {
        AddExceptionIntoDB(req,error);
        return exceptionHandler(res, 1, error.message);
    }
};

const getAvaialableBikeList = async (req: Request, res: Response) => {
    try {
        // #swagger.tags = ['Admin-Bike-Produce']
        // #swagger.description = 'Pass bikeProduceId or 0  and status_enum_id = 0  '

        /*#swagger.parameters[ {
                        "name": "bikeProduceId",
                        "in": "query",
                        "description": "",
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
        let requestQuery = req.query;
         let geoFenceInOut :any ='';
         

          if(CommonMessage.IsValid(requestQuery.lockId)==false)
        {
            requestQuery.lockId='0';
        }
        let result: any;
        if(requestQuery.cardDataFor=='PowerOnOrUnlock')
        {
          //  console.log('check query', )
             result = await BikeProduceServices.availableLockUnlockCardDetailService(requestQuery);
        }
       else
        {
            //console.log('check query avaiable')
             result= await BikeProduceServices.getAvailableBikeList(requestQuery);
         }
        
        let bikeProduceDetails = [];

        
        for (let row of result.rows) {
             
       
           // geoFenceInOut =await checkGeoInOout(row.beep_status_enum_id,row.beep_instruction_enum_id) ;
      
            bikeProduceDetails.push({
                id: row.id,

                lockId: row.lock_id,
                lockNumber: row.lock_number,
                bikeName : row.bike_name,
                deveiceStateEnumId: row.deveice_state_enum_id,
                deveiceStatus: resolveDeviceStatus(row.deveice_state_enum_id, row.device_last_request_time, row.deveice_status),
                device_lock_and_unlock_status: row.device_lock_and_unlock_status,
                device_lock_unlock_status: row.device_lock_unlock_status,
                location: row.location,
                latitude: row.latitude,
                longitude: row.longitude,
                altitude: row.altitude,
                zoneName: row.zone_name,
                batteryPercentage : row.battery,
                deviceLightStatusEnumId: row.device_light_status_enum_id,
                deviceLightStatus: row.deveice_light_status,
                deviceLightInstructionEnumId : row.device_light_instruction_enum_id,
                deviceLightInstruction : row.device_light_instruction ,
                deviceLastRequestTime: row.device_last_request_time,

                    beepStatusEnumId : row.beep_status_enum_id,
                    beepStatusName : row.beep_status_name,
                    beepInstructionEnumId : row.beep_instruction_enum_id,
                    beepInstructionName : row.beep_instruction_name,
                    instructionId : row.instruction_id,
                    instructionName : row.instruction_name,
                    geofenceInOutEnumId  : row.geofence_inout_enum_id,
                    geoFenceInOut           : row.geofence_inout_name ,   
                    bikeBookedStatus: row.bike_booked_status,
                    bikeBookedStatusName: row.bike_booked_status_name,     
                    powerOnOffStatusEnumId : row.power_on_off_status_enum_id,
                    powerOnOffStatus: row.power_on_off_status
                // deviceLockAndUnlockStatus: row.device_lock_and_unlock_status,                                                                                                          
            });
        }

        if (result.rowCount > 0) {
            return RequestResponse.success(res, apiMessage.success, status.success, bikeProduceDetails);
        } else {
            return RequestResponse.success(res, apiMessage.recordNotFound, status.success, []);
        }
    } catch (error: any) {
        AddExceptionIntoDB(req,error);
        return exceptionHandler(res, 1, error.message);
    }
};


const rideScanValidationsController = async (bikeId: any, res: Response, req :any) => {

    try {

        let bike = bikeId[0].bikeId;

        let result: any = await RideBooking.getBikeDetails({ bike });
        if (result.rowCount <= 0) {
            return RequestResponse.validationError(res, apiMessage.bikeNotFound, status.success, bikeId);

        }

        if (result.rows[0].bike_booked_status === '13') {
            return RequestResponse.validationError(res, apiMessage.bikeBooked, status.success, bikeId);

        }

        if (result.rows[0].bike_booked_status === '35') {
            return RequestResponse.validationError(res, 'This Bike Is Undermaintenance.', status.success, bikeId);

        }
       
        let farePlanV: any = await rideScanValidationsControllerForCheckFarePlan(bike, res, req)
        if (farePlanV == false) {
            return;
        }        
        let walletAmount: any = 0;
        let walletAmountFromEnum: any = 0;
        let currentWallet: any = 0;
        let userId = bikeId[0].userId;

        walletAmount = await RideBooking.getWalletAmount({ userId });

        if (walletAmount.rowCount <= 0) {
            return RequestResponse.validationError(res, apiMessage.bikeNotFound, status.success, bikeId);
        }
        walletAmountFromEnum = await RideBooking.getWalletAmountToEnumTbl();

        if (walletAmountFromEnum.rowCount <= 0) {
            return RequestResponse.validationError(res, apiMessage.bikeNotFound, status.success, bikeId);
        }
        currentWallet = (walletAmountFromEnum.rows[0].enum_key - walletAmount.rows[0].min_wallet_amount).toFixed(2);

        if (currentWallet >= 0) {
            if (currentWallet == 0) {
                currentWallet = 1;
            }

            //return RequestResponse.validationError(res, 'please add Minimum wallet Amount. ' + currentWallet + '', status.success, bikeId);
        }



        return RequestResponse.success(res, apiMessage.success, status.success, bikeId);
    } catch (error: any) {
        AddExceptionIntoDB(req,error);
        return exceptionHandler(res, 1, error.message);
    }
};


const rideBookingValidationsController = async (bikeId: any, res: Response, req :any) => {
    try {

        let bike = bikeId[0].bikeId;

        let result: any = await RideBooking.getBikeDetails({ bike });

        if (result.rowCount <= 0) {
            return RequestResponse.validationError(res, apiMessage.bikeNotFound, status.success, bikeId);

        }

        if (result.rows[0].bike_booked_status === '13') {
            return RequestResponse.validationError(res, apiMessage.bikeBooked, status.success, bikeId);

        }
        
        let walletAmount: any = 0;
        let walletAmountFromEnum: any = 0;
        let currentWallet: any = 0;
        let userId = bikeId[0].userId;
        //  console.log('chekc user rjejfksges id',userId)
        walletAmount = await RideBooking.getWalletAmount({ userId });

        if (walletAmount.rowCount <= 0) {
            return RequestResponse.validationError(res, apiMessage.bikeNotFound, status.success, bikeId);
        }
        walletAmountFromEnum = await RideBooking.getWalletAmountToEnumTbl();

        if (walletAmountFromEnum.rowCount <= 0) {
            return RequestResponse.validationError(res, apiMessage.bikeNotFound, status.success, bikeId);
        }
        currentWallet = (walletAmountFromEnum.rows[0].enum_key - walletAmount.rows[0].min_wallet_amount).toFixed(2);

        if (currentWallet >= 0) {
            if (currentWallet == 0) {
                currentWallet = 1;
            }

            return RequestResponse.validationError(res, 'please add Minimum wallet Amount. ' + currentWallet + '', status.success, bikeId);
        }
        return RequestResponse.success(res, apiMessage.success, status.success, bikeId);
    } catch (error: any) {
        AddExceptionIntoDB(req,error);
        return exceptionHandler(res, 1, error.message);
    }
};



const getUndermaintenanceBikeList = async (req: Request, res: Response) => {
    try {
        // #swagger.tags = ['Admin-Bike-Produce']
        // #swagger.description = 'Pass bikeProduceId or 0  and status_enum_id = 0  '

        /*#swagger.parameters[ {
                        "name": "bikeProduceId",
                        "in": "query",
                        "description": "",
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
        let requestQuery = req.query;
        

 if(CommonMessage.IsValid(requestQuery.lockId)==false)
        {
            requestQuery.lockId='0';
        }
        let result: any = await BikeProduceServices.getUndermaintenanceBikeList(requestQuery);
        let bikeProduceDetails = [];
        let geoFenceInOut :any =''
        
        if (result.rowCount > 0) {
        for (let row of result.rows) {

           // geoFenceInOut =await checkGeoInOout(row.beep_status_enum_id,row.beep_instruction_enum_id) ;


            
            bikeProduceDetails.push({
                id: row.id,
                bikeName : row.bike_name,
                lockId: row.lock_id,
                lockNumber: row.lock_number,

                deveiceStateEnumId: row.deveice_state_enum_id,
                deveiceStatus: resolveDeviceStatus(row.deveice_state_enum_id, row.device_last_request_time, row.deveice_status),
                device_lock_and_unlock_status: row.device_lock_and_unlock_status,
                device_lock_unlock_status: row.device_lock_unlock_status,
                location: row.location,
                latitude: row.latitude,
                longitude: row.longitude,
                altitude: row.altitude,
                zoneName: row.zone_name,
                
                deviceLightStatusEnumId: row.device_light_status_enum_id,
                deviceLightStatus: row.deveice_light_status,
                deviceLightInstructionEnumId : row.device_light_instruction_enum_id,
                deviceLightInstruction : row.device_light_instruction,
                batteryPercentage :  row.battery ,
                deviceLastRequestTime: row.device_last_request_time,

                beepStatusEnumId : row.beep_status_enum_id,
                  beepStatusName : row.beep_status_name,
                    beepInstructionEnumId : row.beep_instruction_enum_id,
                    beepInstructionName : row.beep_instruction_name,
				    instructionId  : row.instruction_id ,
                    instructionName  : row.instruction_name,
                    geofenceInOutEnumId  : row.geofence_inout_enum_id,
                    geoFenceInOut           : row.geofence_inout_name,
                    bikeBookedStatus: row.bike_booked_status,
                    bikeBookedStatusName: row.bike_booked_status_name,
                    powerOnOffStatusEnumId : row.power_on_off_status_enum_id,
                    powerOnOffStatus: row.power_on_off_status
                //deviceLockAndUnlockStatus: row.device_lock_and_unlock_status,                                                                                                          
            });
        }

        
            return RequestResponse.success(res, apiMessage.success, status.success, bikeProduceDetails);
        } else {
            return RequestResponse.success(res, apiMessage.recordNotFound, status.success, []);
        }
    } catch (error: any) {
        AddExceptionIntoDB(req,error);
        return exceptionHandler(res, 1, error.message);
    }
};


const getLockDetailForTestPage = async (req: Request, res: Response) => {
    try {
        // #swagger.tags = ['Admin-Bike-Produce']
        // #swagger.description = 'Pass bikeProduceId or 0  and status_enum_id = 0  '

        /*#swagger.parameters[ {
                        "name": "bikeProduceId",
                        "in": "query",
                        "description": "",
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
        let requestQuery = req.query;

        //     if ( CommonMessage.IsValid(requestQuery.lockNumber  )==false) {
        //         RequestResponse.validationError(res, 'Please Set lockNumber', status.error, []);
        //         return false; 
        //    }
        if (CommonMessage.IsValid(requestQuery.deviceLockAndUnlockStatus) == false) {
            RequestResponse.validationError(res, 'Please Set deviceLockAndUnlockStatus', status.error, []);
            return false;
        }
        if (CommonMessage.IsValid(requestQuery.deviceLightStatusEnumId) == false) {
            RequestResponse.validationError(res, 'Please Set deviceLightStatusEnumId', status.error, []);
            return false;
        }

        if (CommonMessage.IsValid(requestQuery.beepStatusEnumId) == false) 
        {
            RequestResponse.validationError(res, 'Please Set beepStatusEnumId', status.error, []);
            return false;
        }
        
        let result: any = await AllotmentServices.getLockDetailForTestPageService(requestQuery, req);

        
        let lockDetails = [];
        if (result.rowCount > 0) {
            for (let row of result.rows) {
                lockDetails.push({
                    lockId: row.id,
                    lockNumber: row.lock_number,
                    batteryPercentage: row.battery,
                    registartionStatus: row.registartion_status,
                    statusEnumId: row.status_enum_id,
                    statusName: row.status,
                    latitude: row.latitude,
                    longitude: row.longitude,
                    altitude: row.altitude,
                    speed: row.speed,
                    internalBatteryVoltage: row.internal_batt_v,
                    externalBatteryVoltage: row.external_batt_v,
                    deviceLockAndUnlockStatus: row.device_lock_and_unlock_status,
                    lockStatus: row.lock_status,
                    instructionId: row.instruction_id,
                    instructionName: row.instruction_name,

                    allotmentStatusId: row.allotment_status_id,
                    allotmentStatus: row.allotment_status,

                    deveiceStateEnumId: row.deveice_state_enum_id,
                    deveiceStatus: row.deveice_state,
                    deviceLastRequestTime: row.device_last_request_time,
                    deviceLightStatusEnumId: row.device_light_status_enum_id,
                    deviceLightStatus: row.device_light_status,
                    deviceLightInstructionEnumId : row.device_light_instruction_enum_id,
                    deviceLightInstruction : row.device_light_instruction ,
                    createdonDate: row.createdon_date,
                    updatedonDate: row.updatedon_date,
                    lockIMEINumber: row.lock_imei_number,
                    lastdateforlatlong: row.lastupdateddateforlatlong,
                    lastdateforbatterypercentage: row.lastupdateddateforbatterypercentage,
                    lastdateforinternalbatteryvolt: row.lastupdateddateforinternalbatteryvolt,
                    lastdateforexternalbatteryvolt: row.lastupdateddateforexternalbatteryvolt,
                    lastdateforspeed: row.lastupdateddateforspeed,
                    lastdateforlockunlock: row.lastupdateddateforlockunlock,
                    lastdateforlightonoff: row.lastupdateddateforlightonoff,
                    lastdateforaltitude: row.lastupdateddateforaltitude,
                    lastupdateddateforbeeponoff : row.lastupdateddateforbeeponoff,
                    beepStatusEnumId : row.beep_status_enum_id,
                    beepStatusName : row.beep_status_name,
                    beepInstructionEnumId : row.beep_instruction_enum_id,
                    beepInstructionName : row.beep_instruction_name,
                    bikeBookedStatus: row.bike_booked_status,
                    bikeBookedStatusName: row.bike_booked_status_name,
                });
            }


            return RequestResponse.success(res, apiMessage.success, status.success, lockDetails);
        } else {
            return RequestResponse.success(res, apiMessage.recordNotFound, status.success, []);
        }
    } catch (error: any) {
        AddExceptionIntoDB(req,error);
        return exceptionHandler(res, 1, error.message);
    }
};

// const InsertFarePlan = async (req: Request, res: Response) => {
//     try {
//             return RequestResponse.success(res, apiMessage.success, status.success, 'work in prograss');

//     } catch (error: any) {
//         logger.error(error);
//         return exceptionHandler(res, 1, error.message);
//     }
// };

const setDeviceLightOnInstructionController = async (req: Request, res: Response) => {

    let requestBody = req.body;
    requestBody.instructionDeviceLightInstructionEnumId = '43';
    requestBody.statusEnumId = '1';
    requestBody.deviceLightStatusEnumId = null;
    requestBody.deviceLightInstructionEnumId = requestBody.instructionDeviceLightInstructionEnumId;    
    requestBody.lightRequetFrom='LightOffOnRequestFromLightOnOffController';
     await setDeviceInstructionLightOnOffController(requestBody, res, req);
}


const setDeviceLightOffInstructionController = async (req: Request, res: Response) => {

    let requestBody =  req.body;    
    requestBody.instructionDeviceLightInstructionEnumId = '44';
    requestBody.statusEnumId = '1';
    requestBody.deviceLightStatusEnumId = null;
    requestBody.deviceLightInstructionEnumId = requestBody.instructionDeviceLightInstructionEnumId;
    requestBody.lightRequetFrom ='LightOffOnRequestFromLightOnOffController'

     await setDeviceInstructionLightOnOffController(requestBody, res, req);
}

const setDeviceInstructionLightOnOffController = async (requestQuery: any, res: Response,req :any) => {
    let lightRequetFrom :any ='LightOffOnRequestFromLightOnOffController';
    requestQuery.instructionLastUpdateDate =getUTCdate();
    try {

        
              
        if (CommonMessage.IsValid(requestQuery.deviceId) == false) {
            
            if(requestQuery.lightRequetFrom==lightRequetFrom)
            {
             RequestResponse.validationError(res, apiMessage.deviceSetId, status.error, []);
            }
            return false;
        }
        if (CommonMessage.IsValid(requestQuery.userId) == false) {
            
            if(requestQuery.lightRequetFrom==lightRequetFrom)
            {
            
             RequestResponse.validationError(res, apiMessage.userSetId, status.error, []);
             return false
            }
            
            

           let getVerifyT : any = await getTokenDetail(requestQuery.access_token);
           
            if(getVerifyT != null)
            {
                
                requestQuery.userId = getVerifyT.id ;
            }          
            else
            {
                
                return true;
            }
            
        }
        let getLockIdByLockNumber: any = await adminLogDeviceInformationServices.getLockIdByLockNumberService(requestQuery);

        if (getLockIdByLockNumber.rowCount == 0)
        {           
            RequestResponse.validationError(res, apiMessage.lockNotAvailable, status.error, []);
            return false;
        }

        
       
     
        if (getLockIdByLockNumber.rows[0].device_light_instruction_enum_id == requestQuery.instructionDeviceLightInstructionEnumId) {
            
            if(requestQuery.lightRequetFrom==lightRequetFrom)
            {
            
            RequestResponse.validationError(res, apiMessage.intractionsAlready, status.error, []);
            return false;
            }
            else
            {            
             return true ;  // If light is already off then below code skip ( this function call from device lock and ride end).
            }   
           
        }
        requestQuery.lockId = getLockIdByLockNumber.rows[0].id;
        requestQuery.createdonDate = getUTCdate()

        let result: any;

        let rideingIdResult: any = await adminLogDeviceInformationServices.getRideingIdByLockNumberService(requestQuery);

        if (rideingIdResult.rowCount > 0) {            
            requestQuery.rideBookingId = rideingIdResult.rows[0].id;                               
        }
        else {
            requestQuery.rideBookingId = '0';
        }
        client
            .query('BEGIN')
            .then(async (res) => {

                result = await adminLogDeviceInformationServices.addDeviceLightInformationslog(requestQuery);
               // console.log('admin line 3228')
                return result;
            })
            .then(async (res) => {

                result = await DashboardServices.setDeviceLightOnOffInstruction(requestQuery,req);
                return result;
            })
            .then(async (res) => {

                result = await adminLogDeviceInformationServices.insertDeviceLightInstrusctions(requestQuery);
                return result;
            })
            .then((res) => {

                return client.query('commit');
            })
            .then((r) => {
                if (result.rowCount > 0) {

                    if(requestQuery.lightRequetFrom==lightRequetFrom)
                    {
                    RequestResponse.success(res, apiMessage.success, status.success, []);                                                           
                    }

                    return true ;                                      
                } else {                 
                     RequestResponse.success(res, apiMessage.somethingWentWrong, status.info, []);                    
                     return false;
                }
            })
            .catch((err) => {
                client.query('rollback');   
                AddExceptionIntoDB(req,err);             
                    exceptionHandler(res, 1, err.message);                
                return  false 
            })
            .catch((err) => {
                AddExceptionIntoDB(req,err);
                 exceptionHandler(res, 1, err.message);                
                return false 
            });

    } catch (error: any) {
        AddExceptionIntoDB(req,error);    
        exceptionHandler(res, 1, error.message);
        return false;
    }
};



//---
const lightOnToDeviceController = async (req: Request, res: Response) => {

    let requestQuery = req.query;
    requestQuery.instructionDeviceLightInstructionEnumId = '48';
    requestQuery.statusEnumId = '1';
    requestQuery.deviceLightInstructionEnumId = '0';
    requestQuery.deviceLightStatusEnumId = '41';
    requestQuery.userId = '0';
    requestQuery.apiRequestFromEnumId = '64';
    await insertApiRequest(req)  
    let LightOn: any = await lightOnOffToDeviceController(requestQuery, res, req);
}

const lightOffToDeviceController = async (req: Request, res: Response) => {
    let requestQuery = req.query;
    requestQuery.instructionDeviceLightInstructionEnumId = '47';
    requestQuery.statusEnumId = '1';
    requestQuery.deviceLightInstructionEnumId = '0';
    requestQuery.deviceLightStatusEnumId = '42';
    requestQuery.userId = '0';
    requestQuery.apiRequestFromEnumId = '64';
    await insertApiRequest(req)  
    let LightOn: any = await lightOnOffToDeviceController(requestQuery, res, req);
}

const lightOnOffToDeviceController = async (requestQuery: any, res: Response, req :any) => {
    try {
        
        if (CommonMessage.IsValid(requestQuery.dId) == false) {
            RequestResponse.validationError(res, apiMessage.deviceSetId, status.error, []);
            return false;
        }
        requestQuery.deviceId = requestQuery.dId;
        requestQuery.device_lock_unlock_communication_enum_id = '93';// online 
        

        let getLockIdByLockNumber: any = await adminLogDeviceInformationServices.getLockIdByLockNumberService(requestQuery);

        if (getLockIdByLockNumber.rowCount == 0) {
            RequestResponse.validationError(res, apiMessage.lockNotAvailable, status.error, []);
            return false;
        }   


        if(requestQuery.deviceLightStatusEnumId =='42') 
        {
            if(config.CLIENT_NAME==kClientName.clientEvegah)
            {
            if(getLockIdByLockNumber.rows[0].device_light_instruction_enum_id !='44'  )// for check set instruction light off 
            {
                return RequestResponse.success(res, apiMessage.instructionNotSet, status.success, []);               
            }
           }
        }


        if(requestQuery.deviceLightStatusEnumId =='41') 
        {
            if(config.CLIENT_NAME==kClientName.clientEvegah)
            {
            if(getLockIdByLockNumber.rows[0].device_light_instruction_enum_id !='43'  )// for check set instruction light on 
            {
                return RequestResponse.success(res, apiMessage.instructionNotSet, status.success, []);               
            }
           }
        }
            
        requestQuery.lockId = getLockIdByLockNumber.rows[0].id;
        requestQuery.createdonDate = getUTCdate()
        requestQuery.device_lock_detail_light_instruction_enum_id = 45;
        let device_light_status_enum_id :any =getLockIdByLockNumber.rows[0].device_light_status_enum_id 
        let result: any;

        let rideingIdResult: any = await adminLogDeviceInformationServices.getRideingIdByLockNumberService(requestQuery);
        
        if (rideingIdResult.rowCount > 0) {
            requestQuery.rideBookingId = rideingIdResult.rows[0].id;      
            requestQuery.counts = 1;

        
            if(requestQuery.deviceLightStatusEnumId == '42')  // light off
            {
                requestQuery.device_lock_detail_light_instruction_enum_id = 45;                                
               await adminLogDeviceInformationServices.addLightOffCountService(requestQuery);
            }
            else
            {
             await adminLogDeviceInformationServices.addLightOnCountService(requestQuery);
            }    

            requestQuery.rideBookingId = rideingIdResult.rows[0].id;           
        }
        else {
            requestQuery.rideBookingId = '0';
        }

        client
            .query('BEGIN')
            .then(async (res) => {

                result = await adminLogDeviceInformationServices.addDeviceLightInformationslog(requestQuery); 
               // console.log('admin line 3382')               
                return result;
            })
            .then(async (res) => {

                result = await DashboardServices.LightOnOffByDeviceService(requestQuery,req);                
                return result;
            })
            .then(async (res) => {

                result = await adminLogDeviceInformationServices.insertDeviceLightInstrusctions(requestQuery);
                
                return result;
            })
            .then((res) => {
            
                return client.query('commit');
            })
            .then((r) => {
                if (result.rowCount > 0) {

                    return RequestResponse.success(res, apiMessage.success, status.success, requestQuery.deviceId);

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
    } catch (error: any) {
        AddExceptionIntoDB(req,error);
        exceptionHandler(res, 1, error.message);
        return false;
    }
};



const getLockStatusList = async (req: Request, res: Response) => {
    try {
        // #swagger.tags = ['Admin-Bike-Produce']
        // #swagger.description = 'Pass bikeProduceId or 0  and status_enum_id = 0  '

        /*#swagger.parameters[ {
                        "name": "bikeProduceId",
                        "in": "query",
                        "description": "",
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

        let result: any = await adminLogDeviceInformationServices.getLockStatusService();
        let lockStatus = [];

        for (let row of result.rows) {

            lockStatus.push({
                id: row.id,
                statusName: row.name
            });
        }

        if (result.rowCount > 0) {
            return RequestResponse.success(res, apiMessage.success, status.success, lockStatus);
        } else {
            return RequestResponse.success(res, apiMessage.recordNotFound, status.success, []);
        }
    } catch (error: any) {
        AddExceptionIntoDB(req,error);
        return exceptionHandler(res, 1, error.message);
    }
};

nodeSchedule.schedule('*/1 * * * *', async () => {
    let updateTime: any;  

    let actionOnDate = getUTCdate();
    try {
        updateTime = await DashboardServices.updateDeviceState(actionOnDate);                    
            return 0;            
    } catch (error: any) {
        //AddExceptionIntoDB(req,error);
        return 'not work';
    }        
    });

    const setBeepOnInstructionController = async (req: Request, res: Response,) => {

        
        let requestBody = req.body;
        
        requestBody.beepInstructionEnumId = '56';// beep on
        requestBody.beepStatusEnumId = null;   
        requestBody.beepInstructionEnumIdLog = requestBody.beepInstructionEnumId;
        requestBody.beepRequetFrom='beepOnOffController';
        requestBody.geofence_inout_enum_id =63;

        //-------------------       
        

        
         await setDeviceInstructionBeepOnOffController(requestBody, res, req );
    }

    const setBeepOffInstructionController = async (req: Request, res: Response) => {

        let requestBody = req.body;
        
        requestBody.beepInstructionEnumId = '57',// beep off
        requestBody.beepStatusEnumId = null;
        requestBody.beepInstructionEnumIdLog = requestBody.beepInstructionEnumId,
        requestBody.beepRequetFrom='beepOnOffController',
        requestBody.geofence_inout_enum_id =62;
         await setDeviceInstructionBeepOnOffController(requestBody, res, req );
    }


const setDeviceInstructionBeepOnOffController = async (requestQuery: any, res: Response, req :any) => {
     let beepRequetFrom :any ='beepOnOffController'; 
     
   
    try {   
        requestQuery.instructionLastUpdateDate =getUTCdate();                      
        
            if (CommonMessage.IsValid(requestQuery.deviceId) == false) 
            {   
                if(beepRequetFrom==requestQuery.beepRequetFrom)    
                 {       
                   RequestResponse.validationError(res, apiMessage.deviceSetId, status.error, []); 
                 }               
                 return false;
            }              

            requestQuery.statusEnumId = '1'; 
            requestQuery.rideBookingId = '0'; 
            requestQuery.device_lock_unlock_communication_enum_id = '93';// online 
            let getLockIdByLockNumber: any = await adminLogDeviceInformationServices.getLockIdByLockNumberService(requestQuery);
    
            if (getLockIdByLockNumber.rowCount == 0) 
            {  
                if(beepRequetFrom==requestQuery.beepRequetFrom)    
                {                        
                  RequestResponse.validationError(res, apiMessage.lockNotAvailable, status.error, []);
                }
                return false;
            } 
            requestQuery.lockId = getLockIdByLockNumber.rows[0].id;
            
            
            let getBikeStatusAndZone: any = await adminLogDeviceInformationServices.getBikeStatusAndZoneService(requestQuery);

            
            if (getBikeStatusAndZone.rowCount == 0) 
            {        
                if(beepRequetFrom==requestQuery.beepRequetFrom)    
                {                  
                  RequestResponse.validationError(res, apiMessage.bikeProduce, status.error, []);
                }
                return false;
            } 
            requestQuery.bikeId =getBikeStatusAndZone.rows[0].id;
           // bike_booked_status,
           requestQuery.mapCityId ='0';
           requestQuery.areaId ='0';
           

            requestQuery.zoneId = getBikeStatusAndZone.rows[0].zone_id;

            let areaAndAreaTypeResult: any = await RideBooking.getAreaAndAreaType(requestQuery);// get  area detail
           
            if(areaAndAreaTypeResult.rowCount>0)
            {    
                if(areaAndAreaTypeResult.rows[0].area_type_enum_id=='31')// for close area 
                {
                     requestQuery.areaId =areaAndAreaTypeResult.rows[0].area_id;                   
                }
               else 
                {
                    requestQuery.mapCityId =areaAndAreaTypeResult.rows[0].map_city_id;
                }                
            }

            // if ( (getLockIdByLockNumber.rows[0].beep_instruction_enum_id) == (requestQuery.beepInstructionEnumId)) 
            // {          
            //     if(beepRequetFrom==requestQuery.beepRequetFrom)    
            //     {                 
            //        RequestResponse.validationError(res, apiMessage.intractionsAlready, status.error, []);
            //     }                 
            //     return false;// 
            // }
  
            
            requestQuery.createdonDate = getUTCdate()

            if (CommonMessage.IsValid(requestQuery.userId) == false) // action (user id)(admin id) 
            {             
               requestQuery.userId ='0';
            }
    
            let result: any;
    
            let rideingIdResult: any = await adminLogDeviceInformationServices.getRideingIdByLockNumberService(requestQuery);
    
            if (rideingIdResult.rowCount > 0)
            {   
                requestQuery.rideBookingId = rideingIdResult.rows[0].id;

             if(requestQuery.userId == '0')
                {
                    requestQuery.userId = rideingIdResult.rows[0].user_id;   
                } 
                
                let latLongJsonData = {                 
                    latitude: requestQuery.latitude,
                    longitude: requestQuery.longitude, 
                               
               };
               latLongJsonData
               
              
                if(requestQuery.beepInstructionEnumId == '56')// beep on 
                {
                    
                    
                  await adminLogDeviceInformationServices.addRidebookingBeepOnLatLogJson(latLongJsonData,requestQuery.rideBookingId,requestQuery.areaId,requestQuery.mapCityId );
                }
                else// beep off  
                {
                   
                    
                    await adminLogDeviceInformationServices.addRidebookingBeepOffLatLogJson(latLongJsonData,requestQuery.rideBookingId);
                }
            }
        
            client
                .query('BEGIN')
                .then(async (res) => {
    
                    result = await adminLogDeviceInformationServices.addDeviceLightInformationslog(requestQuery);
                 //   console.log('admin line 3639')
                    return result;
                })
                .then(async (res) => {
    
                    result = await DashboardServices.setDeviceBeepOnOffInstruction(requestQuery,req);
                    return result;
                })
                .then(async (res) => {
    
                    result = await adminLogDeviceInformationServices.insertBeepInstrusctions(requestQuery);
                    
                    return result;
                })
                .then(async (res) => {
    
                    result = await DashboardServices.setBikeGeoInOut(requestQuery,req);
                    
                    return result;
                })
                .then((res) => {
    
                    return client.query('commit');
                })
                .then((r) => {
                    if (result.rowCount > 0)
                     {    
                         if(beepRequetFrom==requestQuery.beepRequetFrom)    
                        {
                          RequestResponse.success(res, apiMessage.success, status.success, []); 
                          return true ; 
                         }                                                          
                     }                        
                      return true ;                                      
                })
                .catch((err) => {
    
                    client.query('rollback');
                    if(beepRequetFrom==requestQuery.beepRequetFrom)    
                    {
                        AddExceptionIntoDB(req,err);
                        exceptionHandler(res, 1, err.message);
                    }
                    return  false 
                })
                .catch((err) => {   
                    if(beepRequetFrom==requestQuery.beepRequetFrom)    
                    {        
                        AddExceptionIntoDB(req,err);           
                     exceptionHandler(res, 1, err.message);
                    }
                    return false 
                });
    
        } catch (error: any) {
            logger.error(error.message);
            if(beepRequetFrom==requestQuery.beepRequetFrom)    
            {
                AddExceptionIntoDB(req,error);
              exceptionHandler(res, 1, error.message);
            }
            return false;
        }
    };

    const setBeepOnController = async (req: Request, res: Response) => {

        let requestBody = req.query;;

        requestBody.beepInstructionEnumId = '59';// for beep on request is completed 
        requestBody.beepStatusEnumId = '54';   // beep on
        requestBody.beepInstructionEnumIdLog = '0';
        requestBody.beep_instruction_enum_id = '58' ;// for lock detail tbl no istruction 
        requestBody.apiRequestFromEnumId = '64';
         await insertApiRequest(req)       
         await beepOnOffToDeviceController(requestBody, res, req);

    }

    const setBeepOffController = async (req: Request, res: Response) => {

        let requestBody = req.query;;
        
        
        requestBody.beepInstructionEnumId = '60';// for beep off request is completed 
        requestBody.beepStatusEnumId = '55';  // beep off 
        requestBody.beepInstructionEnumIdLog = '0';
        requestBody.beep_instruction_enum_id = '58' ;// for lock detail tbl no istruction 
        requestBody.apiRequestFromEnumId = '64';
         await insertApiRequest(req)  
         await beepOnOffToDeviceController(requestBody, res, req);
    }
  
    const beepOnOffToDeviceController = async (requestQuery: any, res: Response, req :any) => {
        try {
            
            if (CommonMessage.IsValid(requestQuery.dId) == false) {
                RequestResponse.validationError(res, apiMessage.deviceSetId, status.error, []);
                return false;
            }
            requestQuery.deviceId = requestQuery.dId;
            requestQuery.statusEnumId ='1';
            requestQuery.device_lock_unlock_communication_enum_id = '93';//online
            
    
            let getLockIdByLockNumber: any = await adminLogDeviceInformationServices.getLockIdByLockNumberService(requestQuery);
    
            if (getLockIdByLockNumber.rowCount == 0) {
                RequestResponse.validationError(res, apiMessage.lockNotAvailable, status.error, []);
                return false;
            }    

            
            if(requestQuery.beepStatusEnumId == '55') 
            {
                if(config.CLIENT_NAME==kClientName.clientEvegah)
                {
                if(getLockIdByLockNumber.rows[0].beep_instruction_enum_id !='57'  )// for check set instruction beep off 
                {
                     RequestResponse.success(res, apiMessage.instructionNotSet, status.success, []);
                     return false                
                }
            }
            }
            
    
         
            if(requestQuery.beepStatusEnumId =='54') 
            {       
                if(config.CLIENT_NAME==kClientName.clientEvegah)
                {         
                if(getLockIdByLockNumber.rows[0].beep_instruction_enum_id !='56'  )// for check set instruction beep on 
                {
                    return RequestResponse.success(res, apiMessage.instructionNotSet, status.success, []);               
                }
            }
            }
            

            requestQuery.lockId = getLockIdByLockNumber.rows[0].id;
            requestQuery.createdonDate = getUTCdate()
            requestQuery.latitude = getLockIdByLockNumber.rows[0].latitude;
            requestQuery.longitude = getLockIdByLockNumber.rows[0].longitude;
            
            let getBikeStatusAndZone: any = await adminLogDeviceInformationServices.getBikeStatusAndZoneService(requestQuery);

            if (getBikeStatusAndZone.rowCount == 0) 
            {                          
                RequestResponse.validationError(res, apiMessage.bikeProduce, status.error, []);
                return false;
            } 
           // bike_booked_status,
           requestQuery.mapCityId ='0';
           requestQuery.areaId ='0';

            requestQuery.zoneId = getBikeStatusAndZone.rows[0].zone_id;

            let areaAndAreaTypeResult: any = await RideBooking.getAreaAndAreaType(requestQuery);// get  area detail            
            
            if(areaAndAreaTypeResult.rowCount>0)
            {    
                if(areaAndAreaTypeResult.rows[0].area_type_enum_id=='31')// for close area 
                {
                    requestQuery.areaId =areaAndAreaTypeResult.rows[0].area_id;                   
                }
               else 
                {
                    requestQuery.mapCityId =areaAndAreaTypeResult.rows[0].map_city_id;
                }                
            }


            let result: any;
    
            let rideingIdResult: any = await adminLogDeviceInformationServices.getRideingIdByLockNumberService(requestQuery);
            
            if (rideingIdResult.rowCount > 0) {
                requestQuery.rideBookingId = rideingIdResult.rows[0].id;      
                requestQuery.counts = 1;
    
            
                if(requestQuery.beepStatusEnumId == '55')  // beep off
                {                                                  
                   await adminLogDeviceInformationServices.addBeepOffCountService(requestQuery);
                }
                else
                {
                 await adminLogDeviceInformationServices.addBeepOnCountService(requestQuery);
                }    
    
                requestQuery.rideBookingId = rideingIdResult.rows[0].id;           
            }
            else {
                requestQuery.rideBookingId = '0';
            }
    
            client
                .query('BEGIN')
                .then(async (res) => {
    
                    result = await adminLogDeviceInformationServices.addDeviceLightInformationslog(requestQuery); 
                               
                    return result;

                })
                .then(async (res) => {
    
                    result = await DashboardServices.beepOnOffByDeviceService(requestQuery,req);                
                    return result;
                })
                .then(async (res) => {
    
                    result = await adminLogDeviceInformationServices.insertBeepInstrusctions(requestQuery);
                    
                    return result;
                })
                .then((res) => {
                
                    return client.query('commit');
                })
                .then((r) => {
                    if (result.rowCount > 0) {
    
                        return RequestResponse.success(res, apiMessage.success, status.success, requestQuery.deviceId);
    
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
        } catch (error: any) {
            AddExceptionIntoDB(req,error);
            exceptionHandler(res, 1, error.message);
            return false;
        }
    };

    const getOutSideGeoFanceBikeList = async (req: Request, res: Response) => {
        try {
            // #swagger.tags = ['Admin-Bike-Produce']
            // #swagger.description = 'Pass bikeProduceId or 0  and status_enum_id = 0  '
    
            /*#swagger.parameters[ {
                            "name": "bikeProduceId",
                            "in": "query",
                            "description": "",
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
            let requestQuery = req.query;
            let result: any = await BikeProduceServices.getOutSideGeoFanceBikeListServce(requestQuery);
            let bikeProduceDetails = [];
     let geoFenceInOut :any ='';
            
   
            for (let row of result.rows) {
                      
              //  geoFenceInOut =await checkGeoInOout(row.beep_status_enum_id,row.beep_instruction_enum_id) ;
                bikeProduceDetails.push({
                    id: row.id,
    
                    lockId: row.lock_id,
                    lockNumber: row.lock_number,
                    bikeName : row.bike_name,
                    deveiceStateEnumId: row.deveice_state_enum_id,
                    deveiceStatus: resolveDeviceStatus(row.deveice_state_enum_id, row.device_last_request_time, row.deveice_status),
                    device_lock_and_unlock_status: row.device_lock_and_unlock_status,
                    device_lock_unlock_status: row.device_lock_unlock_status,
                    location: row.location,
                    latitude: row.latitude,
                    longitude: row.longitude,
                    altitude: row.altitude,
                    zoneName: row.zone_name,
                    batteryPercentage : row.battery,
                    deviceLightStatusEnumId: row.device_light_status_enum_id,
                    deviceLightStatus: row.deveice_light_status,
                    deviceLightInstructionEnumId : row.device_light_instruction_enum_id,
                    deviceLightInstruction : row.device_light_instruction ,
                    deviceLastRequestTime: row.device_last_request_time,
    
                        beepStatusEnumId : row.beep_status_enum_id,
                        beepStatusName : row.beep_status_name,
                        beepInstructionEnumId : row.beep_instruction_enum_id,
                        beepInstructionName : row.beep_instruction_name,

                        rideBookingNo : row.ride_booking_no,
                        mapCityId : Number(row.map_city_id ),
                        mapCityName: row.map_city_name,   
                        userCityName : row.user_city_name,          
                        mapDrawObjectEnumId : row.map_draw_object_enum_id  ,
                        mapDrawObjectName  : row.map_draw_object_status  ,
                        mapDrawObject  : row.map_draw_object ,
                        mapDrawObjectAddress : row.map_draw_object_address,

                        areaId: Number(row.area_id),             
                        areaName: row.area_name,
                        areaMapDrawObjectEnumId : row.area_map_draw_object_enum_id  ,
                        areaMapDrawObjectName  : row.area_map_draw_object_status  ,
                        areaMapDrawObject  : row.area_map_draw_object ,
                        areaMapDrawObjectAddress : row.area_map_draw_object_address,
                        instructionId  : row.instruction_id ,
                        instruction_name  : row.instruction_name,
                        geofenceInOutEnumId  : row.geofence_inout_enum_id,
                        geoFenceInOut           : row.geofence_inout_name ,
                        userName : row.user_name,
                        mobileNo : row.mobile,  
                         bikeBookedStatus: row.bike_booked_status,
                        bikeBookedStatusName: row.bike_booked_status_name,
                        powerOnOffStatusEnumId : row.power_on_off_status_enum_id,
                        powerOnOffStatus: row.power_on_off_status
                    // deviceLockAndUnlockStatus: row.device_lock_and_unlock_status,                                                                                                          
                });
            }
    
            if (result.rowCount > 0) {
                return RequestResponse.success(res, apiMessage.success, status.success, bikeProduceDetails);
            } else {
                return RequestResponse.success(res, apiMessage.recordNotFound, status.success, []);
            }
        } catch (error: any) {
            AddExceptionIntoDB(req,error);
            return exceptionHandler(res, 1, error.message);
        }
    };

    
    const getBikeDetailZoneWiseController = async (req: Request, res: Response) => {
        try {
            let requestQuery = req.query;
            let getOutSideGeoFanceBikeListResult: any=[];
            let getActiveBikeListResult: any=[];
            let getAvaialableBikeListResult: any=[];
            let getUnderMantanceBikeListResult: any=[];
            
            //getOutSideGeoFanceBikeListResult = await adminDashboardServices.getOutSideGeoFanceBikeListZoneWise(requestQuery);
            getActiveBikeListResult = await adminDashboardServices.getActiveBikeListZoneWise(requestQuery,req);            
            getAvaialableBikeListResult =await adminDashboardServices.getAvaialableBikeListZoneWise(requestQuery,req);
            getUnderMantanceBikeListResult = await adminDashboardServices.getUnderMantanceBikeListZoneWise(requestQuery,req);
            
            
                let data :any =[];
             data= {
                    //outSideGeoFanceBikeListData : getOutSideGeoFanceBikeListResult,
                    activeBikeListData : getActiveBikeListResult,
                    avaialableBikeListData : getAvaialableBikeListResult,
                    underMantanceBikeListData : getUnderMantanceBikeListResult,
                }
                    
               
                return RequestResponse.success(res, apiMessage.success, status.success, data);
            
        } catch (error: any) {
            AddExceptionIntoDB(req,error);
            return exceptionHandler(res, 1, error.message);
        }
    };


    const udimAPiCallForThirdParty = async (req: any, res: Response) => {

        try {
            let requestQuery :any={};
  
            if(CommonMessage.IsValid(req.query)==false)
            {
                 requestQuery = req ;
            }
            else
            {
                requestQuery = req.query;
            }
             
            
            let beepResult :any ;
            let resultCityArea :any =null;
            let deviceDetails :any;
            let distanceInMeters  :any= 0;
    
            requestQuery.apiRequestFromEnumId = '64';
           //await insertApiRequest(req) 
                
    
        // if(CommonMessage.IsValid(requestQuery.device_lock_unlock_communication_enum_id)==false)//  requestQuery.distanceInMeters
        // {
            
        //    // let data:any =await  updateLockDetailFromMQTT(requestBody) 
    
        // }
    
            if (CommonMessage.IsValid(requestQuery.dId) == false) {
                return RequestResponse.success(res, CommonMessage.ErrorMessage(1, 'dId'), status.success, []);
            }
    
            let result: any;
            result = await InwardServices.getRegistrationStatusOfLock(requestQuery.dId);
    
            
            if (result.rowCount == 0) {
                return RequestResponse.success(res, CommonMessage.ErrorMessage(2, 'dId'), status.success, []);
            }
    
           requestQuery.lockId = result.rows[0].id;  
                                
           requestQuery.latitude = requestQuery.lat
           requestQuery.longitude = requestQuery.long
    
           requestQuery.latitudeDb= result.rows[0].latitude;
           requestQuery.longitudeDb = result.rows[0].longitude;
           
           requestQuery.distanceInMeters  ;//= attributes.flt-odometer;It comes from a third-party API
                      
    
        if(CommonMessage.IsValid(requestQuery.device_lock_unlock_communication_enum_id)==false)//  requestQuery.distanceInMeters
        {
            if  ( CommonMessage.IsValid(requestQuery.latitude)==true  && CommonMessage.IsValid(requestQuery.latitude)==true 
            &&  CommonMessage.IsValid(requestQuery.latitudeDb)==true && CommonMessage.IsValid(requestQuery.longitudeDb)==true) 
            {  
               if(  Number(requestQuery.latitude)!=0  && Number(requestQuery.latitude)!=0 
               &&  Number(requestQuery.latitudeDb)!=0 && Number(requestQuery.longitudeDb)!=0)
               {    
                                      
                    distanceInMeters   = geoFance.CalculateDistance(requestQuery.latitude, requestQuery.longitude,requestQuery.latitudeDb,  requestQuery.longitudeDb)
                      
             }
          }
          requestQuery.distanceInMeters =distanceInMeters;
       }
    
                
    
           
    
            if  ( CommonMessage.IsValid(requestQuery.lat)==true && CommonMessage.IsValid(requestQuery.long)==true ) {
            
                
                resultCityArea  = await AreaMasters.getCityAreaForBeepOnOffService(requestQuery.lockId, req); 
            }
            
            if (result.rows[0].registartion_status === true) {  
                      
                result = await DashboardServices.updateDeviceInformationInMultiPart(requestQuery,req);
                if(result ==false)
                {
                    
                    return  false ;//RequestResponse.success(res, CommonMessage.ErrorMessage(7, 'latLong'), status.success, []);
                }
                await AddLog.updateDeviceInformationLogFromMultiPart(requestQuery);
                
               
                
                if (resultCityArea != null) {
    
    
                    if (resultCityArea.rowCount > 0) {
    
                        if(resultCityArea.rows[0].area_type_enum_id =='30')//  30 open
                        {
                            requestQuery.map_city_id =resultCityArea.rows[0].map_city_id;
                        }
                        else if(resultCityArea.rows[0].area_type_enum_id =='31')
                        {
                            requestQuery.area_id=  resultCityArea.rows[0].area_id;
                        }
    
                        adminLogDeviceInformationServices.updateAreaCityInLockDetail(requestQuery);
    
                     
                        
                        
                        
                        if(resultCityArea != null && resultCityArea.rowCount>0)
                        {
    
                            deviceDetails = requestQuery;                       
                
                        if(resultCityArea.rows[0].area_type_enum_id =='31')//  31 close
                        {            
                                        
                            
                            if(resultCityArea.rows[0].area_map_draw_object_enum_id ==51)//Circle                        
                            {
                                
                                if( CommonMessage.IsValid(resultCityArea.rows[0].area_api_circle_center) && CommonMessage.IsValid(resultCityArea.rows[0].area_api_circle_redius) && CommonMessage.IsValid(resultCityArea.rows[0].area_api_circle_center.x) && CommonMessage.IsValid(resultCityArea.rows[0].area_api_circle_center.y))
                                {
                                    
                                // Not exists/Outside of Polygon                                                        
                                   if (await geofence.IsPointExistsInCircle(resultCityArea.rows[0].area_api_circle_center.x,resultCityArea.rows[0].area_api_circle_center.y,resultCityArea.rows[0].area_api_circle_redius,  deviceDetails.latitude,  deviceDetails.longitude)==false) 
                                    {
                                        
                                        beepResult= await setBeepOnInstructionCommon(deviceDetails,res, req)
                                    }
                                    else 
                                    {
                                        
                                        if(resultCityArea.rows[0].beep_status_enum_id=='54' || resultCityArea.rows[0].beep_instruction_enum_id =='56')//54	Device_Beep_Status	BeepOn 55	Device_Beep_Status	BeepOff
                                        {
                                            
                                            beepResult=  await setBeepOffInstructionCommon(deviceDetails,res,req)
                                        }
                                       
                                    }
                               }   
                            }
                
                
                           if(resultCityArea.rows[0].area_map_draw_object_enum_id ==52)//Polygon
                           {
                            
                            if( CommonMessage.IsValid(resultCityArea.rows[0].area_api_polygon))
                            {
                           // Not exists/Outside of Polygon";
                             if (await geofence.IsPointExistsInPolygon(resultCityArea.rows[0].area_api_polygon,null,deviceDetails.latitude,  deviceDetails.longitude)==false) 
                             {
                                
                                beepResult=  await setBeepOnInstructionCommon(deviceDetails,res, req)
                             }
                             else 
                             {
                
                                
                                if(resultCityArea.rows[0].beep_status_enum_id=='54' || resultCityArea.rows[0].beep_instruction_enum_id =='56')//54	Device_Beep_Status	BeepOn 55	Device_Beep_Status	BeepOff
                                {
                                    
                                    beepResult=   await setBeepOffInstructionCommon(deviceDetails,res, req)
                                }
                                 
                             } 
                            }  
                        }
                
                           if(resultCityArea.rows[0].area_map_draw_object_enum_id ==53)//Rectangle
                           {
                            
                               //Not exists/Outside of Rectangle
                               if( CommonMessage.IsValid(resultCityArea.rows[0].area_api_south_west_point) && CommonMessage.IsValid(resultCityArea.rows[0].area_api_north_east_point)  && CommonMessage.IsValid(resultCityArea.rows[0].area_api_south_west_point.x) && CommonMessage.IsValid(resultCityArea.rows[0].area_api_south_west_point.y)
                                && CommonMessage.IsValid(resultCityArea.rows[0].area_api_north_east_point.x) && CommonMessage.IsValid(resultCityArea.rows[0].area_api_north_east_point.y) )
                               {
                                  
                            if (await geofence.IsPointExistsInRectangle( resultCityArea.rows[0].area_api_south_west_point.x, resultCityArea.rows[0].area_api_south_west_point.y,resultCityArea.rows[0].area_api_north_east_point.x,resultCityArea.rows[0].area_api_north_east_point.y, deviceDetails.latitude,  deviceDetails.longitude)==false) 
                            {
                                
                                beepResult=  await setBeepOnInstructionCommon(deviceDetails,res,req)
                            }
                            else 
                            {
                                if(resultCityArea.rows[0].beep_status_enum_id=='54' || resultCityArea.rows[0].beep_instruction_enum_id =='56')//54	Device_Beep_Status	BeepOn 55	Device_Beep_Status	BeepOff
                                {
                                    
                
                                    beepResult= await setBeepOffInstructionCommon(deviceDetails,res,req)
                                }
                                
                            }  
                        }                            
                        } 
                
                        }
                            
                        else if(resultCityArea.rows[0].area_type_enum_id =='30')// open
                        {
                
                                if(resultCityArea.rows[0].city_map_draw_object_enum_id ==51)//Circle
                                {                                            
                                    
                                if( CommonMessage.IsValid(resultCityArea.rows[0].city_api_circle_center)  && CommonMessage.IsValid(resultCityArea.rows[0].city_api_circle_redius)  && CommonMessage.IsValid(resultCityArea.rows[0].city_api_circle_center.x) && CommonMessage.IsValid(resultCityArea.rows[0].city_api_circle_center.y))
                                 {
                                        
                                    //Not exists/Outside of circle
                                    if (await geofence.IsPointExistsInCircle(resultCityArea.rows[0].city_api_circle_center.x,resultCityArea.rows[0].city_api_circle_center.y,resultCityArea.rows[0].city_api_circle_redius,  deviceDetails.latitude,  deviceDetails.longitude)==false) 
                                    {
                                    beepResult=   await setBeepOnInstructionCommon(deviceDetails,res, req)
                                    }
                                    else 
                                    {
                                        
                                        if(resultCityArea.rows[0].beep_status_enum_id=='54' || resultCityArea.rows[0].beep_instruction_enum_id =='56')//54	Device_Beep_Status	BeepOn 55	Device_Beep_Status	BeepOff
                                        {
                                            
                                            beepResult=  await setBeepOffInstructionCommon(deviceDetails,res,req)
                                        }
                                        
                                    }
                                  }
                                }
                   
                       
                           if(resultCityArea.rows[0].city_map_draw_object_enum_id ==52)//Polygon
                           {
                            
                            // "Not exists/Outside of Polygon";
                            if(CommonMessage.IsValid(resultCityArea.rows[0].city_api_polygon)){
                            if (await geofence.IsPointExistsInPolygon(resultCityArea.rows[0].city_api_polygon,null,deviceDetails.latitude,  deviceDetails.longitude)==false) 
                            {
                                
                                beepResult= await setBeepOnInstructionCommon(deviceDetails,res,req)
                            }
                            else 
                            {
                                // 56	"Device_Beep_Instruction"	"BeepOn"
                                
                                // 54	"Device_Beep_Status"	"BeepOn" beep_instruction_enum_id ,beep_status_enum_id
                                
                                if(resultCityArea.rows[0].beep_status_enum_id=='54' || resultCityArea.rows[0].beep_instruction_enum_id =='56')//54	Device_Beep_Status	BeepOn 55	Device_Beep_Status	BeepOff
                                {
                                    
                                    beepResult= await setBeepOffInstructionCommon(deviceDetails,res,req)
                                }
                                
                            }  
                        }
                           }
                        
                
                           if(resultCityArea.rows[0].city_map_draw_object_enum_id ==53)//Rectangle
                           {
                
                            //Not exists/Outside of Rectangle
                            if( CommonMessage.IsValid(resultCityArea.rows[0].city_api_south_west_point) && CommonMessage.IsValid(resultCityArea.rows[0].city_api_north_east_point) && CommonMessage.IsValid(resultCityArea.rows[0].city_api_south_west_point.x) && CommonMessage.IsValid(resultCityArea.rows[0].city_api_south_west_point.y)
                                && CommonMessage.IsValid(resultCityArea.rows[0].city_api_north_east_point.x) && CommonMessage.IsValid(resultCityArea.rows[0].city_api_north_east_point.y))
                            {
                               
                            if (await geofence.IsPointExistsInRectangle( resultCityArea.rows[0].city_api_south_west_point.x, resultCityArea.rows[0].city_api_south_west_point.y,resultCityArea.rows[0].city_api_north_east_point.x,resultCityArea.rows[0].city_api_north_east_point.y, deviceDetails.latitude,  deviceDetails.longitude)==false) 
                            {
                                
                                beepResult= await setBeepOnInstructionCommon(deviceDetails,res, req)
                            }
                            else 
                            {
                                
                                if(resultCityArea.rows[0].beep_status_enum_id=='54' || resultCityArea.rows[0].beep_instruction_enum_id =='56')//54 Device_Beep_Status	BeepOn , 55	Device_Beep_Status	BeepOff
                                {
                                    
                                    beepResult=  await setBeepOffInstructionCommon(deviceDetails,res,req)
                                }
                                
                               
                            }  
                           } 
                        }
                        }
                            
                        if(beepResult==false)
                        {
                            return ;
                        }
                       }                                              
                        return true;//RequestResponse.success(res, apiMessage.addDeviceDetails, status.success, []);
                    } else {
                        return false;//RequestResponse.success(res,apiMessage.somethingWentWrong , status.success, []);
                    }
                }
                return false; //RequestResponse.success(res, apiMessage.addDeviceDetails, status.success, []);                    
          } 
          else {
                return false; //RequestResponse.validationError(res, apiMessage.deviceIsNotRegister, status.success, []);
            }
            //}
        } catch (error: any) {
    
            AddExceptionIntoDB(req,error);
            return false; //exceptionHandler(res, 1, error.message);
        }
    };


    const getDepositAndRidingOrRechargeAmountController = async (req: Request, res: Response) => {
        try {
            // #swagger.tags = ['Admin-Dashboard']
            // #swagger.description = 'Pass id or 0  and status_enum_id = 0 to see all user '
    
            let requestQuery = req.query;
            let result: any;
    

            let getLastDepositAmountEnumTbl :any = await RideBooking.getLastDepositAmount();// deposit amount = advance amount
     
       if (getLastDepositAmountEnumTbl.rowCount <=0)        
       {                
        return RequestResponse.validationError(res, 'Minimum deposit  amount is not set.', status.success, []);            
       }

       let minimumDepositAmountEnmTbl:any =(getLastDepositAmountEnumTbl.rows[0].enum_key).toFixed(2);     

       let getLastMinRechargeAmountTbl :any = await RideBooking.getLastMinRechargeAmountTbl();// wallet amount == recharge amount
    
       if (getLastMinRechargeAmountTbl.rowCount <=0)        
       {                
           return RequestResponse.validationError(res, 'minimum recharge  amount is not set.', status.success, []);            
       }
       
       let getLastMinRecharge:any =(getLastMinRechargeAmountTbl.rows[0].enum_key).toFixed(2);

            

            let DepositAndRidingAmont:any ={ minimumDepositAmoun :minimumDepositAmountEnmTbl,
                                               minimumRidingAmoun : getLastMinRecharge };
           
    
            
                return RequestResponse.success(res, apiMessage.success, status.success, DepositAndRidingAmont);
           
        } catch (error: any) {
            AddExceptionIntoDB(req,error);
            return exceptionHandler(res, 1, error.message);
        }
    };


    // const addAppVersionDetail = async (req: Request, res: Response) => {
    //     try {
    //         /* 	#swagger.tags = ['Admin']
    //             #swagger.description = 'Endpoint to sign in a specific user' */
    
    //         /*	#swagger.parameters['obj'] = {
    //                 in: 'body',
    //                 description: 'User information.',
    //                 required: true,
    //                 schema: { $ref: "#/definitions/adminLoginService" }
    //         } */
    
    //         /* #swagger.security = [{
    //                 "apiKeyAuth": []
    //         }] */
    
    //         await insertAppVersionDetail(req, res);
    //         return Promise.resolve({
    //             message: 'app version added succesfully',
    //             user: 200
    //         });
    //     } catch (error) {
    //         return Promise.reject({
    //             message: 'error',
    //             user: error
    //         });
    //     }
    // };

    const getUserForAddDepositRechargeList = async (req: Request, res: Response) => {
        try {
            // #swagger.tags = ['Admin-Bike-Produce']
            // #swagger.description = 'Pass bikeProduceId or 0  and status_enum_id = 0  '
   
            /*#swagger.parameters[ {
                            "name": "bikeProduceId",
                            "in": "query",
                            "description": "",
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
            let requestBody :any = req.query;
            
            if(CommonMessage.IsValid(requestBody.userName) ==false && CommonMessage.IsValid(requestBody.mobile) ==false)
                {
                    return RequestResponse.success(res, 'Please set at least one value, either the username or mobile number.', status.success, []);
                }
                if(CommonMessage.IsValid(requestBody.userName) ==true)
                {
                   // console.log('check lenght',requestBody.userName.length)
                    if(requestBody.userName.length < 3)
                        {
                            return RequestResponse.success(res, 'Please enter a username with a minimum of 3 characters.', status.success, []);
                        }

                }

                if(CommonMessage.IsValid(requestBody.mobile) ==true)
                    {
                        if(requestBody.mobile.length !=10)
                            {
                                return RequestResponse.success(res, 'Please enter a mobile number with exactly 10 digits', status.success, []);
                            }
    
                    }
            let result: any = await adminLogDeviceInformationServices.getUserForDipositRechargeList(requestBody);
            let userDetail = [];
   
            if(result.rowCount > 0) {
            for (let row of result.rows)
                {
   
            userDetail.push({
                userName : row.user_name,
                mobile   : row.mobile  ,
                userId   : row.id,
                depositAmount   : row.deposit_amount,
                rechargeAmount  : row.min_wallet_amount,
                minWalletAmount : row.min_wallet_amount,
                address : row.address,
                cityId  : row.city_id,
                stateId : row.state_id,
                createdonDate : row.createdon_date ,
                cityName      : row.city_name,
                stateName     : row.state_name
       
                });
            }
                return RequestResponse.success(res, apiMessage.success, status.success, userDetail);
            } else {
                return RequestResponse.success(res, apiMessage.recordNotFound, status.success, []);
            }
        } catch (error: any) {
            AddExceptionIntoDB(req,error);
            return exceptionHandler(res, 1, error.message);
        }
    };
export default {
    getDeviceStatusDebugController,
    adminLoginService,
    AdminUpdatePasswordService,
    ResetpasswordEMailGenerationService,
    updateAdminPasswordByEmailService,
    GetEnumDetailService,
    addUpdateZoneController,
    getZoneController,
    addUpdateBikeProduceController,
    getBikeProduceDetailsController,
    addUpdateBikeAllotmentController,
    getAllotmentDetailsController,
    getZoneWiseListController,
    activeInactiveBikeAllotmentController,
    getDeviceController,
    addDeviceController,
    lockAndUnlockDeviceController,
    getDashboardCardController,
    deviceRegistrationController,
    deviceRegistrationUsingTextController,
    getZoneWiseListByBiKeAllotmentController,
    deviceRegistration2Controller,
    deviceRegistration3Controller,
    getDeviceInstructions,
    deleteDeviceController,
    addDeviceIdAndInstruction,
    setInstructionToLockUnlockDeviceController,
    lockDeviceController,
    unlockDeviceController,
    updateDeviceInformation,
    updateWithdrawRequestFromAdminController,
    getWithdrawnListController,
    verifyTokenController,
    logOutAdminController,
    addLogController,
    updateDeviceInformationMultipart,
    getProduceBikeBatteryStatusController,
    qrDecrypted,
    updateUserMinimumWalletBalanceValuesController,
    getMinimumWalletBalanceHistoryController,
    getWellcomMSG,
    getRideBookedList,
    getLatLog,
    getAvaialableBikeList,
    getUndermaintenanceBikeList,
    getLockDetailForTestPage,
    getLockStatusList,
    setDeviceLightOnInstructionController,
    setDeviceLightOffInstructionController,
    setDeviceInstructionLightOnOffController,
    lightOnToDeviceController,
    lightOffToDeviceController ,
    setInstructionToLockUnlockDeviceFun,    
    setBeepOnInstructionController,
    setBeepOffInstructionController,
    setBeepOnController,
    setBeepOffController,
    setDeviceInstructionBeepOnOffController,
    getOutSideGeoFanceBikeList,
    getBikeDetailZoneWiseController,
    udimAPiCallForThirdParty ,
    getDepositAndRidingOrRechargeAmountController ,
    getUserForAddDepositRechargeList
    // InsertFarePlan
    //   getTransactionController
};
