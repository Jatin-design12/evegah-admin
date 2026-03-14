import { NextFunction, Request, Response } from 'express';
const Razorpay = require('razorpay');
let crypto = require('crypto');
import request from 'request';
import RequestResponse from '../../helper/responseClass';
import status from '../../helper/status';
import { apiMessage } from '../../helper/api-message';
import config from '../../Config/config';
import payment from '../../services/paymentServices/payment.services';
import GetUserServices from '../../services/userServices/user.get.services';
import { exceptionHandler, AddExceptionIntoDB } from '../../helper/responseHandler';
import logger from '../../Config/logging';

//const { validateWebhookSignature } = require('razorpay/dist/utils/razorpay-utils');
import RideBooking from '../../services/rideBookingServices/ride.booking.services';
import WalletAmount from '../../helper/wallet.validation';

import CommonMessage from '../../helper/common.validation';

import { generateOrderNumber, isObjectEmpty } from '../../helper/common-function';
import { getTokenDetail } from '../../helper/common-function';
import DashboardServices from '../../services/adminServices/admin.dashboard.services';
import { SignatureKind, tokenToString } from 'typescript';
import { getUTCdate } from '../../helper/datetime';
import { calculateMin, calculateSecond, calculateHr } from '../../helper/common-function';
import { client } from '../../Config/db.connection';
import utcdate from '../../helper/utcdate';
import userGetServices from '../../services/userServices/user.get.services';
import { kClientName } from '../../constant/kritin-client-name';
let nodeSchedule = require('node-cron');
let instance = new Razorpay({ key_id: config.razorPay.key, key_secret: config.razorPay.SECRET_KEY });

const paymentOrderController = async (req: Request, res: Response) => {
    try {
        /* 	#swagger.tags = ['User-Payment']
              #swagger.description = 'Only user can add type all Parameter are mandatory in swagger for testing purpose' */

        /*	#swagger.parameters['obj'] = {
                    in: 'body',
                    description: 'add add update zone details.',
                    required: true,
                    schema: { $ref: "#/definitions/paymentOrderController" }
            } */

        /* #swagger.security = [{
                    "apiKeyAuth": []
            }] */

        let requestBody = req.body;
        let requestQuery = req.query;
        console.log('check order api start');
        if (Number(requestBody.amount) <= 0) {
            return RequestResponse.validationError(res, 'Please Add Valid Amount.', status.info, []);
        }
        var options = {
            amount: parseInt(requestBody.amount), // amount in the smallest currency unit
            currency: 'INR',
            receipt: 'receipt' + '_' + crypto.randomBytes(8).toString('hex')
        };

        //  console.log('check receipt',options.receipt)

        let getVerifyT: any = await getTokenDetail(requestQuery.access_token);

        let paymentDetails: any = {};
        let OrderNumber: any = 'P';
        paymentDetails.paymentOrderNo = await generateOrderNumber(OrderNumber);

        // if(requestQuery.user_id != getVerifyT.id)
        // {
        //     return RequestResponse.success(res, apiMessage.validTokane, status.info, []);
        // }

        instance.orders.create(options, async (err: Error, order: any) => {
            if (err) {
                let paymentResult: any = await payment.getPaymentTransactionIdService(paymentDetails);

                if (paymentResult.rowCount > 0) {
                    RequestResponse.validationError(res, 'This Transaction already added', status.success, []);
                    return false;
                }

                let errorData: any = err;

                ((paymentDetails.user_id = getVerifyT.id),
                    (paymentDetails.entity = null),
                    (paymentDetails.amount = requestBody.amount),
                    (paymentDetails.currency = null),
                    (paymentDetails.status = null),
                    (paymentDetails.order_id = null),
                    (paymentDetails.email = null),
                    (paymentDetails.contact = null),
                    (paymentDetails.created_at = null));

                // createdon_date
                paymentDetails.receipt = options.receipt;
                paymentDetails.online_payment_status_enumid = 111; // order failed ,

                paymentDetails.createdbyLoginUserId = getVerifyT.id;

                paymentDetails.error_code = errorData.error.code;
                paymentDetails.error_description = errorData.error.description;
                paymentDetails.error_source = errorData.error.source;
                paymentDetails.error_step = errorData.error.step;
                paymentDetails.error_reason = errorData.error.reason;
                paymentDetails.remarks = 'add detail from order api failed.';
                console.log('check error response data');
                let razorpay_response_fromOrderApi: any = JSON.stringify(err);
                paymentDetails.order_response_json = razorpay_response_fromOrderApi;
                await payment.insertPaymentTransactionByOrder(paymentDetails);
                const orderErrorMessage =
                    (errorData && errorData.error && errorData.error.description) ||
                    (errorData && errorData.error && errorData.error.reason) ||
                    err.message ||
                    'Unable to create payment order.';
                return RequestResponse.forbidden(res, orderErrorMessage, status.exception, err);
            } else {
                ((paymentDetails.user_id = getVerifyT.id),
                    (paymentDetails.entity = order.entity),
                    (paymentDetails.amount = order.amount),
                    (paymentDetails.currency = order.currency),
                    (paymentDetails.status = order.status),
                    (paymentDetails.order_id = order.id),
                    (paymentDetails.email = null),
                    (paymentDetails.contact = null),
                    (paymentDetails.created_at = order.created_at));

                // createdon_date
                paymentDetails.receipt = order.receipt;
                paymentDetails.online_payment_status_enumid = 33; // not settulled,

                paymentDetails.createdbyLoginUserId = getVerifyT.id;
                // paymentDetails.remarks = 'add detail from order api' ;
                //paymentDetails.paymentOrderNo
                paymentDetails.error_code = null;
                paymentDetails.error_description = null;
                paymentDetails.error_source = null;
                paymentDetails.error_step = null;
                paymentDetails.error_reason = null;
                paymentDetails.remarks = 'add detail from order api success.';

                let paymentResult: any = await payment.getPaymentTransactionIdService(paymentDetails);

                if (paymentResult.rowCount > 0) {
                    RequestResponse.validationError(res, 'This Transaction already added', status.success, []);
                    return false;
                }

                let razorpay_response_fromOrderApi: any = JSON.stringify(order);
                paymentDetails.order_response_json = razorpay_response_fromOrderApi;
                await payment.insertPaymentTransactionByOrder(paymentDetails);

                const orderResponse = {
                    ...order,
                    key_id: config.razorPay.key,
                    mode: config.razorPay.mode
                };

                return RequestResponse.success(res, 'success', status.success, orderResponse);
            }
        });
    } catch (error: any) {
        AddExceptionIntoDB(req, error);
        return exceptionHandler(res, 1, error.message);
    }
};

const verifyPaymentController = async (req: Request, res: Response) => {
    try {
        /* 	#swagger.tags = ['User-Payment']
              #swagger.description = 'Only user can add type all Parameter are mandatory in swagger for testing purpose' */

        /*	#swagger.parameters['obj'] = {
                    in: 'body',
                    description: 'add add update zone details.',
                    required: true,
                    schema: { $ref: "#/definitions/verifyPaymentController" }
            } */

        /* #swagger.security = [{
                    "apiKeyAuth": []
            }] */

        let body = req.body.razorpay_order_id + '|' + req.body.razorpay_payment_id;

        if (req.body.razorpay_order_id == undefined || req.body.razorpay_order_id == null) {
            return RequestResponse.serverError(res, 'set request parameter razorpay_order_id', status.success);
        }

        if (req.body.razorpay_payment_id == undefined || req.body.razorpay_payment_id == null) {
            return RequestResponse.serverError(res, 'set request parameter razorpay_payment_id', status.success);
        }

        let expectedSignature = crypto.createHmac('sha256', config.razorPay.SECRET_KEY).update(body.toString()).digest('hex');
        let response: any = {};
        let result: any = '';
        let getUserId = {};

        if (expectedSignature === req.body.razorpay_signature) {
            getUserId = { paymentId: req.body.razorpay_payment_id };

            result = await payment.getPaymentTransaction(getUserId); //razrpay server pr

            if (result.rowCount == 0) {
                return RequestResponse.validationError(res, 'This transaction is not available on Razorpay server  ', status.success, []);
            }

            // razrpay count pr condition check krna h
            console.log('check result for third   verify ', result);

            let paymentResult: any = await payment.getPaymentTransactionIdAddPaymentService(result);

            if (paymentResult.rowCount == 0) {
                return RequestResponse.validationError(res, 'this transaction is not found ', status.success, []);
            }

            let customOrderIdFromDB: any = paymentResult.rows[0].order_id;
            result.paymentPrimaryKeyIdFromDB = paymentResult.rows[0].id;
            let custom_online_payment_status_enum_id_from_db: any = paymentResult.rows[0].online_payment_status_enum_id;

            if (Number(custom_online_payment_status_enum_id_from_db) == 32) {
                //  response = { paymentTransactionId: customOrderIdFromDB, signatureIsValid: true };
                return RequestResponse.validationError(res, 'you can not processed this payment because this payment is already processed.', status.success, response);
            } else if (Number(custom_online_payment_status_enum_id_from_db) == 34) {
                //  response = { paymentTransactionId: customOrderIdFromDB, signatureIsValid: true };
                return RequestResponse.validationError(res, 'you can not processed this payment because this payment is failed.', status.success, response);
            } else if (Number(custom_online_payment_status_enum_id_from_db) == 111) {
                //  response = { paymentTransactionId: customOrderIdFromDB, signatureIsValid: true };
                return RequestResponse.validationError(res, 'you can not processed this payment because this payment order is failed.', status.success, response);
            } else if (Number(custom_online_payment_status_enum_id_from_db) == 116) {
                //  response = { paymentTransactionId: customOrderIdFromDB, signatureIsValid: true };
                return RequestResponse.validationError(res, 'you can not processed this payment because this payment is not created.', status.success, response);
            }

            if (result.status == 'captured') {
                getUserId = { contact: result.contact.slice(3) };
                let user_id: any = await GetUserServices.getUserIdByPhoneNumber(getUserId);

                result.user_id = user_id.rows[0].id;
                result.online_payment_status_enumid = 33; //  not settled
                result.createdbyLoginUserId = req.body.createdbyLoginUserId;
                result.remarks = 'payment settled from verify controller. success';
                let razapay_response_jsonDataResponse: any = JSON.stringify(result);
                result.razapay_response_json = razapay_response_jsonDataResponse;
                result.razorpay_response_from_scheduler = null;

                let paymentTransaction: any = await payment.updatePaymentTransaction(result);

                response = { paymentTransactionId: paymentResult.rows[0].id, signatureIsValid: true };

                return RequestResponse.success(res, apiMessage.success, status.success, response);
            } else {
                //
                return RequestResponse.validationError(res, 'this transaction amount is already added in your wallet', status.error, response);
            }
        } else {
            getUserId = { paymentId: req.body.razorpay_payment_id };
            result = await payment.getPaymentTransaction(getUserId);

            if (result.rowCount == 0) {
                return RequestResponse.validationError(res, 'this transaction is not found to razorpay server  ', status.success, []);
            }

            let orderId: any = { id: req.body.razorpay_order_id };

            let paymentResult: any = await payment.getPaymentTransactionIdService(result);

            if (paymentResult.rowCount == 0) {
                return RequestResponse.validationError(res, 'this transaction is not found ', status.success, []);
            }

            //   console.log('check error jsdjs',paymentResult)

            let customOrderIdFromDB: any = paymentResult.rows[0].order_id;
            result.paymentPrimaryKeyIdFromDB = paymentResult.rows[0].id;
            let custom_online_payment_status_enum_id_from_db: any = paymentResult.rows[0].online_payment_status_enum_id;

            if (Number(custom_online_payment_status_enum_id_from_db) == 32) {
                //  response = { paymentTransactionId: customOrderIdFromDB, signatureIsValid: true };
                return RequestResponse.validationError(res, 'you can not processed this payment because this payment is already processed.', status.success, response);
            } else if (Number(custom_online_payment_status_enum_id_from_db) == 111) {
                //  response = { paymentTransactionId: customOrderIdFromDB, signatureIsValid: true };
                return RequestResponse.validationError(res, 'you can not processed this payment because this payment order is failed.', status.success, response);
            }
            result.online_payment_status_enumid = 34; // payment failed

            getUserId = { contact: result.contact.slice(3) };

            let user_id: any = await GetUserServices.getUserIdByPhoneNumber(getUserId);

            result.user_id = user_id.rows[0].id;
            result.createdbyLoginUserId = req.body.createdbyLoginUserId;
            result.remarks = 'payment failed from verify controller else';
            let razapay_response_jsonDataResponse: any = JSON.stringify(result);
            result.razapay_response_json = razapay_response_jsonDataResponse;
            result.razorpay_response_from_scheduler = null;
            let paymentTransaction: any = await payment.updatePaymentTransaction(result);
            //  response = { paymentTransactionId: customOrderIdFromDB, signatureIsValid:  false};

            //  let paymentTransaction: any = await payment.insertPaymentTransaction(result);
            response = { paymentTransactionId: paymentResult.rows[0].id, signatureIsValid: false };

            return RequestResponse.success(res, apiMessage.success, status.success, response);
        }
    } catch (error: any) {
        AddExceptionIntoDB(req, error);
        return exceptionHandler(res, 1, error.message);
    }
};

const addPaymentTransactionController = async (req: Request, res: Response) => {
    try {
        /* 	#swagger.tags = ['User-Payment']
              #swagger.description = 'Only user can add type all Parameter are mandatory in swagger for testing purpose' */

        /*	#swagger.parameters['obj'] = {
                    in: 'body',
                    description: 'add add update zone details.',
                    required: true,
                    schema: { $ref: "#/definitions/verifyPaymentController" }
            } */

        /* #swagger.security = [{
                    "apiKeyAuth": []
            }] */

        let body = req.body.razorpay_order_id + '|' + req.body.razorpay_payment_id;

        if (req.body.razorpay_order_id == undefined || req.body.razorpay_order_id == null) {
            return RequestResponse.serverError(res, 'set request parameter razorpay_order_id', status.success);
        }

        if (req.body.razorpay_payment_id == undefined || req.body.razorpay_payment_id == null) {
            return RequestResponse.serverError(res, 'set request parameter razorpay_payment_id', status.success);
        }

        let expectedSignature = crypto.createHmac('sha256', config.razorPay.SECRET_KEY).update(body.toString()).digest('hex');
        let response: any = {};
        let result: any = '';
        let getUserId = {};

        getUserId = { paymentId: req.body.razorpay_payment_id };
        result = await payment.getPaymentTransaction(getUserId);

        result.online_payment_status_enumid = 33; // not settulled
        // getUserId = { email: result.email };
        // let user_id: any = await GetUserServices.getUserIdByEmailId(getUserId);

        // result.user_id = user_id.rows[0].id;

        getUserId = { contact: result.contact.slice(3) };

        let user_id: any = await GetUserServices.getUserIdByPhoneNumber(getUserId);

        result.user_id = user_id.rows[0].id;
        result.createdbyLoginUserId = req.body.createdbyLoginUserId;

        let paymentTransaction: any = await payment.insertPaymentTransaction(result);

        response = { paymentTransactionId: paymentTransaction.rows[0].id, signatureIsValid: false };
        return RequestResponse.success(res, apiMessage.success, status.success, response);
    } catch (error: any) {
        AddExceptionIntoDB(req, error);
        return exceptionHandler(res, 1, error.message);
    }
};
const getAllPaymentsController = async (req: Request, res: Response) => {
    try {
        // #swagger.tags = ['User-Payment']
        // #swagger.description = 'Pass fromDate  and toDate to between record for individual give paymentId also knows as razorpay_payment_id   ----http://localhost:9001/api/v1/getAllPayments?fromDate=2022-06-05&toDate=2022-06-09&paymentId='

        /*#swagger.parameters[ {
                        "name": "fromDate",
                        "in": "query",
                        "description": "2022-06-05",
                        "required": true,
                        "type": "string"
                    }] 
        } */
        /*#swagger.parameters[ {
                        "name": "toDate",
                        "in": "query",
                        "description": "2022-06-09",
                        "required": true,
                        "type": "string"
                    }] 
        } */
        /*#swagger.parameters[ {
                        "name": "paymentId",
                        "in": "query",
                        "description": "pay_JewGXUOzXvxDN3",
                        "required": false,
                        "type": "string"
                    }] 
        } */
        let requestQuery = req.query;

        let result: any = await payment.getPaymentTransaction(requestQuery);
        return RequestResponse.success(res, apiMessage.success, status.success, result);
    } catch (error: any) {
        AddExceptionIntoDB(req, error);
        return exceptionHandler(res, 1, error.message);
    }
};

const payoutController = async (req: Request, res: Response) => {
    /* 	#swagger.tags = ['User-Payment']
              #swagger.description = 'Only user can add type all Parameter are mandatory in swagger for testing purpose'

    /*	#swagger.parameters['obj'] = {
                    in: 'body',
                    description: 'payoutController',
                    required: true,
                    schema: { $ref: "#/definitions/payoutController" }
            } */

    /* #swagger.security = [{
                    "apiKeyAuth": []
            }] */
    // catchAsync(

    request(
        {
            method: 'POST',
            url: config.razorPay.payoutApi,
            auth: {
                user: config.razorPay.key,
                pass: config.razorPay.SECRET_KEY
            },
            body: JSON.stringify(req.body)
        },
        async (err, body) => {
            if (err) {
                logger.error(err);
            } else {
                if (body.statusCode >= 400) {
                    return RequestResponse.serverError(res, JSON.parse(body.body), status.success);
                } else {
                    let result = await payment.insertWithdrawTransaction(req.body);
                    return RequestResponse.success(res, apiMessage.success, status.success, body);
                }
            }
        }
    );
    //);
};

const addAmountToUserWallet = async (req: Request, res: Response) => {
    console.log('check api');
    let requestBody = req.body;
    let requestQuery = req.query;
    requestBody.transactionType = 27;
    requestBody.apiCallingFun = 'addAmountToUserWallet';
    requestBody.OrderNumber = 'P';
    requestBody.paymentByAdmin = 'PaymentByApp';

    requestBody.paymentOrderNo = await generateOrderNumber(requestBody.OrderNumber);
    let getVerifyT: any = await getTokenDetail(requestQuery.access_token);

    requestBody.amountAddedByUserId = getVerifyT.id;
    //await addDepositAmountToUserWallet(requestBody,res,req);

    if (config.CLIENT_NAME == kClientName.clientEvegah) {
        console.log('check wivh apu call evegah');
        await addAndpayExtraChargesAmountToUserWalletEvegah(requestBody, res, req);
    }
    console.log('check wivh apu call 531');
};

const payExtraChargesController = async (req: Request, res: Response) => {
    // try {
    let requestBody = req.body;
    requestBody.transactionType = 29;

    if (config.CLIENT_NAME == kClientName.clientEvegah) {
        await addAndpayExtraChargesAmountToUserWalletEvegah(requestBody, res, req);
    }

    //     let result: any;

    //     if (requestBody.extraCharges < 0) {
    //         return RequestResponse.validationError(res, 'Please Enter Valid ExtraCharges.', status.error, []);
    //     }

    //     result = await GetUserServices.payExtraCharges(requestBody);

    //     if (result.rowCount < 0) {
    //         return RequestResponse.success(res, apiMessage.noDataFound, status.success, []);
    //     } else {
    //         return RequestResponse.success(res, 'Extra Charges Payed Successfully.', status.success, []);
    //     }
    // } catch (error: any) {
    //     logger.error(error.message);
    //     return exceptionHandler(res, 1, error.message);
    // }
};

const paymentTransactionDetails = async (req: Request, res: Response) => {
    //  let webhooksResponse: any = { details: JSON.stringify(req.body) };
    try {
        let data = JSON.parse(JSON.stringify(req.body.payload.payment));
        let getContactNumber = { contact: data.entity.contact.slice(3) };
        data.entity.event = req.body.event;

        let user_id: any = await GetUserServices.getUserIdByPhoneNumber(getContactNumber);
        data.entity.user_id = user_id.rows[0].id;

        let result = await payment.insertPaymentTransaction(data.entity);
        return RequestResponse.success(res, apiMessage.success, status.success, []);
    } catch (error: any) {
        AddExceptionIntoDB(req, error);
        return exceptionHandler(res, 1, error.message);
    }
};

const verifyWebhooksSecret = async (req: Request, res: Response, next: NextFunction) => {
    try {
        let headers = req.headers;
        let key = config.WEBHOOKS_RESPONSE;
        let message = req.body; // raw webhook request body
        let received_signature = headers['x-razorpay-signature'];

        let result = Razorpay.validateWebhookSignature(JSON.stringify(message), received_signature, key);
        if (!result) {
            return RequestResponse.forbidden(res, 'token is not valid.', status.error, []);
        }
        next();
    } catch (error: any) {
        AddExceptionIntoDB(req, error);
        return exceptionHandler(res, 1, error.message);
    }
};

async function addAndpayExtraChargesAmountToUserWalletEvegah(requestBody: any, res: Response, req: any) {
    let checkCommit: any = false;
    try {
        console.log('check api calling-- ');
        let result: any;
        let walletAmount: any;

        walletAmount = await RideBooking.getWalletAmountByUserId(requestBody);

        let getTransaction: any = await GetUserServices.getTransactionExitOrNot(requestBody);

        if (getTransaction.rowCount <= 0) {
            if (requestBody.apiCallingFun == 'paymentSettledToServer') {
                return false;
            }
            return RequestResponse.success(res, apiMessage.notPayment, status.success, []);
        }
        let getUserTransaction: any = await GetUserServices.getUserTransaction(requestBody);

        if (getUserTransaction.rowCount > 0) {
            if (requestBody.apiCallingFun == 'paymentSettledToServer') {
                return false;
            }
            return RequestResponse.success(res, apiMessage.paymentDone, status.success, []);
        }
        let paymentStatusEnumId: any = getTransaction.rows[0].online_payment_status_enum_id;
        if (paymentStatusEnumId == 32) {
            if (requestBody.apiCallingFun == 'paymentSettledToServer') {
                return false;
            }
            return RequestResponse.success(res, apiMessage.paymentDone, status.success, []);
        }

        if (paymentStatusEnumId == 34) {
            if (requestBody.apiCallingFun == 'paymentSettledToServer') {
                return false;
            }
            return RequestResponse.success(res, apiMessage.PaymentFailed, status.success, []);
        }

        requestBody.paymentEnumId = 32;
        let ValidAmount = WalletAmount.IsValidAmount(Number(requestBody.receivedAmount), Number(walletAmount.rows[0].extra_charges));

        if (ValidAmount.notvalid == true) {
            if (requestBody.apiCallingFun == 'paymentSettledToServer') {
                return false;
            }

            return RequestResponse.validationError(res, 'Please Enter Valid receivedAmount.', status.error, []);
        }

        ValidAmount.id = requestBody.id;
        ValidAmount.paymentTransactionId = requestBody.paymentTransactionId;
        ValidAmount.transactionType = requestBody.transactionType;
        ValidAmount.currentWalletAmount = walletAmount.rows[0].min_wallet_amount;
        ValidAmount.paymentOrderNo = requestBody.paymentOrderNo;
        ValidAmount.amountAddedByUserId = requestBody.id;

        console.log('check api calling-- 802');
        requestBody.paymentTransactionId = requestBody.paymentPrimaryKeyIdFromDB;
        client
            .query('BEGIN')
            .then(async (res1) => {
                //  let  RDAmountJson:any = await rechargeAndDepositAmountTransactionJsonToServer(requestBody, res,requestBody) ;

                await GetUserServices.insertUserAllTransactionDetails(ValidAmount);
                await GetUserServices.addAmountInWalletAndSubtractExtraCharges(ValidAmount);
                await GetUserServices.paymentSeetulled(ValidAmount);

                if (checkCommit == false) {
                    checkCommit = true;
                    client.query('commit');
                }
                if (requestBody.apiCallingFun == 'paymentSettledToServer') {
                    return true;
                }
                return RequestResponse.success(res, 'Amount Added Successfully.', status.success, []);
            })
            .catch((err) => {
                if (checkCommit == false) {
                    checkCommit = true;
                    client.query('rollback');
                }
                AddExceptionIntoDB(requestBody, err);
                exceptionHandler(res, 1, err.message);
                if (requestBody.apiCallingFun == 'paymentSettledToServer') {
                    return false;
                }
                return exceptionHandler(res, 1, err.message);
            });
    } catch (error: any) {
        AddExceptionIntoDB(req, error);
        if (requestBody.apiCallingFun == 'paymentSettledToServer') {
            return false;
        }

        return exceptionHandler(res, 1, error.message);
    }
}

const addAmountToUserWalletByAdmin = async (req: Request, res: Response) => {
    let requestBody = req.body;
    let requestQuery = req.query;

    requestBody.transactionType = 27;

    requestBody.OrderNumber = 'P';
    requestBody.paymentByAdmin = 'PaymentByAdmin';

    requestBody.paymentOrderNo = await generateOrderNumber(requestBody.OrderNumber);

    let getVerifyT: any = await getTokenDetail(requestQuery.access_token);

    requestBody.amountAddedByUserId = getVerifyT.id;

    if (config.CLIENT_NAME == kClientName.clientEvegah) {
        await addAndpayExtraChargesAmountToUserWalletEvegah(requestBody, res, req);
    }
};

//

//------------------
async function addRechargeAmountToUserAccount(requestBody: any, res: Response, req: any) {
    let checkCommit: any = false;
    try {
        let result: any;
        let walletAmount: any;

        walletAmount = await RideBooking.getWalletAmountByUserId(requestBody);

        if (requestBody.paymentByAdmin == 'PaymentByApp') {
            let getTransaction: any = await GetUserServices.getTransactionExitOrNot(requestBody);

            if (getTransaction.rowCount <= 0) {
                return RequestResponse.success(res, apiMessage.notPayment, status.success, []);
            }

            let getUserTransaction: any = await GetUserServices.getUserTransaction(requestBody);

            if (getUserTransaction.rowCount > 0) {
                return RequestResponse.success(res, apiMessage.paymentDone, status.success, []);
            }
            let paymentStatusEnumId: any = getTransaction.rows[0].online_payment_status_enum_id;
            if (paymentStatusEnumId == 32) {
                return RequestResponse.success(res, apiMessage.paymentDone, status.success, []);
            }

            if (paymentStatusEnumId == 34) {
                return RequestResponse.success(res, apiMessage.PaymentFailed, status.success, []);
            }
        }

        requestBody.paymentEnumId = 32;
        let ValidAmount = WalletAmount.IsValidAmount(Number(requestBody.receivedAmount), Number(walletAmount.rows[0].extra_charges));

        if (ValidAmount.notvalid == true) {
            return RequestResponse.validationError(res, 'Please Enter Valid receivedAmount.', status.error, []);
        }

        ValidAmount.id = requestBody.id;
        // ValidAmount.paymentTransactionId = requestBody.paymentTransactionId;
        ValidAmount.transactionType = requestBody.transactionType;
        ValidAmount.currentWalletAmount = walletAmount.rows[0].min_wallet_amount; // recharge amount

        // ValidAmount.currentRechargeAmount = walletAmount.rows[0].deposit_amount;

        ValidAmount.paymentOrderNo = requestBody.paymentOrderNo;
        ValidAmount.amountAddedByUserId = requestBody.amountAddedByUserId;
        ValidAmount.remarkss = requestBody.remark;
        ValidAmount.remarks = requestBody.remark;
        if (requestBody.paymentByAdmin == 'PaymentByApp') {
            ValidAmount.paymentTransactionId = requestBody.paymentTransactionId;
        } else {
            ValidAmount.paymentTransactionId = null;
        }

        //   if(walletAmount.rows[0].deposit_amount == '0')
        //    {
        //        return RequestResponse.validationError(res, 'please add Minimum wallet(deposit) Amount because your deposit amount is .' +  walletAmount.rows[0].deposit_amount + ' ', status.success, []);
        //    }

        //-------------------------
        let getLastMinRechargeAmountTbl: any = await RideBooking.getLastMinRechargeAmountTbl(); // wallet amount == recharge amount

        if (getLastMinRechargeAmountTbl.rowCount <= 0) {
            return RequestResponse.validationError(res, 'minimum recharge  amount is not set.', status.success, []);
        }

        let getLastMinRecharge: any = getLastMinRechargeAmountTbl.rows[0].enum_key.toFixed(2);

        //console.log('getLastMinRecharge',Number(getLastMinRecharge) ,Number(requestBody.receivedAmount))
        if (Number(requestBody.receivedAmount) < Number(getLastMinRecharge)) {
            return RequestResponse.validationError(
                res,
                'You can not recharge with ' + requestBody.receivedAmount + ' rupee ' + 'you have to recharge with minimum' + getLastMinRecharge,
                status.success,
                []
            );
        }

        //---------------------

        //         result = await GetUserServices.addRechargeAmount(ValidAmount);
        //    // result = await GetUserServices.addDepositAmount(ValidAmount)
        //  if (result.rowCount < 0)
        //  {

        //     return RequestResponse.success(res, apiMessage.noDataFound, status.success, []);
        // }
        // else
        // {
        //     result = await GetUserServices.insertUserAllTransactionDetails(ValidAmount);

        //   if (result.rowCount > 0)
        //   {

        //   let  paymentSeetulled :any = await GetUserServices.paymentSeetulled(ValidAmount);

        //     return RequestResponse.success(res, 'Amount Added Successfully.', status.success, []);
        //  // }
        //   }
        //   else
        //   {
        //     return RequestResponse.success(res, 'Amount is not Add', status.success, []);
        //   }
        // }
        ValidAmount.depositAmount = '0';
        ValidAmount.rechargeAmount = ValidAmount.amount;

        client
            .query('BEGIN')
            .then(async (res1) => {
                result = await GetUserServices.insertUserAllTransactionDetails(ValidAmount);

                return result;
            })
            .then(async (res1) => {
                if (result.rowCount > 0) {
                    result = await GetUserServices.addRechargeAmount(ValidAmount);

                    //ronwg
                    //   requestBody.paymentTransactionId = requestBody.paymentPrimaryKeyIdFromDB;

                    //RequestResponse.success(res, 'Amount Added Successfully.', status.success, [])
                }
                return result;
            })
            .then(async (res1) => {
                if (result.rowCount > 0) {
                    let paymentSeetulled: any = await GetUserServices.paymentSeetulled(ValidAmount);
                }
                return RequestResponse.success(res, 'Amount Added Successfully.', status.success, []);
            })

            .then((res1) => {
                if (checkCommit == false) {
                    checkCommit = true;
                    client.query('commit');
                }
                return true;
            })

            .catch((err) => {
                if (checkCommit == false) {
                    checkCommit = true;
                    client.query('rollback');
                }
                AddExceptionIntoDB(requestBody, err);
                exceptionHandler(res, 1, err.message);
                return false;
            })
            .catch((err) => {
                if (checkCommit == false) {
                    checkCommit = true;
                    client.query('rollback');
                }
                AddExceptionIntoDB(requestBody, err);
                exceptionHandler(res, 1, err.message);
                return false;
            });
    } catch (error: any) {
        AddExceptionIntoDB(req, error);
        return exceptionHandler(res, 1, error.message);
    }
}

const addUserRechargeAmount = async (req: Request, res: Response) => {
    let requestBody = req.body;
    let requestQuery = req.query;
    requestBody.transactionType = 106;

    requestBody.OrderNumber = 'P'; // recharge amount
    requestBody.paymentByAdmin = 'PaymentByApp';
    if (CommonMessage.IsValid(requestBody.userTypes) == false) {
        requestBody.userTypes = 'oldUser';
    }
    requestBody.paymentOrderNo = await generateOrderNumber(requestBody.OrderNumber);

    let getVerifyT: any = await getTokenDetail(requestQuery.access_token);

    requestBody.amountAddedByUserId = getVerifyT.id;

    await addRechargeAmountToUserAccount(requestBody, res, req);
};
const aadUserRechargeAmountByAdmin = async (req: Request, res: Response) => {
    let requestBody = req.body;
    let requestQuery = req.query;
    requestBody.transactionType = 106;

    requestBody.OrderNumber = 'P';
    requestBody.paymentByAdmin = 'PaymentByAdmin';
    if (CommonMessage.IsValid(requestBody.userTypes) == false) {
        requestBody.userTypes = 'oldUser';
    }
    requestBody.paymentOrderNo = await generateOrderNumber(requestBody.OrderNumber);

    let getVerifyT: any = await getTokenDetail(requestQuery.access_token);

    requestBody.amountAddedByUserId = getVerifyT.id;

    await addRechargeAmountToUserAccount(requestBody, res, req);
};

//------------------
async function addDepositAmountToUserWallet(requestBody: any, res: Response, req: any) {
    let checkCommit: any = false;
    try {
        let result: any;

        let walletAmount: any;

        walletAmount = await RideBooking.getWalletAmountByUserId(requestBody);
        if (walletAmount.rowCount <= 0) {
            return RequestResponse.validationError(res, 'User is not valid.', status.success, []);
        }

        let currentDepositAmount: any = walletAmount.rows[0].deposit_amount;

        let getLastDepositAmountEnumTbl: any = await RideBooking.getLastDepositAmount(); // deposit amount = advance amount

        if (getLastDepositAmountEnumTbl.rowCount <= 0) {
            return RequestResponse.validationError(res, 'Minimum deposit  amount is not set.', status.success, []);
        }

        if (requestBody.paymentByAdmin == 'PaymentByApp') {
            let getTransaction: any = await GetUserServices.getTransactionExitOrNot(requestBody);

            if (getTransaction.rowCount <= 0) {
                return RequestResponse.success(res, apiMessage.notPayment, status.success, []);
            }

            let getUserTransaction: any = await GetUserServices.getUserTransaction(requestBody);

            if (getUserTransaction.rowCount > 0) {
                return RequestResponse.success(res, apiMessage.paymentDone, status.success, []);
            }
            let paymentStatusEnumId: any = getTransaction.rows[0].online_payment_status_enum_id;
            if (paymentStatusEnumId == 32) {
                return RequestResponse.success(res, apiMessage.paymentDone, status.success, []);
            }

            if (paymentStatusEnumId == 34) {
                return RequestResponse.success(res, apiMessage.PaymentFailed, status.success, []);
            }
        }

        requestBody.paymentEnumId = 32;
        let ValidAmount = WalletAmount.IsValidAmount(Number(requestBody.receivedAmount), Number(walletAmount.rows[0].extra_charges));

        if (ValidAmount.notvalid == true) {
            return RequestResponse.validationError(res, 'Please Enter Valid receivedAmount.', status.error, []);
        }

        let minimumDepositAmountEnmTbl: any = getLastDepositAmountEnumTbl.rows[0].enum_key.toFixed(2);

        let remainingDepositAmount: number = Number(currentDepositAmount) + Number(requestBody.receivedAmount);

        if (remainingDepositAmount > Number(minimumDepositAmountEnmTbl)) {
            return RequestResponse.validationError(
                res,
                'Your current deposit amount is ' + currentDepositAmount + '. You do not need to add any more deposit.  You can not deposit an amount greater than ' + minimumDepositAmountEnmTbl,
                status.success,
                []
            );
        }

        if (Number(minimumDepositAmountEnmTbl) != remainingDepositAmount) {
            return RequestResponse.validationError(
                res,
                'Your current deposit amount is ' +
                    currentDepositAmount +
                    ' You can not deposit with ' +
                    requestBody.receivedAmount +
                    ' rupee ' +
                    'you have to deposit with ' +
                    (Number(minimumDepositAmountEnmTbl) - Number(currentDepositAmount)) +
                    ' rupee.',
                status.success,
                []
            );
        }

        //let minimumDepositAmountEnmTbl:any =(getLastDepositAmountEnumTbl.rows[0].enum_key).toFixed(2);

        // console.log('requestBody.receivedAmount',requestBody.receivedAmount,minimumDepositAmountEnmTbl)
        // if( requestBody.receivedAmount != minimumDepositAmountEnmTbl)
        // {
        //     return RequestResponse.validationError(res, 'You can not deposit with ' + requestBody.receivedAmount + ' rupee ' + 'you have to recharge with '+ minimumDepositAmountEnmTbl + ' rupee.', status.success, []);
        // }

        ValidAmount.id = requestBody.id;
        ValidAmount.paymentTransactionId = requestBody.paymentTransactionId;
        ValidAmount.transactionType = requestBody.transactionType;
        //ValidAmount.currentWalletAmount = walletAmount.rows[0].min_wallet_amount;
        ValidAmount.deposit_amount = walletAmount.rows[0].deposit_amount;

        ValidAmount.paymentOrderNo = requestBody.paymentOrderNo;
        ValidAmount.amountAddedByUserId = requestBody.amountAddedByUserId;
        ValidAmount.remarkss = requestBody.remark;

        if (requestBody.paymentByAdmin == 'PaymentByApp') {
            ValidAmount.paymentTransactionId = requestBody.paymentTransactionId;
        } else {
            ValidAmount.paymentTransactionId = null;
        }
        // result = await GetUserServices.addDepositAmount(ValidAmount);

        //  if (result.rowCount < 0)
        //  {

        //     return RequestResponse.success(res, apiMessage.noDataFound, status.success, []);
        // }
        // else
        // {
        //     result = await GetUserServices.insertUserAllTransactionDetails(ValidAmount);

        //   if (result.rowCount > 0)
        //   {

        //   let  paymentSeetulled :any = await GetUserServices.paymentSeetulled(ValidAmount);

        //     return RequestResponse.success(res, 'Amount Added Successfully.', status.success, []);
        //  // }
        //   }
        //   else
        //   {
        //     return RequestResponse.success(res, 'Amount is not Add', status.success, []);
        //   }
        // }

        //requestBody.paymentTransactionId = requestBody.paymentPrimaryKeyIdFromDB;

        ValidAmount.depositAmount = ValidAmount.amount;
        ValidAmount.rechargeAmount = '0';
        client
            .query('BEGIN')
            .then(async (res1) => {
                result = await GetUserServices.insertUserAllTransactionDetails(ValidAmount);

                return result;
            })
            .then(async (res1) => {
                if (result.rowCount > 0) {
                    result = await GetUserServices.addDepositAmount(ValidAmount);
                }
                return result;
            })
            .then(async (res1) => {
                if (result.rowCount > 0) {
                    let paymentSeetulled: any = await GetUserServices.paymentSeetulled(ValidAmount);
                }
                return RequestResponse.success(res, 'Amount Added Successfully.', status.success, []);
            })

            .then((res1) => {
                if (checkCommit == false) {
                    checkCommit = true;
                    client.query('commit');
                }
                return true;
            })

            .catch((err) => {
                if (checkCommit == false) {
                    checkCommit = true;
                    client.query('rollback');
                }
                AddExceptionIntoDB(requestBody, err);
                exceptionHandler(res, 1, err.message);
                return false;
            })
            .catch((err) => {
                if (checkCommit == false) {
                    checkCommit = true;
                    client.query('rollback');
                }
                AddExceptionIntoDB(requestBody, err);
                exceptionHandler(res, 1, err.message);
                return false;
            });
    } catch (error: any) {
        AddExceptionIntoDB(req, error);
        return exceptionHandler(res, 1, error.message);
    }
}

const addDepositAmountToUserWalletByAdmin = async (req: Request, res: Response) => {
    let requestBody = req.body;
    let requestQuery = req.query;
    requestBody.transactionType = 27;

    requestBody.OrderNumber = 'D'; // deposit amount
    requestBody.paymentByAdmin = 'PaymentByAdmin';
    if (CommonMessage.IsValid(requestBody.userTypes) == false) {
        requestBody.userTypes = 'oldUser';
    }

    requestBody.paymentOrderNo = await generateOrderNumber(requestBody.OrderNumber);

    let getVerifyT: any = await getTokenDetail(requestQuery.access_token);

    requestBody.amountAddedByUserId = getVerifyT.id;

    await addDepositAmountToUserWallet(requestBody, res, req);
};

const addDepositAmountToUserWalletToApp = async (req: Request, res: Response) => {
    let requestBody = req.body;
    let requestQuery = req.query;
    requestBody.transactionType = 27;

    requestBody.OrderNumber = 'D'; // deposit amount
    requestBody.paymentByAdmin = 'PaymentByApp';

    if (CommonMessage.IsValid(requestBody.userTypes) == false) {
        requestBody.userTypes = 'oldUser';
    }

    requestBody.paymentOrderNo = await generateOrderNumber(requestBody.OrderNumber);
    let getVerifyT: any = await getTokenDetail(requestQuery.access_token);

    requestBody.amountAddedByUserId = getVerifyT.id;

    await addDepositAmountToUserWallet(requestBody, res, req);
};

//------------------

const addDepositAndRechargeAmountToUserWalletToApp = async (req: Request, res: Response) => {
    // req.body.userTypes ='newUser'
    //   console.log('check body requestBody req',req)
    let requestBody: any = req.body;

    let depositAmount: any = 'Add';
    let rechargeAmount: any = 'Add';
    let requestQuery = req.query;
    requestBody.transactionType = 27;
    //console.log('check body requestBody',requestBody)

    requestBody.OrderNumber = 'D'; // deposit amount
    if (CommonMessage.IsValid(requestBody.paymentByAdmin) == false) {
        requestBody.paymentByAdmin = 'PaymentByApp';
    }

    if (CommonMessage.IsValid(requestBody.userTypes) == false) {
        requestBody.userTypes = 'oldUser';
    }

    let walletAmount: any = await RideBooking.getWalletAmountByUserId(requestBody);
    if (walletAmount.rowCount <= 0) {
        return RequestResponse.validationError(res, 'User is not valid.', status.success, []);
    }

    let currentDepositAmount: any = walletAmount.rows[0].deposit_amount;

    requestBody.paymentOrderNo = await generateOrderNumber(requestBody.OrderNumber);
    let getVerifyT: any = await getTokenDetail(requestQuery.access_token);

    requestBody.amountAddedByUserId = getVerifyT.id;

    if (CommonMessage.IsValid(requestBody.receivedRechargeAmount) == false && Number(requestBody.receivedRechargeAmount) <= 0) {
        return RequestResponse.validationError(res, 'Please Enter Valid receivedRechargeAmount.', status.error, []);
    }

    if (CommonMessage.IsValid(requestBody.receivedDepositAmount) == false && Number(requestBody.receivedDepositAmount) <= 0) {
        return RequestResponse.validationError(res, 'Please Enter Valid receivedDepositAmount.', status.error, []);
    }

    // deposit amount set by admin
    let getLastDepositAmountEnumTbl: any = await RideBooking.getLastDepositAmount(); // deposit amount = advance amount

    if (getLastDepositAmountEnumTbl.rowCount <= 0) {
        return RequestResponse.validationError(res, 'Minimum deposit  amount is not set.', status.success, []);
    }

    let minimumDepositAmountEnmTbl: any = getLastDepositAmountEnumTbl.rows[0].enum_key.toFixed(2);

    // //console.log('minimumDepositAmountEnmTbl , currentDepositAmount ,receivedDepositAmount',minimumDepositAmountEnmTbl )
    // let remainingDepositAmount :number  = ( Number(currentDepositAmount) + Number(requestBody.receivedDepositAmount) )

    // //console.log(' total amount ',remainingDepositAmount)

    // if((remainingDepositAmount)  >  Number(minimumDepositAmountEnmTbl))
    //     {
    //         return RequestResponse.validationError(res, 'Your current deposit amount is ' +  currentDepositAmount  + '. You do not need to add any more deposit.  You can not deposit an amount greater than ' + minimumDepositAmountEnmTbl, status.success, []);
    //     }

    // if( Number(minimumDepositAmountEnmTbl) !=  (remainingDepositAmount) )
    //     {
    //         return RequestResponse.validationError(res, 'Your current deposit amount is ' +  currentDepositAmount +  'rupee. You can not deposit with ' + (requestBody.receivedAmount)  + ' rupee.' + ' you have to deposit with '+ ( Number(minimumDepositAmountEnmTbl) - Number(currentDepositAmount)) + ' rupee.', status.success, []);
    //     }

    //deposit amount set by admin
    //recharge amount set by admin
    let getLastMinRechargeAmountTbl: any = await RideBooking.getLastMinRechargeAmountTbl(); // wallet amount == recharge amount

    if (getLastMinRechargeAmountTbl.rowCount <= 0) {
        return RequestResponse.validationError(res, 'minimum recharge  amount is not set.', status.success, []);
    }

    let getLastMinRecharge: any = getLastMinRechargeAmountTbl.rows[0].enum_key.toFixed(2);
    //recharge amount set by admin

    // console.log('check rechare and deposit amount ',  getLastMinRecharge ,minimumDepositAmountEnmTbl )
    // let totalAmount:any = Number(minimumDepositAmountEnmTbl) + Number(getLastMinRecharge)

    // console.log('check recharge totalAmount ',   Number(totalAmount) , Number(requestBody.receivedAmount) )

    // if( Number(totalAmount) !=  Number(requestBody.receivedAmount))
    // {
    //     return RequestResponse.validationError(res, 'You can not add with ' + requestBody.receivedAmount + ' rupee ' + 'you have to recharge with '+ totalAmount + ' rupee.', status.success, []);
    // }

    if (Number(requestBody.receivedRechargeAmount) < Number(getLastMinRecharge)) {
        return RequestResponse.validationError(
            res,
            'You can not recharge with ' + requestBody.receivedRechargeAmount + ' rupee ' + 'you have to recharge with minimum ' + getLastMinRecharge,
            status.success,
            []
        );
    }

    requestBody.minimumDepositAmountEnmTbl = requestBody.receivedDepositAmount;
    requestBody.getLastMinRecharge = requestBody.receivedRechargeAmount;
    await addDepositRechargeAmountToUserWallet(requestBody, req, res);
    //    if(depositAmount=='Add'){
    //     req.body.receivedAmount = minimumDepositAmountEnmTbl ;

    //    }
    //    if(rechargeAmount=='Add'){
    //     req.body.receivedAmount = getLastMinRecharge ;
    //     await addUserRechargeAmount(req,res)
    //    }

    return;
};

async function addDepositRechargeAmountToUserWallet(requestBody: any, req: any, res: Response) {
    let checkCommit: any = false;
    try {
        //let requestBody = req.body;

        //console.log('check body requestBody',requestBody)

        let result: any;
        let walletAmount: any;

        walletAmount = await RideBooking.getWalletAmountByUserId(requestBody);
        if (walletAmount.rowCount <= 0) {
            return RequestResponse.validationError(res, 'User is not valid.', status.success, []);
        }
        requestBody.currentWalletAmount = walletAmount.rows[0].deposit_amount;

        let getLastDepositAmountEnumTbl: any = await RideBooking.getLastDepositAmount(); // deposit amount = advance amount

        if (getLastDepositAmountEnumTbl.rowCount <= 0) {
            return RequestResponse.validationError(res, 'Minimum deposit  amount is not set.', status.success, []);
        }

        if (requestBody.paymentByAdmin == 'PaymentByApp') {
            let getTransaction: any = await GetUserServices.getTransactionExitOrNot(requestBody);

            if (getTransaction.rowCount <= 0) {
                return RequestResponse.success(res, apiMessage.notPayment, status.success, []);
            }

            let getUserTransaction: any = await GetUserServices.getUserTransaction(requestBody);

            if (getUserTransaction.rowCount > 0) {
                return RequestResponse.success(res, apiMessage.paymentDone, status.success, []);
            }
            let paymentStatusEnumId: any = getTransaction.rows[0].online_payment_status_enum_id;
            if (paymentStatusEnumId == 32) {
                return RequestResponse.success(res, apiMessage.paymentDone, status.success, []);
            }

            if (paymentStatusEnumId == 34) {
                return RequestResponse.success(res, apiMessage.PaymentFailed, status.success, []);
            }
        }

        requestBody.paymentEnumId = 32; // for payment settulled
        let ValidAmount: any;
        //=WalletAmount.IsValidAmount( Number(requestBody.receivedAmount),Number(walletAmount.rows[0].extra_charges));

        // if (ValidAmount.notvalid==true)
        // {
        //     return RequestResponse.validationError(res, 'Please Enter Valid receivedAmount.', status.error, []);
        // }

        let minimumDepositAmountEnmTbl: any = getLastDepositAmountEnumTbl.rows[0].enum_key.toFixed(2);

        // console.log('requestBody.receivedAmount',requestBody.receivedAmount,minimumDepositAmountEnmTbl)
        // if( requestBody.receivedAmount != minimumDepositAmountEnmTbl)
        // {
        //     return RequestResponse.validationError(res, 'You can not deposit with ' + requestBody.receivedAmount + ' rupee ' + 'you have to recharge with '+ minimumDepositAmountEnmTbl + ' rupee.', status.success, []);
        // }

        //ValidAmount.currentWalletAmount = walletAmount.rows[0].min_wallet_amount;
        requestBody.deposit_amount = walletAmount.rows[0].deposit_amount;

        requestBody.remarkss = requestBody.remark;
        requestBody.depositAmount = requestBody.receivedDepositAmount;
        requestBody.rechargeAmount = requestBody.receivedRechargeAmount;
        requestBody.hiringCharges = null;
        requestBody.fromRideTime = null;
        requestBody.toRideTime = null;
        requestBody.rideBookingMinutes = null;
        requestBody.withdrawnId = 0;
        requestBody.rideBookingId = 0;

        // result = await GetUserServices.addDepositRechargeAmount(requestBody);

        //  if (result.rowCount < 0)
        //  {

        //     return RequestResponse.success(res, apiMessage.noDataFound, status.success, []);
        // } -----------------------------------------++
        //6663 else
        // {

        //     let  RDAmountJson:any = await rechargeAndDepositAmountTransactionJson(req, res,requestBody) ;

        //      for (let i = 0; i <= RDAmountJson.length -1;i++) {

        //           result = await GetUserServices.insertUserAllTransactionDetails(RDAmountJson[i]);
        //         }

        //   if (result.rowCount > 0)
        //   {

        //   let  paymentSeetulled :any = await GetUserServices.paymentSeetulled(requestBody);

        //     return RequestResponse.success(res, 'Amount Added Successfully.', status.success, []);
        //  // }
        //   }
        //   else
        //   {
        //     return RequestResponse.success(res, 'Amount is not Add', status.success, []);
        //   }
        // }
        let paymentResultTrasaction: any;
        //   requestBody.paymentTransactionId = requestBody.paymentPrimaryKeyIdFromDB;

        client
            .query('BEGIN')
            .then(async (res1) => {
                let RDAmountJson: any = await rechargeAndDepositAmountTransactionJson(requestBody, res, requestBody);

                for (let i = 0; i <= RDAmountJson.length - 1; i++) {
                    paymentResultTrasaction = await GetUserServices.insertUserAllTransactionDetails(RDAmountJson[i]);

                    //  console.log('check result for this paymentResultTrasaction',paymentResultTrasaction)
                }

                return paymentResultTrasaction;
            })
            .then(async (res1) => {
                if (paymentResultTrasaction.rowCount > 0) {
                    result = await GetUserServices.addDepositRechargeAmount(requestBody);
                    //  console.log('check result for this result',result)

                    //return true;
                }
                // return true;
                return result; //RequestResponse.success(res, apiMessage.stateList, status.success, []);
            })
            .then(async (res1) => {
                if (result.rowCount > 0) {
                    let paymentSettulled: any = await GetUserServices.paymentSeetulled(requestBody);
                    //  console.log('check result for this paymentSettulled',paymentSettulled)

                    //return true;
                }
                // return true;
                return; //RequestResponse.success(res, apiMessage.stateList, status.success, []);
            })

            .then((res1) => {
                if (checkCommit == false) {
                    checkCommit = true;
                    client.query('commit');
                }
                return true;
            })

            .catch((err) => {
                if (checkCommit == false) {
                    checkCommit = true;
                    client.query('rollback');
                }
                AddExceptionIntoDB(requestBody, err);
                exceptionHandler(res, 1, err.message);
                return false;
            })
            .catch((err) => {
                if (checkCommit == false) {
                    checkCommit = true;
                    client.query('rollback');
                }
                AddExceptionIntoDB(requestBody, err);
                exceptionHandler(res, 1, err.message);
                return false;
            });
    } catch (error: any) {
        AddExceptionIntoDB(req, error);
        return exceptionHandler(res, 1, error.message);
    }
}

const cancelWithdrawRequestFromUserController = async (req: Request, res: Response) => {
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
        let requestQuery = req.query;

        let userDetails: any = await GetUserServices.getUserDetails({ id: requestBody.id, statusEnumId: 1 });

        if (userDetails.rowCount <= 0) {
            return RequestResponse.validationError(res, 'User Details Not Found.', status.info, []);
        }

        requestBody.currentWalletAmount = userDetails.rows[0].deposit_amount;
        let result: any;

        requestBody.processing_user_id = requestBody.id;
        requestBody.withdrawRequestStatusEnumId = 10; // for get user pending withdraw request

        let withDrawRequestResult: any = await DashboardServices.getWithdrawRequestFromAdminSide(requestBody, req);
        if (withDrawRequestResult.rowCount <= 0) {
            return RequestResponse.validationError(res, 'No withdrawal request found for this user.', status.info, []);
        }

        requestBody.amount = withDrawRequestResult.rows[0].amount;
        requestBody.userId = withDrawRequestResult.rows[0].user_id;
        requestBody.withdrawnId = withDrawRequestResult.rows[0].id;

        if (Number(requestBody.userId) != Number(requestBody.id)) {
            return RequestResponse.validationError(res, 'withdrawal request user and  withdrawal request cancel user both are not same.', status.info, []);
        }
        requestBody.OrderType = 'W';
        requestBody.withdrawNo = await generateOrderNumber(requestBody.OrderType);

        // result = await GetUserServices.getWithdrawRequestFromUser(requestBody);

        //  if (result.rowCount <= 0) {
        //     return RequestResponse.success(res, apiMessage.somethingWentWrong, status.info, []);
        //  }

        //  requestBody.withdrawnId = result.rows[0].id;
        let addDepositAmountFromWithdrawRequest: any = await GetUserServices.addDepositAmountFromWithdrawRequestCancel(requestBody); // deposit amount

        requestBody.walletAmount = requestBody.amount;
        requestBody.extraCharges = 0;
        requestBody.hiringCharges = null;
        requestBody.transactionType = 109;
        requestBody.fromRideTime = null;
        requestBody.toRideTime = null;
        requestBody.rideBookingMinutes = null;
        requestBody.rideBookingId = 0;
        requestBody.remarkss = requestBody.remark;
        requestBody.remarks = requestBody.remark;

        let getVerifyT: any = await getTokenDetail(requestQuery.access_token);

        requestBody.cancelled_user_id = getVerifyT.id;

        if (addDepositAmountFromWithdrawRequest.rowCount <= 0) {
            return RequestResponse.success(res, apiMessage.error, status.error, []);
        } else {
            requestBody.withdrawRequestStatusEnumId = 110; // for update cancelled withdraw Request

            let updateWithdrawRequest: any = await DashboardServices.updateStatusCancelledOfWithdrawRequest(requestBody, req);

            if (updateWithdrawRequest.rowCount <= 0) {
                return RequestResponse.validationError(res, 'User Withdraw request is not cancelled.', status.info, []);
            }
            requestBody.amountAddedByUserId = requestBody.cancelled_user_id;
            requestBody.depositAmount = requestBody.walletAmount;
            requestBody.rechargeAmount = '0';
            requestBody.paymentTransactionId = null;
            result = await GetUserServices.insertUserAllTransactionDetails(requestBody);
            return RequestResponse.success(res, apiMessage.withdrawRequestCancelled, status.success, []);
        }
    } catch (error: any) {
        AddExceptionIntoDB(req, error);
        return exceptionHandler(res, 1, error.message);
    }
};

const addAppVersionDetail = async (req: Request, res: Response) => {
    try {
        // #swagger.tags = ['User-Payment']
        // #swagger.description = 'Pass fromDate  and toDate to between record for individual give paymentId also knows as razorpay_payment_id   ----http://localhost:9001/api/v1/getAllPayments?fromDate=2022-06-05&toDate=2022-06-09&paymentId='

        /*#swagger.parameters[ {
                        "name": "fromDate",
                        "in": "query",
                        "description": "2022-06-05",
                        "required": true,
                        "type": "string"
                    }] 
        } */
        /*#swagger.parameters[ {
                        "name": "toDate",
                        "in": "query",
                        "description": "2022-06-09",
                        "required": true,
                        "type": "string"
                    }] 
        } */
        /*#swagger.parameters[ {
                        "name": "paymentId",
                        "in": "query",
                        "description": "pay_JewGXUOzXvxDN3",
                        "required": false,
                        "type": "string"
                    }] 
        } */

        //console.log('req.body req.body',req.body)
        let requestBody: any = req.body;

        if (requestBody.minSupportableVersion == true) {
            await DashboardServices.updateOldVersion(req, res);
        }

        let result: any = await DashboardServices.insertVersionDetail(requestBody, res);
        if (result.rowCount > 0) {
            return RequestResponse.success(res, 'version added successfully.', status.success, []);
        } else {
            return RequestResponse.validationError(res, apiMessage.error, status.error, []);
        }
    } catch (error: any) {
        AddExceptionIntoDB(req, error);
        return exceptionHandler(res, 1, error.message);
    }
};

const getVersionHistoryController = async (req: Request, res: Response) => {
    try {
        let versionHistoryData: any = [];

        let result: any = await DashboardServices.getVersionHistory(req, res);
        if (result.rowCount == 0) {
            return RequestResponse.validationError(res, apiMessage.error, status.error, []);
        } else {
            for (let row of result.rows) {
                //   console.log('check data ',row)
                versionHistoryData.push({
                    versionId: row.id,
                    displayVersion: row.display_version,
                    actualVersion: row.actual_version,
                    minSupportableVersion: row.min_supportable_version,
                    remark: row.remark,
                    versionApplyDate: row.version_apply_date,
                    createdOnDate: row.createdon_date,
                    createdByLoginUserId: row.createdby_login_user_id,
                    updatedOnDate: row.updatedon_date,
                    actionRemark: row.action_remark,
                    updatedByLoginUserId: row.updatedby_login_user_id
                });
            }

            return RequestResponse.success(res, apiMessage.success, status.success, versionHistoryData);
        }
    } catch (error: any) {
        AddExceptionIntoDB(req, error);
        return exceptionHandler(res, 1, error.message);
    }
};

const updateAppVersionDetail = async (req: Request, res: Response) => {
    try {
        // #swagger.tags = ['User-Payment']
        // #swagger.description = 'Pass fromDate  and toDate to between record for individual give paymentId also knows as razorpay_payment_id   ----http://localhost:9001/api/v1/getAllPayments?fromDate=2022-06-05&toDate=2022-06-09&paymentId='

        /*#swagger.parameters[ {
                        "name": "fromDate",
                        "in": "query",
                        "description": "2022-06-05",
                        "required": true,
                        "type": "string"
                    }] 
        } */
        /*#swagger.parameters[ {
                        "name": "toDate",
                        "in": "query",
                        "description": "2022-06-09",
                        "required": true,
                        "type": "string"
                    }] 
        } */
        /*#swagger.parameters[ {
                        "name": "paymentId",
                        "in": "query",
                        "description": "pay_JewGXUOzXvxDN3",
                        "required": false,
                        "type": "string"
                    }] 
        } */

        let requestBody: any = req.body;
        // console.log('check requestBody',requestBody)
        // console.log('check requestBody',requestBody)
        requestBody.minSupportable = requestBody.minSupportableVersion;
        if (requestBody.minSupportableVersion == true) {
            await DashboardServices.updateOldVersion(req, res);
        }

        let result: any = await DashboardServices.updateAppUserVersion(req, res);
        if (result.rowCount > 0) {
            return RequestResponse.success(res, 'version added successfully.', status.success, []);
        } else {
            return RequestResponse.validationError(res, apiMessage.error, status.error, []);
        }
    } catch (error: any) {
        AddExceptionIntoDB(req, error);
        return exceptionHandler(res, 1, error.message);
    }
};

export function rechargeAndDepositAmountTransactionJson(req: any, res: any, requestBody: any) {
    let amountJson: any = [];

    //console.log('check json',requestBody)

    amountJson = [
        {
            id: requestBody.id,
            paymentTransactionId: requestBody.paymentTransactionId,
            transactionType: '112', // 112 set for add recharge amount and deposit amount
            walletAmount: requestBody.depositAmount,
            depositAmount: requestBody.depositAmount,
            rechargeAmount: requestBody.rechargeAmount,
            // uncomment blow commented code and comment above line 1690
            // walletAmount : requestBody.depositAmount + requestBody.rechargeAmount  walletAmount :requestBody.depositAmount,
            extraCharges: requestBody.extraCharges,
            hiringCharges: requestBody.hiringCharges,
            withdrawnId: requestBody.withdrawnId,
            rideBookingId: requestBody.rideBookingId,
            currentWalletAmount: requestBody.currentWalletAmount,
            remarkss: 'add deposit amount with recharge , both recharge and deposit add with single transaction',
            amountAddedByUserId: requestBody.amountAddedByUserId
        }
        //,
        // { // remove json object
        //     id : requestBody.id,
        //     paymentTransactionId :requestBody.paymentTransactionId,
        //     transactionType : '106',
        //     walletAmount :requestBody.rechargeAmount,
        //     extraCharges :requestBody.extraCharges,
        //     hiringCharges :requestBody.hiringCharges,
        //     withdrawnId :requestBody.withdrawnId,
        //     rideBookingId :requestBody.rideBookingId,
        //     currentWalletAmount : requestBody.currentWalletAmount,
        //     remarkss : 'add recharge amount with deposit and deposit add with single transaction',
        //     amountAddedByUserId : requestBody.amountAddedByUserId
        // }
    ];
    // console.log('add return amountJson',amountJson)
    return amountJson;
}

const getVersionCurrentController = async (req: Request, res: Response) => {
    try {
        //      console.log('check version api start')
        let data: any = {};
        let CurrentVersionData: any;

        let CurrentVersionResult: any = await DashboardServices.getVersionCurrentService(req, res);
        // let ninSupportCurrentVersionResult: any = await DashboardServices.getMiniSupportCurrentVersionService(req,res);
        if (CurrentVersionResult.rowCount > 0) {
            CurrentVersionData = {
                versionId: CurrentVersionResult.rows[0].id,
                displayVersion: CurrentVersionResult.rows[0].display_version,
                actualVersion: CurrentVersionResult.rows[0].actual_version,
                minSupportableVersion: CurrentVersionResult.rows[0].min_supportable_version,
                remark: CurrentVersionResult.rows[0].remark,
                versionApplyDate: CurrentVersionResult.rows[0].version_apply_date,
                createdOnDate: CurrentVersionResult.rows[0].createdon_date,
                createdByLoginUserId: CurrentVersionResult.rows[0].createdby_login_user_id,
                updatedOnDate: CurrentVersionResult.rows[0].updatedon_date,
                actionRemark: CurrentVersionResult.rows[0].action_remark,
                updatedByLoginUserId: CurrentVersionResult.rows[0].updatedby_login_user_id
            };
        }

        let minSupportCurrentVersion: any;
        let minSupportCurrentVersionResult: any = await DashboardServices.getMiniSupportCurrentVersionService(req, res);
        if (minSupportCurrentVersionResult.rowCount > 0) {
            minSupportCurrentVersion = {
                versionId: minSupportCurrentVersionResult.rows[0].id,
                displayVersion: minSupportCurrentVersionResult.rows[0].display_version,
                actualVersion: minSupportCurrentVersionResult.rows[0].actual_version,
                minSupportableVersion: minSupportCurrentVersionResult.rows[0].min_supportable_version,
                remark: minSupportCurrentVersionResult.rows[0].remark,
                versionApplyDate: minSupportCurrentVersionResult.rows[0].version_apply_date,
                createdOnDate: minSupportCurrentVersionResult.rows[0].createdon_date,
                createdByLoginUserId: minSupportCurrentVersionResult.rows[0].createdby_login_user_id,
                updatedOnDate: minSupportCurrentVersionResult.rows[0].updatedon_date,
                actionRemark: minSupportCurrentVersionResult.rows[0].action_remark,
                updatedByLoginUserId: minSupportCurrentVersionResult.rows[0].updatedby_login_user_id
            };
        }

        // console.log('versionHistoryData.ninSupportCurrentVersion versionHistoryData.CurrentVersionData' ,
        //     minSupportCurrentVersion ,
        // CurrentVersionData
        // )

        data.minSupportableVersion = minSupportCurrentVersion;
        data.CurrentVersion = CurrentVersionData;

        return RequestResponse.success(res, apiMessage.success, status.success, data);
    } catch (error: any) {
        AddExceptionIntoDB(req, error);
        return exceptionHandler(res, 1, error.message);
    }
};

export function rechargeAndDepositAmountTransactionJsonToServer(req: any, res: any, requestBody: any) {
    let amountJson: any = [];

    // console.log('check json tweter',requestBody)

    amountJson = [
        {
            id: requestBody.user_id,
            paymentTransactionId: requestBody.paymentPrimaryKeyIdFromDB,
            transactionType: '113', // 112 set for add recharge amount and deposit amount
            //   walletAmount :requestBody.depositAmount,
            // uncomment blow commented code and comment above line 1690
            walletAmount: requestBody.depositAmount + requestBody.rechargeAmount,
            depositAmount: requestBody.depositAmount,
            rechargeAmount: requestBody.rechargeAmount,
            extraCharges: null,
            hiringCharges: null,
            withdrawnId: 0,
            rideBookingId: requestBody.rideBookingId,
            currentWalletAmount: requestBody.currentWalletAmount,
            remarkss: 'add deposit amount with recharge , both recharge and deposit add with single transaction from server.',
            amountAddedByUserId: requestBody.id,
            transaction_from_enum_id: '114'
        }
    ];
    // console.log('add return amountJson',amountJson)
    return amountJson;
}
//MetroDevelopmentTest

const gatPaymentOrderDetail = async () => {
    // let orderDetail :any;

    let res: any;
    let bodyRequestData: any = {};
    try {
        // console.log('start gatPaymentOrderDetail ',)

        let ResultForUpdateValues: any = await payment.getPaymentTransactionForUpdateDetailToServerService();

        //  console.log('check data from database ResultForUpdateValues.rowCount ',ResultForUpdateValues)
        if (ResultForUpdateValues.rowCount == 0) {
            return false;
        }

        for (let row of ResultForUpdateValues.rows) {
            //await sleep(10000);
            bodyRequestData.customUniqueIdforUPPFDB = row.id;

            let orderId: any = { id: row.order_id };

            bodyRequestData.paymentOrderNo = row.payment_order_no;

            let resultOrder: any;
            try {
                resultOrder = await payment.getPaymentTransactionByOrderId(orderId);
            } catch (error) {
                continue;
            }

            let checkLength: any = isObjectEmpty(resultOrder);
            //  console.log('check resultOrder  4 ',resultOrder.items.length)
            if (checkLength == false) // length
            {
                //  console.log('check data resultOrder.resultOrder.items.length 5',resultOrder.items.length)

                if (resultOrder.items.length > 0) {
                    let razorPayServerFinalData: any = {};
                    for (let i = 0; i <= resultOrder.items.length - 1; i++) {
                        //     console.log(resultOrder.items[i].status,' check status data 6')
                        if (resultOrder.items[i].status == 'captured') //,'' ,'created'
                        {
                            //   console.log(' check status data  captured 7 ')
                            razorPayServerFinalData = resultOrder.items[i]; // .status;
                            break;
                        }
                        if (resultOrder.items.length == i + 1) {
                            //   console.log(' check status data  capturedn esultOrder.items.length==i+1 8',resultOrder.items.length,i+1)
                            razorPayServerFinalData = resultOrder.items[i]; //.status;
                            break;
                        }
                    } // second loop
                    let razorpay_response_fromSchedulerData: any = JSON.stringify(resultOrder.items);
                    //  console.log('check final data  razorPayServerFinalData 9 bodyRequestData',razorPayServerFinalData)
                    //console.log('check status in side captured 1985',razorPayServerFinalData.status)

                    if (razorPayServerFinalData.status == 'captured') //,'' ,'created'
                    {
                        //  console.log('check status in side captured 1989')
                        let currentTime = getUTCdate();
                        let difference: any = await calculateMin(row.createdon_date, currentTime);
                        // console.log('check status in side captured 10',razorPayServerFinalData.status,difference)
                        if (difference > 15) //1  fir se 15 minut krna h testing k liye 5 minut kiya h
                        {
                            //    let paymentResuslt :any = await payment.getPaymentTransactionIdService(razorPayServerFinalData)

                            let paymentResuslt: any = await payment.getPaymentTransactionIdAddPaymentService(razorPayServerFinalData);
                            //   console.log('resultOrder.m paymentResuslt 11',paymentResuslt)
                            if (paymentResuslt.rowCount > 0) //2
                            {
                                //   console.log('resultOrder.m paymentResuslt  12 ',)
                                bodyRequestData.paymentPrimaryKeyIdFromDB = row.id;

                                bodyRequestData.paymentTransactionId = bodyRequestData.paymentPrimaryKeyIdFromDB;

                                bodyRequestData.user_id = Number(row.user_id);

                                let getUserId: any = { contact: razorPayServerFinalData.contact.slice(3) };

                                razorPayServerFinalData.user_id = bodyRequestData.user_id;
                                bodyRequestData.createdbyLoginUerId = bodyRequestData.user_id;
                                bodyRequestData.remarks = 'payment settled  from server (scheduler)controller.';

                                bodyRequestData.online_payment_status_enumid = 33; // not settled

                                bodyRequestData.id = razorPayServerFinalData.id;
                                bodyRequestData.entity = razorPayServerFinalData.entity;
                                bodyRequestData.amount = razorPayServerFinalData.amount;
                                bodyRequestData.currency = razorPayServerFinalData.currency;
                                bodyRequestData.status = razorPayServerFinalData.status;
                                bodyRequestData.order_id = razorPayServerFinalData.order_id;
                                bodyRequestData.invoice_id = razorPayServerFinalData.invoice_id;
                                bodyRequestData.international = razorPayServerFinalData.international;
                                bodyRequestData.method = razorPayServerFinalData.method;
                                // bodyRequestData.amount_refunde =razorPayServerFinalData.amount_refunde;
                                bodyRequestData.refund_status = razorPayServerFinalData.refund_status;
                                bodyRequestData.captured = razorPayServerFinalData.captured;
                                bodyRequestData.description = razorPayServerFinalData.description;
                                bodyRequestData.card_id = razorPayServerFinalData.card_id;
                                bodyRequestData.bank = razorPayServerFinalData.bank;
                                bodyRequestData.wallet = razorPayServerFinalData.wallet;
                                bodyRequestData.vpa = razorPayServerFinalData.vpa;
                                bodyRequestData.email = razorPayServerFinalData.email;
                                bodyRequestData.contact = razorPayServerFinalData.contact;

                                bodyRequestData.fee = razorPayServerFinalData.fee;
                                bodyRequestData.tax = razorPayServerFinalData.tax;
                                bodyRequestData.error_code = razorPayServerFinalData.error_code;
                                bodyRequestData.error_description = razorPayServerFinalData.error_description;
                                bodyRequestData.error_source = razorPayServerFinalData.error_source;
                                bodyRequestData.error_step = razorPayServerFinalData.error_step;
                                bodyRequestData.error_reason = razorPayServerFinalData.error_reason;
                                bodyRequestData.amount_refunded = razorPayServerFinalData.amount_refunded;
                                bodyRequestData.notes = razorPayServerFinalData.notes;

                                bodyRequestData.razorpay_response_from_scheduler = razorpay_response_fromSchedulerData;
                                // bodyRequestData.razorpay_response_from_scheduler =null;
                                bodyRequestData.razapay_response_json = null;

                                let paymentResult: any = await payment.updatePaymentTransaction(bodyRequestData);

                                if (config.CLIENT_NAME == kClientName.clientEvegah) {
                                }
                                //  console.log('check dt  finel 14 ',dt)
                            } // first if (second sub if)
                        } // first if (first sub if)
                    } // first if
                    else if (razorPayServerFinalData.status == 'failed') {
                        let currentTime = getUTCdate();
                        let differenceHr: any = await calculateHr(row.createdon_date, currentTime); // This will give difference in milliseconds
                        if (differenceHr > 47) // hr
                        {
                            // let paymentResuslt :any = await payment.getPaymentTransactionIdService(razorPayServerFinalData)
                            let paymentResuslt: any = await payment.getPaymentTransactionIdAddPaymentService(razorPayServerFinalData);
                            if (paymentResuslt.rowCount > 0) {
                                bodyRequestData.paymentPrimaryKeyIdFromDB = row.id;
                                bodyRequestData.user_id = Number(row.user_id);

                                let getUserId: any = { contact: razorPayServerFinalData.contact.slice(3) };

                                razorPayServerFinalData.user_id = bodyRequestData.user_id;
                                bodyRequestData.createdbyLoginUserId = bodyRequestData.user_idd;
                                bodyRequestData.remarks = 'payment settled  from server (scheduler)controller.';

                                bodyRequestData.online_payment_status_enumid = 34; // failed

                                bodyRequestData.id = razorPayServerFinalData.id;
                                bodyRequestData.entity = razorPayServerFinalData.entity;
                                bodyRequestData.amount = razorPayServerFinalData.amount;
                                bodyRequestData.currency = razorPayServerFinalData.currency;
                                bodyRequestData.status = razorPayServerFinalData.status;
                                bodyRequestData.order_id = razorPayServerFinalData.order_id;
                                bodyRequestData.invoice_id = razorPayServerFinalData.invoice_id;
                                bodyRequestData.international = razorPayServerFinalData.international;
                                bodyRequestData.method = razorPayServerFinalData.method;
                                //  bodyRequestData.amount_refunde =razorPayServerFinalData.amount_refunde;
                                bodyRequestData.refund_status = razorPayServerFinalData.refund_status;
                                bodyRequestData.captured = razorPayServerFinalData.captured;
                                bodyRequestData.description = razorPayServerFinalData.description;
                                bodyRequestData.card_id = razorPayServerFinalData.card_id;
                                bodyRequestData.bank = razorPayServerFinalData.bank;
                                bodyRequestData.wallet = razorPayServerFinalData.wallet;
                                bodyRequestData.vpa = razorPayServerFinalData.vpa;
                                bodyRequestData.email = razorPayServerFinalData.email;
                                bodyRequestData.contact = razorPayServerFinalData.contact;
                                //resultOrder.items[0].notes: [],
                                bodyRequestData.fee = razorPayServerFinalData.fee;
                                bodyRequestData.tax = razorPayServerFinalData.tax;
                                bodyRequestData.error_code = razorPayServerFinalData.error_code;
                                bodyRequestData.error_description = razorPayServerFinalData.error_description;
                                bodyRequestData.error_source = razorPayServerFinalData.error_source;
                                bodyRequestData.error_step = razorPayServerFinalData.error_step;
                                bodyRequestData.error_reason = razorPayServerFinalData.error_reason;
                                bodyRequestData.razorpay_response_from_scheduler = razorpay_response_fromSchedulerData;
                                // bodyRequestData.razorpay_response_from_scheduler =null;
                                bodyRequestData.razapay_response_json = null;
                                // //resultOrder.items[0].notes: [],
                                // bodyRequestData.fee =razorPayServerFinalData.fee;
                                // bodyRequestData.tax =razorPayServerFinalData.tax;
                                // bodyRequestData.error_code =razorPayServerFinalData.error_code;
                                // bodyRequestData.error_description =razorPayServerFinalData.error_description;
                                // bodyRequestData.error_source =razorPayServerFinalData.error_source;
                                // bodyRequestData.error_step =razorPayServerFinalData.error_step;
                                // bodyRequestData.error_reason =razorPayServerFinalData.error_reason;

                                let paymentResult: any = await payment.updatePaymentTransaction(bodyRequestData);
                            }
                        }
                    } else if (razorPayServerFinalData.status == 'created') {
                        let currentTime = getUTCdate();
                        let differenceHr: any = await calculateHr(row.createdon_date, currentTime); // This will give difference in milliseconds
                        //  console.log('resultOrder.m paymentResuslt 2135')
                        if (differenceHr > 23) // hr
                        {
                            // let paymentResuslt :any = await payment.getPaymentTransactionIdService(razorPayServerFinalData)
                            let paymentResuslt: any = await payment.getPaymentTransactionIdAddPaymentService(razorPayServerFinalData);
                            // console.log('resultOrder.m paymentResuslt',paymentResuslt)
                            if (paymentResuslt.rowCount > 0) {
                                bodyRequestData.paymentPrimaryKeyIdFromDB = row.id;
                                //  console.log('bodyRequestData.paymentPrimaryKeyIdFromDB',bodyRequestData.paymentPrimaryKeyIdFromDB)
                                bodyRequestData.user_id = Number(row.user_id);

                                //  let  getUserId :any= { contact: resultOrder.items[0].contact.slice(3) };
                                let getUserId: any = { contact: razorPayServerFinalData.contact.slice(3) };

                                // let user_id: any = await GetUserServices.getUserIdByPhoneNumber(getUserId);

                                //  resultOrder.items[0].user_id = user_id.rows[0].id;
                                razorPayServerFinalData.user_id = bodyRequestData.user_id;
                                bodyRequestData.createdbyLoginUserId = bodyRequestData.user_id;
                                bodyRequestData.remarks = 'payment settled  from server (scheduler)controller.';

                                bodyRequestData.online_payment_status_enumid = 34; // failed

                                bodyRequestData.id = razorPayServerFinalData.id;
                                bodyRequestData.entity = razorPayServerFinalData.entity;
                                bodyRequestData.amount = razorPayServerFinalData.amount;
                                bodyRequestData.currency = razorPayServerFinalData.currency;
                                bodyRequestData.status = razorPayServerFinalData.status;
                                bodyRequestData.order_id = razorPayServerFinalData.order_id;
                                bodyRequestData.invoice_id = razorPayServerFinalData.invoice_id;
                                bodyRequestData.international = razorPayServerFinalData.international;
                                bodyRequestData.method = razorPayServerFinalData.method;
                                //  bodyRequestData.amount_refunde =razorPayServerFinalData.amount_refunde;
                                bodyRequestData.refund_status = razorPayServerFinalData.refund_status;
                                bodyRequestData.captured = razorPayServerFinalData.captured;
                                bodyRequestData.description = razorPayServerFinalData.description;
                                bodyRequestData.card_id = razorPayServerFinalData.card_id;
                                bodyRequestData.bank = razorPayServerFinalData.bank;
                                bodyRequestData.wallet = razorPayServerFinalData.wallet;
                                bodyRequestData.vpa = razorPayServerFinalData.vpa;
                                bodyRequestData.email = razorPayServerFinalData.email;
                                bodyRequestData.contact = razorPayServerFinalData.contact;
                                //resultOrder.items[0].notes: [],
                                bodyRequestData.fee = razorPayServerFinalData.fee;
                                bodyRequestData.tax = razorPayServerFinalData.tax;
                                bodyRequestData.error_code = razorPayServerFinalData.error_code;
                                bodyRequestData.error_description = razorPayServerFinalData.error_description;
                                bodyRequestData.error_source = razorPayServerFinalData.error_source;
                                bodyRequestData.error_step = razorPayServerFinalData.error_step;
                                bodyRequestData.error_reason = razorPayServerFinalData.error_reason;
                                bodyRequestData.razorpay_response_from_scheduler = razorpay_response_fromSchedulerData;
                                //  bodyRequestData.razorpay_response_from_scheduler =null
                                bodyRequestData.razapay_response_json = null;

                                let paymentResult: any = await payment.updatePaymentTransaction(bodyRequestData);
                            }
                        }
                    } else if (razorPayServerFinalData.status == 'refunded') {
                        let currentTime = getUTCdate();
                        let differenceHr: any = await calculateHr(row.createdon_date, currentTime); // This will give difference in milliseconds
                        // console.log('resultOrder.m paymentResuslt 2135')
                        if (differenceHr > 23) // hr
                        {
                            // let paymentResuslt :any = await payment.getPaymentTransactionIdService(razorPayServerFinalData)
                            let paymentResuslt: any = await payment.getPaymentTransactionIdAddPaymentService(razorPayServerFinalData);
                            //   console.log('resultOrder.m paymentResuslt',paymentResuslt)
                            if (paymentResuslt.rowCount > 0) {
                                bodyRequestData.paymentPrimaryKeyIdFromDB = row.id;
                                //  console.log('bodyRequestData.paymentPrimaryKeyIdFromDB',bodyRequestData.paymentPrimaryKeyIdFromDB)
                                bodyRequestData.user_id = Number(row.user_id);

                                //  let  getUserId :any= { contact: resultOrder.items[0].contact.slice(3) };
                                let getUserId: any = { contact: razorPayServerFinalData.contact.slice(3) };

                                // let user_id: any = await GetUserServices.getUserIdByPhoneNumber(getUserId);

                                //  resultOrder.items[0].user_id = user_id.rows[0].id;
                                razorPayServerFinalData.user_id = bodyRequestData.user_id;
                                bodyRequestData.createdbyLoginUserId = bodyRequestData.user_id;
                                bodyRequestData.remarks = 'payment settled  from server (scheduler)controller.';

                                bodyRequestData.online_payment_status_enumid = 118; // payment is refund to user

                                bodyRequestData.id = razorPayServerFinalData.id;
                                bodyRequestData.entity = razorPayServerFinalData.entity;
                                bodyRequestData.amount = razorPayServerFinalData.amount;
                                bodyRequestData.currency = razorPayServerFinalData.currency;
                                bodyRequestData.status = razorPayServerFinalData.status;
                                bodyRequestData.order_id = razorPayServerFinalData.order_id;
                                bodyRequestData.invoice_id = razorPayServerFinalData.invoice_id;
                                bodyRequestData.international = razorPayServerFinalData.international;
                                bodyRequestData.method = razorPayServerFinalData.method;
                                //  bodyRequestData.amount_refunde =razorPayServerFinalData.amount_refunde;
                                bodyRequestData.refund_status = razorPayServerFinalData.refund_status;
                                bodyRequestData.captured = razorPayServerFinalData.captured;
                                bodyRequestData.description = razorPayServerFinalData.description;
                                bodyRequestData.card_id = razorPayServerFinalData.card_id;
                                bodyRequestData.bank = razorPayServerFinalData.bank;
                                bodyRequestData.wallet = razorPayServerFinalData.wallet;
                                bodyRequestData.vpa = razorPayServerFinalData.vpa;
                                bodyRequestData.email = razorPayServerFinalData.email;
                                bodyRequestData.contact = razorPayServerFinalData.contact;
                                //resultOrder.items[0].notes: [],
                                bodyRequestData.fee = razorPayServerFinalData.fee;
                                bodyRequestData.tax = razorPayServerFinalData.tax;
                                bodyRequestData.error_code = razorPayServerFinalData.error_code;
                                bodyRequestData.error_description = razorPayServerFinalData.error_description;
                                bodyRequestData.error_source = razorPayServerFinalData.error_source;
                                bodyRequestData.error_step = razorPayServerFinalData.error_step;
                                bodyRequestData.error_reason = razorPayServerFinalData.error_reason;
                                bodyRequestData.razorpay_response_from_scheduler = razorpay_response_fromSchedulerData;
                                //  bodyRequestData.razorpay_response_from_scheduler =null
                                bodyRequestData.razapay_response_json = null;

                                let paymentResult: any = await payment.updatePaymentTransaction(bodyRequestData);
                            }
                        }
                    }
                } //resultOrder.items.length
                else {
                    if (resultOrder.items.length == 0) {
                        let resultOrderOnly: any = await payment.getPaymentTransactionByOrderIdOnlyOrderDetail(orderId);
                        //    console.log('check result resultOrder line 2202',resultOrder)
                        let checkLength: any = isObjectEmpty(resultOrderOnly);
                        if (checkLength == false) {
                            if (resultOrderOnly.status == 'created') {
                                let currentTime = getUTCdate();
                                let differenceHr: any = await calculateHr(row.createdon_date, currentTime);
                                if (differenceHr > 23) // hr
                                {
                                    bodyRequestData.paymentPrimaryKeyIdFromDB = row.id;
                                    bodyRequestData.remarks = 'payment settled  from server  (scheduler)controller (payment is not created).';

                                    bodyRequestData.online_payment_status_enumid = 116; // Payment is not created (if payment not created only  order is created)
                                    bodyRequestData.razorpay_response_from_scheduler = JSON.stringify(resultOrderOnly);
                                    let paymentResult: any = await payment.UPaymentTransactionFromVerifyFromOrderFailedService(bodyRequestData);
                                    //   console.log('check result data paymentResult',paymentResult)
                                }
                            }
                        }
                    }
                }
            } // length
        } // for loop

        // console.log('check list line 2210')
        return false;
    } catch (error: any) {
        //   AddExceptionIntoDB(orderDetail,error);
        // console.log('check in catch block 2215',error.message)
        return exceptionHandler(res, 1, error.message);
    }
};

const CheckPaymentOrderDetailByOrderId = async (req: Request, res: Response) => {
    try {
        let result: any;
        let querystring = req.query;
        let orderId: any = { id: querystring.order_id };

        let resultOrder: any = await payment.getPaymentTransactionByOrderId(orderId);

        let checkLength: any = isObjectEmpty(resultOrder);
        //console.log('check resultOrder ',resultOrder)
        if (checkLength == false) {
            // console.log('check data resultOrder.items',resultOrder.items)
            if (resultOrder.items.length > 0) {
                // console.log('resultOrder.items[0].status',resultOrder.items[0].status,resultOrder.items[0].id)
                return RequestResponse.success(res, apiMessage.success, status.success, resultOrder.items);
            }
        }
        return RequestResponse.success(res, apiMessage.success, status.success, []);
    } catch (error: any) {
        AddExceptionIntoDB(req, error);

        return exceptionHandler(res, 1, error.message);
    }
};
const getUserPaymentOnlineTransactionServiceController = async (req: Request, res: Response) => {
    try {
        let requestQuery = req.query;
        // #swagger.tags = ['Master-Get']
        // #swagger.description = 'Pass state_id to see list of cities'

        /*#swagger.parameters[ {
                            "name": "userId",
                            "in": "query",
                            "description": "userId=userid",
                            "required": true,
                            "type": "string"
                        }] 
            } */
        if (CommonMessage.IsValid(requestQuery.userId) == false) {
            return RequestResponse.success(res, 'Please enter valid user id ', status.error, []);
        }
        const Data: any = await userGetServices.getUserPaymentOnlineTransactionService(requestQuery);
        //   console.log('check Data iuu',Data.rows)
        let paymentData: any = [];
        if (Data.rowCount > 0) {
            for (let row of Data.rows) {
                paymentData.push({
                    userId: row.user_id,
                    userName: row.user_name,
                    mobile: row.mobile,
                    amount: row.amount,
                    currency: row.currency,
                    status: row.status,
                    orderId: row.order_id,
                    // wallet : row.wallet,
                    email: row.email,
                    createdAt: row.created_at,
                    createdOnDate: row.createdon_date,
                    updatedOnDate: row.updatedon_date,
                    onlinePaymentStatusEnumId: row.online_payment_status_enum_id,
                    onlinePaymentStatus: row.online_payment_status
                });
            }

            return RequestResponse.success(res, apiMessage.cityList, status.success, paymentData);
        } else {
            return RequestResponse.success(res, apiMessage.dataNotAvailable, status.info, []);
        }
    } catch (error: any) {
        AddExceptionIntoDB(req, error);
        return exceptionHandler(res, 1, error.message);
    }
};

const CheckPaymentOrderDetailByOrderIdOnlyOrderIsCheck = async (req: Request, res: Response) => {
    try {
        let result: any;
        let querystring = req.query;
        let orderId: any = { id: querystring.order_id };

        let resultOrder: any = await payment.getPaymentTransactionByOrderIdOnlyOrderDetail(orderId);

        console.log('check result data', resultOrder.length);

        console.log('check result data status:', resultOrder.status);
        let checkLength: any = isObjectEmpty(resultOrder);
        console.log('check checkLength ', checkLength);
        if (checkLength == false) {
            // console.log('check data resultOrder.items',resultOrder.items)
            return RequestResponse.success(res, apiMessage.success, status.success, resultOrder);
        }
        return RequestResponse.success(res, apiMessage.success, status.success, []);
    } catch (error: any) {
        AddExceptionIntoDB(req, error);

        return exceptionHandler(res, 1, error.message);
    }
};

export default {
    paymentOrderController,
    verifyPaymentController,
    getAllPaymentsController,
    payoutController,
    addAmountToUserWallet,
    payExtraChargesController,
    paymentTransactionDetails,
    verifyWebhooksSecret,
    addAmountToUserWalletByAdmin,

    addDepositAmountToUserWalletByAdmin,
    addDepositAmountToUserWalletToApp,

    addUserRechargeAmount,
    aadUserRechargeAmountByAdmin,
    cancelWithdrawRequestFromUserController,
    addAppVersionDetail,
    getVersionHistoryController,
    addDepositAndRechargeAmountToUserWalletToApp,
    updateAppVersionDetail,
    getVersionCurrentController,
    gatPaymentOrderDetail,
    CheckPaymentOrderDetailByOrderId,
    getUserPaymentOnlineTransactionServiceController,
    CheckPaymentOrderDetailByOrderIdOnlyOrderIsCheck
};
