import { client } from '../../Config/db.connection';
import { DB_CONFIGS } from '../../Config/db.queries';
import { getUTCdate } from '../../helper/datetime';
import config from '../../Config/config';
import logger from '../../Config/logging';
import { AddExceptionIntoDB } from '../../helper/responseHandler';

import axios from 'axios';
const Razorpay = require('razorpay');

let instance = new Razorpay({ key_id: config.razorPay.key, key_secret: config.razorPay.SECRET_KEY });

class Payment {
    constructor() {}

    async insertPaymentTransaction(paymentDetails: any) {
        let actionOnDate = getUTCdate();

        let created_at = new Date(paymentDetails.created_at * 1000);
        // let check_create_at_date = new Date(paymentDetails.created_at * 1000);

        let amount = paymentDetails.amount / 100;
        let query: any = {
            text: DB_CONFIGS.payment.insertPaymentTransaction(),
            values: [
                paymentDetails.user_id,
                paymentDetails.id, //paymentid,
                paymentDetails.entity,
                amount,
                paymentDetails.currency,
                paymentDetails.status,
                paymentDetails.order_id,
                paymentDetails.invoice_id,
                paymentDetails.international,
                paymentDetails.method,
                paymentDetails.amount_refunded,
                paymentDetails.refund_status,
                paymentDetails.captured,
                paymentDetails.description,
                paymentDetails.card_id,
                paymentDetails.bank,
                paymentDetails.wallet,
                paymentDetails.vpa,
                paymentDetails.email,
                paymentDetails.contact,
                paymentDetails.notes,
                paymentDetails.fee,
                paymentDetails.tax,
                paymentDetails.error_code,
                paymentDetails.error_description,
                paymentDetails.error_source,
                paymentDetails.error_step,
                paymentDetails.error_reason,
                paymentDetails.acquirer_data,
                created_at,
                actionOnDate,
                paymentDetails?.card,
                paymentDetails?.event,
                paymentDetails.online_payment_status_enumid,
                paymentDetails.createdbyLoginUserId,
                paymentDetails.paymentOrderNo
            ]
        };

        return new Promise(async (resolve, reject) => {
            try {
                let result = await client.query(query);
                resolve(result);
            } catch (error) {
                reject(error);
            }
        });
    }

    async getPaymentTransactionIdService(orderId: any) {
        let actionOnDate = getUTCdate();
        if (orderId.receipt == undefined) {
            orderId.receipt = '';
        }
        let query: any = { text: DB_CONFIGS.payment.getPaymentTransactionId(), values: [orderId.order_id, orderId.receipt] };
        // console.log('check query', query)
        return new Promise(async (resolve, reject) => {
            try {
                let result = await client.query(query);
                resolve(result);
            } catch (error) {
                reject(error);
            }
        });
    }
    //  check and payment

    async getPaymentTransaction(paymentDetails: any) {
        return new Promise(async (resolve, reject) => {
            try {
                if (paymentDetails.paymentId) {
                    let result = await instance.payments.fetch(paymentDetails.paymentId);

                    resolve(result);
                } else {
                    instance.payments
                        .all({
                            from: paymentDetails.fromDate, //'2016-08-01',
                            to: paymentDetails.toDate //'2016-08-20'
                        })
                        .then((result: any) => {
                            resolve(result);
                            // handle success
                        })
                        .catch((error: any) => {
                            logger.error(error);
                            // handle error
                        });
                }
            } catch (error) {
                reject(error);
            }
        });
    }

    async getPaymentTransactionByOrderId(paymentDetails: any) {
        // console.log('check result paymentDetails',paymentDetails)
        return new Promise(async (resolve, reject) => {
            try {
                if (paymentDetails.id) {
                    //  console.log('check result paymeter',paymentDetails)
                    let result = await instance.orders.fetchPayments(paymentDetails.id);
                    //    console.log('check result apiResponse',result)
                    resolve(result);
                } else {
                    instance.payments
                        .all({
                            from: paymentDetails.fromDate, //'2016-08-01',
                            to: paymentDetails.toDate //'2016-08-20'
                        })
                        .then((result: any) => {
                            resolve(result);
                            // handle success
                        })
                        .catch((error: any) => {
                            logger.error(error);
                            reject(error);
                            // handle error
                        });
                }
            } catch (error) {
                reject(error);
            }
        });
    }

    //     async getPaymentTransactionByOrderId(paymentDetails: any) {
    //         return new Promise((resolve, reject) => {
    //              instance.payments.fetch(paymentDetails.paymentId);

    //             // resolve(result);
    // console.log('check result for' ,paymentDetails)
    //             axios.get('https://api.razorpay.com/v1/orders/' + paymentDetails.id, {
    //                 headers: {
    //                     'api-key':config.razorPay.key
    //                 },

    //             }
    //             ).then(function(result) {
    //                 console.log('check result for order' ,result)
    //                 resolve(result);
    //              } ).catch((error) => {
    //                 console.log('check result error')
    //                 logger.error(error);

    //                resolve(error.response);

    //             });
    //         });

    //         }

    // async getPaymentTransactionByOrderId(paymentDetails: any) {
    //     return new Promise(async (resolve, reject) => {
    //         try {
    //             if (paymentDetails.orderId) {
    //                 console.log('start')
    //                 let apiResponse :any = await axios.get('https://api.razorpay.com/v1/orders/' + paymentDetails.orderId, {
    //                     headers: {
    //                         'x-api-key': config.razorPay.key
    //                     }}
    //                    );

    //                    console.log('',apiResponse)
    //                 resolve(apiResponse);
    //             }
    //         } catch (error) {

    //             reject(error);
    //         }
    //     });
    // }

    // async getPaymentTransaction(paymentDetails: any) {
    //     return new Promise(async (resolve, reject) => {
    //         try {
    //             if (paymentDetails.paymentId) {
    //                 console.log('check paymentDetails.paymentId',paymentDetails.paymentId)
    //                 let result = await instance.payments.fetch(paymentDetails.paymentId);
    //                 console.log('checkifashfjah',result)
    //                 resolve(result);
    //             } else {
    //                 instance.payments
    //                     .all({
    //                         from: paymentDetails.fromDate, //'2016-08-01',
    //                         to: paymentDetails.toDate //'2016-08-20'
    //                     })
    //                     .then((result: any) => {
    //                         resolve(result);
    //                         // handle success
    //                     })
    //                     .catch((error: any) => {
    //                         logger.error(error);
    //                         // handle error
    //                     });
    //             }
    //         } catch (error) {
    //             reject(error);
    //         }
    //     });
    // }

    async insertWithdrawTransaction(withdrawDetails: any) {
        let actionOnDate = getUTCdate();
        withdrawDetails.fund_account = withdrawDetails.fund_account.bank_account;
        withdrawDetails.account_type = withdrawDetails.fund_account.account_type;
        withdrawDetails.contact = withdrawDetails.fund_account.contact;
        let query: any = {
            text: DB_CONFIGS.payment.insertWithdrawTransaction(),
            values: [
                withdrawDetails.id,
                withdrawDetails.account_number,
                withdrawDetails.amount,
                withdrawDetails.currency,
                withdrawDetails.mode,
                withdrawDetails.purpose,
                withdrawDetails.fund_account,
                withdrawDetails.account_type,
                withdrawDetails.contact,
                withdrawDetails.queue_if_low_balance,
                withdrawDetails.reference_id,
                withdrawDetails.narration,
                withdrawDetails.notes,
                withdrawDetails.created_at,
                actionOnDate
            ]
        };
        return new Promise(async (resolve, reject) => {
            try {
                let result = await client.query(query);
                resolve(result);
            } catch (error) {
                reject(error);
            }
        });
    }

    // async webhooksResponseForPaymentTransaction(webhooksResponse: any) {
    //     let actionOnDate = getUTCdate();
    //     let query: any = {
    //        text: DB_CONFIGS.payment.webhooksResponseForPaymentTransaction(),
    //         values: [webhooksResponse.details, actionOnDate]
    //     };
    //     return new Promise(async (resolve, reject) => {
    //         try {
    //             let result = await client.query(query);
    //             resolve(result);
    //         } catch (error) {
    //             reject(error);
    //         }
    //     });
    // }

    async addUpdatewalletAmount(user: any) {
        let actionOnDate = getUTCdate();
        let query: any = { text: DB_CONFIGS.customerQueries.userMakeWithdrawRequest(), values: [user.id, user.amount, actionOnDate] };
        return new Promise(async (resolve, reject) => {
            try {
                let result = await client.query(query);
                resolve(result);
            } catch (error) {
                reject(error);
            }
        });
    }

    async insertPaymentTransactionByOrder(paymentDetails: any) {
        console.log('check order detil  vlues', paymentDetails);
        let actionOnDate = getUTCdate();

        let created_at = new Date(paymentDetails.created_at * 1000);
        // let check_create_at_date = new Date(paymentDetails.created_at * 1000);

        let amount = paymentDetails.amount / 100;
        let query: any = {
            text: DB_CONFIGS.payment.insertPaymentTransactionByOrderApi(),
            values: [
                paymentDetails.user_id,
                paymentDetails.entity,
                amount,

                paymentDetails.currency,
                paymentDetails.status,
                paymentDetails.order_id,

                paymentDetails.email,
                paymentDetails.contact,
                created_at,
                actionOnDate,
                paymentDetails.online_payment_status_enumid,
                paymentDetails.receipt,

                paymentDetails.createdbyLoginUserId,
                paymentDetails.paymentOrderNo,
                paymentDetails.remarks,

                paymentDetails.error_code,
                paymentDetails.error_description,
                paymentDetails.error_source,
                paymentDetails.error_step,
                paymentDetails.error_reason,
                paymentDetails.order_response_json
            ]
        };

        console.log('check api order insert q', query);

        return new Promise(async (resolve, reject) => {
            try {
                let result = await client.query(query);
                resolve(result);
            } catch (error) {
                reject(error);
            }
        });
    }

    async updatePaymentTransaction(paymentDetails: any) {
        let actionOnDate = getUTCdate();
        // console.log('check bodyRequestData.paymentPrimaryKeyIdFromDB',paymentDetails)
        let created_at = new Date(paymentDetails.created_at * 1000);
        // let check_create_at_date = new Date(paymentDetails.created_at * 1000);

        let amount = paymentDetails.amount / 100;
        let query: any = {
            text: DB_CONFIGS.payment.UPaymentTransactionFromVerifyController(),
            values: [
                paymentDetails.paymentPrimaryKeyIdFromDB,
                paymentDetails.user_id,
                paymentDetails.id, //paymentid,

                paymentDetails.entity,
                paymentDetails.remarks,
                paymentDetails.currency,

                paymentDetails.status,
                paymentDetails.order_id,
                paymentDetails.invoice_id,

                paymentDetails.international,
                paymentDetails.method,
                paymentDetails.amount_refunded,

                paymentDetails.refund_status,
                paymentDetails.captured,
                paymentDetails.description,

                paymentDetails.card_id,
                paymentDetails.bank,
                paymentDetails.wallet,

                paymentDetails.vpa,
                paymentDetails.email,
                paymentDetails.contact,

                paymentDetails.notes,
                paymentDetails.fee,
                paymentDetails.tax,

                paymentDetails.error_code,
                paymentDetails.error_description,
                paymentDetails.error_source,

                paymentDetails.error_step,
                paymentDetails.error_reason,
                paymentDetails.acquirer_data,

                paymentDetails?.card,
                paymentDetails?.event,
                paymentDetails.online_payment_status_enumid,
                actionOnDate,
                paymentDetails.razapay_response_json,
                paymentDetails.razorpay_response_from_scheduler
            ]
        };
        //  console.log('check query result 1', query)

        return new Promise(async (resolve, reject) => {
            try {
                let result = await client.query(query);
                resolve(result);
            } catch (error) {
                reject(error);
            }
        });
    }
    async UPaymentTransactionFromVerifyFromOrderFailedService(paymentDetails: any) {
        let actionOnDate = getUTCdate();
        let query: any = {
            text: DB_CONFIGS.payment.UPaymentTransactionFromVerifyFromOrderFailedController(),
            values: [paymentDetails.paymentPrimaryKeyIdFromDB, paymentDetails.remarks, paymentDetails.online_payment_status_enumid, actionOnDate, paymentDetails.razorpay_response_from_scheduler]
        };
        // console.log('check query result 1', query)

        return new Promise(async (resolve, reject) => {
            try {
                let result = await client.query(query);
                //   console.log('check result UPaymentTransactionFromVerifyFromOrderFailedService 2',result)
                resolve(result);
            } catch (error) {
                //   console.log('check error UPaymentTransactionFromVerifyFromOrderFailedService 3',error)
                reject(error);
            }
        });
    }
    async getPaymentTransactionForUpdateDetailToServerService() {
        let actionOnDate = getUTCdate();
        let query: any = { text: DB_CONFIGS.payment.getPaymentTransactionForUpdateValueId() };
        // console.log('check query first ', query)
        return new Promise(async (resolve, reject) => {
            try {
                let result = await client.query(query);
                resolve(result);
            } catch (error) {
                reject(error);
            }
        });
    }

    async getPaymentTransactionIdAddPaymentService(orderId: any) {
        let actionOnDate = getUTCdate();
        if (orderId.receipt == undefined) {
            orderId.receipt = '';
        }
        let query: any = { text: DB_CONFIGS.payment.getPaymentTransactionIdAddPayment(), values: [orderId.order_id] };
        //  console.log('check query', query)
        return new Promise(async (resolve, reject) => {
            try {
                let result = await client.query(query);
                resolve(result);
            } catch (error) {
                reject(error);
            }
        });
    }

    async getPaymentTransactionByOrderIdOnlyOrderDetail(paymentDetails: any) {
        return new Promise(async (resolve, reject) => {
            try {
                if (paymentDetails.id) {
                    //    console.log('check result paymeter',paymentDetails)
                    let result = await instance.orders.fetch(paymentDetails.id);
                    //    console.log('check result apiResponse',result)
                    resolve(result);
                } else {
                    instance.payments
                        .all({
                            from: paymentDetails.fromDate, //'2016-08-01',
                            to: paymentDetails.toDate //'2016-08-20'
                        })
                        .then((result: any) => {
                            resolve(result);
                            // handle success
                        })
                        .catch((error: any) => {
                            logger.error(error);
                            reject(error);
                            // handle error
                        });
                }
            } catch (error) {
                reject(error);
            }
        });
    }
}

export default new Payment();
