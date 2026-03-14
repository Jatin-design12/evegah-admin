import { NextFunction, Request, Response } from 'express';
const { parse } = require('querystring');

import status from '../../helper/status';

import AreaMasters from '../../services/adminServices/admin.area.services';

import { exceptionHandler, AddExceptionIntoDB } from '../../helper/responseHandler';
import RequestResponse from '../../helper/responseClass';
import { apiMessage } from '../../helper/api-message';
import logger from '../../Config/logging';
import CommonMessage from '../../helper/common.validation';
import { getUTCdate } from '../../helper/datetime';

import Dateformats from '../../helper/utcdate';

import adminDashboardServices from '../../services/adminServices/admin.dashboard.services';

const addUpdateAreaDetailController = async (req: Request, res: Response) => {
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
        let msg: any = '';

        let validationResult: any = await addUpdateAreaValidations(requestBody, res, req);

        if (validationResult == false) {
            return;
        }

        requestBody.sw = validationResult.sw;
        requestBody.ne = validationResult.ne;
        requestBody.center = validationResult.center;
        requestBody.radius = validationResult.radius;
        requestBody.polygonpoint = validationResult.polygonpoint;
        requestBody.polygonpoint2 == validationResult.polygonpoint2;

        if (requestBody.areaId == 0) {
            msg = apiMessage.addArea;
            result = await AreaMasters.insertAreaDetails(requestBody, req);
        } else {
            msg = apiMessage.updateArea;
            result = await AreaMasters.updateAreaDetails(requestBody, req);
        }

        if (result.rowCount > 0) {
            return RequestResponse.success(res, msg, status.info, msg);
        } else {
            return RequestResponse.validationError(res, apiMessage.somethingWentWrong, status.info, []);
        }
    } catch (error: any) {
        AddExceptionIntoDB(req, error);
        return exceptionHandler(res, 1, error.message);
    }
};

const addCountryStateCityController = async (countyStateCityDetail: any, req: any) => {
    try {
        countyStateCityDetail.mapCountryId = '0';
        countyStateCityDetail.mapStateId = '0';
        countyStateCityDetail.statusEnumId = 1;

        countyStateCityDetail.actionsDate = getUTCdate();
        // this code
        let mapCountryNameExist: any = await AreaMasters.checkMapCountryNameExists(countyStateCityDetail.mapCountryName, countyStateCityDetail.mapCountryId, req);
        if (mapCountryNameExist.rowCount == 0) {
            mapCountryNameExist = await AreaMasters.addMapCountryName(countyStateCityDetail, req);
        }
        countyStateCityDetail.mapCountryId = mapCountryNameExist.rows[0].map_country_id;

        let checkMapStateNameExist: any = await AreaMasters.checkMapStateNameExists(countyStateCityDetail.mapStateName, countyStateCityDetail.mapCountryId, req);

        if (checkMapStateNameExist.rowCount == 0) {
            checkMapStateNameExist = await AreaMasters.addMapStateName(countyStateCityDetail, req);
        }

        countyStateCityDetail.mapStateId = checkMapStateNameExist.rows[0].map_state_id;

        if (countyStateCityDetail.mapCityId == '0') {
            let checkMapCityNameExist: any = await AreaMasters.checkMapCityNameExists(countyStateCityDetail.mapCityName, countyStateCityDetail.mapStateId, countyStateCityDetail.mapCityId, req);
            let checkUserCityNameExist: any = await AreaMasters.checkUserCityNameExists(countyStateCityDetail.userCityName, countyStateCityDetail.mapStateId, countyStateCityDetail.mapCityId, req);

            if (checkMapCityNameExist.rowCount == 0 && checkUserCityNameExist.rowCount == 0) {
                checkMapCityNameExist = await AreaMasters.addMapCityName(countyStateCityDetail, req);
            }
            countyStateCityDetail.mapCityId = checkMapCityNameExist.rows[0].map_city_id;
        }

        let countyStateCity = {
            mapCountryId: countyStateCityDetail.mapCountryId,
            mapStateId: countyStateCityDetail.mapStateId,
            mapCityId: countyStateCityDetail.mapCityId
        };

        return countyStateCity;
    } catch (error: any) {
        AddExceptionIntoDB(req, error);
        return error.message;
    }
};

const addUpdateAreaValidations = async (requestBody: any, res: Response, req: any) => {
    try {
        if (requestBody.areaId == null || requestBody.areaId == undefined) {
            RequestResponse.validationError(res, apiMessage.areaId, status.error, []);
            return false;
        }

        if (CommonMessage.IsValid(requestBody.name) == false) {
            RequestResponse.validationError(res, apiMessage.AreaName, status.error, []);
            return false;
        }

        let mapValidationResult: any = await mapAreacityValidations(requestBody, res, req);

        if (mapValidationResult == false) {
            return false;
        }

        let checkMapAreaNameE: any = await AreaMasters.checkMapAreaNameExists(requestBody.areaId, requestBody.name, requestBody.mapCityId, req);
        if (checkMapAreaNameE.rowCount != 0) {
            RequestResponse.validationError(res, apiMessage.AreaNameExist, status.error, []);
            return false;
        }

        return mapValidationResult;
    } catch (error: any) {
        AddExceptionIntoDB(req, error);
        exceptionHandler(res, 1, error.message);
        return false;
    }
};

// const getAreaCityState = async (req: Request, res: Response) => {
//     try {

//         let result: any;

//         result = await AreaMasters.getAreaCityStates();
//         let areaDetail: any = [];

//         if (result.rowCount > 0) {
//         for (let row of result.rows) {
//             areaDetail.push({
//                  stateId: Number(row.state_id),
//                  stateName: row.state_name,
//                   cityId : Number(row.city_id ),
//                   cityName: row.city_name
//             });
//         }

//             return RequestResponse.success(res, apiMessage.success, status.success, areaDetail);
//         } else {
//             return RequestResponse.validationError(res, apiMessage.dataNotAvailable, status.error, []);
//         }
//     } catch (error: any) {
//         logger.error(error);

//         return exceptionHandler(res, 1, error.message);
//     }
// };

const getAreaMapCityState = async (req: Request, res: Response) => {
    try {
        let result: any;

        result = await AreaMasters.getAreaMapCityStates(require);
        let areaDetail: any = [];

        if (result.rowCount > 0) {
            for (let row of result.rows) {
                areaDetail.push({
                    stateId: Number(row.state_id),
                    stateName: row.state_name,
                    mapCityId: Number(row.map_city_id),
                    mapCityName: row.map_city_name,
                    areaTypeEnumId: row.area_type_enum_id,
                    areaTypeName: row.area_enum_type_name,
                    createdOnDate: row.createdon_date,
                    updatedOnDate: row.updatedon_date
                });
            }

            return RequestResponse.success(res, apiMessage.success, status.success, areaDetail);
        } else {
            return RequestResponse.validationError(res, apiMessage.dataNotAvailable, status.error, []);
        }
    } catch (error: any) {
        AddExceptionIntoDB(req, error);

        return exceptionHandler(res, 1, error.message);
    }
};
const getAreaDetail = async (req: Request, res: Response) => {
    try {
        let requestQuery = req.query;
        let result: any;

        if (requestQuery.areaId == undefined || requestQuery.areaId == null || requestQuery.areaId == 'null') {
            RequestResponse.validationError(res, apiMessage.areaId, status.error, []);
            return false;
        }

        if (requestQuery.mapCityId == undefined || requestQuery.mapCityId == null || requestQuery.mapCityId == 'null') {
            RequestResponse.validationError(res, apiMessage.mapCityId, status.error, []);
            return false;
        }

        if (requestQuery.dataFor == 'ForMapSearch') // for search on map
        {
            result = await AreaMasters.getMapAreaDetailsForSearche(requestQuery.mapCountryName, requestQuery.mapStateName, requestQuery.mapCityName, requestQuery.areaId, req);
        } else {
            result = await AreaMasters.getAreaDetail(requestQuery.areaId, requestQuery.mapCityId, req);
        }

        let areaDetail: any = [];

        if (result.rowCount > 0) {
            for (let row of result.rows) {
                areaDetail.push({
                    areaId: Number(row.id),
                    name: row.name,

                    mapCountryId: Number(row.map_country_id),
                    mapCountryName: row.map_country_name,
                    mapStateId: Number(row.map_state_id),
                    mapStateName: row.map_state_name,
                    mapCityId: Number(row.map_city_id),
                    mapCityName: row.map_city_name,
                    areaTypeEnumId: Number(row.area_type_enum_id),
                    areaType: row.area_type,
                    statusEnumId: Number(row.status_enum_id),
                    createdById: row.created_by_id,
                    createdDate: row.createdon_date,
                    createdOnDate: row.createdon_date,
                    updatedOnDate: row.updatedon_date,
                    placeId: row.place_id,
                    pinCode: row.Pin_code,
                    fullAddress: row.full_address,
                    mapDrawObjectEnumId: row.map_draw_object_enum_id,
                    mapDrawObjectName: row.map_draw_object_status,
                    mapDrawObject: row.map_draw_object,
                    mapDrawObjectAddress: row.map_draw_object_address,

                    center: row.are_api_circle_center,
                    redius: row.area_api_circle_redius,
                    sw: row.are_api_south_west_point,

                    ne: row.are_api_north_east_point,
                    polygon: row.area_api_polygon,
                    polygon2: row.area_api_db_polygon
                });
            }

            return RequestResponse.success(res, apiMessage.success, status.success, areaDetail);
        } else {
            return RequestResponse.validationError(res, apiMessage.dataNotAvailable, status.error, []);
        }
    } catch (error: any) {
        AddExceptionIntoDB(req, error);

        return exceptionHandler(res, 1, error.message);
    }
};

const getCountryStateCityList = async (countyStateCityDetail: any, res: Response, req: any) => {
    try {
        countyStateCityDetail.mapCountryId = 0;
        countyStateCityDetail.mapStateId = 0;
        countyStateCityDetail.statusEnumId = 1;

        countyStateCityDetail.actionsDate = getUTCdate();
        // this code
        let mapCountryNameExist: any = await AreaMasters.checkMapCountryNameExists(countyStateCityDetail.mapCountryName, countyStateCityDetail.mapCountryId, req);
        if (mapCountryNameExist.rowCount == 0) {
            RequestResponse.validationError(res, apiMessage.mapCountryNotExsit, status.error, []);
            return false;
        }
        countyStateCityDetail.mapCountryId = mapCountryNameExist.rows[0].map_country_id;

        //
        let checkMapStateNameExist: any = await AreaMasters.checkMapStateNameExists(countyStateCityDetail.mapStateName, countyStateCityDetail.mapCountryId, req);
        if (checkMapStateNameExist.rowCount > 0) {
            //  RequestResponse.validationError(res, apiMessage.mapStateNotExsit, status.error, []);
            // return false
            countyStateCityDetail.mapStateId = checkMapStateNameExist.rows[0].map_state_id;
        }

        //
        let checkMapCityNameExist: any = await AreaMasters.checkMapCityNameForSearchExistsQuery(countyStateCityDetail.mapCityName, countyStateCityDetail.mapStateId, req);

        if (checkMapCityNameExist.rowCount > 0) {
            countyStateCityDetail.mapCityId = checkMapCityNameExist.rows[0].map_city_id;
            //  RequestResponse.validationError(res, apiMessage.mapCityNotExsit, status.error, []);
            //return false;
        }
        //   countyStateCityDetail.mapCityId = checkMapCityNameExist.rows[0].map_city_id

        let countyStateCity = {
            mapStateId: countyStateCityDetail.mapStateId,
            mapCityId: countyStateCityDetail.mapCityId,
            mapCountryId: countyStateCityDetail.mapCountryId
        };

        return countyStateCity;
    } catch (error: any) {
        AddExceptionIntoDB(req, error);
        return error.message;
    }
};
const insertFarePlanDetailDetailController = async (req: Request, res: Response) => {
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
        // console.log('check api start',requestBody)
        let result: any = '';
        let msg: any = '';

        if (requestBody.length == undefined) {
            return RequestResponse.validationError(res, 'Please Json Is Not Correct', status.error, []);
        }

        for (let i = 0; i <= requestBody.length - 1; i++) {
            for (let j = 0; j <= requestBody.length - 1; j++) {
                if (i != j) {
                    if (
                        requestBody[i].aplicableDate == requestBody[j].aplicableDate &&
                        requestBody[i].areaTypeEnumId == requestBody[j].areaTypeEnumId &&
                        requestBody[i].mapCityId == requestBody[j].mapCityId &&
                        requestBody[i].modelId == requestBody[j].modelId &&
                        requestBody[i].areaId == requestBody[j].areaId
                    ) {
                        let rowNo: any = i + 1;
                        let rowNo1: any = j + 1;

                        return RequestResponse.validationError(res, 'Please Check duplicate Data Row Number  ' + rowNo + ' And Row Number ' + rowNo + '.', status.error, []);
                    }
                    continue;
                }
            }
        }

        for (let i = 0; i <= requestBody.length - 1; i++) {
            if ((await addFarePlanValidations(requestBody[i], res, req)) == false) {
                return;
            }
        }

        for (let row of requestBody) {
            if (row.farePlanId == 0) {
                msg = apiMessage.addFarePlan;
                result = await AreaMasters.insertFarePlanDetail(row, req);
            } else {
                msg = apiMessage.updateFarePlan;
                result = await AreaMasters.updateFarePlanDetail(row, req);
            }
        }

        if (result.rowCount > 0) {
            return RequestResponse.success(res, msg, status.info, msg);
        } else {
            return RequestResponse.validationError(res, apiMessage.somethingWentWrong, status.info, []);
        }
    } catch (error: any) {
        AddExceptionIntoDB(req, error);
        return exceptionHandler(res, 1, error.message);
    }
};

const addFarePlanValidations = async (requestBody: any, res: Response, req: any) => {
    try {
        let rowNumber = 'Row Numeber ' + requestBody.rownumber;

        if (CommonMessage.IsValidAction(requestBody.actionsType) == false) {
            //  let rowNumber = ' Row Numeber ' +  requestBody.rownumber ;
            RequestResponse.validationError(res, 'Please Set Valid Actions Type' + rowNumber, status.error, []);
            return false;
        }
        if (CommonMessage.IsValid(requestBody.actionsType) == false) {
            //let rowNumber = ' Row Numeber ' +  requestBody.rownumber ;
            RequestResponse.validationError(res, 'Please Set actions Type' + rowNumber, status.error, []);
            return false;
        }

        if (requestBody.actionsType != 'insert') {
            let fareIdResult: any = await AreaMasters.getfareIdList(requestBody.farePlanId, req);
            if (fareIdResult.rowCount == 0) {
                RequestResponse.validationError(res, 'This Fare Plan Not Found' + rowNumber, status.error, []);
                return false;
            }
        }

        // activeAndDeactive case
        if (requestBody.actionsType == 'activeOrDeactive') {
            return true;
        }

        //
        if (CommonMessage.IsValid(requestBody.stateId) == false) {
            RequestResponse.validationError(res, 'Please Set Fare Plan State' + rowNumber, status.error, []);
            return false;
        }

        if (CommonMessage.IsValid(requestBody.mapCityId) == false) {
            RequestResponse.validationError(res, 'Please Set city' + rowNumber, status.error, []);
            return false;
        }

        if (CommonMessage.IsValid(requestBody.areaTypeEnumId) == false) {
            RequestResponse.validationError(res, 'Please Set area Type' + rowNumber, status.error, []);
            return false;
        }

        if (CommonMessage.IsValid(requestBody.modelId) == false) {
            RequestResponse.validationError(res, 'Please Set model ' + rowNumber, status.error, []);
            return false;
        }
        if (CommonMessage.IsValid(requestBody.hireTimeInMinuts) == false || requestBody.hireTimeInMinuts <= 0) {
            RequestResponse.validationError(res, 'Please Set hire Time In Minuts' + rowNumber, status.error, []);
            return false;
        }
        //-----------------------------------

        //console.log('check zero requestBody.perMinuteRateMonday ',requestBody.perMinuteRateMonday)

        //     if ( CommonMessage.IsRateValid(requestBody.perMinuteRateMonday )==false)
        //     {
        //         RequestResponse.validationError(res, 'Please Set Per Minuts Rates For Monday', status.error, []);
        //         return false ;
        //     }
        //    if ( CommonMessage.IsRateValid(requestBody.perMinuteRateTuesday )==false)
        //     {
        //        RequestResponse.validationError(res, 'Please Set Per Minuts Rates For Tuesday', status.error, []);
        //        return false ;
        //     }
        //     if ( CommonMessage.IsRateValid(requestBody.perMinuteRateWednesday )==false)
        //      {
        //         RequestResponse.validationError(res, 'Please Set Per Minuts Rates For Wednesday', status.error, []);
        //         return false ;
        //     }
        //     if ( CommonMessage.IsRateValid(requestBody.perMinuteRateThursday )==false)
        //     {
        //         RequestResponse.validationError(res, 'Please Set Per Minuts Rates For Thursday', status.error, []);
        //         return false ;
        //     }
        //     if ( CommonMessage.IsRateValid(requestBody.perMinuteRateFriday )==false) {
        //          RequestResponse.validationError(res, 'Please Set Per Minuts Rates For Friday', status.error, []);
        //         return false ;
        //     }
        //     if ( CommonMessage.IsRateValid(requestBody.perMinuteRateSaturday )==false)
        //     {
        //          RequestResponse.validationError(res, 'Please Set Per Minuts Rates For Saturday', status.error, []);
        //          return false ;
        //     }
        //     if ( CommonMessage.IsRateValid(requestBody.perMinuteRateSunday )==false)
        //      {
        //           RequestResponse.validationError(res, 'Please Set Per Minuts Rates For Sunday', status.error, []);
        //           return false ;
        //     }

        if (
            (requestBody.perMinuteRateMonday < 0 || requestBody.perMinuteRateMonday == null) &&
            (requestBody.perMinuteRateTuesday < 0 || requestBody.perMinuteRateTuesday == null) &&
            (requestBody.perMinuteRateWednesday < 0 || requestBody.perMinuteRateWednesday == null) &&
            (requestBody.perMinuteRateWednesday < 0 || requestBody.perMinuteRateWednesday == null) &&
            (requestBody.perMinuteRateThursday < 0 || requestBody.perMinuteRateThursday == null) &&
            (requestBody.perMinuteRateFriday < 0 || requestBody.perMinuteRateFriday == null) &&
            (requestBody.perMinuteRateSaturday < 0 || requestBody.perMinuteRateSaturday == null) &&
            (requestBody.perMinuteRateSunday < 0 || requestBody.perMinuteRateSunday == null)
        ) {
            RequestResponse.validationError(res, 'Sun to Sat Enter Rate Per minute - at least one day  value must be greater than or queal to 0' + rowNumber, status.error, []);
            return false;
        }
        let actionDate: any = Dateformats.getUTCdateformat();

        let aplicableDateDate: any = Dateformats.ConvertUTCtoDateformat(requestBody.aplicableDate); // new Date()

        if (requestBody.farePlanId == 0) {
            if (actionDate >= aplicableDateDate) {
                RequestResponse.validationError(res, 'Please  select applicable date and time greater than current date' + rowNumber, status.error, []);
                return false;
            }
        } else {
            if (actionDate > aplicableDateDate) {
                RequestResponse.validationError(res, 'Please  select applicable date and time greater than current date' + rowNumber, status.error, []);
                return false;
            }
        }

        let stateResult: any = await AreaMasters.getMapStateId(requestBody.stateId, req);

        if (stateResult.rowCount == 0) {
            RequestResponse.validationError(res, 'This State Not Found' + rowNumber, status.error, []);
            return false;
        }

        let cityResult: any = await AreaMasters.getMapCityData(requestBody.mapCityId, req);

        if (cityResult.rowCount == 0) {
            RequestResponse.validationError(res, 'This City Not Found' + rowNumber, status.error, []);
            return false;
        }

        if (cityResult.rows[0].map_state_id != requestBody.stateId) {
            RequestResponse.validationError(res, 'This City Not Match with this State' + rowNumber, status.error, []);

            return false;
        }

        let modelResult: any = await AreaMasters.getModelData(requestBody.modelId, req);

        if (modelResult.rowCount == 0) {
            RequestResponse.validationError(res, 'This Model Not Found.' + rowNumber, status.error, []);
            return false;
        }

        if (requestBody.areaTypeEnumId == 31) // for close area
        {
            let areaResult: any = await AreaMasters.getAreaData(requestBody.areaId, req);

            // console.log('check model data  areaResult',areaResult)
            if (areaResult.rowCount == 0) {
                RequestResponse.validationError(res, 'This Area Not Found.' + rowNumber, status.error, []);
                return false;
            }

            if (areaResult.rows[0].map_city_id != requestBody.mapCityId) {
                RequestResponse.validationError(res, 'This City Not Match with this Area' + rowNumber, status.error, []);

                return false;
            }

            // area cityId and city match or not
        }

        let exitResult: any = await AreaMasters.getFarePlanExit(
            requestBody.farePlanId,
            requestBody.mapCityId,
            requestBody.areaTypeEnumId,
            requestBody.areaId,
            requestBody.modelId,
            requestBody.aplicableDate,
            req
        );
        if (exitResult.rowCount > 0) {
            RequestResponse.validationError(res, 'This Plan Name AlreadyExit' + rowNumber, status.error, []);
            return false;
        }

        return true;
    } catch (error: any) {
        AddExceptionIntoDB(req, error);
        exceptionHandler(res, 1, error.message);
        return false;
    }
};

const getfarePlanDetail = async (req: Request, res: Response) => {
    try {
        let requestQuery = req.query;
        let result: any;

        result = await AreaMasters.getFarePlanDetail(requestQuery.farePlanId, requestQuery.mapCityId, requestQuery.modelId, requestQuery.areaId, requestQuery.statusEnumId, req);
        let farePlanDetail: any = [];

        if (result.rowCount > 0) {
            for (let row of result.rows) {
                farePlanDetail.push({
                    farePlanId: row.id,
                    mapCityId: Number(row.map_city_id),
                    mapCityName: row.map_city_name,

                    stateId: Number(row.state_id),
                    stateName: row.state_name,
                    hireTimeInMinuts: row.hire_minuts,

                    areaTypeEnumId: Number(row.area_type_enum_id),
                    areaType: row.area_type,
                    areaId: Number(row.area_id),
                    areaName: row.area_name,
                    aplicableDate: row.aplicable_date,

                    modeleId: Number(row.model_id),
                    modeleName: row.model_name,
                    vehicleType: Number(row.vehicle_type),
                    vehicleTypeName: row.vehicle_type_name,

                    perMinuteRateMonday: row.per_minute_rate_monday,
                    perMinuteRateTuesday: row.per_minute_rate_tuesday,
                    perMinuteRateWednesday: row.per_minute_rate_wednesday,
                    perMinuteRateThursday: row.per_minute_rate_thursday,
                    perMinuteRateFriday: row.per_minute_rate_friday,
                    perMinuteRateSaturday: row.per_minute_rate_saturday,
                    perMinuteRateSunday: row.per_minute_rate_sunday,
                    statusEnumId: Number(row.status_enum_id)
                });
            }

            return RequestResponse.success(res, apiMessage.success, status.success, farePlanDetail);
        } else {
            return RequestResponse.validationError(res, apiMessage.dataNotAvailable, status.error, []);
        }
    } catch (error: any) {
        AddExceptionIntoDB(req, error);
        return exceptionHandler(res, 1, error.message);
    }
};

const getReportBikeData = async (req: Request, res: Response) => {
    try {
        let requestQuery = req.query;
        let result: any;

        result = await AreaMasters.getReportBikeData(
            requestQuery.userId,
            requestQuery.rideBookingId,
            requestQuery.ridestatus,
            requestQuery.RequestrideFromDate,
            requestQuery.RequestrideToDate,
            requestQuery.bikeId,
            requestQuery.rideEndByUser,
            req
        );
        let reportDetail: any = [];

        //  console.log('check row count area ',result.rowCount)
        if (result.rowCount > 0) {
            for (let row of result.rows) {
                reportDetail.push({
                    rideBookingId: row.id,
                    userId: row.user_id,
                    userName: row.user_name,
                    modelId: row.vehicle_model_id,
                    modelName: row.model_name,
                    uId: row.vehicle_uid_id,
                    modelUidNumber: row.model_uid_number,
                    lockId: row.vehicle_lock_id,
                    lockNumber: row.model_lock_number,
                    rideBookingMin: row.ride_booking_min,
                    fromRideTime: row.from_ride_time,
                    toRideTime: row.to_ride_time,
                    actualRideTime: row.actual_ride_time,
                    actualRideMin: row.actual_ride_min,
                    totalRideAmount: row.total_ride_amount,
                    rideStartLatitude: row.ride_start_latitude,
                    rideStartLongitude: row.ride_start_longitude,
                    rideEndLatitude: row.ride_end_latitude,
                    rideEndLongitude: row.ride_end_longitude,
                    bikeRideingStatus: row.bike_rideing_status,
                    minimumHiringTime: row.minimum_hiring_time,
                    minimumRentRate: row.minimum_rent_rate,
                    endRideUserId: row.end_ride_user_id,
                    endRideUserName: row.end_ride_user_name,
                    rideBookingNo: row.ride_booking_no,
                    ride_rating: row.ride_rating,
                    rideComments: row.ride_comments,
                    rideCommentsReply: row.ride_comments_reply,
                    commentsReplyStatusEnumId: row.comments_reply_status_enum_id,
                    commentsReplyStatusName: row.comments_reply_status_name
                });
            }
            return RequestResponse.success(res, apiMessage.success, status.success, reportDetail);
        } else {
            return RequestResponse.validationError(res, apiMessage.dataNotAvailable, status.error, []);
        }
    } catch (error: any) {
        AddExceptionIntoDB(req, error);
        return exceptionHandler(res, 1, error.message);
    }
};

const getMapAreaDetail = async (req: Request, res: Response) => {
    try {
        let requestQuery = req.query;
        let result: any;

        result = await AreaMasters.getMapAreaDetail(requestQuery.areaId, requestQuery.mapCityId, req);
        let areaDetail: any = [];

        if (result.rowCount > 0) {
            for (let row of result.rows) {
                areaDetail.push({
                    areaId: Number(row.id),
                    name: row.name,
                    mapStateId: Number(row.map_state_id),
                    mapStateName: row.map_state_name,
                    mapCityId: Number(row.map_city_id),
                    mapCityName: row.map_city_name,
                    areaTypeEnumId: Number(row.area_type_enum_id),
                    areaType: row.area_type,
                    statusEnumId: Number(row.status_enum_id),
                    createdById: row.created_by_id,
                    createdDate: row.createdon_date
                });
            }
            return RequestResponse.success(res, apiMessage.success, status.success, areaDetail);
        } else {
            return RequestResponse.validationError(res, apiMessage.dataNotAvailable, status.error, []);
        }
    } catch (error: any) {
        AddExceptionIntoDB(req, error);
        return exceptionHandler(res, 1, error.message);
    }
};

const getzoneDetailWithBikeCountList = async (req: Request, res: Response) => {
    try {
        let requestQuery = req.query;
        let result: any;

        if (requestQuery.zoneId == undefined || requestQuery.zoneId == null || requestQuery.zoneId == 'null') {
            RequestResponse.validationError(res, apiMessage.zoneId, status.error, []);
            return false;
        }

        if (requestQuery.mapCityId == undefined || requestQuery.mapCityId == null || requestQuery.mapCityId == 'null') {
            RequestResponse.validationError(res, 'Please set map city id ', status.error, []);
            return false;
        }

        if (requestQuery.dataFor == 'ForMapSearch') // for search on map
        {
            result = await AreaMasters.getzoneDetailWithBikeCountListService(requestQuery.mapCountryName, requestQuery.mapStateName, requestQuery.mapCityName, req);
        } else {
            result = await AreaMasters.getAreaDetailWithBikeCountListZone(requestQuery.zoneId, requestQuery.mapCityId, req);
        }

        let getOutSideGeoFanceBikeListResult: any = [];
        let getActiveBikeListResult: any = [];
        let getAvaialableBikeListResult: any = [];
        let getUnderMantanceBikeListResult: any = [];

        let zoneDetail: any = [];

        if (result.rowCount > 0) {
            for (let row of result.rows) {
                ((requestQuery.zoneId = row.id), (getOutSideGeoFanceBikeListResult = await adminDashboardServices.getOutSideGeoFanceBikeListZoneWise(requestQuery, req)));
                getActiveBikeListResult = await adminDashboardServices.getActiveBikeListZoneWise(requestQuery, req);
                getAvaialableBikeListResult = await adminDashboardServices.getAvaialableBikeListZoneWise(requestQuery, req);
                getUnderMantanceBikeListResult = await adminDashboardServices.getUnderMantanceBikeListZoneWise(requestQuery, req);

                zoneDetail.push({
                    zoneId: row.id,
                    zoneName: row.name,
                    bikeCount: row.bike_count,
                    latitude: row.latitude,
                    longitude: row.longitude,
                    zone_size: row.zone_size,
                    zone_capacity: row.zone_capacity,
                    zone_address: row.zone_address,
                    mapStateId: Number(row.map_state_id),
                    mapStateName: row.map_state_name,
                    mapCityId: Number(row.map_city_id),
                    mapCityName: row.map_city_name,
                    areaName: row.area_name,
                    areaTypeEnumId: Number(row.area_type_enum_id),
                    areaType: row.area_type,
                    statusEnumId: Number(row.status_enum_id),
                    createdById: row.created_by_id,
                    createdDate: row.createdon_date,
                    areaPlaceId: row.place_id,
                    areaPinCode: row.Pin_code,
                    areaFullAddress: row.full_address,

                    outSideGeoFanceBikeListData: getOutSideGeoFanceBikeListResult,
                    activeBikeListData: getActiveBikeListResult,
                    avaialableBikeListData: getAvaialableBikeListResult,
                    underMantanceBikeListData: getUnderMantanceBikeListResult
                    //   areaMapDrawObjectEnumId : row.map_draw_object_enum_id  ,
                    //   areaMDrawObjectName  : row.map_draw_object_status  ,
                    //   areaMDrawObject  : row.map_draw_object ,
                    //   areaMapDrawObjectAddress  : row.map_draw_object_address ,
                });
            }

            return RequestResponse.success(res, apiMessage.success, status.success, zoneDetail);
        } else {
            return RequestResponse.validationError(res, apiMessage.dataNotAvailable, status.error, []);
        }
    } catch (error: any) {
        AddExceptionIntoDB(req, error);

        return exceptionHandler(res, 1, error.message);
    }
};

// const addUpdateMapCityDetailController = async (req: Request, res: Response) => {
//     try
//     {
//         let requestBody = req.body;

//             let cityResult= await addMapCityController(requestBody,res)
//              if(cityResult==false)
//              {
//                 return ;
//              }
//              return RequestResponse.success(res, apiMessage.success, status.success, 'check ');

//     }
//     catch (error: any) {
//         logger.error(error);
//         return exceptionHandler(res, 1, error.message);
//     }
// }

const addUpdateMapCityDetailController = async (req: Request, res: Response) => {
    try {
        let countyStateCityDetail = req.body;
        countyStateCityDetail.statusEnumId = 1;
        ((countyStateCityDetail.mapCountryId = '0'), (countyStateCityDetail.mapStateId = '0'), (countyStateCityDetail.actionsDate = getUTCdate()));

        if (CommonMessage.IsValid(countyStateCityDetail.userCityName) == false) {
            RequestResponse.validationError(res, apiMessage.userCityName, status.error, []);
            return false;
        }

        let validationResult: any = await mapAreacityValidations(countyStateCityDetail, res, req);

        if (validationResult == false) {
            return;
        }
        // this code
        let mapCountryNameExist: any = await AreaMasters.checkMapCountryNameExists(countyStateCityDetail.mapCountryName, countyStateCityDetail.mapCountryId, req);
        if (mapCountryNameExist.rowCount == 0) {
            mapCountryNameExist = await AreaMasters.addMapCountryName(countyStateCityDetail, req);
        }
        countyStateCityDetail.mapCountryId = mapCountryNameExist.rows[0].map_country_id;
        //

        //
        let checkMapStateNameExist: any = await AreaMasters.checkMapStateNameExists(countyStateCityDetail.mapStateName, countyStateCityDetail.mapCountryId, req);

        if (checkMapStateNameExist.rowCount == 0) {
            checkMapStateNameExist = await AreaMasters.addMapStateName(countyStateCityDetail, req);
        }

        countyStateCityDetail.mapStateId = checkMapStateNameExist.rows[0].map_state_id;
        //

        //
        let checkMapCityNameExist: any = await AreaMasters.checkMapCityNameExists(countyStateCityDetail.mapCityName, countyStateCityDetail.mapStateId, countyStateCityDetail.mapCityId, req);

        if (checkMapCityNameExist.rowCount > 0) {
            RequestResponse.validationError(res, apiMessage.mapCityNotExsit, status.error, []);
            return false;
        }

        let checkUserCityNameExist: any = await AreaMasters.checkUserCityNameExists(countyStateCityDetail.userCityName, countyStateCityDetail.mapStateId, countyStateCityDetail.mapCityId, req);

        if (checkUserCityNameExist.rowCount > 0) {
            RequestResponse.validationError(res, apiMessage.userCityNotExsit, status.error, []);
            return false;
        }

        countyStateCityDetail.sw = validationResult.sw;
        countyStateCityDetail.ne = validationResult.ne;
        countyStateCityDetail.center = validationResult.center;
        countyStateCityDetail.radius = validationResult.radius;
        countyStateCityDetail.polygonpoint = validationResult.polygonpoint;
        countyStateCityDetail.polygonpoint2 == validationResult.polygonpoint2;

        if (countyStateCityDetail.mapCityId == '0') {
            checkMapCityNameExist = await AreaMasters.addMapCityName(countyStateCityDetail, req);
        } else {
            checkMapCityNameExist = await AreaMasters.updateMapCityName(countyStateCityDetail, req);
        }

        return RequestResponse.success(res, apiMessage.success, status.success, []);
    } catch (error: any) {
        AddExceptionIntoDB(req, error);
        return error.message;
    }
};

// const addUpdateMapCityValidations = async (countyStateCityValidation : any ,res: Response ) => {
//     try {

//         if ( CommonMessage.IsValid(countyStateCityValidation.userCityName )==false) {
//             RequestResponse.validationError(res,  apiMessage.userCityName, status.error, []);
//             return false;
//           }

//           //     let polygonArray: any = [];

//     //     if (countyStateCityValidation.mapDrawObjectEnumId == '53')// rectange
//     //      {

//     //       if ( CommonMessage.IsValid(countyStateCityValidation.sw )==false) {
//     //           RequestResponse.validationError(res,  apiMessage.sw, status.error, []);
//     //           return false;
//     //       }

//     //       if ( CommonMessage.IsValid(countyStateCityValidation.ne )==false) {
//     //           RequestResponse.validationError(res,  apiMessage.ne, status.error, []);
//     //           return false;
//     //       }
//     //       countyStateCityValidation.sw =  "("+countyStateCityValidation.sw[0] +","+countyStateCityValidation.sw[1]+")"

//     //       countyStateCityValidation.ne =  "("+countyStateCityValidation.ne[0] +","+countyStateCityValidation.ne[1]+")"
//     //      }
//     //      else
//     //      {
//     //         countyStateCityValidation.sw = null ;
//     //         countyStateCityValidation.ne = null ;
//     //      }

//     //    if (countyStateCityValidation.mapDrawObjectEnumId == '51')// Circle
//     //    {

//     //       if ( CommonMessage.IsValid(countyStateCityValidation.center )==false) {
//     //           RequestResponse.validationError(res,  apiMessage.center, status.error, []);
//     //           return false;
//     //       }

//     //       if ( CommonMessage.IsValid(countyStateCityValidation.radius )==false) {
//     //           RequestResponse.validationError(res,  apiMessage.radius, status.error, []);
//     //           return false;
//     //       }

//     //       countyStateCityValidation.center = "("+countyStateCityValidation.center[0] +","+countyStateCityValidation.center[1]+")";
//     //    }
//     //    else
//     //    {
//     //     countyStateCityValidation.center =null;
//     //     countyStateCityValidation.radius =null;
//     //    }

//     //    if (countyStateCityValidation.mapDrawObjectEnumId == '52')// Polygon
//     //    {

//     //       if ( CommonMessage.IsValid(countyStateCityValidation.polygonpoint )==false) {
//     //           RequestResponse.validationError(res,  apiMessage.polygonpoint, status.error, []);
//     //           return false;
//     //       }

//     //       if ( CommonMessage.IsValid(countyStateCityValidation.polygonpoint2 )==false) {
//     //           RequestResponse.validationError(res,  apiMessage.polygonpoint2, status.error, []);
//     //           return false;
//     //       }
//     //       //
//     //       for (var i = 0; i< countyStateCityValidation.polygonpoint.length; i++)
//     //       {
//     //          polygonArray.push("("+countyStateCityValidation.polygonpoint[i][0] +","+countyStateCityValidation.polygonpoint[i][1]+")");
//     //       }

//     //       countyStateCityValidation.polygonpoint =polygonArray;

//     //    }
//     //    else
//     //    {
//     //     countyStateCityValidation.polygonpoint =null
//     //     countyStateCityValidation.polygonpoint2 =null

//     //    }

//     let mapValidationResult:any =  await mapAreacityValidations(countyStateCityValidation,res)

//   if(mapValidationResult==false)
//     {
//       return false ;
//     }
//     return mapValidationResult;

//        } catch (error: any) {
//         logger.error(error);
//          exceptionHandler(res, 1, error.message);
//          return false;
//     }
// };

const mapAreacityValidations = async (countyStateCityValidation: any, res: Response, req: any) => {
    try {
        let polygonArray: any = [];

        if (CommonMessage.IsValid(countyStateCityValidation.mapCountryName) == false) {
            RequestResponse.validationError(res, apiMessage.CountryName, status.error, []);
            return false;
        }

        if (CommonMessage.IsValid(countyStateCityValidation.mapStateName) == false) {
            RequestResponse.validationError(res, apiMessage.StateName, status.error, []);
            return false;
        }
        if (CommonMessage.IsValid(countyStateCityValidation.mapCityName) == false) {
            RequestResponse.validationError(res, apiMessage.CityName, status.error, []);
            return false;
        }

        if (CommonMessage.IsValid(countyStateCityValidation.placeId) == false) {
            RequestResponse.validationError(res, apiMessage.placeId, status.error, []);
            return false;
        }

        // if ( CommonMessage.IsValid(countyStateCityValidation.pinCode)==false) {
        //     RequestResponse.validationError(res,  apiMessage.pinCode, status.error, []);
        //     return false;
        // }

        if (CommonMessage.IsValid(countyStateCityValidation.fullAddress) == false) {
            RequestResponse.validationError(res, apiMessage.fullAddress, status.error, []);
            return false;
        }

        if (CommonMessage.IsValid(countyStateCityValidation.mapDrawObjectEnumId) == false) {
            RequestResponse.validationError(res, apiMessage.mapDrawObjectEnumId, status.error, []);
            return false;
        }

        if (CommonMessage.IsValid(countyStateCityValidation.mapDrawObject) == false) {
            RequestResponse.validationError(res, apiMessage.mapDrawObject, status.error, []);
            return false;
        }

        if (CommonMessage.IsValid(countyStateCityValidation.mapDrawObjectAddress) == false) {
            RequestResponse.validationError(res, apiMessage.mapDrawObjectAddress, status.error, []);
            return false;
        }

        if (countyStateCityValidation.mapDrawObjectEnumId == '53') // rectange
        {
            if (CommonMessage.IsValid(countyStateCityValidation.sw) == false) {
                RequestResponse.validationError(res, apiMessage.sw, status.error, []);
                return false;
            }

            if (CommonMessage.IsValid(countyStateCityValidation.ne) == false) {
                RequestResponse.validationError(res, apiMessage.ne, status.error, []);
                return false;
            }
            countyStateCityValidation.sw = '(' + countyStateCityValidation.sw[0] + ',' + countyStateCityValidation.sw[1] + ')';

            countyStateCityValidation.ne = '(' + countyStateCityValidation.ne[0] + ',' + countyStateCityValidation.ne[1] + ')';
        } else {
            countyStateCityValidation.sw = null;
            countyStateCityValidation.ne = null;
        }

        if (countyStateCityValidation.mapDrawObjectEnumId == '51') // Circle
        {
            if (CommonMessage.IsValid(countyStateCityValidation.center) == false) {
                RequestResponse.validationError(res, apiMessage.center, status.error, []);
                return false;
            }

            if (CommonMessage.IsValid(countyStateCityValidation.radius) == false) {
                RequestResponse.validationError(res, apiMessage.radius, status.error, []);
                return false;
            }

            countyStateCityValidation.center = '(' + countyStateCityValidation.center[0] + ',' + countyStateCityValidation.center[1] + ')';
        } else {
            countyStateCityValidation.center = null;
            countyStateCityValidation.radius = null;
        }

        if (countyStateCityValidation.mapDrawObjectEnumId == '52') // Polygon
        {
            if (CommonMessage.IsValid(countyStateCityValidation.polygonpoint) == false) {
                RequestResponse.validationError(res, apiMessage.polygonpoint, status.error, []);
                return false;
            }

            if (CommonMessage.IsValid(countyStateCityValidation.polygonpoint2) == false) {
                RequestResponse.validationError(res, apiMessage.polygonpoint2, status.error, []);
                return false;
            }
            //
            for (var i = 0; i < countyStateCityValidation.polygonpoint.length; i++) {
                polygonArray.push('(' + countyStateCityValidation.polygonpoint[i][0] + ',' + countyStateCityValidation.polygonpoint[i][1] + ')');
            }

            countyStateCityValidation.polygonpoint = polygonArray;
        } else {
            countyStateCityValidation.polygonpoint = null;
            countyStateCityValidation.polygonpoint2 = null;
        }

        return countyStateCityValidation;
    } catch (error: any) {
        AddExceptionIntoDB(req, error);
        exceptionHandler(res, 1, error.message);
        return false;
    }
};

const getCityDataForTable = async (req: Request, res: Response) => {
    try {
        let requestQuery = req.query;
        let result: any;

        result = await AreaMasters.getCityDataForTable(req);
        let cityDetail: any = [];

        if (result.rowCount > 0) {
            for (let row of result.rows) {
                cityDetail.push({
                    mapStateId: Number(row.map_state_id),
                    mapStateName: row.map_state_name,
                    mapCityId: Number(row.map_city_id),
                    mapCityName: row.map_city_name,
                    statusEnumId: Number(row.status_enum_id),
                    cityStatus: row.city_status,
                    userCityName: row.user_city_name,
                    createdOnDate: row.createdon_date,
                    updatedOnDate: row.updatedon_date
                });
            }
            return RequestResponse.success(res, apiMessage.success, status.success, cityDetail);
        } else {
            return RequestResponse.validationError(res, apiMessage.dataNotAvailable, status.error, []);
        }
    } catch (error: any) {
        AddExceptionIntoDB(req, error);
        return exceptionHandler(res, 1, error.message);
    }
};

const getMapCityDetail = async (req: Request, res: Response) => {
    try {
        let requestQuery = req.query;
        let result: any;
        if (CommonMessage.IsValid(requestQuery.mapCityId) == false) {
            RequestResponse.validationError(res, apiMessage.mapCityId, status.error, []);
            return false;
        }
        result = await AreaMasters.getCityDataForDetail(requestQuery.mapCityId, req);

        let cityDetail: any = [];

        if (result.rowCount > 0) {
            for (let row of result.rows) {
                cityDetail.push({
                    mapCountryId: Number(row.map_country_id),
                    mapCountryName: row.map_country_name,
                    mapStateId: Number(row.map_state_id),
                    mapStateName: row.map_state_name,
                    mapCityId: Number(row.map_city_id),
                    mapCityName: row.map_city_name,
                    statusEnumId: Number(row.status_enum_id),
                    cityStatus: row.city_status,
                    pinCode: row.pin_code,
                    fullAddress: row.full_address,
                    placeId: row.place_id,
                    userCityName: row.user_city_name,
                    mapDrawObjectEnumId: row.map_draw_object_enum_id,
                    mapDrawObject: row.map_draw_object,
                    mapDrawObjectAddress: row.map_draw_object_address,

                    center: row.city_api_circle_center,
                    redius: row.city_api_circle_redius,
                    sw: row.city_api_south_west_point,

                    ne: row.city_api_north_east_point,
                    polygon: row.city_api_polygon,
                    polygon2: row.city_api_db_polygon
                });
            }
            return RequestResponse.success(res, apiMessage.success, status.success, cityDetail);
        } else {
            return RequestResponse.validationError(res, apiMessage.dataNotAvailable, status.error, []);
        }
    } catch (error: any) {
        AddExceptionIntoDB(req, error);

        return exceptionHandler(res, 1, error.message);
    }
};

const getMapCityDetailsForSearche = async (req: Request, res: Response) => {
    try {
        let requestQuery = req.query;
        let result: any;

        result = await AreaMasters.getMapCityDetailsForSearche(requestQuery.mapCountryName, requestQuery.mapStateName, requestQuery.mapCityName, req);
        let cityDetail: any = [];

        if (result.rowCount > 0) {
            for (let row of result.rows) {
                cityDetail.push({
                    mapCountryId: Number(row.map_country_id),
                    mapCountryName: row.map_country_name,
                    mapStateId: Number(row.map_state_id),
                    mapStateName: row.map_state_name,
                    mapCityId: Number(row.map_city_id),
                    mapCityName: row.map_city_name,
                    statusEnumId: Number(row.status_enum_id),
                    cityStatus: row.city_status,
                    pinCode: row.pin_code,
                    fullAddress: row.full_address,
                    placeId: row.place_id,

                    userCityName: row.user_city_name,
                    mapDrawObjectEnumId: row.map_draw_object_enum_id,
                    mapDrawObject: row.map_draw_object,
                    mapDrawObjectAddress: row.map_draw_object_address,

                    center: row.city_api_circle_center,
                    redius: row.city_api_circle_redius,
                    sw: row.city_api_south_west_point,

                    ne: row.city_api_north_east_point,
                    polygon: row.city_api_polygon,
                    polygon2: row.city_api_db_polygon
                });
            }
            return RequestResponse.success(res, apiMessage.success, status.success, cityDetail);
        } else {
            return RequestResponse.validationError(res, apiMessage.dataNotAvailable, status.error, []);
        }
    } catch (error: any) {
        AddExceptionIntoDB(req, error);

        return exceptionHandler(res, 1, error.message);
    }
};

const getzoneDetailWithAllTypeBikeCountList = async (req: Request, res: Response) => {
    try {
        let requestQuery = req.query;
        let result: any;

        // if (  requestQuery.zoneId == undefined || requestQuery.zoneId ==null|| requestQuery.zoneId =='null' ) {
        //     RequestResponse.validationError(res, apiMessage.zoneId, status.error, [])
        //     return  false  ;
        // }
        // if (requestQuery.mapCityId==undefined || requestQuery.mapCityId == null|| requestQuery.mapCityId == 'null') {
        //     RequestResponse.validationError(res, 'Please set map city id ', status.error, [])
        //     return  false  ;
        // }

        result = await AreaMasters.getzoneDetailWithBikeAllTypeCountService(requestQuery.mapCountryName, requestQuery.mapStateName, requestQuery.mapCityName, requestQuery.zoneId, req);

        let getOutSideGeoFanceBikeListResult: any = [];
        let getActiveBikeListResult: any = [];
        let getAvaialableBikeListResult: any = [];
        let getUnderMantanceBikeListResult: any = [];

        let zoneDetail: any = [];

        if (result.rowCount > 0) {
            for (let row of result.rows) {
                ((requestQuery.zoneId = row.id),
                    //  getOutSideGeoFanceBikeListResult = await adminDashboardServices.getOutSideGeoFanceBikeListZoneWise(requestQuery);
                    (getActiveBikeListResult = await adminDashboardServices.getActiveBikeListZoneWise(requestQuery, req)));
                getAvaialableBikeListResult = await adminDashboardServices.getAvaialableBikeListZoneWise(requestQuery, req);
                getUnderMantanceBikeListResult = await adminDashboardServices.getUnderMantanceBikeListZoneWise(requestQuery, req);

                zoneDetail.push({
                    zoneId: row.id,
                    zoneName: row.name,
                    totalBikeCount: row.total_bike_count,
                    availableBikeCount: row.available_bike_count,
                    bookedKikeCount: row.booked_bike_count,
                    underMaintenanceBikeCount: row.undermaintenance_bike_count,
                    latitude: row.latitude,
                    longitude: row.longitude,
                    zone_size: row.zone_size,
                    zone_capacity: row.zone_capacity,
                    zone_address: row.zone_address,
                    mapStateId: Number(row.map_state_id),
                    mapStateName: row.map_state_name,
                    mapCityId: Number(row.map_city_id),
                    mapCityName: row.map_city_name,
                    areaName: row.area_name,
                    areaTypeEnumId: Number(row.area_type_enum_id),
                    areaType: row.area_type,
                    statusEnumId: Number(row.status_enum_id),
                    createdById: row.created_by_id,
                    createdDate: row.createdon_date,
                    areaPlaceId: row.place_id,
                    areaPinCode: row.Pin_code,
                    areaFullAddress: row.full_address,

                    activeBikeListData: getActiveBikeListResult,
                    avaialableBikeListData: getAvaialableBikeListResult,
                    underMantanceBikeListData: getUnderMantanceBikeListResult
                });
            }

            return RequestResponse.success(res, apiMessage.success, status.success, zoneDetail);
        } else {
            return RequestResponse.validationError(res, apiMessage.dataNotAvailable, status.error, []);
        }
    } catch (error: any) {
        AddExceptionIntoDB(req, error);

        return exceptionHandler(res, 1, error.message);
    }
};

const getMapCityDetailForReport = async (req: Request, res: Response) => {
    try {
        let requestQuery = req.body;
        let result: any;
        if (CommonMessage.IsValid(requestQuery.mapStateId) == false) {
            RequestResponse.validationError(res, apiMessage.mapStateNotExsit, status.error, []);
            return false;
        }
        result = await AreaMasters.getCityDataForDetailForReport(requestQuery.mapStateId, req);

        let cityDetail: any = [];

        if (result.rowCount > 0) {
            for (let row of result.rows) {
                cityDetail.push({
                    mapCountryId: Number(row.map_country_id),
                    mapCountryName: row.map_country_name,
                    mapStateId: Number(row.map_state_id),
                    mapStateName: row.map_state_name,
                    mapCityId: Number(row.map_city_id),
                    mapCityName: row.map_city_name,
                    statusEnumId: Number(row.status_enum_id),
                    cityStatus: row.city_status,
                    pinCode: row.pin_code,
                    fullAddress: row.full_address,
                    placeId: row.place_id,
                    userCityName: row.user_city_name,
                    mapDrawObjectEnumId: row.map_draw_object_enum_id,
                    mapDrawObject: row.map_draw_object,
                    mapDrawObjectAddress: row.map_draw_object_address,

                    center: row.city_api_circle_center,
                    redius: row.city_api_circle_redius,
                    sw: row.city_api_south_west_point,

                    ne: row.city_api_north_east_point,
                    polygon: row.city_api_polygon,
                    polygon2: row.city_api_db_polygon
                });
            }
            return RequestResponse.success(res, apiMessage.success, status.success, cityDetail);
        } else {
            return RequestResponse.validationError(res, apiMessage.dataNotAvailable, status.error, []);
        }
    } catch (error: any) {
        AddExceptionIntoDB(req, error);

        return exceptionHandler(res, 1, error.message);
    }
};

const getMapAreaDetailForReport = async (req: Request, res: Response) => {
    try {
        let requestQuery = req.query;
        let result: any;

        result = await AreaMasters.getMapAreaDetailReport(req);
        let areaDetail: any = [];

        if (result.rowCount > 0) {
            for (let row of result.rows) {
                areaDetail.push({
                    areaId: Number(row.id),
                    name: row.name,
                    mapStateId: Number(row.map_state_id),
                    mapStateName: row.map_state_name,
                    mapCityId: Number(row.map_city_id),
                    mapCityName: row.map_city_name,
                    areaTypeEnumId: Number(row.area_type_enum_id),
                    areaType: row.area_type,
                    statusEnumId: Number(row.status_enum_id),
                    createdById: row.created_by_id,
                    createdDate: row.createdon_date
                });
            }
            return RequestResponse.success(res, apiMessage.success, status.success, areaDetail);
        } else {
            return RequestResponse.validationError(res, apiMessage.dataNotAvailable, status.error, []);
        }
    } catch (error: any) {
        AddExceptionIntoDB(req, error);
        return exceptionHandler(res, 1, error.message);
    }
};

const getZoneDetailForReportController = async (req: Request, res: Response) => {
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

        // let requestQuery = req.query;
        let result: any = await AreaMasters.getZoneDetailReport(req);

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
                    areaTypeEnumId: row.area_type_enum_id,
                    areaTypeName: row.area_enum_type_name
                });
            }

            return RequestResponse.success(res, apiMessage.success, status.success, zoneDetails);
        } else {
            return RequestResponse.success(res, apiMessage.recordNotFound, status.success, []);
        }
    } catch (error: any) {
        AddExceptionIntoDB(req, error);

        return exceptionHandler(res, 1, error.message);
    }
};

export default {
    addUpdateAreaDetailController,
    getAreaDetail,
    insertFarePlanDetailDetailController,
    getfarePlanDetail,
    getReportBikeData,
    addCountryStateCityController,
    getMapAreaDetail,
    getzoneDetailWithBikeCountList,
    addUpdateMapCityDetailController,
    getCityDataForTable,
    getMapCityDetail,
    getMapCityDetailsForSearche,
    getzoneDetailWithAllTypeBikeCountList,
    getAreaMapCityState,
    getMapCityDetailForReport,
    getMapAreaDetailForReport,
    getZoneDetailForReportController
};
