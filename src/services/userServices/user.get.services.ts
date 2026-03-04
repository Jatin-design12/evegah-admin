import { client } from '../../Config/db.connection';
import { DB_CONFIGS } from '../../Config/db.queries';
import { getUTCdate } from '../../helper/datetime';
import moment, { utc } from 'moment';
import { AddExceptionIntoDB } from '../../helper/responseHandler';
import  CommonMessage  from '../../helper/common.validation';
class GetUserServices {
    constructor() {}

    async getUserDetails(user: any) {
        let query: any = {
            text: DB_CONFIGS.customerQueries.getUser(),
            values: [user.id, user.statusEnumId, user.updatedSince || null]
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

    async getUserIdByEmailId(user: any) {
        let query: any = {
            text: DB_CONFIGS.customerQueries.getUserIdByEmailId(),
            values: [user.email]
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

    async getUserIdByPhoneNumber(user: any) {
        let query: any = {
            text: DB_CONFIGS.customerQueries.getUserIdByPhoneNumber(),
            values: [user.contact]
        };
      //  console.log('check user id query', query)
        return new Promise(async (resolve, reject) => {
            try {
                let result = await client.query(query);
                resolve(result);
            } catch (error) {
                reject(error);
            }
        });
    }

    async getUserTransactionByUserId(user: any) {
        let query: any = {
            text: DB_CONFIGS.customerQueries.getTransactionDetailsByUserId(),
            values: [user.id]
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

    async getWithdrawRequestFromUser(user: any) {
        let actionOnDate = getUTCdate();
        let query: any = { text: DB_CONFIGS.customerQueries.userMakeWithdrawRequest(), values: [user.id, user.amount, actionOnDate,user.withdrawNo ,
            actionOnDate,//.withdrawDate
            user.id] };
           // console.log('check quary getWithdrawRequestFromUser',query)
        return new Promise(async (resolve, reject) => {
            try {
                let result = await client.query(query);
                resolve(result);
            } catch (error) {
                reject(error);
            }
        });
    }
    async payExtraCharges(user: any) {
        let actionOnDate = getUTCdate();
        let query: any = { text: DB_CONFIGS.customerQueries.payExtraCharges(), values: [user.extraCharges, actionOnDate, Number(user.id)] };

        return new Promise(async (resolve, reject) => {
            try {
                let result = await client.query(query);
                resolve(result);
            } catch (error) {
                reject(error);
            }
        });
    }
    async addAmountInWalletAndSubtractExtraCharges(user: any) {
        let actionOnDate = getUTCdate();
        let query: any = { text: DB_CONFIGS.customerQueries.addAmountInWalletAndSubtractExtraCharges(), values: [actionOnDate, Number(user.id), user.extraChargesAdminTbl, user.amount] };

        return new Promise(async (resolve, reject) => {
            try {
                let result = await client.query(query);
                resolve(result);
            } catch (error) {
                reject(error);
            }
        });
    }

   
    
    
    async insertUserAllTransactionDetails(userDetails: any) {
        let actionOnDate = getUTCdate();
        userDetails.fromRideTime =actionOnDate ;

        userDetails.toRideTime = moment(userDetails.fromRideTime).add(  userDetails.rideBookingMinutes, 'm').toDate();
        
      
        if(CommonMessage.IsValid(userDetails.transaction_from_enum_id)==false  )
            {
                userDetails.transaction_from_enum_id='115'// transaction from api
            }
    

        let query: any = {
            text: DB_CONFIGS.userTransaction.insertUserTransactionDetails(),
            values: [
                userDetails.id,
                userDetails.paymentTransactionId,
                userDetails.transactionType,
                userDetails.walletAmount,
                userDetails.extraCharges,
                userDetails.hiringCharges,        
                userDetails.withdrawnId,
                actionOnDate,
                userDetails.rideBookingId,
                userDetails.currentWalletAmount,
                userDetails.remarkss,  
                userDetails.amountAddedByUserId   ,
                userDetails.depositAmount,
                userDetails.rechargeAmount  ,
                userDetails.transaction_from_enum_id      
                // userDetails.withdrawNo ,
                // actionOnDate,//.withdrawDate
                // userDetails.id //created_user_id

            ] 
        };


       // console.log('check user transcation detail', query)

        
        return new Promise(async (resolve, reject) => {
            try {
                let result = await client.query(query);
                resolve(result);
            } catch (error) {
                reject(error);
            }
        });
    }
    async updateUserLanguage(userDetails: any) {
        let query: any = {
            text: DB_CONFIGS.customerQueries.updateUserLanguage(),
            values: [userDetails.userAppLanguageId, userDetails.id]
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

    async subWalletAmount(user: any) {
        let query: any = {
            text: DB_CONFIGS.rideBooking.subWalletAmount(),
            values: [user.amount,user.id]
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


    async subDepositAmount(user: any) {
        let query: any = {
            text: DB_CONFIGS.rideBooking.subDepositAmount(),
            values: [user.amount,user.id]
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
    
    
    async addDepositAmountFromWithdrawRequestCancel(user: any) {
        let query: any = {
            text: DB_CONFIGS.rideBooking.addDepositAmountFromWithdrawRequestCancel(),
            values: [user.amount,user.id]
        };
        
      //  console.log('check quary getWithdrawRequestFromUser',query)
        return new Promise(async (resolve, reject) => {
            try {
                let result = await client.query(query);
                resolve(result);
            } catch (error) {
                reject(error);
            }
        });
    }

    async getTransactionExitOrNot(user: any) {        
        let query: any = { text: DB_CONFIGS.userTransaction.getTransactionExitOrNot(), values: [user.paymentTransactionId] };
        //console.log('check undefinded getTransactionExitOrNot',query)
        return new Promise(async (resolve, reject) => {
            try {
                let result = await client.query(query);
                resolve(result);
            } catch (error) {
                reject(error);
            }
        });
    }

    async getUserTransaction(user: any) {
        
        let query: any = { text: DB_CONFIGS.userTransaction.getUserTransaction(), values: [user.paymentTransactionId] };
    //console.log('check payment transtion user tbl query',query)
        
        return new Promise(async (resolve, reject) => {
            try {
                let result = await client.query(query);
                resolve(result);
            } catch (error) {
                reject(error);
            }
        });
    }


    async paymentSeetulled(payment: any) {

        
        let query: any = {
            text: DB_CONFIGS.userTransaction.paymentSettulled(),
            values: [payment.paymentTransactionId,payment.paymentOrderNo]
        };
    //  console.log('check settulled stus paymentSeetulled', query)
        return new Promise(async (resolve, reject) => {
            try {
                let result = await client.query(query);
                resolve(result);
            } catch (error) {
                reject(error);
            }
        });
    }

    async paymentFromSchedulerSettulled(payment: any) {
        let query: any = {
            text: DB_CONFIGS.userTransaction.paymentFromSchedulerSettulled(),
            values: [payment.customUniqueIdforUPPFDB]
        };
      console.log('check settulled stus paymentSeetulled', query)
        return new Promise(async (resolve, reject) => {
            try {
                let result = await client.query(query);
                resolve(result);
            } catch (error) {
                reject(error);
            }
        });
    }

    


    

    async addRechargeAmount(user: any) {
        let actionOnDate = getUTCdate();
             let query: any = { text: DB_CONFIGS.customerQueries.addRechargeAmount(), values: [actionOnDate, Number(user.id), user.amount] };

            // console.log('check recharge amount query', query);
        return new Promise(async (resolve, reject) => {
            try {
                let result = await client.query(query);
                resolve(result);
            } catch (error) {
                reject(error);
            }
        });
    }

    async addDepositAmount(user: any) {
        let actionOnDate = getUTCdate();
        let query: any = { text: DB_CONFIGS.customerQueries.addDepositAmount(), values: [actionOnDate, Number(user.id), user.extraChargesAdminTbl, user.amount] };

      //  console.log('check deposit amount query', query)
        return new Promise(async (resolve, reject) => {
            try {
                let result = await client.query(query);
                resolve(result);
            } catch (error) {
                reject(error);
            }
        });
    }


    async addDepositRechargeAmount(user: any) {
        let actionOnDate = getUTCdate();
        console.log('check deposit aamount',user)
        let query: any = { text: DB_CONFIGS.customerQueries.addDepositRechargeAmount(), values: [actionOnDate, Number(user.id), user.rechargeAmount, user.depositAmount] };

        console.log('check deposit amount query', query)
        return new Promise(async (resolve, reject) => {
            try {
                let result = await client.query(query);
                resolve(result);
            } catch (error) {
                reject(error);
            }
        });
    }
    

    async getUserPaymentOnlineTransactionService(user: any) {
        let query: any = {
            text: DB_CONFIGS.userTransaction.getUserPaymentOnlineTransaction(),
            values: [user.userId]
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
    
}

export default new GetUserServices();
