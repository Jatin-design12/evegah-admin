
import { NextFunction, Request, Response } from 'express';
import { apiMessage } from '../helper/api-message';
class WalletAmount{
    constructor () {}
 IsValidAmount  (receivedAmount: any, extraCharges: any) 
 {   

   
    let returnAmount :any = [];
    returnAmount.notvalid= false ;
    
    if (!receivedAmount || receivedAmount <= 0 ||  receivedAmount==undefined ||receivedAmount==null) 
     {
        returnAmount.notvalid=true;
        return returnAmount;
    }

   


   if( Number(receivedAmount)  <= Number(extraCharges))
       {        
        returnAmount.extraChargesAdminTbl = Number(receivedAmount); 
        returnAmount.amount =0;            
       } 
   else 
       {     
        returnAmount.extraChargesAdminTbl =  Number(extraCharges); 
        (returnAmount.amount) = Number(receivedAmount)-  Number(extraCharges);
      }       
      returnAmount.walletAmount = returnAmount.amount;
      returnAmount.extraCharges =  returnAmount.extraChargesAdminTbl;
      returnAmount.hiringCharges=null;
      returnAmount.fromRideTime=null;
      returnAmount.toRideTime=null;
      returnAmount.rideBookingMinutes=null;
      returnAmount.withdrawnId=0;
      returnAmount.rideBookingId=0;

      return returnAmount ;
  
}



trasactionParameter (requestPerm: any) 
{
    requestPerm.hiringCharges=null;
    requestPerm.fromRideTime=null;
    requestPerm.toRideTime=null;
    requestPerm.rideBookingMinutes=null;
    requestPerm.withdrawnId=0;
    requestPerm.rideBookingId=0;
   return requestPerm
}

}

export default new WalletAmount();