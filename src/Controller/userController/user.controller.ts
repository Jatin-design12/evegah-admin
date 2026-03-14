import { Request, Response } from 'express';
import { apiMessage } from '../../helper/api-message';
import RequestResponse from '../../helper/responseClass';

import { AddUserCheckCustomerMobileNumberDetail, AddGetUserDetail, SendOtpDetail, logOutUser } from '../../services/userServices/user.services';
import GetUserServices from '../../services/userServices/user.get.services';
import status from '../../helper/status';
import logger from '../../Config/logging';
import DashboardServices from '../../services/adminServices/admin.dashboard.services';
import RideBooking from '../../services/rideBookingServices/ride.booking.services';
import { generateOrderNumber, getTokenDetail } from '../../helper/common-function';
import { exceptionHandler, AddExceptionIntoDB } from '../../helper/responseHandler';
import CommonMessage from '../../helper/common.validation';

const addUserCheckCustomerMobileNumberService = async (req: Request, res: Response) => {
    try {
        // #swagger.tags = ['User']
        // #swagger.description = 'Endpoint to get a specific user.'

        /*	#swagger.parameters['obj'] = {
                in: 'body',
                description: 'User information.',
                required: true,
                schema: { $ref: "#/definitions/addUserCheckCustomerMobileNumberService" }
        } */
        await AddUserCheckCustomerMobileNumberDetail(req, res);
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

const AddUserService = async (req: Request, res: Response) => {
    try {
        // #swagger.tags = ['User']
        // #swagger.description = 'Endpoint to get a specific user.'
        /*	#swagger.parameters['obj'] = {
                in: 'body',
                description: 'User information.',
                required: true,
                schema: { $ref: "#/definitions/AddUserService" }
        } */
        await AddGetUserDetail(req, res);
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

const sendOtpController = async (req: Request, res: Response) => {
    try {
        await SendOtpDetail(req, res);
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

const getUserController = async (req: Request, res: Response) => {
    try {
        // #swagger.tags = ['user-Get']
        // #swagger.description = 'Pass id or 0  and status_enum_id = 0 to see all user '

        /*#swagger.parameters[ {
                        "name": "id",
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

        let requestQuery: any = { ...req.query };
        const updatedSinceRaw = typeof requestQuery.updatedSince === 'string' ? requestQuery.updatedSince : '';
        let updatedSinceIso: string | null = null;
        if (CommonMessage.IsValid(updatedSinceRaw) == true) {
            const updatedSinceDate = new Date(updatedSinceRaw);
            if (isNaN(updatedSinceDate.getTime())) {
                return RequestResponse.validationError(res, CommonMessage.ErrorMessage(5, 'updatedSince'), status.error, []);
            }
            updatedSinceIso = updatedSinceDate.toISOString();
        }
        requestQuery.updatedSince = updatedSinceIso;

        let result: any = await GetUserServices.getUserDetails(requestQuery);

        let userDetails = [];
        let maxSyncTimestamp = 0;

        let distance_in_meters: any = 0;
        for (let row of result.rows) {
            if (Number(row.total_distance_in_meters) == 0) {
                distance_in_meters = 0;
            } else {
                distance_in_meters = parseFloat(row.total_distance_in_meters).toFixed(3);
            }

            const rowSyncDate = row.updatedon_date || row.createdon_date;
            if (rowSyncDate) {
                const rowSyncTime = new Date(rowSyncDate).getTime();
                if (!isNaN(rowSyncTime) && rowSyncTime > maxSyncTimestamp) {
                    maxSyncTimestamp = rowSyncTime;
                }
            }

            userDetails.push({
                id: row.id,
                userName: row.user_name,
                totalRide: row.total_ride,
                totalDistanceInKm: distance_in_meters, //parseFloat(row.total_distance_in_meters).toFixed(3),
                totalAideAmount: row.total_ride_amount,
                emailId: row.emailid,
                mobile: row.mobile,
                createdOnDate: row.createdon_date,
                updatedOnDate: row.updatedon_date,
                autoReferralCode: row.auto_referral_code,
                userEnumId: row.user_enum_id,
                userEnumName: row.user_enum_name,
                statusEnumId: row.status_enum_id,
                statusName: row.status_name,
                userTypeEnumId: row.user_type_enum_id,
                userTypeName: row.user_type_name,
                stateId: row.state_id,
                stateName: row.state_name,
                cityId: row.city_id,
                cityName: row.city_name,
                referralCode: row.referral_code,
                dateOfBirth: row.date_of_birth,
                genderEnumId: row.gender_enum_id,
                gender: row.gender,
                address: row.address,
                autoGenUserReferralCode: row.auto_gen_user_referral_code,
                walletAmount: row.min_wallet_amount ? row.min_wallet_amount : 0,
                extraCharges: row.extra_charges ? row.extra_charges : 0,

                depositAmount: row.deposit_amount ? row.deposit_amount : 0,
                lastDepositAmountDate: row.last_deposit_amount_date ? row.last_deposit_amount_date : 0,
                lastRechargeAmountDate: row.last_recharge_amount_date ? row.last_recharge_amount_date : 0,

                subsequentlyRideStatus: row.subsequently_ride_status,
                registrationStatus: row.registration_status,
                drivingStatusId: row.user_driving_status,
                drivingStatusName: row.user_driving_status_name,
                userAppLanguageId: row.user_app_language_id,
                userAppLanguageName: row.user_app_language_name,
                userLastRideDateTime: row.last_user_ride_date_time
            });
        }

        const requestSyncTime = updatedSinceIso ? new Date(updatedSinceIso).getTime() : 0;
        const syncToken = new Date(Math.max(maxSyncTimestamp, requestSyncTime, Date.now())).toISOString();
        res.setHeader('x-sync-token', syncToken);
        res.setHeader('x-delta-mode', updatedSinceIso ? 'true' : 'false');

        if (result.rowCount > 0) {
            return RequestResponse.success(res, apiMessage.success, status.success, userDetails);
        } else {
            return RequestResponse.success(res, apiMessage.recordNotFound, status.success, []);
        }
    } catch (error: any) {
        AddExceptionIntoDB(req, error);
        return exceptionHandler(res, 1, error.message);
    }
};

const getLatestTransactionList = async (req: Request, res: Response) => {
    try {
        let requestQuery = req.query;
        let result: any;
        if (CommonMessage.IsValid(requestQuery.id) == false) {
            requestQuery.id = '0';
        }

        if (CommonMessage.IsValid(requestQuery.userName) == false) {
            requestQuery.userName = '';
        }

        if (CommonMessage.IsValid(requestQuery.mobileNo) == false) {
            requestQuery.mobileNo = '';
        }
        if (CommonMessage.IsValid(requestQuery.transactionTypeEnumId) == false) {
            requestQuery.transactionTypeEnumId = '0';
        }
        result = await DashboardServices.getAllTransaction(requestQuery, req);

        const transactionArray: any = [];
        for (let row of result.rows) {
            let withDrawRequestData: any = {};

            // if(row.transaction_type_enum_id == '107'){
            //     method = 'Add recharge Amount';
            // }else if(row.transaction_type_enum_id == '25'){
            //     method = 'Add deposit Amount';
            // }else {
            //     method =row.transaction_type
            // }

            //  if(row.transaction_type_enum_id == '28'){

            //     requestQuery.requestId =  row.id ;
            //     requestQuery.withdrawRequestStatusEnumId =  '0' ;
            //     requestQuery.id = row.user_id;
            //    let withDrawRequestResult:any = await DashboardServices.getWithdrawRequestFromAdminSide(requestQuery,req);
            //     console.log('check result withDrawRequestResult',withDrawRequestResult)
            //     withDrawRequestData.requestId= withDrawRequestResult.rows[0].id ;
            //     withDrawRequestData.id =withDrawRequestResult.rows[0].user_id ;
            //     withDrawRequestData.userName = withDrawRequestResult.rows[0].user_name ;
            //     withDrawRequestData.contactNumber = withDrawRequestResult.rows[0].contact_number ;
            //     withDrawRequestData.walletAmount = withDrawRequestResult.rows[0].wallet_amount ;
            //     withDrawRequestData.depositAmount =withDrawRequestResult.rows[0].deposit_amount ? withDrawRequestResult.rows[0].deposit_amount:0 ;
            //     withDrawRequestData.withdrawRequestStatusEnumId = withDrawRequestResult.rows[0].withdraw_request_status_enum_id ;
            //     withDrawRequestData.withdrawRequestStatus = withDrawRequestResult.rows[0].withdraw_request_status ;
            //     withDrawRequestData.amount = withDrawRequestResult.rows[0].amount ;
            //     withDrawRequestData.createdOnDate = withDrawRequestResult.rows[0].createdon_date ;
            //     withDrawRequestData.updatedOnDate = withDrawRequestResult.rows[0].updatedon_date ;
            //     withDrawRequestData.cancelledUserId  = withDrawRequestResult.rows[0].cancelled_user_id;
            //     withDrawRequestData.cancelledUserName = withDrawRequestResult.rows[0].cancelled_user_name;
            //     withDrawRequestData.cancelledDate = withDrawRequestResult.rows[0].cancelled_date;
            //     withDrawRequestData.cancelledRemark = withDrawRequestResult.rows[0].cancelled_remark;
            // }

            if (row.transaction_type_enum_id != '109') {
                transactionArray.push({
                    requestId: row.request_id,
                    transactionId: row.id,
                    id: row.user_id,
                    user_name: row.user_name,
                    contact: row.contact,
                    amount: row.wallet_amount,
                    extra_charges: row.extra_charges,
                    hiring_charges: row.hiring_charges,
                    from_ride_time: row.from_ride_time,
                    to_ride_time: row.to_ride_time,
                    ride_booking_min: row.ride_min,
                    createdon_date: row.createdon_date,
                    rideBookingId: row.ride_booking_id,
                    rideStartLatitude: row.ride_start_latitude,
                    rideStartLongitude: row.ride_start_longitude,
                    rideEndLatitude: row.ride_end_latitude,
                    rideEndLongitude: row.ride_end_longitude,
                    withdraw_request_status_enum_id: row.withdraw_request_status_enum_id,
                    withdraw_request_status: row.withdraw_request_status,
                    OrderNumber: row.order_no,
                    rideRating: row.ride_rating,
                    rideComments: row.ride_comments,
                    rideCommentsReply: row.ride_comments_reply,
                    commentsReplyStatusEnumId: row.comments_reply_status_enum_id,
                    commentsReplyStatusName: row.comments_reply_status,
                    rideStartZoneId: row.ride_start_zone_id,
                    rideStartZoneName: row.ride_start_zone_name,
                    rideEndZoneId: row.ride_end_zone_id,
                    endStartZoneName: row.end_start_zone_name,
                    amountAddedByUserId: row.amount_added_by_user_id,
                    amountAddedByUserName: row.amount_added_by_user_name,
                    amountAddedByUserType: row.amount_added_by_user_type,
                    transactionTypeEnumId: row.transaction_type_enum_id,

                    payment_id: row.payment_id ? row.payment_id : row.withdrawn_id,
                    method: row.transaction_type,
                    transaction_type_enum_id: row.transaction_type_enum_id,
                    withdrawnCreatedOnDate: row.createdon_date_w,
                    withdrawnUpdatedOnDate: row.updatedon_date_w,
                    withdrawnCancelledUserId: row.cancelled_user_id,
                    withdrawnCancelledUserName: row.cancelled_user_name,
                    withdrawnCancelledDate: row.cancelled_date,
                    withdrawnCancelledRemark: row.cancelled_remark
                });
            }
        }

        if (result.rowCount > 0) {
            return RequestResponse.success(res, apiMessage.success, status.success, transactionArray);
        } else {
            return RequestResponse.validationError(res, apiMessage.dataNotAvailable, status.error, []);
        }
    } catch (error: any) {
        AddExceptionIntoDB(req, error);

        return exceptionHandler(res, 1, error.message);
    }
};

//     try {
//         let requestQuery = req.query;
//         let result: any;

//         result = await DashboardServices.getAllTransaction(requestQuery);

//         const transactionArray: any = [];
//         for (let row of result.rows) {
//             transactionArray.push({
//                 requestId: row.id,
//                 id: row.user_id,
//                 user_name: row.user_name,
//                 contact: row.contact,
//                 payment_id: row.payment_id ? row.payment_id : row.withdrawn_id,
//                 method: row.transaction_type,
//                 transaction_type_enum_id : row.transaction_type_enum_id,
//                 amount: row.wallet_amount,
//                 extra_charges: row.extra_charges,
//                 hiring_charges: row.hiring_charges,
//                 from_ride_time: row.from_ride_time,
//                 to_ride_time: row.to_ride_time,
//                 ride_booking_min: row.ride_min,
//                 createdon_date: row.createdon_date,
//                 rideBookingId: row.ride_booking_id,
//                 rideStartLatitude: row.ride_start_latitude,
//                 rideStartLongitude: row.ride_start_longitude,
//                 rideEndLatitude: row.ride_end_latitude,
//                 rideEndLongitude: row.ride_end_longitude,
//                 withdraw_request_status_enum_id : row.withdraw_request_status_enum_id,
//                 withdraw_request_status : row.withdraw_request_status,
//             });
//         }

//         if (result.rowCount > 0) {
//             return RequestResponse.success(res, apiMessage.success, status.success, transactionArray);
//         } else {
//             return RequestResponse.success(res, apiMessage.somethingWentWrong, status.error, []);
//         }
//     } catch (error: any) {
//         logger.error(error);

//         return exceptionHandler(res, 1, error.message);
//     }
// };
const getWithdrawRequestFromUserController = async (req: Request, res: Response) => {
    try {
        // #swagger.tags = ['User']
        // #swagger.description = 'Endpoint to get a specific user.'
        /*	#swagger.parameters['obj'] = {
                in: 'body',
                description: 'User information.',
                required: true,
                schema: { $ref: "#/definitions/getWithdrawRequestFromUserController" }
        } */
        let requestBody = req.body;
        let CurrentAmount: any = 0;
        let requestQuery = req.query;
        if (CommonMessage.IsValid(requestBody.amount) == false) {
            return RequestResponse.success(res, 'Please Enter Valid Amount For Withdrawn Request', status.error, []);
        }

        if (requestBody.amount <= 0) {
            return RequestResponse.validationError(res, 'Please Enter Valid Amount For Withdrawn Request', status.error, []);
        }

        let userRideStatus: any = await RideBooking.getUserRideStatus({ id: requestBody.id });

        if (userRideStatus.rowCount > 0) {
            return RequestResponse.validationError(res, 'your ride is active please end the ride.', status.info, []);
        }

        let userDetails: any = await GetUserServices.getUserDetails({ id: requestBody.id, statusEnumId: 1 });

        if (userDetails.rowCount <= 0) {
            return RequestResponse.validationError(res, 'User Details Not Found.', status.info, []);
        }

        requestBody.rechargeAmount = userDetails.rows[0].min_wallet_amount; // it is recharge amount

        if (requestBody.rechargeAmount < 0) {
            return RequestResponse.validationError(res, 'Please recharge you Account because your recharge amount is negative ' + requestBody.rechargeAmount, status.error, []);
        }
        //  CurrentAmount = (userDetails.rows[0].min_wallet_amount - userDetails.rows[0].extra_charges);

        requestBody.currentWalletAmount = userDetails.rows[0].deposit_amount;

        CurrentAmount = userDetails.rows[0].deposit_amount - userDetails.rows[0].extra_charges;

        // if (CurrentAmount < requestBody.amount)
        // {
        //     return RequestResponse.validationError(res, 'InSufficient Wallet Amount For Withdrawn.You Can Withdrawn Only ' + CurrentAmount +'', status.error, []);
        // }

        if (requestBody.currentWalletAmount <= 0) {
            return RequestResponse.validationError(res, 'InSufficient Wallet(Deposit) Amount For Withdrawn.You Can Withdrawn Only ' + CurrentAmount + '', status.error, []);
        }

        if (CurrentAmount != requestBody.amount) {
            return RequestResponse.validationError(res, 'You Can Withdrawn Only ' + requestBody.currentWalletAmount + '', status.error, []);
        }

        let getVerifyT: any = await getTokenDetail(requestQuery.access_token);

        requestBody.amountAddedByUserId = getVerifyT.id;

        let result: any;
        requestBody.OrderType = 'W';
        requestBody.withdrawNo = await generateOrderNumber(requestBody.OrderType);

        result = await GetUserServices.getWithdrawRequestFromUser(requestBody);
        // console.log('check widthrow id re wafn result.rows[0].id;',result.rows[0].id)
        requestBody.withdrawnId = result.rows[0].id;
        if (result.rowCount <= 0) {
            return RequestResponse.success(res, apiMessage.somethingWentWrong, status.info, []);
        } else {
            let subWalletAmount: any = await GetUserServices.subDepositAmount(requestBody); // deposit amount
            //await GetUserServices.subWalletAmount(requestBody); // recharge amount
            if (subWalletAmount.rowCount > 0) {
                requestBody.walletAmount = requestBody.amount;
                requestBody.extraCharges = 0;
                requestBody.hiringCharges = null;
                requestBody.transactionType = 28;
                requestBody.fromRideTime = null;
                requestBody.toRideTime = null;
                requestBody.rideBookingMinutes = null;

                //  requestBody.withdrawnId=0;
                requestBody.rideBookingId = 0;
                result = await GetUserServices.insertUserAllTransactionDetails(requestBody);

                return RequestResponse.success(res, apiMessage.withdrawRequest, status.success, []);
            }
            return RequestResponse.success(res, apiMessage.withdrawRequest, status.success, []);
        }
    } catch (error: any) {
        AddExceptionIntoDB(req, error);
        return exceptionHandler(res, 1, error.message);
    }
};

const insertUserTransactionDetails = async (req: Request, res: Response) => {
    try {
        // #swagger.tags = ['User']
        // #swagger.description = 'Endpoint to get a specific user.'
        /*	#swagger.parameters['obj'] = {
                in: 'body',
                description: 'User information.',
                required: true,
                schema: { $ref: "#/definitions/insertUserTransactionDetails" }
        } */
        let requestBody = req.body;
        let result: any;

        result = await GetUserServices.insertUserAllTransactionDetails(requestBody);

        if (result.rowCount <= 0) {
            return RequestResponse.success(res, apiMessage.somethingWentWrong, status.info, []);
        } else {
            return RequestResponse.success(res, apiMessage.success, status.success, []);
        }
    } catch (error: any) {
        AddExceptionIntoDB(req, error);
        return exceptionHandler(res, 1, error.message);
    }
};

const updateUserLanguageController = async (req: Request, res: Response) => {
    try {
        let requestBody = req.body;
        let result: any;

        result = await GetUserServices.updateUserLanguage(requestBody);

        if (result.rowCount <= 0) {
            return RequestResponse.success(res, apiMessage.somethingWentWrong, status.info, []);
        } else {
            return RequestResponse.success(res, 'Language Changed Successfully.', status.success, []);
        }
    } catch (error: any) {
        AddExceptionIntoDB(req, error);
        return exceptionHandler(res, 1, error.message);
    }
};

const logOutUserController = async (req: Request, res: Response) => {
    try {
        let result: any = await logOutUser(req, res);
        return result;
    } catch (error: any) {
        AddExceptionIntoDB(req, error);
        return exceptionHandler(res, 1, error.message);
    }
};

const getLastTenTransactionList = async (req: Request, res: Response) => {
    try {
        let requestQuery = req.query;
        let result: any;

        result = await DashboardServices.getLastTenTransaction(requestQuery, req);

        const transactionArray: any = [];
        for (let row of result.rows) {
            transactionArray.push({
                requestId: row.id,
                id: row.user_id,
                user_name: row.user_name,
                contact: row.contact,
                payment_id: row.payment_id ? row.payment_id : row.withdrawn_id,
                method: row.transaction_type,
                transaction_type_enum_id: row.transaction_type_enum_id,
                amount: row.wallet_amount,
                extra_charges: row.extra_charges,
                hiring_charges: row.hiring_charges,
                from_ride_time: row.from_ride_time,
                to_ride_time: row.to_ride_time,
                ride_booking_min: row.ride_min,
                createdon_date: row.createdon_date,
                rideBookingId: row.ride_booking_id,
                rideStartLatitude: row.ride_start_latitude,
                rideStartLongitude: row.ride_start_longitude,
                rideEndLatitude: row.ride_end_latitude,
                rideEndLongitude: row.ride_end_longitude,
                withdraw_request_status_enum_id: row.withdraw_request_status_enum_id,
                withdraw_request_status: row.withdraw_request_status,
                OrderNumber: row.order_no
            });
        }

        if (result.rowCount > 0) {
            return RequestResponse.success(res, apiMessage.success, status.success, transactionArray);
        } else {
            return RequestResponse.success(res, apiMessage.somethingWentWrong, status.error, []);
        }
    } catch (error: any) {
        AddExceptionIntoDB(req, error);

        return exceptionHandler(res, 1, error.message);
    }
};

export default {
    addUserCheckCustomerMobileNumberService,
    AddUserService,
    sendOtpController,
    getUserController,
    getLatestTransactionList,
    getWithdrawRequestFromUserController,
    insertUserTransactionDetails,
    logOutUserController,
    updateUserLanguageController,
    getLastTenTransactionList
};
