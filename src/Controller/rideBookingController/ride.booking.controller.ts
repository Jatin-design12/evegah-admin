import { Request, Response } from 'express';
const isValidCoordinates = require('is-valid-coordinates');
import { apiMessage } from '../../helper/api-message';

import { kClientName } from '../../constant/kritin-client-name';
import RequestResponse from '../../helper/responseClass';
import { exceptionHandler,AddExceptionIntoDB  } from '../../helper/responseHandler';
import status from '../../helper/status';
import RideBooking from '../../services/rideBookingServices/ride.booking.services';
import ProduceBike from '../../services/adminServices/admin.produceBike.services';
import payment from '../../services/paymentServices/payment.services';
import { client } from '../../Config/db.connection';
import { calculateMin,generateUniqueNumber,generateOrderNumber ,checkVaidLatLong} from '../../helper/common-function';
import { masterMessage } from '../../constant/master-constant';
import logger from '../../Config/logging';
import inwardServices from '../../services/inwardServices/inward.services';
import { rideBookingValidation } from '../../helper/ride.booking.validation';
import moment, { utc } from 'moment';
import { getUTCdate } from '../../helper/datetime';
import  CommonMessage  from '../../helper/common.validation';
import GetUserServices from '../../services/userServices/user.get.services';
import DashboardServices from '../../services/adminServices/admin.dashboard.services';
import AddLog from '../../services/adminServices/admin.logDeviceInformation.services';
import InwardServices from '../../services/inwardServices/inward.services';
import { instruction, instructionName ,disconectTime} from '../../constant/device-instruction';
import request from 'request';
import utcdate from '../../helper/utcdate';
import  Dateformats from '../../helper/utcdate';
import adminController from '../adminController/admin.controller';
import { setBeepOnInstructionCommon,setBeepOffInstructionCommon ,getAddressFromLatLong} from '../../helper/common-function';
import { fromDateTodateValidations } from '../../helper/common-function';
import axios from 'axios';
import inwardController from '../../Controller/inwardController/inward.controller';
import config from '../../Config/config';
import { CostExplorer } from 'aws-sdk';
let nodeSchedule = require('node-cron');

const rideBookingController = async (req: Request, res: Response) => {
    try {
        // check lagana h  bike booked h ya nhi 
        
        /* 	#swagger.tags = ['User-Payment']
              #swagger.description = 'Only user can add type all Parameter are mandatory in swagger for testing purpose' */

        /*	#swagger.parameters['obj'] = {
                    in: 'body',
                    description: 'ride booking.',
                    required: true,
                    schema: { $ref: "#/definitions/rideBookingController" }
            } */

        /* #swagger.security = [{
                    "apiKeyAuth": []
            }] */
         let actionOnDate = getUTCdate();                     
        let requestBody = req.body;
           

        
if(CommonMessage.IsValid(requestBody.id)==false  && CommonMessage.IsValid(requestBody.vehicleId)==false
&& CommonMessage.IsValid(requestBody.uId)==false &&   CommonMessage.IsValid(requestBody.lockId)==false  &&  CommonMessage.IsValid(requestBody.rideBookingMinutes)==false  
)
{
    return RequestResponse.validationError(res, 'some request parameter are missing.', status.error, []);
}
        let validation = await rideBookingValidation(requestBody);
        if (validation)
         {
         //   console.log('inside validation')
             RequestResponse.validationError(res, validation, status.error, []);
             return false;
        }
        
        requestBody.apiCallFun =  'rideStart';
        requestBody.fromRideTime= actionOnDate;   
       let rideStartResultDate:any= await rideBookingValidationsController(requestBody,res,req); 
    //   console.log('check i ride start controller ', rideStartResultDate); 
       return     rideStartResultDate;
    } catch (error: any) {
        AddExceptionIntoDB(req,error);

        return exceptionHandler(res, 1, error.message);
    }
};

const updateDetailsRideEndsController = async (req: Request, res: Response) => {
    let rollBack :any = true;
    try {
        /* 	#swagger.tags = ['User-Payment']
              #swagger.description = 'Only user can add type all Parameter are mandatory in swagger for testing purpose' */

        /*	#swagger.parameters['obj'] = {
                    in: 'body',
                    description: 'ride booking.',
                    required: true,
                    schema: { $ref: "#/definitions/updateDetailsRideEndsController" }
            } */

        /* #swagger.security = [{
                    "apiKeyAuth": []
            }] */
        let requestBody = req.body;
        let result: any;
        requestBody.actualRideTime = getUTCdate();
        requestBody.rideEndRemarks = requestBody.remarks
        
        if (  CommonMessage.IsValid(requestBody.id)==false && requestBody.id <= 0  ) {
            return RequestResponse.validationError(res, 'Please Enter Valid User Id', status.error, []);
        }

        if (  CommonMessage.IsValid(requestBody.endRideUserId)==false && requestBody.endRideUserId <= 0  ) {
            return RequestResponse.validationError(res, 'Please Enter Valid endRideUserId', status.error, []);
        }
         

        if (CommonMessage.IsValid(requestBody.rideBookingId)==false &&requestBody.rideBookingId <= 0) {
            return RequestResponse.validationError(res, 'Please Enter Valid Ride Booking Id', status.error, []);
        }
       
        requestBody.statusEnumId = 1;
        result = await RideBooking.getRideBookingDetailsForEndRide(requestBody);
        
        if (result.rowCount <= 0) 
        {
            return RequestResponse.validationError(res, 'this riding  is not found.', status.success, []);            
        }

        if (result.rows[0].bike_rideing_status != '16')// ride booking == 16
        {
            return RequestResponse.validationError(res, 'This Ride Is Already Ended By User?Admin.', status.success, []);
        }

        if (  CommonMessage.IsValid(requestBody.apiCallFun)==false ) {
            requestBody.apiCallFun =  'RideEnd';
        }
        requestBody.vehicleId =result.rows[0].vehicle_model_id ;
        requestBody.uId =result.rows[0].vehicle_uid_id;
        requestBody.lockId =result.rows[0].vehicle_lock_id;
        requestBody.bikeId    = result.rows[0].bike_id ;
        requestBody.fromRideTime = result.rows[0].from_ride_time ;
        requestBody.minimumHiringTime=   result.rows[0].minimum_hiring_time;
        requestBody.minimumRentRate = result.rows[0].minimum_rent_rate;
        requestBody.rideBookingNo=result.rows[0].ride_booking_no;  
        
        let LockDetailForRideStart: any = await RideBooking.getLockDetailForRideStart(requestBody);
        
        if (LockDetailForRideStart.rowCount <= 0) 
        {
            return RequestResponse.validationError(res, 'data not found', status.success, []);            
        }    
        requestBody.lockNumber=LockDetailForRideStart.rows[0].lock_number;  
        
        let rideStartAddress :any =await getAddressFromLatLong(LockDetailForRideStart.rows[0].latitude,LockDetailForRideStart.rows[0].longitude);   
      
        // LockDetailForRideStart.rows[0].speed ;
        requestBody.rideEndLatitude =LockDetailForRideStart.rows[0].latitude;
        requestBody.rideEndtLongitude =LockDetailForRideStart.rows[0].longitude;
        requestBody.rideStartZoneId = '05'
        requestBody.rideEndAddress= rideStartAddress;     
        requestBody.rideEndExternalBatteryVoltage =LockDetailForRideStart.rows[0].external_batt_v  ;
        requestBody.rideEndInternalBatteryVoltage  = LockDetailForRideStart.rows[0].internal_batt_v ;
        requestBody.rideEndBatteryPercentage = LockDetailForRideStart.rows[0].battery ;
        requestBody.light_off_count ='0'; 
        requestBody.device_lock_count='0'; 
        requestBody.lockStatusName = LockDetailForRideStart.rows[0].lock_status;
        requestBody.deviceLockAndUnlockStatus =   LockDetailForRideStart.rows[0].device_lock_and_unlock_status;
        requestBody.deveice_state_enum_id =   LockDetailForRideStart.rows[0].deveice_state_enum_id;
        requestBody.deveice_state = LockDetailForRideStart.rows[0].deveice_state;

               
        if(CommonMessage.IsValid(requestBody.rideEndtLongitude) ==true && CommonMessage.IsValid(requestBody.rideEndLatitude) ==true)
        {
            let vaidLatLongResult :any = await checkVaidLatLong(requestBody.rideEndLatitude,requestBody.rideEndtLongitude);                        
            if(vaidLatLongResult !='correct')
            {                     
                 return RequestResponse.validationError(res, 'incorrect LatLong.', status.success, []);
            }
        }
     
        
        if(LockDetailForRideStart.rows[0].device_light_status_enum_id =='41')// light on 
        {
            requestBody.light_off_count= '1';                      
        }
        if(LockDetailForRideStart.rows[0].device_lock_and_unlock_status =='1')// device lock
        {
            requestBody.device_lock_count= '1'; 
        }    
        
        let  ProduceBikeDetail: any = await ProduceBike.getBikeReservedUnReservedStatus(requestBody);
        if (ProduceBikeDetail.rowCount <= 0) 
        {
            
             RequestResponse.validationError(res, apiMessage.bikeNotFound, status.success, []);        
             return    
        }
        
          requestBody.bikeId = ProduceBikeDetail.rows[0].id;
          let modelName:any ='';
          modelName  = ProduceBikeDetail.rows[0].model_name
          requestBody.deviceId= result.rows[0].lock_number;
          requestBody.instructionId=  3;//instructionName[3]
          
         
          requestBody.device_lock_unlock_communication_enum_id = '93';

        if (result.rowCount <= 0)
        {
             RequestResponse.validationError(res, 'Current Ride Note Found', status.info, []);
             return
        }
        let bike = requestBody.bikeId;
      
        let bikeResult: any = await RideBooking.getBikeDetails({bike});
        
        if(bikeResult.rowCount <= 0) 
        {
             RequestResponse.validationError(res, apiMessage.bikeNotFound, status.success, []); 
             return           
        }

        
        if (bikeResult.rows[0].bike_booked_status === '14' && result.rows[0].bike_rideing_status != '16' ) 
        {
           RequestResponse.validationError(res, 'This Ride Is Already Ended By User/Admin.', status.success, []);  
           return 
        }

        requestBody.vehicleId         = bikeResult.rows[0].model_id;
        requestBody.uId               = bikeResult.rows[0].uid_id;
        requestBody.lockId            = bikeResult.rows[0].lock_id;
        requestBody.endProductZoneId  = bikeResult.rows[0].zone_id;
         
       
      requestBody.dbrideEndLatitude =LockDetailForRideStart.rows[0].latitude;
      requestBody.dbrideEndtLongitude =LockDetailForRideStart.rows[0].longitude;

      
    //   if(CommonMessage.IsValid(requestBody.rideEndtLongitude) ==true && CommonMessage.IsValid(requestBody.rideEndLatitude) ==true)
    //   {
        requestBody.endRideZoneId =0;

        if(CommonMessage.IsValid(requestBody.rideEndtLongitude) ==true && CommonMessage.IsValid(requestBody.rideEndLatitude) ==true)
        {
        let findNearestZoneResult :any = await RideBooking.findNearestZone(requestBody);
        
       
        if(findNearestZoneResult.rowCount>0)
        {
            
            requestBody.endRideZoneId=findNearestZoneResult.rows[0].id;

            requestBody.endProductZoneId= requestBody.endRideZoneId
        }

    }
        


        let model_id=result.rows[0].vehicle_model_id;
        let fromTime =result.rows[0].from_ride_time;
   
        let difference: any = await calculateMin(requestBody.fromRideTime , requestBody.actualRideTime); // This will give difference in milliseconds
        requestBody.actualRideMin = difference ;//.toFixed(2);
          
        if(requestBody.actualRideMin == 0)
        {
            requestBody.actualRideMin =1;
        }    
         let userId:any=  requestBody.id;
         
          requestBody.userId =requestBody.endRideUserId;

        // console.log('check user id  dsafaf ',requestBody.endRideUserId )

         let usersId : any  = requestBody.endRideUserId;
         let rideEnData:any={};
        // console.log('check user id  dsafaf ',usersId )

      let  walletAmount :any = await RideBooking.getWalletAmount({userId}); // 
      
      
       if (walletAmount.rowCount <=0)        
       {
          RequestResponse.validationError(res, 'Wallet amount not found for this user.', status.success, []);
          return;
       }
         requestBody.currentWalletAmount =walletAmount.rows[0].min_wallet_amount; // recharge amount 

       

          if (Number(requestBody.actualRideMin) < Number(requestBody.minimumHiringTime) )          
          {
            
            requestBody.totalRideAmount =  (requestBody.minimumRentRate * requestBody.minimumHiringTime);
         }
          else 
         {
            requestBody.totalRideAmount =  requestBody.minimumRentRate * requestBody.actualRideMin ;
         }
                  
         

           requestBody.totalRideAmount= parseFloat(requestBody.totalRideAmount).toFixed(2) ;


    

           // this for wallet amount 
           requestBody.amount= requestBody.totalRideAmount ; 

          let subWalletAmount:any  = await GetUserServices.subWalletAmount(requestBody); // deduct recharge amount

          if(subWalletAmount.rowCount <=0)
          {                           
               RequestResponse.success(res, apiMessage.noDataFound, status.success, []);
               return
          }

          let  remainingwalletAmount :any = await RideBooking.getWalletAmount({userId}); //   recharge amount 
      
          
          if (remainingwalletAmount.rowCount <=0)        
          {
            await GetUserServices.addRechargeAmount(requestBody);
            if(config.CLIENT_NAME==kClientName.clientEvegah)
                {
                    RequestResponse.validationError(res, 'Wallet amount not found for this user.', status.success, []);

                }
          }
           requestBody.remainingwalletAmount = remainingwalletAmount.rows[0].min_wallet_amount;

        
 

          requestBody.hiringCharges = requestBody.totalRideAmount;
          requestBody.transactionType = 26;
          requestBody.extraCharges = 0;
        

        let getUserTypeEnumId: any = await RideBooking.getUserTypeEnumId({usersId});
        if(getUserTypeEnumId.rowCount <=0)
           {                           
             RequestResponse.success(res, 'User Type Is not found.', status.success, []);
             return
           }
          requestBody.userTypeEnumId = getUserTypeEnumId.rows[0].user_type_enum_id;

          
          
          let  deviceLockAndUnlockResult :any;
          let thirdPartyLockUnlockResponseData :any={ massage : null ,
            result  : null} ;

          

        client                             
            .query('BEGIN')
            .then(async (res) => {
                result = await RideBooking.updateActualTime(requestBody);                
                return result;
            })
            .then(async (res) => {
               
                requestBody.reservedAndUnReservedStatus = masterMessage.unReserved;
                
                result = await RideBooking.updateBikeReservedAndUnReservedStatus(requestBody);               
                return result;
            })
            // .then(async (res) => {                         
            //     result = await adminController.setInstructionToLockUnlockDeviceController(requestBody,res);               
            //     return result;
            // })//result = await GetUserServices.insertUserAllTransactionDetails(requestBody); 
            .then(async (res) => {                         
                result = await GetUserServices.insertUserAllTransactionDetails(requestBody);               
                return result;
            })
           
            .then(async (r) => {
                if (result.rowCount > 0) {
                    

                 let RideBookingDetails :any  = await RideBooking.getRideBookingDetailsForEndRide(requestBody);
                    if (result.rowCount <= 0) 
                    {       
                        rollBack =false ;
                        client.query('rollback');               
                         RequestResponse.validationError(res, 'this riding  is not found.', status.success, []);
                         return            
                    }

                    let rideArray: any = [];
                    let actual_ride_time :any ;
                    actual_ride_time =RideBookingDetails.rows[0].actual_ride_time ;
                          
                    requestBody.lockNumber = requestBody.deviceId ;
                           
                  if(config.CLIENT_NAME==kClientName.clientEvegah)// for evegah 
                   {
                    
                    requestBody.instructionId='3';                    
                    result = await adminController.setInstructionToLockUnlockDeviceFun(requestBody,res,req); 
          
                    thirdPartyLockUnlockResponseData =
                        {
                            massage : null ,
                            result  : null,    
                        }
                   }
                    

                   let CurrentLockDetailForRideStart: any = await RideBooking.getLockDetailForRideStart(requestBody);
                   
                   if (LockDetailForRideStart.rowCount <= 0) 
                   {
                    rollBack =false;
                      client.query('rollback');
                        RequestResponse.validationError(res, 'data not found', status.success, []);  
                        return          
                   }    
                                   
                    rideArray.push({ 
                        totalRideAmount: requestBody.totalRideAmount ,
                        totalDurationInMinutes: requestBody.actualRideMin,
                        rate: requestBody.minimumRentRate,
                        startRideTime : fromTime,
                        endRideTime:actual_ride_time,
                        minimumHireTime : requestBody.minimumHiringTime,
                        modelName : modelName,
                        remainingwalletAmount : requestBody.remainingwalletAmount,
                        rideBookingNo:requestBody.rideBookingNo,

                       lastDeviceLockStatusName : requestBody.lockStatusName,
                       lastDeviceLockAndUnlockStatus : requestBody.deviceLockAndUnlockStatus,
                       lastDeveiceStateEnumId: requestBody.deveice_state_enum_id ,
                       lastdeveiceState: requestBody.deveice_state,

                        CurrentDeviceLockStatusName  : CurrentLockDetailForRideStart.rows[0].lock_status,
                        CurrentDeviceLockAndUnlockStatus :   CurrentLockDetailForRideStart.rows[0].device_lock_and_unlock_status,
                        CurrentDeveiceStateEnumId :   CurrentLockDetailForRideStart.rows[0].deveice_state_enum_id,
                        CurrentDeveiceState : CurrentLockDetailForRideStart.rows[0].deveice_state,

                       thirdPartyLockUnlockResponseDatas : thirdPartyLockUnlockResponseData
                    });

                                        
                    rideEnData.message =apiMessage.success;
                    rideEnData.status =status.success;
                    rideEnData.rideArrays = rideArray;
                            
                   
                    RequestResponse.success(res, apiMessage.success, status.success, rideArray);                   
                     return ;
                     
                }
                // else {
                                 
                //     await GetUserServices.addRechargeAmount(requestBody);                
                //      RequestResponse.success(res, apiMessage.somethingWentWrong, status.info, []);
                //      return
                // }
            }) .then(async(res1) => {

           //     console.log(' check requestBody.apiCallFun',requestBody.apiCallFun)
             //   console.log('check commit')
                if(rollBack ==true){
                    rollBack ==false
                    client.query('commit');                
                       //  return ;                                               
                    } 
                    // axios.get('http://localhost:10101/api/deviceLockAndPowerOffWithTime').then(res => 
                    //     {
                        
                    //    console.log('call http://localhost:7001/api/countryList');
                    //        }); 



                  return;
            })            
            .catch((err) => {
              //  console.log('check rollback 1') 
                if(rollBack ==true){
                    rollBack ==false
                   client.query('rollback');
                }
                AddExceptionIntoDB(req,err);
                return exceptionHandler(res, 1, err.message);
            })           
    } catch (error: any) {
        AddExceptionIntoDB(req,error);
        logger.error(error);

        return exceptionHandler(res, 1, error.message);
    }
};

const getRideBookingDetailsController = async (req: Request, res: Response) => {
    try {
        // #swagger.tags = ['User-Payment']
        // #swagger.description = 'Pass lockInwardId and statusEnumId '

        /*#swagger.parameters[ {
                        "name": "rideBookingId",
                        "in": "query",
                        "description": "rideBookingId",
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

        let requestQuery = req.query;
        let rideBookingArray: any = [];
        let result: any = await RideBooking.getRideBookingDetails(requestQuery);
        for (let row of result.rows) {
            //let paymentDetails;
            // if (row.payment) {
            //     let paymentId = { paymentId: row.payment };
            //     paymentDetails = await payment.getPaymentTransaction(paymentId);
            // }
            rideBookingArray.push({
                rideBookingId: row.id,
                id: row.user_id,
                bikeId : row.bike_id,
                minWalletAmount: row.min_wallet_amount,
                // extraCharges: row.extra_charges,
                userName: row.user_name,
                vehicleId: row.vehicle_model_id,
                modelName: row.model_name,
                uId: row.vehicle_uid_id,
                vehicleModelUId: row.model_uid_number,
                lockId: row.vehicle_lock_id,
                lockNumber: row.lock_number,
                rideBookingMinutes: row.ride_booking_min,
                fromRideTime: row.from_ride_time,
                toRideTime: row.to_ride_time,
                actualRideTime: row.actual_ride_time,
                actualRideMin: row.actual_ride_min,
                ridePaymentStatus: row.ride_payment_status,
                hiringCharges: row.hiring_charges,
                perviousCharges: row.pervious_charges,
                createdOnDate: row.createdon_date,
                updatedOnDate: row.updatedon_date,
                statusEnumId: row.status_enum_id,
                extraCharges: row.extra_ride_charges,
                totalRideAmount: row.total_ride_amount,
                //   paymentDetails: paymentDetails ? paymentDetails : [],
                bikeRidingStatus: row.bike_rideing_status,
                bikeRidingStatusName: row.bike_rideing_status_name,
                rideStartLatitude: row.ride_start_latitude,
                rideStartLongitude: row.ride_start_longitude,
                rideEndLatitude: row.ride_end_latitude,
                rideEndLongitude: row.ride_end_longitude
            });
        }
        if (result.rowCount > 0) {
            return RequestResponse.success(res, apiMessage.success, status.success, rideBookingArray);
        } else {
            return RequestResponse.success(res, apiMessage.recordNotFound, status.success, []);
        }
    } catch (error: any) {
        AddExceptionIntoDB(req,error);
        return exceptionHandler(res, 1, error.message);
    }
};

const getLastRideBookingDetailsController = async (req: Request, res: Response) => {
    try {
        // #swagger.tags = ['User-Payment']
        // #swagger.description = 'Pass lockInwardId and statusEnumId '

        /*#swagger.parameters[ {
                        "name": "rideBookingId",
                        "in": "query",
                        "description": "rideBookingId",
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

        let requestQuery = req.query;
        let rideBookingArray: any = [];
        let result: any = await RideBooking.getRideBookingDetails(requestQuery);

        if (result.rowCount <= 0) {
            return RequestResponse.success(res, apiMessage.recordNotFound, status.success, []);
        }

        let row = result.rows[0];
        let getLock: any;
        let distance_in_meters :any = 0;
        getLock = await inwardServices.getLockDetails({ lockId: row.vehicle_lock_id });

         if (Number(row.distance_in_meters) ==0)
         {
            distance_in_meters=0;
         }
         else
         {
            distance_in_meters = parseFloat(row.distance_in_meters).toFixed(3)
         }

        rideBookingArray.push({
             bikeId : row.bike_id,
            rideBookingId: row.id,

            id: row.user_id,
            minWalletAmount: row.min_wallet_amount,
            // extraCharges: row.extra_charges,
            totalDistanceInKm :distance_in_meters,// parseFloat(row.distance_in_meters).toFixed(3) ,
            userName: row.user_name,
            vehicleId: row.vehicle_model_id,
            modelName: row.model_name,
            uId: row.vehicle_uid_id,
            vehicleModelUId: row.model_uid_number,
            lockId: row.vehicle_lock_id,
            lockNumber: row.lock_number,
            rideBookingMinutes: row.ride_booking_min,
            fromRideTime: row.from_ride_time,
            toRideTime: row.to_ride_time,
            actualRideTime: row.actual_ride_time,
            actualRideMin: row.actual_ride_min,
            ridePaymentStatus: row.ride_payment_status,
            hiringCharges: row.hiring_charges,
            perviousCharges: row.pervious_charges,
            createdOnDate: row.createdon_date,
            updatedOnDate: row.updatedon_date,
            statusEnumId: row.status_enum_id,
            extraCharges: row.extra_ride_charges,
            totalRideAmount: row.total_ride_amount,
            //   paymentDetails: paymentDetails ? paymentDetails : [],
            bikeRidingStatus: row.bike_rideing_status,
            bikeRidingStatusName: row.bike_rideing_status_name,
            rideStartLatitude: row.ride_start_latitude,
            rideStartLongitude: row.ride_start_longitude,
            rideEndLatitude: row.ride_end_latitude,
            rideEndLongitude: row.ride_end_longitude,
            lockStatusId: getLock[0].deviceLockAndUnlockStatus,
            lockStatusName: getLock[0].deviceLockAndUnlockStatusName,// == '1' ? 'UnLock' : 'Lock'
            latitude: getLock[0].latitude,
            longitude: getLock[0].longitude,
            altitude:getLock[0].altitude,
            speed: getLock[0].speed,
            batteryPercentage: getLock[0].battery,
            deviceLightInstructionEnumId  :getLock[0].deviceLightInstructionEnumId ,
            deviceLightInstruction  :getLock[0].deviceLightInstruction,
            deviceLightStatus  : getLock[0].deviceLightStatus ,
            deviceLightStatusEnumId : getLock[0].deviceLightStatusEnumId
        });
        return RequestResponse.success(res, apiMessage.success, status.success, rideBookingArray);
    } catch (error: any) {
        AddExceptionIntoDB(req,error);
        return exceptionHandler(res, 1, error.message);
    }
};

const getRideHistoryController = async (req: Request, res: Response) => {
    try {
        let requestQuery = req.query;
        let result: any = await RideBooking.getRideBookingDetails({ rideBookingId: 0, statusEnumId: 1, id: requestQuery.id });
        let rideArray: any = [];
        if (result.rowCount <= 0) {
            return RequestResponse.success(res, apiMessage.recordNotFound, status.success, []);
        }
        // let data: any = await getMemcached(`getRideHistoryController-${requestQuery.id}`);
        // if (data) {
        //     return RequestResponse.success(res, apiMessage.success, status.success, JSON.parse(data));
        // }
        for (let row of result.rows) {
            requestQuery.rideBookingId = row.id;

            let hiringCharges: any = await RideBooking.getRideBookingHiringChargesByUserId(requestQuery);
            let extraCharges: any = await RideBooking.getRideBookingExtraChargesByUserId(requestQuery);
            let totalRideAmount: any = await RideBooking.getRideBookingTotalChargesByUserId(requestQuery);

            rideArray.push({ hiringCharges: hiringCharges.rows, extraCharges: extraCharges.rows, totalRideAmount: totalRideAmount.rows });
        }
        //        await setMemcached(`getRideHistoryController-${requestQuery.id}`, JSON.stringify(rideArray));

        return RequestResponse.success(res, apiMessage.success, status.success, rideArray);
    } catch (error: any) {
        AddExceptionIntoDB(req,error);
        return exceptionHandler(res, 1, error.message);
    }
};


  
const rideBookingValidationsControllerForCheckFarePlan = async (requestBody:any,res: Response ,req :any) => {  
    try {                
      

       let bike =requestBody;       
        let bikeresult: any = await RideBooking.getBikeDetails({bike}); 
        let data: any =[];             
        if(bikeresult.rowCount <=0)
        {
          //  console.log('check bikeresult.rowCount 710 ')
             RequestResponse.validationError(res, apiMessage.bikeNotFound, status.success, []); 
             return false;           
        }
        data.modelId = bikeresult.rows[0].model_id;
        data.lockId =bikeresult.rows[0].lock_id;
        data.uId  =bikeresult.rows[0].uid_id;   
        data.zoneId =bikeresult.rows[0].zone_id;  
        

   
      let areaAndAreaTypeResult: any = await RideBooking.getAreaAndAreaType(data);    
      if(areaAndAreaTypeResult.rowCount <=0)
      {
      //  console.log('check bikeresult.rowCount 724 ')
           RequestResponse.validationError(res, 'For this  zone area is not found.', status.success, []); 
           return false;           
      } 
     
      data.areaId ='0';
      data.mapCityId  ='0';
      data.cityId = areaAndAreaTypeResult.rows[0].map_city_id;
      data.areaTypeEnumId = areaAndAreaTypeResult.rows[0].area_type_enum_id; 
      
      
      if(areaAndAreaTypeResult.rows[0].area_type_enum_id=='31')// close area 
      {
        data.areaId = areaAndAreaTypeResult.rows[0].area_id;
      }
      else if(areaAndAreaTypeResult.rows[0].area_type_enum_id=='30')//open area 
      {
        data.mapCityId = areaAndAreaTypeResult.rows[0].map_city_id;
      }

      
      data.apDate =  getUTCdate();                            
      data.aplicableDate = getUTCdate()

      if(data.areaTypeEnumId=='30')// for open area 
      {
           data.areaId='0';
      }     
           
      let farePlanResultesult: any = await RideBooking.getFarePlanDataForRideBooking(data);        
      if(farePlanResultesult.rowCount <=0)
      {
       // console.log('check farePlanResultesult  756 ')
           RequestResponse.validationError(res, 'For this bike no plan availale.', status.success, []); 
           return false;           
      }
      let todayRate :any =0;
      let farePlanDetail :any =[];


      if(Dateformats.ConvertUTCtoDayformat() =='Monday')
      {
       if( farePlanResultesult.rows[0].per_minute_rate_monday ==null || farePlanResultesult.rows[0].per_minute_rate_monday < 0 ) 
       {
        RequestResponse.validationError(res, apiMessage.planNotActive , status.success, []); 
           return false; 
       }
         todayRate = farePlanResultesult.rows[0].per_minute_rate_monday;

      }

      if(Dateformats.ConvertUTCtoDayformat() =='Tuesday')
      {
        if(farePlanResultesult.rows[0].per_minute_rate_tuesday ==null || farePlanResultesult.rows[0].per_minute_rate_tuesday < 0 ) 
        {
           RequestResponse.validationError(res, apiMessage.planNotActive , status.success, []); 
            return false;
        }
        todayRate = farePlanResultesult.rows[0].per_minute_rate_tuesday;
      }

      if(Dateformats.ConvertUTCtoDayformat() =='Wednesday')
      {
        if(farePlanResultesult.rows[0].per_minute_rate_wednesday ==null || farePlanResultesult.rows[0].per_minute_rate_wednesday < 0 ) 
        {
           RequestResponse.validationError(res, apiMessage.planNotActive , status.success, []); 
            return false;
        }
        todayRate = farePlanResultesult.rows[0].per_minute_rate_wednesday;
      }
      

      if(Dateformats.ConvertUTCtoDayformat() =='Thursday')
      {
        if(farePlanResultesult.rows[0].per_minute_rate_thursday ==null || farePlanResultesult.rows[0].per_minute_rate_thursday < 0 ) 
        {
           RequestResponse.validationError(res, apiMessage.planNotActive , status.success, []); 
            return false;
        }
        todayRate = farePlanResultesult.rows[0].per_minute_rate_thursday;
      }

      
      if(Dateformats.ConvertUTCtoDayformat() =='Friday')
      {
        if(farePlanResultesult.rows[0].per_minute_rate_friday ==null || farePlanResultesult.rows[0].per_minute_rate_friday < 0 ) 
        {
           RequestResponse.validationError(res, apiMessage.planNotActive , status.success, []); 
            return false;
        }
        todayRate = farePlanResultesult.rows[0].per_minute_rate_friday;
      }

      if(Dateformats.ConvertUTCtoDayformat() =='Saturday')
      {
        if(farePlanResultesult.rows[0].per_minute_rate_saturday ==null || farePlanResultesult.rows[0].per_minute_rate_saturday < 0 ) 
        {
           RequestResponse.validationError(res, apiMessage.planNotActive , status.success, []); 
            return false;
        }
        todayRate = farePlanResultesult.rows[0].per_minute_rate_saturday;
      }
      
      if(Dateformats.ConvertUTCtoDayformat() =='Sunday')
      {
        if(farePlanResultesult.rows[0].per_minute_rate_sunday ==null || farePlanResultesult.rows[0].per_minute_rate_sunday < 0 ) 
        {
           RequestResponse.validationError(res, apiMessage.planNotActive , status.success, []); 
            return false;
        }
        todayRate = farePlanResultesult.rows[0].per_minute_rate_sunday;
      }
      
      //console.log('check fare farePlanResultesult 837')
      farePlanDetail.push({
             farePlanId         : Number(farePlanResultesult.rows[0].id),
             minimumHireMinuts  : Number(farePlanResultesult.rows[0].hire_minuts),             
             todaysRate : (todayRate),
             areaId:data.areaId,
             mapCityId: data.mapCityId ,
      })
          
      //console.log('check fare farePlanDetail 846',farePlanDetail)
     return  farePlanDetail; 
    } catch (error: any) {
        AddExceptionIntoDB(req,error);
        return exceptionHandler(res, 1, error.message);
    }
};




const rideBookingValidationsController = async (requestBody:any,res: Response ,req :any) => {  

  let  rollBack :any =true ;
    try {
        
      
            // requestBody.reservedAndUnReservedStatus = 13;
       let bike =requestBody.bikeId ;

        let bikeresult: any = await RideBooking.getBikeDetails({bike});
       // model_id , lock_id , uid_id
    
        if(bikeresult.rowCount <=0)
        {
            return RequestResponse.validationError(res, apiMessage.bikeNotFound, status.success, []);            
        }
        requestBody.vehicleId = bikeresult.rows[0].model_id;
        requestBody.lockId =bikeresult.rows[0].lock_id;
        requestBody.uId  =bikeresult.rows[0].uid_id;    
        requestBody.endProductZoneId  =bikeresult.rows[0].zone_id; 
        
      let  result: any = await ProduceBike.getBikeReservedUnReservedStatus(requestBody);

        if (result.rowCount <= 0) 
        {
            return RequestResponse.validationError(res, apiMessage.bikeNotFound, status.success, []);            
        }

        let  checkRideStartOrNotForUserResult: any = await RideBooking.checkRideStartOrNotForUserService(requestBody);

        if (checkRideStartOrNotForUserResult.rowCount > 0) 
        {
            return RequestResponse.validationError(res, apiMessage.userBikeBooked, status.success, []);            
        }
        


        let LockDetailForRideStart: any = await RideBooking.getLockDetailForRideStart(requestBody);
        if (LockDetailForRideStart.rowCount <= 0) 
        {
            return RequestResponse.validationError(res, 'lock detail not found.', status.success, []);            
        }    
        
 
      if(config.CLIENT_NAME==kClientName.clientEvegah)
        {
          if(LockDetailForRideStart.rows[0].device_lock_and_unlock_status =='2') // unlock device 
          {
            return RequestResponse.validationError(res, 'You can not start ride because device is locked, please wait for unlock device.', status.success, []); 
          }
        }

        let rideStartAddress :any =await getAddressFromLatLong(LockDetailForRideStart.rows[0].latitude,LockDetailForRideStart.rows[0].longitude);   
        
        requestBody.rideStartLatitude =LockDetailForRideStart.rows[0].latitude;
        requestBody.rideStartLongitude =LockDetailForRideStart.rows[0].longitude;
        requestBody.rideStartZoneId =bikeresult.rows[0].zone_id;
        
        requestBody.rideStartAddress=rideStartAddress;

        
        requestBody.rideStartExternalBatteryVoltage =LockDetailForRideStart.rows[0].external_batt_v  ;
        requestBody.rideStartInternalBatteryVoltage  = LockDetailForRideStart.rows[0].internal_batt_v ;
        requestBody.rideStartBatteryPercentage = LockDetailForRideStart.rows[0].battery ;

    let vaidLatLongResult :any = await checkVaidLatLong(requestBody.rideStartLatitude,requestBody.rideStartLongitude);                
      if(vaidLatLongResult !='correct')
      {       
      //  console.log('check result for vaidLatLongResult 919')              
           return RequestResponse.validationError(res, 'incorrect LatLong.', status.success, []);
      }

        requestBody.OrderType ='R'
        requestBody.rideBookingNo = await generateOrderNumber(requestBody.OrderType);
        //requestBody.rideBookingNo = 'R_' +''+requestBody.rideBookingNo;
        
        

     if (result.rows[0].bike_booked_status === '13') // resurved
     {
       return RequestResponse.validationError(res, apiMessage.bikeBooked, status.success, []);      
    }
    if (result.rows[0].bike_booked_status === '35') // Under Maintenance 
    {
       return RequestResponse.validationError(res, 'This Bike Is Under Maintenance.', status.success, []);      
    }


//--rideV
let farePlanDadte :any =await rideBookingValidationsControllerForCheckFarePlan(bike,res,req)
if(  farePlanDadte==false)
   {  
   // console.log('check result for farePlanDadte 943') 
      return;           
   } 
//----

for (let row of farePlanDadte) 
 {   
   requestBody.farePlanId =row.farePlanId ;//: 95, minimumHireMinuts: 2, todaysRate: '3'
   requestBody.minimumHiringTime =row.minimumHireMinuts ;
   requestBody.minimumRentRate =row.todaysRate;
   requestBody.areaId = row.areaId;
   requestBody.mapCityId = row.mapCityId ;
}

 
     if (   requestBody.rideBookingMinutes < requestBody.minimumHiringTime )
     {
      //  console.log('check requestBody.rideBookingMinutes < requestBody.minimumHiringTime 963')
        return RequestResponse.validationError(res, 'Please Check Hiring Time. Hiring Time Can Not Less Then To '+ requestBody.minimumHireMinuts + ' Minutes.', status.success, []);
     }

  
    let walletAmount : any =0;
    let walletAmountFromEnum : any =0;      
    let  currentWallet : any =0;
   // let currentWalletAmount:any =0;

   let userId = requestBody.id;
 
    walletAmount = await RideBooking.getWalletAmount({userId});

       if (walletAmount.rowCount <=0)        
    {
      //  console.log('check walletAmount 979')
        return  RequestResponse.validationError(res, 'user wallet amount not found.', status.success, []);
    }

    requestBody.currentWalletAmount =walletAmount.rows[0].min_wallet_amount; // recharge amount
    requestBody.depositAmount =walletAmount.rows[0].deposit_amount; // user deposit amount 
    
    walletAmountFromEnum= await RideBooking.getWalletAmountToEnumTbl();
    

    if (walletAmountFromEnum.rowCount <=0)        
    {
       // console.log('check walletAmountFromEnum 986')
        return RequestResponse.validationError(res, 'Set Minimum Ride Amount.', status.success, []);            
    }
    let rechargeAmountTblEnum:any= (walletAmountFromEnum.rows[0].enum_key).toFixed(2)
    currentWallet =(walletAmount.rows[0].min_wallet_amount -walletAmountFromEnum.rows[0].enum_key).toFixed(2);
    
    //console.log('walletAmount.rows[0].min_wallet_amount  1086',walletAmount.rows[0].min_wallet_amount)

      if(Number(walletAmount.rows[0].min_wallet_amount) <= 0)
        {  
          //  console.log('check  currentWallet 993')
          
                return RequestResponse.validationError(res, 'please add Minimum Recharge Amount. ' + rechargeAmountTblEnum + '', status.success, []);
          
           
       }

       result = await RideBooking.getPreviousChargesByUserId(requestBody);
     
       if (result.rowCount > 0) {
           let hiring_charges = result.rows[0].hiring_charges ? result.rows[0].hiring_charges : 0;
           let extra_charges = result.rows[0].extra_ride_charges ? result.rows[0].extra_ride_charges : 0;
           requestBody.perviousCharges = Number(hiring_charges) + Number(extra_charges);
       } else {
           requestBody.perviousCharges = 0;
       }

       requestBody.ridePaymentStatus ='NotCaptured',
       requestBody.hiringCharges =null,
       requestBody.perviousCharges =null,
       requestBody.paymentTransactionId =null,
       requestBody.beepOnCount ='0', 
       requestBody.beepOffCount ='0', 
       requestBody.distanceInMeters =0
       requestBody.rideRating ='0';
       requestBody.rideBookingId ='0';
       let bikeStateResult: any ;
       return new Promise(async (resolve, reject) => {
       try{
        client
           .query('BEGIN')
           .then(async (rese) => {

            bikeStateResult = await rideBookedStatusValidation(requestBody.bikeId,res);
            if(bikeStateResult ==false)
            {
                if(rollBack ==true)
                {
                await client.query('rollback');
                }
              //  console.log('check  bikeStateResult 1026')
              return ;           
            }
            
               result = await RideBooking.insertRideBooking(requestBody);
              
               requestBody.rideBookingId = result.rows[0].id;
                     
               if(Number(requestBody.rideBookingId) !=0)
                {
    
                    bikeStateResult = await rideBookedStatusValidation(requestBody.bikeId,res);
                    if(bikeStateResult ==false)
                    { 
                            if(rollBack ==true){
                             rollBack =false
                            await client.query('rollback');
                         }
                       // console.log('check  bikeStateResult 1046')
                        return ; 
                        //resolve(result) ;          
                    }
    
                    requestBody.reservedAndUnReservedStatus = masterMessage.reserved;
                    result = await RideBooking.updateBikeReservedAndUnReservedStatus(requestBody);                           
                    if(rollBack ==true){
                        rollBack =false;
                    (client.query('commit'))
                    }
          
              
                    // console.log('return ride start 1054')
                     let rideBooking = { rideBookingId: requestBody.rideBookingId };
                    let data :any = {
                         message : "Success",
                         status : "SUCCESS",
                         statusCode: 200,                    
                         rideBookingId :requestBody.rideBookingId
                         
                       }
                      resolve(data)
                     //  console.log('check data in ride',data)  
                     //   if(requestBody.apiCallFun == 'rideStart') 
                     //     {
                            RequestResponse.success(res, apiMessage.success, status.success, rideBooking)
                            return data;
                       }    
     
                     else {
                         let data :any = {
                             message : "error",
                             status : "error",
                             statusCode: 4001,                    
                             rideBookingId :requestBody.rideBookingId
                             
                           }
                            resolve(data)
                        // console.log('return apiMessage.somethingWentWrong 1087')
                         
                             RequestResponse.success(res, apiMessage.somethingWentWrong, status.info, []);
                             return data
                        }
                 
             }).catch((err) => {
                if(rollBack ==true){
                    rollBack =false;
                 client.query('rollback');
                }
                // console.log('return apiMessage.somethingWentWrong 1095')
                 AddExceptionIntoDB(req,err);
                 return exceptionHandler(res, 1, err.message);
             })
             .catch((err) => {
                if(rollBack ==true){
                    rollBack =false;
                 client.query('rollback');
                }
              AddExceptionIntoDB(req,err);
            //  console.log('return apiMessage.somethingWentWrong 1102')
                 return exceptionHandler(res, 1, err.message);
             });        
     
              }catch(err) {
                 
                 reject(err);
             } 
         });
     
          // return   RequestResponse.success(res, apiMessage.success, status.success, []);
         } catch (error: any) {
             logger.error(error);
           //  console.log('return apiMessage.somethingWentWrong 1108')
             return exceptionHandler(res, 1, error.message);
         }
     };




 const rideBookedStatusValidation = async(data:any, res :any)=>
 {
    let bikeStateResult :any
    let bike:any =data;
    bikeStateResult = await RideBooking.getBikeDetails({bike});//5723

    if(bikeStateResult.rowCount <=0)
    {        
        RequestResponse.validationError(res, apiMessage.bikeNotFound, status.success, []);
        return  false;    
    }

    if (bikeStateResult.rows[0].bike_booked_status === '13') // resurved
    { 
    RequestResponse.validationError(res, apiMessage.bikeBooked, status.success, []);    
     return  false;   
    }

    if (bikeStateResult.rows[0].bike_booked_status === '35') // Under Maintenance 
    {
        RequestResponse.validationError(res, 'This Bike Is Under Maintenance.', status.success, []);  
        return false;    
    }
     return true; 
 }


const updateBikeUndermaintenanceController = async (req: Request, res: Response) => {
    try {
        /* 	#swagger.tags = ['User-Payment']
              #swagger.description = 'Only user can add type all Parameter are mandatory in swagger for testing purpose' */

        /*	#swagger.parameters['obj'] = {
                    in: 'body',
                    description: 'ride booking.',
                    required: true,
                    schema: { $ref: "#/definitions/updateDetailsRideEndsController" }
            } */

        /* #swagger.security = [{
                    "apiKeyAuth": []
            }] */
        let requestBody = req.body;
        let result: any;
        requestBody.actualRideTime = getUTCdate();
       

        if (  CommonMessage.IsValid(requestBody.bikeId)==false && requestBody.bikeId <= 0  ) {
            return RequestResponse.validationError(res, 'Please Enter Valid bike Id', status.error, []);
        }

        if (  CommonMessage.IsValid(requestBody.userId)==false && requestBody.userId <= 0  ) {
            return RequestResponse.validationError(res, 'Please Enter Valid User Id', status.error, []);
        }
        if (  CommonMessage.IsValid(requestBody.remarks)==false ) {
            return RequestResponse.validationError(res, 'Please Enter Valid remark', status.error, []);
        }

       requestBody.statusEnumId = 1;

      let bike = requestBody.bikeId;
     
        let bikeResult: any = await RideBooking.getBikeDetails({bike});
       

        if(bikeResult.rowCount <= 0) 
        {
            return RequestResponse.validationError(res, apiMessage.bikeNotFound, status.success, []);            
        }

        if (bikeResult.rows[0].bike_booked_status === '35') 
        {
          return RequestResponse.validationError(res, 'This Ride Is Already Under Maintenance.', status.success, []);   
        }

        if (bikeResult.rows[0].bike_booked_status === '13') 
        {
          return RequestResponse.validationError(res, 'This Ride Is Resurved By user.', status.success, []);   
        }
   
       
        requestBody.vehicleId = bikeResult.rows[0].model_id;
        requestBody.uId = bikeResult.rows[0].uid_id;
        requestBody.lockId = bikeResult.rows[0].lock_id;
        requestBody.reservedAndUnReservedStatus =14;

        await setBeepOffInstructionCommon(requestBody,res,req)


        client                             
            .query('BEGIN')
            .then(async (res) => {
                
                requestBody.reservedAndUnReservedStatus =35;
                result = await RideBooking.updateBikeUndermaintenanceStatus(requestBody);                
                return result;
            })
            .then(async (res) => {
                
                requestBody.bikeStatusEnumId = 35;                  
                result = await RideBooking.insertBikeUnserMatenationHistory(requestBody);               
                return result;
            })            
            .then((res) => {
                return client.query('commit');
            })
            .then(async (r) => {
                if (result.rowCount > 0) {
                    
                    return RequestResponse.success(res, apiMessage.success, status.success, bike);
                } else {                  
                    return RequestResponse.success(res, apiMessage.somethingWentWrong, status.info, []);
                }
            })
            .catch((err) => {
                
                client.query('rollback');
                AddExceptionIntoDB(req,err);
                return exceptionHandler(res, 1, err.message);
            })
            .catch((err) => {
                AddExceptionIntoDB(req,err)
                return exceptionHandler(res, 1, err.message);
            });
    } catch (error: any) {
        AddExceptionIntoDB(req,error);

        return exceptionHandler(res, 1, error.message);
    }
};

const updateBikeStatusUnresurvedController = async (req: Request, res: Response) => {
    try {
        /* 	#swagger.tags = ['User-Payment']
              #swagger.description = 'Only user can add type all Parameter are mandatory in swagger for testing purpose' */

        /*	#swagger.parameters['obj'] = {
                    in: 'body',
                    description: 'ride booking.',
                    required: true,
                    schema: { $ref: "#/definitions/updateDetailsRideEndsController" }
            } */

        /* #swagger.security = [{
                    "apiKeyAuth": []
            }] */
        let requestBody = req.body;
        let result: any;
        requestBody.actualRideTime = getUTCdate();
       

        if (  CommonMessage.IsValid(requestBody.bikeId)==false && requestBody.bikeId <= 0  ) {
            return RequestResponse.validationError(res, 'Please Enter Valid bike Id', status.error, []);
        }

        if (  CommonMessage.IsValid(requestBody.userId)==false && requestBody.userId <= 0  ) {
            return RequestResponse.validationError(res, 'Please Enter Valid User Id', status.error, []);
        }
        if (  CommonMessage.IsValid(requestBody.remarks)==false ) {
            return RequestResponse.validationError(res, 'Please Enter Valid remark', status.error, []);
        }

       requestBody.statusEnumId = 1;

      let bike = requestBody.bikeId;
     
        let bikeResult: any = await RideBooking.getBikeDetails({bike});
       

        if(bikeResult.rowCount <= 0) 
        {
            return RequestResponse.validationError(res, apiMessage.bikeNotFound, status.success, []);            
        }

        if (bikeResult.rows[0].bike_booked_status != '35') 
        {
          return RequestResponse.validationError(res, 'This Bike Is Not under Mantanence.', status.success, []);   
        }
    
   
       
        requestBody.vehicleId = bikeResult.rows[0].model_id;
        requestBody.uId = bikeResult.rows[0].uid_id;
        requestBody.lockId = bikeResult.rows[0].lock_id;
        requestBody.endProductZoneId = bikeResult.rows[0].zone_id
        
      
        client                             
            .query('BEGIN')
            .then(async (res) => {
                requestBody.reservedAndUnReservedStatus =masterMessage.unReserved;
                result = await RideBooking.updateBikeReservedAndUnReservedStatus(requestBody);                
                return result;
            })
            .then(async (res) => {
               
                requestBody.bikeStatusEnumId = masterMessage.unReserved;                
                result = await RideBooking.insertBikeUnserMatenationHistory(requestBody);               
                return result;
            })            
            .then((res) => {
                return client.query('commit');
            })
            .then(async (r) => {
                if (result.rowCount > 0) {
                    
                    return RequestResponse.success(res, apiMessage.success, status.success, bike);
                } else {                  
                    return RequestResponse.success(res, apiMessage.somethingWentWrong, status.info, []);
                }
            })
            .catch((err) => {
                
                client.query('rollback');
                AddExceptionIntoDB(req,err);
                return exceptionHandler(res, 1, err.message);
            })
            .catch((err) => {
                AddExceptionIntoDB(req,err);
                return exceptionHandler(res, 1, err.message);
            });
    } catch (error: any) {
        AddExceptionIntoDB(req,error);

        return exceptionHandler(res, 1, error.message);
    }
};


const calculateDistance = async (req : any,  res: Response ) => {
    try {
       
        let requestQuery = req.query;
     
        let result: any;
        result = await ProduceBike.calculateDistance(requestQuery);  
     
                                  
        return  RequestResponse.success(res, apiMessage.success, status.success,[] );    
    } catch (error: any) {
        AddExceptionIntoDB(req,error);
        return exceptionHandler(error.message, 1, error.message);
    }
};

const getRideBookingByUserIdAndLockNumber = async (req: Request, res: Response) => {
    try {
        // #swagger.tags = ['User-Payment']
        // #swagger.description = 'Pass lockInwardId and statusEnumId '

        /*#swagger.parameters[ {
                        "name": "rideBookingId",
                        "in": "query",
                        "description": "rideBookingId",
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
        let requestQuery = req.query;

        if((CommonMessage.IsValid(requestQuery.userId) ==false  || requestQuery.userId =='0') && ( CommonMessage.IsValid(requestQuery.lockId)==false  || requestQuery.lockId =='0')) 
        {
         return RequestResponse.validationError(res, 'Please set lockId OR userId', status.error, []);
        }
        
        let rideBookingArray: any = [];
        let result: any = await RideBooking.getRideBookingByUserIdAndLockNumberService(requestQuery);
        for (let row of result.rows) {
            rideBookingArray.push({
                rideBookingId: row.id,
                id: row.user_id,
                bikeId : row.bike_id,
                minWalletAmount: row.min_wallet_amount,
                // extraCharges: row.extra_charges,
                userName: row.user_name,
                vehicleId: row.vehicle_model_id,
                modelName: row.model_name,
                uId: row.vehicle_uid_id,
                vehicleModelUId: row.model_uid_number,
                lockId: row.vehicle_lock_id,
                lockNumber: row.lock_number,
                rideBookingMinutes: row.ride_booking_min,
                fromRideTime: row.from_ride_time,
                toRideTime: row.to_ride_time,
                actualRideTime: row.actual_ride_time,
                actualRideMin: row.actual_ride_min,
                ridePaymentStatus: row.ride_payment_status,
                hiringCharges: row.hiring_charges,
                perviousCharges: row.pervious_charges,
                createdOnDate: row.createdon_date,
                updatedOnDate: row.updatedon_date,
                statusEnumId: row.status_enum_id,
                extraCharges: row.extra_ride_charges,
                totalRideAmount: row.total_ride_amount,
                //   paymentDetails: paymentDetails ? paymentDetails : [],
                bikeRidingStatus: row.bike_rideing_status,
                bikeRidingStatusName: row.bike_rideing_status_name,
                rideStartLatitude: row.ride_start_latitude,
                rideStartLongitude: row.ride_start_longitude,
                rideEndLatitude: row.ride_end_latitude,
                rideEndLongitude: row.ride_end_longitude,

                 rideStartExternalBatteryVoltage : row.ride_start_external_battery_voltage,
                 rideStartInternalBatteryVoltage : row.ride_start_internal_battery_voltage,
                 farePlanId : row.fare_plan_id,
                 rideBookingNo : row.ride_booking_no,
                 rideStartZoneName : row.ride_start_zone_name,
                 rideStartZoneId : row.ride_start_zone_id,
                 beepOnCount : row.beepOnCount,
                 beepOffCount : row.beepOffCount ,
                 areaId : row.areaId,
                 areaName : row.area_name,
                 mapCityId : row.map_city_id,
                 mapCityName : row.map_city_name,
                 rideStartExtBatteryPercentage : row.ride_start_ext_battery_percentage,

                 minimumHiringTime : row.minimum_hiring_time,
                 minimumRentRate : row.minimum_rent_rate,
                 endRideUserId : row.end_ride_user_id,
                 endRideUserName : row.end_ride_user_name,
                 rideEndExtatteryPercentage : row.ride_end_ext_battery_percentage,

                 rideEndZoneId : row.ride_end_zone_id,
                 rideEndZonename : row.ride_end_zone_name,

            });
        }
        if (result.rowCount > 0) {
            return RequestResponse.success(res, apiMessage.success, status.success, rideBookingArray);
        } else {
            return RequestResponse.success(res, apiMessage.recordNotFound, status.success, []);
        }
    } catch (error: any) {
        AddExceptionIntoDB(req,error);
        return exceptionHandler(res, 1, error.message);
    }
};


const calculateDistance1 = async (req: Request, res: Response) => {
    try {
        let requestBody = req.query;

        let check: any;
        check = 'Test Unlock Detail';
        let result: any;
        let findNearestZoneResult :any = await RideBooking.findNearestZone(requestBody);

        if(findNearestZoneResult.rowCount>0)
        {
             
            requestBody.endRideZoneId=findNearestZoneResult.rows[0].id;

            requestBody.endProductZoneId= requestBody.endRideZoneId
        }
        return RequestResponse.success(res, apiMessage.recordNotFound, status.success, check);

    } catch (error: any) {
        AddExceptionIntoDB(req,error);

        return exceptionHandler(res, 1, error.message);
    }
};

const addRideBookingRatingController = async (req: Request, res: Response) => {
    try {
        /* 	#swagger.tags = ['User-Payment']
              #swagger.description = 'Only user can add type all Parameter are mandatory in swagger for testing purpose' */

        /*	#swagger.parameters['obj'] = {
                    in: 'body',
                    description: 'ride booking.',
                    required: true,
                    schema: { $ref: "#/definitions/updateDetailsRideEndsController" }
            } */

        /* #swagger.security = [{
                    "apiKeyAuth": []
            }] */
        let requestBody = req.body;
        let result: any;
        requestBody.actualRideTime = getUTCdate();
        if (  CommonMessage.IsValid(requestBody.rideBookingId)==false ) {
            return RequestResponse.validationError(res, 'Please Enter rideBookingId', status.error, []);
        }

        if (  CommonMessage.IsValid(requestBody.rideRating)==false ) {
            return RequestResponse.validationError(res, 'Please Enter rideRating', status.error, []);
        }

        if (  CommonMessage.IsValid(requestBody.rideComments)==false) {
            requestBody.rideComments ='';
        }
          
        requestBody.commentsReplyStatusEnumId = 85,                 
      
        client                             
            .query('BEGIN')
            .then(async (res) => {
                requestBody.reservedAndUnReservedStatus =masterMessage.unReserved;
                result = await RideBooking.addRideBookingRating(requestBody, req);                
                return result;
            })
                      
            .then((res) => {
                return client.query('commit');
            })
            .then(async (r) => {
                if (result.rowCount > 0) {
                    
                    return RequestResponse.success(res, apiMessage.success, status.success, []);
                } else {                  
                    return RequestResponse.success(res, apiMessage.somethingWentWrong, status.info, []);
                }
            })
            .catch((err) => {
                
                client.query('rollback');
                AddExceptionIntoDB(req,err);
                return exceptionHandler(res, 1, err.message);
            })
            .catch((err) => {
                AddExceptionIntoDB(req,err);
                return exceptionHandler(res, 1, err.message);
            });
    } catch (error: any) {
        AddExceptionIntoDB(req,error);
        return exceptionHandler(res, 1, error.message);
    }
};

const addRidebookingCommentsReply = async (req: Request, res: Response) => {
    try {
        /* 	#swagger.tags = ['User-Payment']
              #swagger.description = 'Only user can add type all Parameter are mandatory in swagger for testing purpose' */

        /*	#swagger.parameters['obj'] = {
                    in: 'body',
                    description: 'ride booking.',
                    required: true,
                    schema: { $ref: "#/definitions/updateDetailsRideEndsController" }
            } */

        /* #swagger.security = [{
                    "apiKeyAuth": []
            }] */
        let requestBody = req.body;
        let result: any;

        requestBody.commentsReplyDate = getUTCdate();


        if (  CommonMessage.IsValid(requestBody.rideBookingId)==false ) {
            return RequestResponse.validationError(res, 'Please Enter rideBookingId', status.error, []);
        }

        if (  CommonMessage.IsValid(requestBody.rideCommentsReply)==false ) {
            return RequestResponse.validationError(res, 'Please Enter rideCommentsReply', status.error, []);
        }
        
          
        requestBody.commentsReplyStatusEnumId = 86,                 
      
        client                             
            .query('BEGIN')
            .then(async (res) => {
                requestBody.reservedAndUnReservedStatus =masterMessage.unReserved;
                result = await RideBooking.addRidebookingCommentsReply(requestBody, req);                
                return result;
            })
                      
            .then((res) => {
                return client.query('commit');
            })
            .then(async (r) => {
                if (result.rowCount > 0) {
                    
                    return RequestResponse.success(res, apiMessage.success, status.success, []);
                } else {                  
                    return RequestResponse.success(res, apiMessage.somethingWentWrong, status.info, []);
                }
            })
            .catch((err) => {
                
                client.query('rollback');
                AddExceptionIntoDB(req,err);
                return exceptionHandler(res, 1, err.message);
            })
            .catch((err) => {
                AddExceptionIntoDB(req,err);
                return exceptionHandler(res, 1, err.message);
            });
    } catch (error: any) {
        AddExceptionIntoDB(req,error);
        return exceptionHandler(res, 1, error.message);
    }
};


const getRideBookingDetailForCommentsReply = async (req: Request, res: Response) => {
    try {
        let requestQuery = req.body;
        let result: any;

        if (  CommonMessage.IsValid(requestQuery.fromDate)==false ) {
            return RequestResponse.validationError(res, 'select set from data', status.error, []);
        }
        if (  CommonMessage.IsValid(requestQuery.toDate)==false ) {
            return RequestResponse.validationError(res, 'select set to data', status.error, []);
        }
        if (  CommonMessage.IsValid(requestQuery.rideRating)==false ) {
            return RequestResponse.validationError(res, 'select set ride rating', status.error, []);
        }

        if (  CommonMessage.IsValid(requestQuery.commentsReplyStatusEnumId)==false ) {
            return RequestResponse.validationError(res, 'select set comments Reply Status', status.error, []);
        }

        if( await fromDateTodateValidations(requestQuery.fromDate,apiMessage.fromDate ,requestQuery.toDate,apiMessage.toDate,res) == false) 
        {
          return ;
        }      
        let  from_date :any =  Dateformats.ConvertUTCtoDateformatWithoutTime(requestQuery.fromDate) // new Date()
        let  to_date :any =  Dateformats.ConvertUTCtoDateformatWithoutTimeAddEndTime(requestQuery.toDate) // new Date() 
        req.body.fromDate =  from_date;
        req.body.toDate =  to_date;


        result = await RideBooking.getRideBookingDetailForCommentsReplyService(req);
        let reportDetail: any = [];

        if (result.rowCount > 0) {
        for (let row of result.rows) {
        reportDetail.push({     
            rideBookingId : row.id,         
        userId : row.user_id,
        userName : row.user_name,
        mobile : row.mobile,
        modelId : row.vehicle_model_id,
        modelName : row.model_name,
        uId : row.vehicle_uid_id,
        modelUidNumber : row.model_uid_number,
    lockId : row.vehicle_lock_id, 
    lockNumber : row.model_lock_number,
    rideBookingMin : row.ride_booking_min,
    fromRideTime : row.from_ride_time,
    toRideTime  : row.to_ride_time,
    actualRideTime : row.actual_ride_time, 
    actualRideMin : row.actual_ride_min,
    totalRideAmount  : row.total_ride_amount ,
    rideStartLatitude : row.ride_start_latitude,
    rideStartLongitude : row.ride_start_longitude,
    rideEndLatitude : row.ride_end_latitude,
    rideEndLongitude : row.ride_end_longitude,
    bikeRideingStatus  : row.bike_rideing_status,
	 minimumHiringTime : row.minimum_hiring_time ,
    minimumRentRate : row.minimum_rent_rate ,
    endRideUserId  : row.end_ride_user_id,
    endRideUserName : row.end_ride_user_name ,
    rideBookingNo : row.ride_booking_no ,
    rideStartZoneId : row.ride_start_zone_id,
    rideStartZone : row.ride_start_zone,
    rideEndZoneId : row.ride_end_zone_id,
    rideEndZone : row.ride_end_zone,

    rideRating : row.ride_rating ,
    rideComments  : row.ride_comments ,
    rideCommentsReply :  row.ride_comments_reply ,
    commentsReplyStatusEnumId : row.comments_reply_status_enum_id ,
    commentsReplyStatusName : row.comments_reply_status_name  ,

   
                batteryPercentage: row.battery ,

                deveiceStateEnumId: row.deveice_state_enum_id,
                deveiceStatus: row.deveice_status,
                device_lock_and_unlock_status: row.device_lock_and_unlock_status,
                device_lock_unlock_status: row.device_lock_unlock_status,
                location: row.location,
                latitude: row.latitude,
                longitude: row.longitude,
                altitude: row.altitude,
                deviceLightStatusEnumId: row.device_light_status_enum_id,
                deviceLightStatus: row.deveice_light_status,
                deviceLightInstructionEnumId : row.device_light_instruction_enum_id,
                deviceLightInstruction : row.device_light_instruction,
                light_off_count  : row.light_off_count,
                light_on_count : row.light_on_count, 
                device_lock_count : row.device_lock_count,
                device_unlock_count : row.device_unlock_count,
                deviceLastRequestTime: row.device_last_request_time,

                beepStatusEnumId : row.beep_status_enum_id,
                beepStatusName : row.beep_status_name,
                beepInstructionEnumId : row.beep_instruction_enum_id,
                beepInstructionName : row.beep_instruction_name,
                instructionId : row.instruction_id,
                instructionName : row.instruction_name,
                geofenceInOutEnumId  : row.geofence_inout_enum_id,
                geoFenceInOut           : row.geofence_inout_name,

            });
        }       
            return RequestResponse.success(res, apiMessage.success, status.success, reportDetail);
        } else {
            return RequestResponse.validationError(res, apiMessage.dataNotAvailable, status.error, []);
        }
    } catch (error: any) {
        AddExceptionIntoDB(req,error);
        return exceptionHandler(res, 1, error.message);
    }
};


const rideBookingForTime = async (req: Request, res: Response) => {     
      return new Promise(async (resolve, reject) => {
          try {
         let   ridebookingResult :any = await rideBookingController(req,res)
         
              resolve(ridebookingResult);
          } catch (error) {
              reject(error);
          }
      });
  }

function sleep(timeInSecond :any) {
    return new Promise(resolve => setTimeout(resolve, timeInSecond));
  }

  const rideStartWithTime = async (req: Request, res: Response) => {
    try {
        let requestQuery = req.body;
        let result: any;
        let ridebookingResult:any;
        req.body.userId =requestQuery.id;  
        let bike :any = requestQuery.bikeId ;
        let bikeresult: any = await RideBooking.getBikeDetails({bike});
        // model_id , lock_id , uid_id
        req.body.apiCallFun = 'rideStartWithTime';
        req.body.device_lock_unlock_communication_enum_id = '93'
        
         if(bikeresult.rowCount =0)
         {
           // console.log('check ride 1804')
             return RequestResponse.validationError(res, apiMessage.bikeNotFound, status.success, []);            
         }

         requestQuery.vehicleId = bikeresult.rows[0].model_id;
         requestQuery.lockId =bikeresult.rows[0].lock_id;
         requestQuery.uId  =bikeresult.rows[0].uid_id;    
         requestQuery.endProductZoneId  =bikeresult.rows[0].zone_id; 
         requestQuery.lockId =bikeresult.rows[0].lock_id;
         
         let LockDetailForRideStart: any = await RideBooking.getLockDetailForRideStart(requestQuery);
         if (LockDetailForRideStart.rowCount <= 0) 
         { //console.log('check ride 1816')
             return RequestResponse.validationError(res, 'lock detail not found.', status.success, []);            
         } 
         req.body.lockNumber = LockDetailForRideStart.rows[0].lock_number;
         
          result = await ProduceBike.getBikeReservedUnReservedStatus(requestQuery);

         if (result.rowCount <= 0) 
         {
            //console.log('check ride 1825')
             return RequestResponse.validationError(res, apiMessage.bikeNotFound, status.success, []);            
         }
 
 
      if (result.rows[0].bike_booked_status === '13') // resurved
      {
        return RequestResponse.validationError(res, apiMessage.bikeBooked, status.success, []);      
     }
     if (result.rows[0].bike_booked_status === '35') // Under Maintenance 
     {
        return RequestResponse.validationError(res, 'This Bike Is Under Maintenance.', status.success, []);      
     }
         
     let userId = requestQuery.id;
 
     let walletAmount:any = await RideBooking.getWalletAmount({userId});
 
        if (walletAmount.rowCount <=0)        
     {
       //  console.log('check walletAmount 979')
         return  RequestResponse.validationError(res, 'user wallet amount not found.', status.success, []);
     }
 
     requestQuery.currentWalletAmount =walletAmount.rows[0].min_wallet_amount; // recharge amount
     requestQuery.depositAmount =walletAmount.rows[0].deposit_amount; // user deposit amount 

  //  return RequestResponse.validationError(res, 'Your current deposit amount is ' , status.success, []); 
    let walletAmountFromEnum :any = await RideBooking.getLastMinRechargeAmountTbl();
     
 
     if (walletAmountFromEnum.rowCount <=0)        
     {
        // console.log('check walletAmountFromEnum 986')
         return RequestResponse.validationError(res, 'Set Minimum Ride Amount.', status.success, []);            
     }
     let rechargeAmountTblEnum:any= (walletAmountFromEnum.rows[0].enum_key).toFixed(2)
    let  currentWallet :any =(walletAmount.rows[0].min_wallet_amount -walletAmountFromEnum.rows[0].enum_key).toFixed(2);
       if(walletAmount.rows[0].min_wallet_amount <= 0)
         {  
           //  console.log('check  currentWallet 993')
             if(config.CLIENT_NAME==kClientName.clientEvegah)// check for deposit amount can not be zero
             { 
                 return RequestResponse.validationError(res, 'please add Minimum Recharge Amount. ' + rechargeAmountTblEnum + '', status.success, []);
             }
        }
           return await  rideBookingController(req,res)                          
         } catch (error: any) {
        AddExceptionIntoDB(req,error);
        return exceptionHandler(res, 1, error.message);
    }
};





const deviceUnlockWithTime = async (req: Request, res: Response) => {
    try {
        let requestQuery = req.body;
        let result: any;
        req.body.apiCallFun =  'PowerOnOffByTimeApi';
        req.body.device_lock_unlock_communication_enum_id = '93';// online 
        requestQuery.dId  = requestQuery.lockNumber ; 
        let deveiceResut :any = await DashboardServices.getDeviceInstruction(requestQuery, req);
        if (deveiceResut.rowCount == 0) 
        {
            return RequestResponse.validationError(res, 'lock detail not found.', status.success, []); 
        }
        requestQuery.lockId =deveiceResut.rows[0].lock_id;

        let unlockResult:any = await inwardController.deviceUnlockForThirdParty(req,res);                       
        
        
        if(unlockResult.result=='SUCCESS')
        {          
           await sleep(10000);                    
            let powerOnResult:any = await inwardController.powerOnForThirdParty(req, res)                         
            
              if(powerOnResult.result=='SUCCESS')
                {                                            
                 return RequestResponse.success(res, apiMessage.success, status.success,powerOnResult);                   
               }      
               else 
               {
                // id change kr k uncoment krna h
                 requestQuery.rideStartUnlockFlagEnumId =98;// add flag for lock again
                await RideBooking.updateUnlockFlagService(requestQuery);

               
                // await sleep(10000);   
                // let lockResult:any = await inwardController.deviceLockForThirdParty(req,res); 
                return RequestResponse.validationError(res, 'please try again issue in device power on.', status.error,[]);  
               }          
        }
        else 
        {
            return RequestResponse.validationError(res,'please try again issue in device unlock.', status.error,[]);  
        }
           
     } catch (error: any) {
        AddExceptionIntoDB(req,error);
        return exceptionHandler(res, 1, error.message);
    }
};

const deviceLockWithTime = async (req: Request, res: Response) => {
    try {
        let requestQuery = req.body;
        let result: any;
        req.body.apiCallFun =  'PowerOnOffByTimeApi';
        req.body.device_lock_unlock_communication_enum_id = '93';// online 

        requestQuery.dId  = requestQuery.lockNumber ; 
        let deveiceResut :any = await DashboardServices.getDeviceInstruction(requestQuery, req);
        if (deveiceResut.rowCount == 0) 
        {
            return RequestResponse.validationError(res, 'lock detail not found.', status.success, []); 
        }
        requestQuery.lockId =deveiceResut.rows[0].id;
                            
        let powerOnResult:any = await inwardController.powerOffForThirdParty(req, res)    
                      
        if(powerOnResult.result=='SUCCESS')
        {
            await sleep(10000);   
            let lockResult:any = await inwardController.deviceLockForThirdParty(req,res);   
                                                     
              if(lockResult.result == 'SUCCESS')
                {                                      
                    return RequestResponse.success(res, apiMessage.success, status.success,lockResult);  
                }    
               else
               { 
                requestQuery.rideStartPowerFlagEnumId =102;// 102	"RideStartPowerOnFlag"	"Power On"
                await RideBooking.updatePowerOnFlagService(requestQuery);            
                return RequestResponse.validationError(res,'Please try again issue in  device lock', status.error,[]);  
                           
             
            }            
      }
      else 
      {
    
        return RequestResponse.validationError(res,'Please try again issue in device power off', status.error,[]);
      }                        
         } catch (error: any) {
        AddExceptionIntoDB(req,error);
        return exceptionHandler(res, 1, error.message);
    }
};


const rideStartLockPowerOff = async () => {
    try {   
      //  console.log('check result rideStartLockPowerOff')
   
     let requestQuery :any={
        body:{}
     };
     requestQuery.body.apiCallFun =  'PowerOnOffByTimeApi';
     requestQuery.body.device_lock_unlock_communication_enum_id = '93';// online 
    // console.log('check result requestQuery')
  //;
let res:any;
        let LockDetailForRideStart: any = await RideBooking.getLockDetailForScheduleRideStartService();  
              
        
   if (LockDetailForRideStart.rowCount > 0) 
    {    
        //console.log('check result row cout')
       for (let row of LockDetailForRideStart.rows) 
                {      
                    
                  // console.log('check result row ',row)

                    let lockNumber = row.lock_number ;
                    let lockId = row.id;                                                                                
                    requestQuery.body.lockNumber  =lockNumber;
                
                    requestQuery.body.lockId = lockId;
                    requestQuery.body.autoActionType = false;
                 
            if(row.ride_start_poweron_flag_enum_id =='100')//100"RideStartPowerOnFlag"	"Power Off"
           {
          
                let powerOnResult:any = await inwardController.powerOffForThirdParty(requestQuery, res)                    
                if(powerOnResult.result=='SUCCESS')
                {
                  requestQuery.rideStartPowerFlagEnumId =101;// add flag for 101	"RideStartPowerOnFlag"	"Done"
                  await RideBooking.updatePowerOnFlagService(requestQuery);
                }
                await sleep(10000); 
           }

           if(row.ride_start_unlock_flag_enum_id =='98') //98	"RideStartunLockFlag"	"Device Lock"
           {
                           
               let lockResult:any = await inwardController.deviceLockForThirdParty(requestQuery,res); 
               if(lockResult.result=='SUCCESS')
               {
                       requestQuery.rideStartUnlockFlagEnumId =99;
                   let updateUnlockFlagService:any =    await RideBooking.updateUnlockFlagService(requestQuery);
         

               }
           } 


      if(row.ride_start_unlock_flag_enum_id =='103')//103	"RideStartunLockFlag"	"Device Unlock"
            {
             // console.log('start unlcok third party')
                let lockResult:any = await inwardController.deviceUnlockForThirdParty(requestQuery,res); 
                if(lockResult.result=='SUCCESS')
                {
                        requestQuery.rideStartUnlockFlagEnumId =99;//99	"RideStartunLockFlag"	"Done"
                        await RideBooking.updateUnlockFlagService(requestQuery);

                }
                await sleep(10000); 
            }

            if (row.ride_start_poweron_flag_enum_id =='102') //102	"RideStartPowerOnFlag"	"Power On"
                {
                   // console.log('powerOnResult line 2116')  

                    let powerOnResult:any = await inwardController.powerOnForThirdParty(requestQuery, res)    
                   // console.log('powerOnResult line 2121',powerOnResult.result)                     
                    if(powerOnResult.result=='SUCCESS')
                    {
                      requestQuery.rideStartPowerFlagEnumId =101;// add flag for 101	"RideStartPowerOnFlag"	"Done"
                      await RideBooking.updatePowerOnFlagService(requestQuery);
                    }
                    await sleep(10000); 

                }
           
       
        }
    }                                                                                                         
        return ;
                
    } catch (error: any) {
       // AddExceptionIntoDB(requestQuery,error);     
        return;   
    }
};

    const rideEndWithTime = async (req: Request, res: Response) => {
        try {
            let requestQuery = req.body;
           
            requestQuery.statusEnumId = 1;
            
           req.body.apiCallFun = 'rideEndWithTime';
           req.body.device_lock_unlock_communication_enum_id = '93'
             await updateDetailsRideEndsController(req,res)
                        
        } catch (error: any) {
            AddExceptionIntoDB(req,error);
            return exceptionHandler(res, 1, error.message);
        }
    };
export default {
    rideBookingController,
    updateDetailsRideEndsController,
    getRideBookingDetailsController,
    getRideHistoryController,
    getLastRideBookingDetailsController,
    updateBikeUndermaintenanceController,
   updateBikeStatusUnresurvedController,
   rideBookingValidationsControllerForCheckFarePlan,
   calculateDistance,
   calculateDistance1,getRideBookingByUserIdAndLockNumber ,
   addRideBookingRatingController,
   addRidebookingCommentsReply ,
   getRideBookingDetailForCommentsReply ,
   rideStartWithTime ,
   deviceUnlockWithTime,
   deviceLockWithTime,
   rideEndWithTime
   
};
