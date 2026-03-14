import { NextFunction, Request, Response } from 'express';
const { parse } = require('querystring');

import status from '../../helper/status';
import RideEarningReport from '../../services/rideEarningServices/ride.earningreport.services';
import { exceptionHandler, AddExceptionIntoDB } from '../../helper/responseHandler';
import RequestResponse from '../../helper/responseClass';
import { apiMessage } from '../../helper/api-message';
import logger from '../../Config/logging';
import CommonMessage from '../../helper/common.validation';

import Dateformats from '../../helper/utcdate';
import { fromDateTodateValidations } from '../../helper/common-function';

const reportParametersValidation = async (data: any) => {
    let vData: any;
    if (CommonMessage.IsValid(data.userId) === false) {
        vData.userId = '0';
    }

    if (CommonMessage.IsValid(data.bikeId) === false) {
        vData.bikeId = '0';
    }

    if (CommonMessage.IsValid(data.bikeRideingStatusEnumId) === false) {
        vData.bikeRideingStatusEnumId = '0';
    }

    if (CommonMessage.IsValid(data.userName) === false) {
        vData.userName = '';
    }

    if (CommonMessage.IsValid(data.mobileNo) === false) {
        vData.userName = '';
    }

    if (CommonMessage.IsValid(data.lockNumber) === false) {
        vData.lockNumber = '';
    }

    if (CommonMessage.IsValid(data.mapStateName) === false) {
        vData.mapStateName = '';
    }

    if (CommonMessage.IsValid(data.mapCityName) === false) {
        vData.mapCityName = '';
    }

    vData.fromDate = data.fromDate;
    vData.toDate = data.toDate;
    return vData;
};
const getUserWiseRideEarningReport = async (req: Request, res: Response) => {
    try {
        let requestQuery = req.body;
        let result: any;

        if ((await fromDateTodateValidations(requestQuery.fromDate, apiMessage.fromDate, requestQuery.toDate, apiMessage.toDate, res)) == false) {
            return;
        }

        let from_date: any = Dateformats.ConvertUTCtoDateformatWithoutTime(requestQuery.fromDate); // new Date()
        let to_date: any = Dateformats.ConvertUTCtoDateformatWithoutTimeAddEndTime(requestQuery.toDate); // new Date()

        requestQuery.fromDate = from_date;
        requestQuery.toDate = to_date;
        if (CommonMessage.IsValid(requestQuery.userId) === false) {
            requestQuery.userId = '0';
        }

        if (CommonMessage.IsValid(requestQuery.bikeId) === false) {
            requestQuery.bikeId = '0';
        }

        if (CommonMessage.IsValid(requestQuery.bikeRideingStatusEnumId) === false) {
            requestQuery.bikeRideingStatusEnumId = '0';
        }

        if (CommonMessage.IsValid(requestQuery.userName) === false) {
            requestQuery.userName = '';
        }

        if (CommonMessage.IsValid(requestQuery.mobileNo) === false) {
            requestQuery.mobileNo = '';
        }

        if (CommonMessage.IsValid(requestQuery.lockNumber) === false) {
            requestQuery.lockNumber = '';
        }

        if (CommonMessage.IsValid(requestQuery.mapStateId) === false) {
            requestQuery.mapStateName = '';
        }

        if (CommonMessage.IsValid(requestQuery.mapCityId) === false) {
            requestQuery.mapCityName = '';
        }

        result = await RideEarningReport.userWiseRideEarningReports(requestQuery);
        let report: any = [];

        if (result.rowCount > 0) {
            for (let row of result.rows) {
                report.push({
                    totalRide: Number(row.total_ride),
                    totalRideAmount: parseFloat(row.total_ride_amount).toFixed(2),
                    userId: Number(row.user_id),
                    userName: row.user_name,
                    mobileNo: row.mobile
                });
            }

            return RequestResponse.success(res, apiMessage.success, status.success, report);
        } else {
            return RequestResponse.validationError(res, apiMessage.dataNotAvailable, status.error, []);
        }
    } catch (error: any) {
        AddExceptionIntoDB(req, error);

        return exceptionHandler(res, 1, error.message);
    }
};

const getbikeWiseRideEarningReport = async (req: Request, res: Response) => {
    try {
        let requestQuery = req.body;
        let result: any;

        if ((await fromDateTodateValidations(requestQuery.fromDate, apiMessage.fromDate, requestQuery.toDate, apiMessage.toDate, res)) == false) {
            return;
        }

        let from_date: any = Dateformats.ConvertUTCtoDateformatWithoutTime(requestQuery.fromDate); // new Date()
        let to_date: any = Dateformats.ConvertUTCtoDateformatWithoutTimeAddEndTime(requestQuery.toDate); // new Date()
        requestQuery.fromDate = from_date;
        requestQuery.toDate = to_date;
        {
            requestQuery.userId = '0';
        }

        if (CommonMessage.IsValid(requestQuery.bikeId) === false) {
            requestQuery.bikeId = '0';
        }

        if (CommonMessage.IsValid(requestQuery.bikeRideingStatusEnumId) === false) {
            requestQuery.bikeRideingStatusEnumId = '0';
        }

        if (CommonMessage.IsValid(requestQuery.userName) === false) {
            requestQuery.userName = '';
        }

        if (CommonMessage.IsValid(requestQuery.mobileNo) === false) {
            requestQuery.mobileNo = '';
        }

        if (CommonMessage.IsValid(requestQuery.lockNumber) === false) {
            requestQuery.lockNumber = '';
        }

        if (CommonMessage.IsValid(requestQuery.mapStateId) === false) {
            requestQuery.mapStateName = '';
        }

        if (CommonMessage.IsValid(requestQuery.mapCityId) === false) {
            requestQuery.mapCityName = '';
        }
        result = await RideEarningReport.bikeWiseRideEarningReport(requestQuery);

        let report: any = [];

        if (result.rowCount > 0) {
            for (let row of result.rows) {
                report.push({
                    totalRide: Number(row.no_of_ride),
                    totalRideAmount: parseFloat(row.total_ride_amount).toFixed(2),
                    bikeId: Number(row.bike_id),
                    bikeName: row.bike_name,
                    lockNumber: row.lock_number,
                    lockId: Number(row.id)
                });
            }

            return RequestResponse.success(res, apiMessage.success, status.success, report);
        } else {
            return RequestResponse.validationError(res, apiMessage.dataNotAvailable, status.error, []);
        }
    } catch (error: any) {
        AddExceptionIntoDB(req, error);
        return exceptionHandler(res, 1, error.message);
    }
};

const getRideEraningReportDetails = async (req: Request, res: Response) => {
    try {
        let requestQuery = req.query;
        let result: any;

        if ((await fromDateTodateValidations(requestQuery.fromDate, apiMessage.fromDate, requestQuery.toDate, apiMessage.toDate, res)) == false) {
            return;
        }

        if (CommonMessage.IsValid(requestQuery.rideStatusEnumId) == false) {
            return RequestResponse.validationError(res, apiMessage.validEnumStatusId, status.info, []);
        }

        let from_date: any = Dateformats.ConvertUTCtoDateformatWithoutTime(requestQuery.fromDate); // new Date()
        let to_date: any = Dateformats.ConvertUTCtoDateformatWithoutTimeAddEndTime(requestQuery.toDate); // new Date()

        result = await RideEarningReport.getRideReportDetail(from_date, to_date, requestQuery.rideStatusEnumId);

        let report: any = [];

        if (result.rowCount > 0) {
            for (let row of result.rows) {
                report.push({
                    rideId: Number(row.id),
                    fromRideTime: row.from_ride_time,
                    toRideTime: row.to_ride_time,
                    userId: row.user_id,
                    userName: row.user_name,
                    mobileNo: row.mobile,
                    bikeId: row.bike_id,
                    lockId: row.vehicle_lock_id,
                    modelId: row.vehicle_model_id,
                    uid: row.vehicle_uid_id,
                    modelName: row.model_name,
                    uidNumber: row.model_uid_number,
                    lockNumber: row.lock_number,
                    rideBookingMin: row.ride_booking_min,
                    actualRideMin: row.actual_ride_min,
                    endRideUserId: row.end_ride_user_id,
                    endRideUserName: row.end_ride_user_name,
                    totalRideAmount: row.total_ride_amount,
                    remark: row.remark
                    // totalRideAmount : parseFloat(row.total_ride_amount ).toFixed(2),
                    // bikeId : Number(row.bike_id) ,
                });
            }

            return RequestResponse.success(res, apiMessage.success, status.success, report);
        } else {
            return RequestResponse.validationError(res, apiMessage.dataNotAvailable, status.error, []);
        }
    } catch (error: any) {
        AddExceptionIntoDB(req, error);
        return exceptionHandler(res, 1, error.message);
    }
};

const getRideEarningDetailReport = async (req: Request, res: Response) => {
    try {
        let requestQuery = req.body;
        let result: any;
        let user_id: any = 0;
        let bike_id: any = 0;
        let bike_rideing_Status_enum_id: any = 15; // for completed

        if (CommonMessage.IsValid(requestQuery.userId) == false && CommonMessage.IsValid(requestQuery.bikeId) == false && CommonMessage.IsValid(requestQuery.bikeRideingStatusEnumId) == false) {
            return RequestResponse.validationError(res, apiMessage.unllAndUndefindeCheck, status.info, []);
        }

        if (CommonMessage.IsValid(requestQuery.userId) == false) {
            requestQuery.userId = user_id;
        }

        if (CommonMessage.IsValid(requestQuery.bikeId) == false) {
            requestQuery.bikeId = bike_id;
        }

        if (CommonMessage.IsValid(requestQuery.bikeRideingStatusEnumId) == false) {
            requestQuery.bikeRideingStatusEnumId = bike_rideing_Status_enum_id;
        }

        if (CommonMessage.IsValid(requestQuery.userName) === false) {
            requestQuery.userName = '';
        }

        if (CommonMessage.IsValid(requestQuery.mobileNo) === false) {
            requestQuery.mobileNo = '';
        }

        if (CommonMessage.IsValid(requestQuery.lockNumber) === false) {
            requestQuery.lockNumber = '';
        }

        if (CommonMessage.IsValid(requestQuery.mapStateId) === false) {
            requestQuery.mapStateName = '';
        }

        if (CommonMessage.IsValid(requestQuery.mapCityId) === false) {
            requestQuery.mapCityName = '';
        }

        if ((await fromDateTodateValidations(requestQuery.fromDate, apiMessage.fromDate, requestQuery.toDate, apiMessage.toDate, res)) == false) {
            return;
        }
        //requestQuery.userName,requestQuery.mobileNo,requestQuery.lockNumber
        let from_date: any = Dateformats.ConvertUTCtoDateformatWithoutTime(requestQuery.fromDate); // new Date()
        let to_date: any = Dateformats.ConvertUTCtoDateformatWithoutTimeAddEndTime(requestQuery.toDate); // new Date()
        requestQuery.fromDate = from_date;
        requestQuery.toDate = to_date;
        result = await RideEarningReport.userIdOrBikeIdWiseRideEarningDetailReport(requestQuery);

        let report: any = [];

        if (result.rowCount > 0) {
            for (let row of result.rows) {
                report.push({
                    fromRideTime: row.from_ride_time,
                    toRideTime: row.actual_ride_time,
                    minimumHiringTime: row.minimum_hiring_time,
                    minimumRentRate: row.minimum_rent_rate,
                    userName: row.user_name,
                    mobileNo: row.mobile,
                    bikeName: row.bike_name,
                    modelName: row.model_name,
                    uidNumber: row.model_uid_number,
                    lockNumber: row.lock_number,
                    actualRideMin: row.actual_ride_min,
                    endRideUserName: row.end_ride_user_name,
                    totalRideAmount: row.total_ride_amount,
                    endRideRemark: row.end_ride_remark,
                    bikeRideingStatus: row.bike_rideing_status,
                    rideStartZoneId: row.ride_start_zone_id,
                    rideStartZoneName: row.ride_start_zone_name,
                    rideEndZoneId: row.ride_end_zone_id,
                    rideEndZoneName: row.end_start_zone_name,

                    rideBookingNo: row.ride_booking_no,
                    // deviceLockCount : row.device_lock_count ,
                    // deviceUnlockCount  : row.device_unlock_count ,
                    rideRating: row.ride_rating,
                    rideComments: row.ride_comments,
                    rideCommentsReply: row.ride_comments_reply,
                    // commentsReplyStatusEnumId : row.comments_reply_status_enum_id ,
                    // ratingCommentsDate : row.rating_comments_date ,
                    commentsReplyDate: row.comments_reply_date,
                    distanceInMeters: row.distance_in_meters
                    // map_city_name : row.map_city_name ,
                    // map_state_name   : row.map_state_name ,
                });
            }

            return RequestResponse.success(res, apiMessage.success, status.success, report);
        } else {
            return RequestResponse.validationError(res, apiMessage.dataNotAvailable, status.error, []);
        }
    } catch (error: any) {
        AddExceptionIntoDB(req, error);

        return exceptionHandler(res, 1, error.message);
    }
};

export default { getUserWiseRideEarningReport, getbikeWiseRideEarningReport, getRideEarningDetailReport, getRideEraningReportDetails };
