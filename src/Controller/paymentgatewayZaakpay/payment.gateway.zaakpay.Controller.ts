import { NextFunction, Request, Response } from 'express';
let crypto = require('crypto');
import RequestResponse from '../../helper/responseClass';
import status from '../../helper/status';
import { apiMessage } from '../../helper/api-message';
import config from '../../Config/config';
import logger from '../../Config/logging';
import checksum from './lib/checksum'
import Payments from '../paymentgatewayZaakpay/paymentServices/payments.service';
import RideBooking from '../../services/rideBookingServices/ride.booking.services';
import  WalletAmount  from '../../helper/wallet.validation';
import GetUserServices from '../../services/userServices/user.get.services';
import  CommonMessage  from '../../helper/common.validation';
import { getTokenDetail } from '../../helper/common-function';
import {generateOrderNumber } from '../../helper/common-function';
import { exceptionHandler,AddExceptionIntoDB  } from '../../helper/responseHandler';
const transactionResponseController = async (req: Request, res: Response) => {
    try {
       
        var checksumstring = checksum.getResponseChecksumString(req.body);
        var calculatedchecksum = checksum.calculateChecksum(checksumstring);        
        var url= ''; // 'https://www.google.com';

         //'https://www.google.com'; // set client return url that is passed on payment/begintransaction api         
          req.body.create_user_id  ='0';
          if(CommonMessage.IsValid(req.body.product3Description)==true )
          {
            req.body.create_user_id  =req.body.product3Description  ;
          }
          
         
          if(CommonMessage.IsValid(req.body.orderId)==false )
          {
            return RequestResponse.success(res, apiMessage.orderNotFound, status.info, []);
          }

        if(req.body.responseCode=='100')// if 
        {
            req.body.zaakpay_payment_status_enum_id=38;// completed 
            req.body.payment_status_enum_id=33;//not Settled
        }
        else 
        {
            req.body.zaakpay_payment_status_enum_id=40;// failed
            req.body.payment_status_enum_id=34;//failed
        }
         
         
         let getTransactionsExit :any =  await Payments.getTransactionsExitOrNot(req.body);
         
         if(getTransactionsExit.rowCount>0)
         {
            return RequestResponse.success(res, apiMessage.paymentDone, status.info, []);
         }

         //requestQuery.

        let getClientUrl :any =  await Payments.getClientsUrl(req.body);
        
        if(getClientUrl.rowCount==0)
        {
           return RequestResponse.success(res, apiMessage.clientUrlNotFound, status.info, []);
        }

         let OrderType:any  ='P'
         req.body.paymentOrderNo = await generateOrderNumber(OrderType);

       

        let insertPaymentTransactionResult: any = await Payments.insertPaymentTransaction(req.body);
                       
        req.body.payment_transaction_id =insertPaymentTransactionResult.rows[0].id;
        let result: any = await Payments.updatePaymentGatwayTransaction(req.body); 
   
        url = '';// getClientUrl.rows[0].client_return_url;
      

        if(req.body.responseCode=='100')
        {      
            if( req.body.product2Description==27)// only for add wallet amount product2Description 
            {

                
          let result=  await addAmountToUserWallet(req.body,res,req);
          if(result==true){ 
          res.render('response', {
            data: req.body,
            url:url,
            isChecksumValid: (calculatedchecksum.toString()) === ((req.body.checksum).toString())
        });                
        res.end();
           }
        }

           
        }
        else 
        {
            res.render('response', {
                data: req.body,
                url:url,
                isChecksumValid: (calculatedchecksum.toString()) === ((req.body.checksum).toString())
            });                
            res.end();
        }
       

       
    } 
    catch (error: any) {
        AddExceptionIntoDB(req,error);
       return exceptionHandler(res, 1, error.message);
    }
};

const checkTransactionStatusController = async (req: Request, res: Response) => {
    try {
        /*
           orderId 
           access Token
           client return url
           mode (optional parameter)
        */
        //    res.render('test'); 
        //    return ;
        var json_data = {
            'merchantIdentifier': config.zaakPaymentConfigKeys.ZAAKPAY_MERCHANTKEY,
            'mode': '0', //req.query.mode,
            'orderDetail': {
              'orderId': req.query.orderId
            }
          }

          
          var json_string=JSON.stringify(json_data);
         
          var calculatedchecksum = checksum.calculateChecksum(json_string).toString();
       
          var url = config.zaakPaymentConfigKeys.ZAAKPAY_CHECKSTATUSAPI;

          let clienturl= 'https://www.microsoft.com/en-in';
                
          res.render('checktxn', {
                data: json_data,
                checksum: calculatedchecksum,
                url: url,
                clienturl:clienturl
            });
       
        res.end();
    } 
    catch (error: any) {
        AddExceptionIntoDB(req,error);
        return exceptionHandler(res, 1, error.message);
    }
};

const refundTransactionController = async (req: Request, res: Response) => {
    try {
         /*
           orderId 
           amount
           updateDesired -- Full Refund /Partial Refund
           access Token
           client return url
        */       
       
        var ref_json={
            "merchantIdentifier":config.zaakPaymentConfigKeys.ZAAKPAY_MERCHANTKEY,
            "orderDetail":{
               "orderId":req.query.orderId,
               "amount":req.query.amount,
            },
            "mode": '0' ,//req.query.mode,
            "updateDesired":req.query.updateDesired,
            "updateReason":req.query.updateReason
         }
         
         var fin_json=JSON.stringify(ref_json);
       
           var calculatedchecksum = checksum.calculateChecksum(fin_json).toString();
           var url = config.zaakPaymentConfigKeys.ZAAKPAY_UPDATEAPI;
                 
           res.render('refundtxn', {
               data: ref_json,
               checksum: calculatedchecksum,
               url: url
           });
           res.end();
    } 
    catch (error: any) {
        AddExceptionIntoDB(req,error);
        return exceptionHandler(res, 1, error.message);
    }
};

const  paymentTransactionController = async (req: Request, res: Response) => {
    try {
     
        let requestQuery = req.query;
        
        
        if(CommonMessage.IsValid(requestQuery.user_id)==false )
        {
            
            return RequestResponse.success(res, apiMessage.userId, status.info, []);
        }
               
        if(CommonMessage.IsValid(requestQuery.amount)==false )
        {
            return RequestResponse.success(res, apiMessage.amount, status.info, []);
        }

        if((requestQuery.amount)=='0' )
        {
            return RequestResponse.success(res, apiMessage.amount, status.info, []);
        }

        if(CommonMessage.IsValid(requestQuery.payment_transction_type_enum_id)==false || requestQuery.payment_transction_type_enum_id != '27'  )
        {
            return RequestResponse.success(res, apiMessage.paymentTransactionsType, status.info, []);
        }

        if(CommonMessage.IsValid(requestQuery.create_user_id)==false ||  requestQuery.create_user_id=='0')
        {
            return RequestResponse.success(res, apiMessage.createdUser, status.info, []);
        }
        
        if(CommonMessage.IsValid(requestQuery.client_return_url)==false)
        {
            return RequestResponse.success(res, apiMessage.clientUrl, status.info, []);
        }

      
        
        if(CommonMessage.IsValid(requestQuery.access_token)==false)
        {
            return RequestResponse.success(res, apiMessage.validTokane, status.info, []);
        }
        
        let getVerifyT : any = await getTokenDetail(requestQuery.access_token);

        if(requestQuery.user_id != getVerifyT.id)
        {
            return RequestResponse.success(res, apiMessage.validTokane, status.info, []);
        }

         let orderno = crypto.randomBytes(8).toString('hex') +''+ String(new Date().getTime());       

        requestQuery.order_id=orderno;
        requestQuery.zaakpay_payment_status_enum_id = '39';//for proccessing payment  
        requestQuery.status_enum_id ='1';

        let amount : any = requestQuery.amount;


        
        
        let getUsersEmailId : any = await Payments.getUserEmailIdService(requestQuery);
        if(getUsersEmailId.rowcount ==0 || CommonMessage.IsValid(getUsersEmailId.rows[0].emailid)==false )
        {
            return RequestResponse.success(res, apiMessage.emailNotExist, status.info, []);
        }
                      
        let result: any = await Payments.insertPaymentGatwayTransaction(requestQuery);  
        
                 
        let paymentId:any = result.rows[0].id;
        

     let dataval:any = {
        merchantIdentifier:config.zaakPaymentConfigKeys.ZAAKPAY_MERCHANTKEY,
        amount: (amount*100).toFixed(0),
        orderId :orderno,
        buyerEmail:getUsersEmailId.rows[0].emailid,                
        returnUrl :config.zaakPaymentConfigKeys.ZAAKPAY_RESPONSEURL,
        currency:'INR',
        productDescription:paymentId,// it used for payment id
        product1Description : requestQuery.user_id,// product1Description = userid 
        product2Description : requestQuery.payment_transction_type_enum_id,// this is used for add wallet amount in response controller,
        product3Description : requestQuery.create_user_id,
        

        }
       
       
        var checksumstring = checksum.getChecksumString(dataval);
        var calculatedchecksum = checksum.calculateChecksum(checksumstring);
        var url = config.zaakPaymentConfigKeys.ZAAKPAY_TRANSACTAPI;

       

       res.render('transact', {
              data: dataval,
              checksum: calculatedchecksum,
              checksumstring: checksumstring,
              url:url
          });
        
        res.end();
    } 
    catch (error: any) {
        AddExceptionIntoDB(req,error);
        return exceptionHandler(res, 1, error.message);
    }
};


async function  addAmountToUserWallet ( requestBody :any, res: Response, req :any)  {
    
    try {               
        let result: any;
        let walletAmount:any;
        requestBody.id= requestBody.product1Description;
        
        requestBody.paymentTransactionId = requestBody.payment_transaction_id;      
      walletAmount = await RideBooking.getWalletAmountByUserId(requestBody);
       
       let extra_charges = Number(walletAmount.rows[0].extra_charges)
      let   getTransaction :any = await GetUserServices.getTransactionExitOrNot(requestBody);
      
      if (getTransaction.rowCount <=0) 
      { 
         RequestResponse.success(res, apiMessage.notPayment, status.success, []);  
         return   false;     
      } 
     let  getUserTransaction :any = await GetUserServices.getUserTransaction(requestBody);

    // console.log('check getUserTransaction',getUserTransaction)

     if (getUserTransaction.rowCount > 0) 
      {
    
          RequestResponse.success(res, apiMessage.paymentDone, status.success, []);
          return   false;
     } 

     
           let paymentStatusEnumId : any  = getTransaction.rows[0].online_payment_status_enum_id;    

         if(paymentStatusEnumId == 32)
         {
             RequestResponse.success(res, apiMessage.paymentDone, status.success, []);
             return   false;
         }

         if(paymentStatusEnumId == 34)
         {
             RequestResponse.success(res, apiMessage.PaymentFailed, status.success, []);
             return   false;
         }
         
         requestBody.paymentEnumId = 32;
         Number(requestBody.amount)
        let ValidAmount =WalletAmount.IsValidAmount( Number(requestBody.amount)/100,extra_charges);

        if (ValidAmount.notvalid==true)        
        {  
             RequestResponse.validationError(res, apiMessage.VaidAmount, status.error, []); 
             return   false;
        }
        
        ValidAmount.id = requestBody.id;
        ValidAmount.paymentTransactionId = requestBody.paymentTransactionId;
        ValidAmount.transactionType = 27;   
        ValidAmount.currentWalletAmount = walletAmount.rows[0].min_wallet_amount;
        ValidAmount.extraCharges=walletAmount.rows[0].extra_charges;
        ValidAmount.paymentOrderNo =requestBody.paymentOrderNo
        ValidAmount.depositAmount='0',
        ValidAmount.rechargeAmount =ValidAmount.walletAmount    
        result = await GetUserServices.addAmountInWalletAndSubtractExtraCharges(ValidAmount);

         if (result.rowCount < 0) 
         {       
             RequestResponse.success(res, apiMessage.noDataFound, status.success, []);
             return   false;
        } 
        else 
        {
            result = await GetUserServices.insertUserAllTransactionDetails(ValidAmount);                          
          if (result.rowCount > 0)
          {           
          await GetUserServices.paymentSeetulled(ValidAmount); 
            return   true;
          }
          else 
          {
             RequestResponse.success(res, apiMessage.notAdd, status.success, []);
             return false;
          }
        }
    } catch (error: any) {
        AddExceptionIntoDB(req,error);
         exceptionHandler(res, 1, error.message);
         return false;
    }
};


const testEJSFile = async (req: Request, res: Response) => {
    try {
       
        res.render('test');

       // return RequestResponse.success(res, apiMessage.success, status.success, []);
    } catch (error: any) {
        AddExceptionIntoDB(req,error);
        return exceptionHandler(res, 1, error.message);
    }
};


export default {
    paymentTransactionController,transactionResponseController,checkTransactionStatusController,refundTransactionController,
    testEJSFile
};