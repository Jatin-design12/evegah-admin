import { client } from '../../../Config/db.connection';
import { DB_CONFIGS } from '../../paymentgatewayZaakpay/dbqueries/db.paymentqueries';
import { getUTCdate } from '../../../helper/datetime';

class Payments {
    constructor() {}

    async insertPaymentGatwayTransaction(paymentDetails: any) {
        let actionOnDate = getUTCdate();

        // let clientReturnUrl='set with FE work';
        let query: any = {
            text: DB_CONFIGS.paymentQueries.insertPaymentPatewayTransction(),
            values: [
                paymentDetails.user_id,
                paymentDetails.order_id,
                paymentDetails.amount,
                paymentDetails.payment_transction_type_enum_id,
                paymentDetails.zaakpay_payment_status_enum_id,
                paymentDetails.status_enum_id,
                actionOnDate,
                paymentDetails.client_return_url,
                paymentDetails.create_user_id
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

    async getUserEmailIdService(data: any) {
        let query: any = {
            text: DB_CONFIGS.paymentQueries.getUserEmailId(),
            values: [data.user_id]
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

    async updatePaymentGatwayTransaction(paymentDetails: any) {
        //paymentDetails.payment_status_enum_id=32;// for Settled payment success
        let actionOnDate = getUTCdate();

        let query: any = {
            text: DB_CONFIGS.paymentQueries.updatePaymentPatewayTransction(),
            values: [
                paymentDetails,
                paymentDetails.zaakpay_payment_status_enum_id,
                actionOnDate,
                paymentDetails.productDescription,
                paymentDetails.payment_transaction_id,
                paymentDetails.create_user_id
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

    async insertPaymentTransaction(paymentDetails: any) {
        let actionOnDate = getUTCdate();
        let amount = paymentDetails.amount / 100;

        const zaakpayTrandate = new Date(paymentDetails.pgTransTime);

        //  let payment_status_enum_id ='32';
        let payment_gatway = 37; // for zaakpay
        let query: any = {
            text: DB_CONFIGS.paymentQueries.insertZaakPaymentTransaction(),
            values: [
                paymentDetails.product1Description,
                paymentDetails.productDescription,
                amount,

                paymentDetails.orderId,
                paymentDetails.responseCode,
                paymentDetails.responseDescription,

                paymentDetails.checksum,
                paymentDetails.doRedirect,
                paymentDetails.paymentMode,

                paymentDetails.cardId,
                paymentDetails.cardScheme,
                paymentDetails.cardToken,

                paymentDetails.bankid,
                paymentDetails.paymentMethod,
                paymentDetails.cardhashid,

                paymentDetails.productDescription,
                paymentDetails.product1Description,
                paymentDetails.product2Description,

                paymentDetails.product3Description,
                paymentDetails.product4Description,
                paymentDetails.pgTransId,
                zaakpayTrandate,

                paymentDetails.payment_status_enum_id,
                payment_gatway,
                paymentDetails.bank,
                paymentDetails.create_user_id,
                actionOnDate,
                zaakpayTrandate,
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

    async getTransactionsExitOrNot(user: any) {
        let query: any = { text: DB_CONFIGS.paymentQueries.getTransactions(), values: [user.orderId] };
        return new Promise(async (resolve, reject) => {
            try {
                let result = await client.query(query);
                resolve(result);
            } catch (error) {
                reject(error);
            }
        });
    }

    async getClientsUrl(user: any) {
        let query: any = { text: DB_CONFIGS.paymentQueries.getClientUrl(), values: [user.productDescription] };
        return new Promise(async (resolve, reject) => {
            try {
                let result = await client.query(query);
                resolve(result);
            } catch (error) {
                reject(error);
            }
        });
    }
}

export default new Payments();
