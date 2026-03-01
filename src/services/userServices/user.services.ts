import { request, Request, Response } from 'express';
import { client } from '../../Config/db.connection';
import { exceptionHandler, validHandler } from '../../helper/responseHandler';
import status from '../../helper/status';
import { CustomerMobileNumbers, IAddUserDetails } from '../../model/user.model';
import { DB_CONFIGS } from '../../Config/db.queries';
import logger from '../../Config/logging';
import RequestResponse from '../../helper/responseClass';
import { apiMessage } from '../../helper/api-message';
import { userMessage } from '../../constant/user-constant';
import { getUTCdate } from '../../helper/datetime';
import { createAuthToken } from '../../helper/common-function';
import { AddExceptionIntoDB } from '../../helper/responseHandler';

export async function AddUserCheckCustomerMobileNumberDetail(req: Request, res: Response) {
    try {
        let requestQuery: CustomerMobileNumbers = req.body;
        let userArray: any = [];
        if (requestQuery.mobile_number === null) {
            return validHandler(res, 1);
        } else {
            const query = DB_CONFIGS.customerQueries.addUserCheckCustomerMobileNumber(requestQuery.mobile_number, 1);
            await client
                .query(query)
                .then(async (cursor) => {
                    const Data: any = cursor;
                    for (let row of Data[1].rows) {
                        let access_token: any = await createAuthToken(row.id);
                        await addUserAuthToken(row.id, access_token);
                        userArray.push({
                            userId: Number(row.id),
                            userName: row.user_name,
                            access_token: access_token,
                            // stateId: Number(row.state_id),
                            // cityId: Number(row.city_id),
                            // dateOfBirth : row.date_of_birth,
                            // gendeEnumId :  Number(row.gender_enum_id),
                            // gender : row.gender,
                            // referralCode: row.referral_code,
                            mobile: row.mobile,
                            emailId: row.emailid,
                            // autoReferralCode: row.auto_referral_code,
                            // cityName: row.city_name,
                            // stateName: row.state_name,
                            statusEnumId: Number(row.status_enum_id),
                            status: row.status,
                            userTypeEnumId : Number(row.user_type_enum_id),
                            usersStatus: row.users_status,
                            registrationStatus: row.registration_status
                        });
                    }
                    if (Data[1].rows.length == 0) {
                        RequestResponse.success(res, apiMessage.noDataFound, status.info, []);
                    } else {
                        if (Data[1].rows[0].type === 'Exists') {
                            RequestResponse.success(res, apiMessage.checkMobileNumber, status.success, userArray);
                        } else {
                            RequestResponse.success(res, apiMessage.checkMobileNumberExist, status.success, userArray);
                        }
                    }
                })
                .catch((e) => {
                    logger.error(e, { error_function_name: 'AddUserCheckCustomerMobileNumberDetail', error_service_url: '/AddUserCheckCustomerMobileNumberDetail' });
                    return exceptionHandler(res, 1, e.message);
                });
        }
    } catch (error: any) {
        logger.error(error, { error_function_name: 'AddUserCheckCustomerMobileNumberDetail', error_service_url: '/AddUserCheckCustomerMobileNumberDetail' });
        return exceptionHandler(res, 1, error.message);
    }
}

export async function AddGetUserDetail(req: Request, res: Response) {
    try {
        const requestBody: IAddUserDetails = req.body;
        const actionOnDate = getUTCdate();
        const userTypeEnumId = userMessage.userTypeEnumId;
        
        if(requestBody.emailId == '')
        {
            
            requestBody.emailId ==null;
        }
        const query: any = DB_CONFIGS.customerQueries.addUser(
            requestBody.userId,
            requestBody.userName,
            requestBody.address,
            requestBody.referralCode,
            requestBody.mobile,
            requestBody.emailId,
            requestBody.dateOfBirth,
            requestBody.genderEnumId,
            userTypeEnumId,
            requestBody.stateId,
            requestBody.cityId,
            requestBody.statusEnumId,
            actionOnDate
        );
        
        await client
            .query(query)
            .then((cursor) => {
                const Data: any = cursor;

                let userDetails = Data[1].rows[0];
                
                let output_result: string = Data[1].rows[0].fp_output_result;
                let userArray = [
                    {
                        userId: Number(userDetails.id),
                        userName: userDetails.user_name,
                        stateId: Number(userDetails.state_id),
                        statusEnumId: Number(userDetails.status_enum_id),
                        whatsAppNo: userDetails.whats_app_no,
                        address: userDetails.address,
                        status: userDetails.status,
                        stateName: userDetails.state_name,
                        cityId: Number(userDetails.city_id),
                        cityName: userDetails.city_name,
                        referralCode: userDetails.referral_code,
                        mobile: userDetails.mobile,
                        dateOfBirth: userDetails.date_of_birth,
                        emailId: userDetails.emailid,
                        autoGenUserReferralCode: userDetails.auto_gen_user_referral_code,
                        genderEnumId: Number(userDetails.gender_enum_id),
                        gender: userDetails.gender,
                        userTypeEnumId: Number(userDetails.user_type_enum_id),
                        userType: userDetails.user_type,
                        becamePartnerStatusEnumId: Number(userDetails.became_partner_status_enum_id),
                        partnerstatus: userDetails.partner_user_status,
                        registrationStatus: userDetails.registration_status,
                        access_token: userDetails.access_token
                    }
                ];

                switch (output_result) {
                    case userMessage.checkReferral: {
                        RequestResponse.validationError(res, apiMessage.invalidCode, status.error, []);
                        break;
                    }
                    case userMessage.checkCondition: {
                        RequestResponse.validationError(res, apiMessage.mobileNumber, status.error, []);

                        break;
                    }
                    case userMessage.success: {
                        RequestResponse.success(res, apiMessage.userCreated, status.success, userArray);
                        break;
                    }
                    case userMessage.checkEmailId: {
                        RequestResponse.validationError(res, apiMessage.emailAlreadyExist, status.error, []);
                        break;
                    }
                    default: {
                        RequestResponse.validationError(res, apiMessage.noDataFound, status.info, []);
                        break;
                    }
                }
            })
            .catch((e) => {
                logger.error(e, { error_function_name: 'GetUserDetail', error_service_url: '/GetUserDetail' });
                return exceptionHandler(res, 1, e.message);
            });
    } catch (error: any) {
        logger.error(error, { error_function_name: 'GetEnumDetail', error_service_url: '/EnumArray' });
        return exceptionHandler(res, 1, error.message);
    }
}

const addUserAuthToken = async (id: any, token: string) => {
    try {
        let result: any;
        // let query: any = DB_CONFIGS.adminQueries.getAuthToken(id);
        // result = await client.query(query);

        let query: any = { text: DB_CONFIGS.customerQueries.addUserAuthToken(), values: [token, id] };
        result = await client.query(query);
        return result;
    } catch (error) {
        logger.error(error);
    }
};

export const logOutUser = async (req: Request, res: Response) => {
    try {
        let result: any;
        let requestBody = req.body;
        let query: any = { text: DB_CONFIGS.customerQueries.addUserAuthToken(), values: [null, requestBody.id] };
        result = await client.query(query);

        if (result.rowCount > 0) {
            return RequestResponse.success(res, 'Logout Successfully', status.success, []);
        } else {
            return RequestResponse.success(res, apiMessage.somethingWentWrong, status.info, []);
        }
    } catch (error: any) {
        logger.error(error, { error_function_name: 'updateAdminPassword', error_service_url: '/updateAdminPassword' });
        return exceptionHandler(res, 1, error.message);
    }
};

// export async function getUserForTable(req: Request, res: Response) {
//     try {
//         const requestQuery = req.query;
//         const geUserArray: any = [];

//         const query = DB_CONFIGS.masterQueries.getUserForTable(requestQuery.statusEnumId,requestQuery.userStatusEnumId);
//         await client
//             .query(query)
//             .then((result) => {
//                 const Data: any = result;
//                 for (let row of Data[1].rows) {
//                     geUserArray.push({
//                         userId: Number(row.customer_id),
//                         customerName: row.customer_name,
//                         referralCode  : row.referral_code,
//                         mobile : row.mobile,
//                         stateId: Number(row.state_id),
//                         stateName : row.state_name,
//                         cityId : Number(row.city_id),
//                         cityName : row.city_name,
//                         statusEnumId: Number(row.status_enum_id),
//                         status: row.status,
//                         usersStatusEnum_id : Number(row.users_status_enum_id),
//                         userStatus : row.users_status,
//                     });
//                 }
//                 if (Data.rowCount == 0) {
//                     return RequestResponse.success(res, apiMessage.dataNotAvailable, status.info, null);
//                 } else {
//                     return RequestResponse.success(res, apiMessage.getUserForTable, status.success, geUserArray);
//                 }
//             })
//             .catch((e) => {
//                 logger.error(e, { error_function_name: 'getUserForTable', error_service_url: '/getUserForTable' });
//                 return exceptionHandler(res, 1);
//             });
//     } catch (error) {
//         logger.error(error, { error_function_name: 'getUserForTable', error_service_url: '/getUserForTable' });
//         return exceptionHandler(res, 1);
//     }
// }
