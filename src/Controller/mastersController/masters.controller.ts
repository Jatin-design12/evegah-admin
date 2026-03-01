import { Request, Response, NextFunction } from 'express';
import logger from '../../Config/logging';
import { adminMessage } from '../../constant/admin-constant';
import { apiMessage } from '../../helper/api-message';
import RequestResponse from '../../helper/responseClass';
import { exceptionHandler, validHandler,AddExceptionIntoDB } from '../../helper/responseHandler';
import status from '../../helper/status';
import inwardServices from '../../services/inwardServices/inward.services';
import MasterServices from '../../services/masterServices/master.services';
import ProduceBike from '../../services/adminServices/admin.produceBike.services';
import { vehicleValidation } from '../../helper/master.validation';
import RideBooking from '../../services/rideBookingServices/ride.booking.services';
import { getUTCdate } from '../../helper/datetime';
import  Dateformats from '../../helper/utcdate';
import CommonMessage from '../../helper/common.validation';
import masterServices from '../../services/masterServices/master.services';
import { client } from '../../Config/db.connection';
import { insertApiExceptionData } from '../../helper/common-function';
import { gets3SignedUrls } from '../../helper/common-function';
import inwardController from '../../Controller/inwardController/inward.controller';
const { parse } = require('querystring');
import { calculateSecond} from '../../helper/common-function';
import utcdate from '../../helper/utcdate';
//import { setMemcached, getMemcached } from '../../services/commanServices/comman.api.services';

const getStatesController = async (req: Request, res: Response) => {
    try {
        let requestQuery = req.query;
        // #swagger.tags = ['Master-Get']
        // #swagger.description = 'Pass country_id to see state list'

        /*#swagger.parameters[ {
                        "name": "country_id",
                        "in": "query",
                        "description": "country_id=0",
                        "required": true,
                        "type": "string"
                    }] 
        } */
        let result: any = '';
        if (requestQuery.country_id === null || requestQuery.country_id === '') {
            return validHandler(res, 1);
        } else {
            result = await MasterServices.getStates(requestQuery);
            if (result[1].rows.length > 0) {
                return RequestResponse.success(res, apiMessage.stateList, status.success, result[1].rows);
            } else {
                return RequestResponse.success(res, apiMessage.dataNotAvailable, status.info, []);
            }
        }
    } catch (error: any) {
        AddExceptionIntoDB(req,error);
        return exceptionHandler(res, 1, error.message);
    }
};

const getCitiesController = async (req: Request, res: Response) => {
    try {
        let requestQuery = req.query;
        // #swagger.tags = ['Master-Get']
        // #swagger.description = 'Pass state_id to see list of cities'

        /*#swagger.parameters[ {
                        "name": "state_id",
                        "in": "query",
                        "description": "state_id=1 or any state_id",
                        "required": true,
                        "type": "string"
                    }] 
        } */
        if (requestQuery.state_id === null || requestQuery.state_id === '') {
            return validHandler(res, 1);
        } else {
            const Data: any = await MasterServices.getCities(requestQuery);
            let cityArray: any = [];
            for (let row of Data[1].rows) {
                cityArray.push({
                    city_id: Number(row.city_id),
                    city_name: row.city_name
                });
            }

            if (Data[1].rows.length == 0) {
                return RequestResponse.success(res, apiMessage.dataNotAvailable, status.info, []);
            } else {
                return RequestResponse.success(res, apiMessage.cityList, status.success, cityArray);
            }
        }
    } catch (error: any) {
        AddExceptionIntoDB(req,error);
        return exceptionHandler(res, 1, error.message);
    }
};

const getUnitController = async (req: Request, res: Response) => {
    try {
        let requestQuery = req.query;
        // #swagger.tags = ['Master-Get']
        // #swagger.description = 'Pass unitId and statusEnumId'

        /*#swagger.parameters[ {
                        "name": "unitId",
                        "in": "query",
                        "description": "unitId",
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
        let unitArray = [];
        const Data: any = await MasterServices.getUnit(requestQuery);
        for (let row of Data.rows) {
            unitArray.push({
                unitId: row.id,
                unitName: row.unit_name,
                statusEnumId: row.status_enum_id,
                statusName: row.status_name,
                remarks: row.remarks,
                actionRemarks: row.action_remarks,
                createdOnDate: row.createdon_date,
                createdByLoginUserId: row.createdby_login_user_id,
                createdByUserName: row.created_by_user_name,
                createdByUserTypeEnumId: row.createdby_user_type_enum_id,
                createdByUserTypeName: row.created_by_user_type_name,
                updatedLoginUserId: row.updated_login_user_id,
                updatedLoginUserName: row.updated_login_user_name,
                updatedOnDate: row.updatedon_date,
                updatedByUserTypeEnumId: row.updatedby_user_type_enum_id,
                updatedByUserTypeName: row.updated_by_user_type_name
            });
        }
        if (Data.rows.length == 0) {
            return RequestResponse.success(res, apiMessage.dataNotAvailable, status.info, []);
        } else {
            return RequestResponse.success(res, apiMessage.success, status.success, unitArray);
        }
    } catch (error: any) {
        AddExceptionIntoDB(req,error);
        return exceptionHandler(res, 1, error.message);
    }
};

const getVehicleModelController = async (req: Request, res: Response) => {
    try {
        let requestQuery = req.query;
        // #swagger.tags = ['Master-Get']
        // #swagger.description = 'Pass VehicleId and statusEnumId'

        /*#swagger.parameters[ {
                        "name": "VehicleId",
                        "in": "query",
                        "description": "VehicleId",
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
        let Data: any;
        let vehicleObject: any = requestQuery.VehicleId;
        let result: any = JSON.parse(vehicleObject);
        let getProduceBikeStatus: any;
        let bikeStatus :any ;
        let bikeStatusEnumName :any ;
        let bike :any='0' ;
        if(CommonMessage.IsValid(result.bikeId) ==true)
               {
                bike=result.bikeId;
               }       
         let checkTimeData :any={} ;
        let getLastMinRecharge:any =0 ;
        let minimumDepositAmountEnmTbl :any =0;

        let getLastMinRechargeAmountTbl :any = await RideBooking.getLastMinRechargeAmountTbl();// wallet amount == recharge amount
    
        if (getLastMinRechargeAmountTbl.rowCount <=0)        
        {                
            getLastMinRecharge =0 ;          
        }else{
            getLastMinRecharge =(getLastMinRechargeAmountTbl.rows[0].enum_key).toFixed(2);
        }        
         
        
 let getLastDepositAmountEnumTbl :any = await RideBooking.getLastDepositAmount();// deposit amount = advance amount

if (getLastDepositAmountEnumTbl.rowCount <=0)        
{        
    minimumDepositAmountEnmTbl = 0        
}else{
    minimumDepositAmountEnmTbl =(getLastDepositAmountEnumTbl.rows[0].enum_key).toFixed(2);
}
 


        if (result.vehicleId) {
            let objectData = { VehicleId: result.vehicleId, statusEnumId: requestQuery.statusEnumId };
            getProduceBikeStatus = await ProduceBike.getBikeReservedUnReservedStatus({ vehicleId: result.vehicleId, uId: result.uId, lockId: result.lockId });

            

            Data =   await MasterServices.getVehicleModel(objectData);//let result :any  = await MasterServices.getVehicleModelService(requestQuery); 

            
        } else {
            Data = await MasterServices.getVehicleModel(requestQuery);
        }


        let vehicleModelArray = [];

        for (let row of Data.rows) {
            bikeStatus =''; 
            bikeStatusEnumName='';
            if(getProduceBikeStatus != null && getProduceBikeStatus.rowsCount > 0) 
             {
                bikeStatus = (getProduceBikeStatus?.rows[0].bike_booked_status);
                bikeStatusEnumName = (getProduceBikeStatus?.rows[0].enum_key)
             }

            let lockId = { lockId: result.lockId };
            let getLockDetails :any= await inwardServices.getLockDetails(lockId);

           
          
            let vehicleImage = await MasterServices.getImagesOfVehicle({ VehicleId: row.id });
            let vehicleAdminMoileImage:any = await MasterServices.getAdminAndMobileImagesOfVehicle({ VehicleId: row.id }); 

            let farePlanDadte :any ;
       
        if(result.lockId > 0)
        {
             farePlanDadte  =await rideBookingValidationsControllerForCheckFarePlan(bike,res,req)
            if(farePlanDadte==false)
          {   
              return;           
          }          
        }
      

            vehicleModelArray.push({
                vehicleId: row.id,
                vehicleType: row.vehicle_type,
                vehicleTypeName: row.vehicle_type_name,
                modelName: row.model_name,
                brakesType: row.brackes_type,
                brandName: row.brand_name,
                frameType: row.frame_type,
                tiersSize: row.tiers_size,                
                length: row.lenght,
                lengthUnit: row.length_unit,
                width: row.width,
                widthUnit: row.width_unit,
                weight: row.weight,
                weightUnit: row.weight_unit,
                height: row.height,
                heightUnit: row.height_unit,
                statusEnumId: row.status_enum_id,
                statusName: row.status_name,
             
                remarks: row.remarks,
                actionRemarks: row.action_remarks,
                createdOnDate: row.createdon_date,
                createdByLoginUserId: row.createdby_login_user_id,
                createdByUserName: row.created_by_user_name,
                createdByUserTypeEnumId: row.createdby_user_type_enum_id,
                createdByUserTypeName: row.created_by_user_type_name,
                updatedLoginUserId: row.updated_login_user_id,
                updatedLoginUserName: row.updated_login_user_name,
                updatedOnDate: row.updatedon_date,
                updatedByUserTypeEnumId: row.updatedby_user_type_enum_id,
                updatedByUserTypeName: row.updated_by_user_type_name,
                lockDetails: getLockDetails,
                bikeBookedStatus: bikeStatus,
                bikeBookedStatusName: bikeStatusEnumName,// (bikeStatus =='' ? bikeStatus: (bikeStatus == '13' ? 'reserved' : 'unReserved')),
                
                min_wallet_amount : row.min_wallet_amount ,
                farePlanData :farePlanDadte ,
                vehicleImage: vehicleImage,
                mobileImageArray : vehicleAdminMoileImage.mobileImageArray	, 
                adminImageArray : vehicleAdminMoileImage.adminImageArray ,
                maxRangeOn100PercentageBatteryKM : row.max_range_100_battery_in_km ,
                minimumRechargeAmount:getLastMinRecharge,
                minimumDepositAmount :minimumDepositAmountEnmTbl
                
            });
        }
        //     await setMemcached('getVehicleModel', vehicleModelArray);
        // }
        if (Data.length == 0) {
            return RequestResponse.success(res, apiMessage.dataNotAvailable, status.info, []);
        } else {
            return RequestResponse.success(res, apiMessage.success, status.success, vehicleModelArray);
        }
    } catch (error: any) {
        AddExceptionIntoDB(req,error);

        return exceptionHandler(res, 1, error.message);
    }
};


const rideBookingValidationsControllerForCheckFarePlan = async (requestBody:any,res: Response, req :any) => {  
    try {                      
       let bike =requestBody;
       
        let bikeresult: any = await RideBooking.getBikeDetails({bike}); 
        let data: any =[];             
        if(bikeresult.rowCount <=0)
        {
             RequestResponse.validationError(res, 'this bike is not found01.', status.success, []); 
             return false;           
        }
        data.modelId = bikeresult.rows[0].model_id;
        data.lockId =bikeresult.rows[0].lock_id;
        data.uId  =bikeresult.rows[0].uid_id;       
        data.zoneId = bikeresult.rows[0].zone_id;

    //     console.log('check model id  requestBody.modelId',data.modelId)
    //   let zoneResult: any = await RideBooking.getZoneForRideBooking(data);        
    //   if(zoneResult.rowCount <=0)
    //   {
    //        RequestResponse.unauthorized(res, 'For this bike zone is not found.', status.success, []); 
    //        return false;           
    //   }
    //   data.zoneId = zoneResult.rows[0].zone_id;


      let areaAndAreaTypeResult: any = await RideBooking.getAreaAndAreaType(data);    
      if(areaAndAreaTypeResult.rowCount <=0)
      {
           RequestResponse.validationError(res, 'For this  zone area is not found.', status.success, []); 
           return false;           
      }          
      data.areaId = areaAndAreaTypeResult.rows[0].area_id;
      data.cityId = areaAndAreaTypeResult.rows[0].map_city_id;
      data.areaTypeEnumId = areaAndAreaTypeResult.rows[0].area_type_enum_id; 
      data.apDate =  getUTCdate();                            
      data.aplicableDate = getUTCdate()
      if(data.areaTypeEnumId=='30')
      {
        data.areaId = 0;
      }
      
      let farePlanResultesult: any = await RideBooking.getFarePlanDataForRideBooking(data); 
      
      //console.log('check data farePlanResultesult',farePlanResultesult)
      if(farePlanResultesult.rowCount <=0)
      {
           RequestResponse.validationError(res, 'For this bike no plan availale.', status.success, []); 
           return false;           
      }
      let todayRate :any =0;
      let farePlanDetail :any =[];


      if(Dateformats.ConvertUTCtoDayformat() =='Monday')
      {
       if( farePlanResultesult.rows[0].per_minute_rate_monday ==null || farePlanResultesult.rows[0].per_minute_rate_monday < 0 ) 
       {
        RequestResponse.validationError(res, 'For this Day No Plan Activate.', status.success, []); 
           return false; 
       }
         todayRate = farePlanResultesult.rows[0].per_minute_rate_monday;

      }


      if(Dateformats.ConvertUTCtoDayformat() =='Tuesday')
      {
        if(farePlanResultesult.rows[0].per_minute_rate_tuesday ==null || farePlanResultesult.rows[0].per_minute_rate_tuesday < 0 ) 
        {
           RequestResponse.validationError(res, 'For this Day No Plan Activate.', status.success, []); 
            return false;
        }
        todayRate = farePlanResultesult.rows[0].per_minute_rate_tuesday;
      }

      if(Dateformats.ConvertUTCtoDayformat() =='Wednesday')
      {
        if(farePlanResultesult.rows[0].per_minute_rate_wednesday ==null || farePlanResultesult.rows[0].per_minute_rate_wednesday < 0 ) 
        {
           RequestResponse.validationError(res, 'For this Day No Plan Activate.', status.success, []); 
            return false;
        }
        todayRate = farePlanResultesult.rows[0].per_minute_rate_wednesday;
      }
      

      if(Dateformats.ConvertUTCtoDayformat() =='Thursday')
      {
        if(farePlanResultesult.rows[0].per_minute_rate_thursday ==null || farePlanResultesult.rows[0].per_minute_rate_thursday < 0 ) 
        {
           RequestResponse.validationError(res, 'For this Day No Plan Activate.', status.success, []); 
            return false;
        }
        todayRate = farePlanResultesult.rows[0].per_minute_rate_thursday;
      }

      
      if(Dateformats.ConvertUTCtoDayformat() =='Friday')
      {
        if(farePlanResultesult.rows[0].per_minute_rate_friday ==null || farePlanResultesult.rows[0].per_minute_rate_friday < 0 ) 
        {
           RequestResponse.validationError(res, 'For this Day No Plan Activate.', status.success, []); 
            return false;
        }
        todayRate = farePlanResultesult.rows[0].per_minute_rate_friday;
      }


      if(Dateformats.ConvertUTCtoDayformat() =='Saturday')
      {
        if(farePlanResultesult.rows[0].per_minute_rate_saturday ==null || farePlanResultesult.rows[0].per_minute_rate_saturday < 0 ) 
        {
           RequestResponse.validationError(res, 'For this Day No Plan Activate.', status.success, []); 
            return false;
        }
        todayRate = farePlanResultesult.rows[0].per_minute_rate_saturday;
      }

      if(Dateformats.ConvertUTCtoDayformat() =='Sunday')
      {
        if(farePlanResultesult.rows[0].per_minute_rate_sunday ==null || farePlanResultesult.rows[0].per_minute_rate_sunday < 0 ) 
        {
           RequestResponse.validationError(res, 'For this Day No Plan Activate.', status.success, []); 
            return false;
        }
        todayRate = farePlanResultesult.rows[0].per_minute_rate_sunday;
      }
      
     
      farePlanDetail.push({
             farePlanId         : Number(farePlanResultesult.rows[0].id),
             minimumHireMinuts  : Number(farePlanResultesult.rows[0].hire_minuts),             
             todaysRate : (todayRate),
      })
          
    // RequestResponse.success(res, 'check success.', status.success,farePlanDetail); 
     return  farePlanDetail; 
    } catch (error: any) {
        AddExceptionIntoDB(req,error);
        return exceptionHandler(res, 1, error.message);
    }
};






const addUpdateVehicleModelDetailsController = async (req: Request, res: Response) => {
    try {
        /* 	#swagger.tags = ['Master-Post']
              #swagger.description = 'Only user can add type all Parameter are mandatory in swagger for testing purpose' */

        /*	#swagger.parameters['obj'] = {
                    in: 'body',
                    description: 'add add update zone details.',
                    required: true,
                    schema: { $ref: "#/definitions/addUpdateVehicleModelDetailsController" }
            } */

        /* #swagger.security = [{
                    "apiKeyAuth": []
            }] */
        let requestBody = req.body;

        let result: any;
        let validation = await vehicleValidation(requestBody);
        if (validation) {
            return RequestResponse.validationError(res, validation, status.error, []);
        }
        if(requestBody.vehicleImage.length >3){
            return RequestResponse.validationError(res, 'you can Not Upload More Then Three Images.', status.error, []);
     
        }

        result = await MasterServices.addUpdateVehicleModel(requestBody);

        if (result.rows[0].fp_output_result === adminMessage.success && requestBody.vehicleId === 0) {
            requestBody.vehicleId = result.rows[0].fp_vehicle_model_id;

            await MasterServices.deleteUnUsedImageOfVehicle(requestBody);

            result = await MasterServices.addImagesOfVehicle(requestBody);
            if (result) {
                return RequestResponse.success(res, apiMessage.addVehicleDetails, status.success, [{ vehicleId: requestBody.vehicleId }]);
            } else {
                return RequestResponse.success(res, 'Vehicle Details Added But Image Are Not Saved.', status.success, [{ vehicleId: requestBody.vehicleId }]);
            }
        } else if (result.rows[0].fp_output_result === adminMessage.success && requestBody.vehicleId > 0) {
            await MasterServices.deleteUnUsedImageOfVehicle(requestBody);

            result = await MasterServices.addImagesOfVehicle(requestBody);
            if (result) {
                return RequestResponse.success(res, apiMessage.updateVehicleDetails, status.success, [{ vehicleId: requestBody.vehicleId }]);
            } else {
                return RequestResponse.success(res, 'Vehicle Details Updated But Image Are Not Saved.', status.success, [{ vehicleId: requestBody.vehicleId }]);
            }
        } else if (result.rows[0].fp_output_result === adminMessage.checkDuplicateData) {
            return RequestResponse.validationError(res, apiMessage.VehicleAlreadyExist, status.error, []);
        } else {
            return RequestResponse.success(res, apiMessage.recordNotFound, status.success, []);
        }
    } catch (error: any) {
        AddExceptionIntoDB(req,error);
        return exceptionHandler(res, 1, error.message);
    }
};
const getVehicleListController = async (req: Request, res: Response) => {
    try {
        /* 	#swagger.tags = ['Master-Get']
              #swagger.description = 'Only user can add type all Parameter are mandatory in swagger for testing purpose' */

        let requestQuery = req.query;
        let result: any;

        result = await MasterServices.getVehicleList(requestQuery);
        let vehicleArray: any = [];
        for (let row of result.rows) {
            vehicleArray.push({
                vehicleId: row.id,
                modelName: row.model_name,
                vehicle_type : row.vehicle_type,
                vehicle_type_name : row.vehicle_type_name
            });
        }
        if (result) {
            return RequestResponse.success(res, apiMessage.success, status.success, vehicleArray);
        } else {
            return RequestResponse.success(res, apiMessage.recordNotFound, status.success, []);
        }
    } catch (error: any) {
        AddExceptionIntoDB(req,error);

        return exceptionHandler(res, 1, error.message);
    }
};
const getZoneListController = async (req: Request, res: Response) => {
    try {
        let requestQuery = req.query;
        // #swagger.tags = ['Master-Get']
        // #swagger.description = 'zone list'

        const Data: any = await MasterServices.getZoneList(requestQuery);

        if (Data.rows.length == 0) {
            return RequestResponse.success(res, apiMessage.dataNotAvailable, status.info, []);
        } else {
            return RequestResponse.success(res, apiMessage.success, status.success, Data.rows);
        }
    } catch (error: any) {
        AddExceptionIntoDB(req,error);

        return exceptionHandler(res, 1, error.message);
    }
};


const getVehicleTypeListController = async (req: Request, res: Response) => {
    try {
        /* 	#swagger.tags = ['Master-Get']
              #swagger.description = 'Only user can add type all Parameter are mandatory in swagger for testing purpose' */

        let requestQuery = req.query;
        let result: any;

        result = await MasterServices.getVehicleTypeList(requestQuery);
        
        let vehicleArray: any = [];
        if (result.rowCount > 0) 
        {
        for (let row of result.rows) {
            vehicleArray.push({               
                vehicle_type : row.id,
                vehicle_type_name : row.name
            });
        }
       
    return RequestResponse.success(res, apiMessage.success, status.success, vehicleArray);
        } 
        else {
            return RequestResponse.success(res, apiMessage.recordNotFound, status.success, []);
        }
    } catch (error: any) {
        AddExceptionIntoDB(req,error);

        return exceptionHandler(res, 1, error.message);
    }
};





const getMapCity = async (req: Request, res: Response) => {
    try {
        // #swagger.tags = ['Admin-Bike-Produce']
        // #swagger.description = 'Pass bikeProduceId or 0  and status_enum_id = 0  '

      
        /*#swagger.parameters[ {
                        "name": "statusEnumId",
                        "in": "query",
                        "description": "statusEnumId",
                        "required": true,
                        "type": "integer"
                    }]
                     
        } */

        let requestQuery = req.query;
        let result: any = await masterServices.getMapCity(requestQuery);        
        let data = [];
        for (let row of result.rows) {
            data.push({
                mapCityId: row.map_city_id,    
                mapCityName : row.map_city_name,            

            });
        }

        if (result.rowCount > 0) {
            return RequestResponse.success(res, apiMessage.success, status.success, data);
        } else {
            return RequestResponse.success(res, apiMessage.recordNotFound, status.success, []);
        }
    } catch (error: any) {
        AddExceptionIntoDB(req,error);
        return exceptionHandler(res, 1, error.message);
    }
};


const getMapState = async (req: Request, res: Response) => {
    try {
        // #swagger.tags = ['Admin-Bike-Produce']
        // #swagger.description = 'Pass bikeProduceId or 0  and status_enum_id = 0  '

      
        /*#swagger.parameters[ {
                        "name": "statusEnumId",
                        "in": "query",
                        "description": "statusEnumId",
                        "required": true,
                        "type": "integer"
                    }]
                     
        } */

        let requestQuery = req.query;
        let result: any = await masterServices.getMapState(requestQuery);        
        let data = [];
        for (let row of result.rows) {
            data.push({
                mapStateId: row.map_state_id,    
                mapStateName : row.map_state_name,            

            });
        }

        if (result.rowCount > 0) {
            return RequestResponse.success(res, apiMessage.success, status.success, data);
        } else {
            return RequestResponse.success(res, apiMessage.recordNotFound, status.success, []);
        }
    } catch (error: any) {
        AddExceptionIntoDB(req,error);
        return exceptionHandler(res, 1, error.message);
    }
};

const getMapCountry = async (req: Request, res: Response) => {
    try {
        // #swagger.tags = ['Admin-Bike-Produce']
        // #swagger.description = 'Pass bikeProduceId or 0  and status_enum_id = 0  '

      
        /*#swagger.parameters[ {
                        "name": "statusEnumId",
                        "in": "query",
                        "description": "statusEnumId",
                        "required": true,
                        "type": "integer"
                    }]
                     
        } */        
        let result: any = await masterServices.getMapCountry();        
        let data = [];
        for (let row of result.rows) {
            data.push({
                mapCountryId: row.map_country_id,    
                mapCountryName : row.map_country_name,            

            });
        }

        if (result.rowCount > 0) {
            return RequestResponse.success(res, apiMessage.success, status.success, data);
        } else {
            return RequestResponse.success(res, apiMessage.recordNotFound, status.success, []);
        }
    } catch (error: any) {
        AddExceptionIntoDB(req,error);
        return exceptionHandler(res, 1, error.message);
    }
};

const insertVehicleModelDetailsController = async (req: Request, res: Response) => {
    try {
        let requestBody = req.body;
                   
        let validation :any = await ValidationsVehicleModel(requestBody,res, req);

        if (validation == false) 
        {     
            return ;
        }
       if(requestBody.vehicleId =='0')
       {
        
          await insertVehicleModelDetails(requestBody,res, req);
       }
       else 
       {
        
         await updateVehicleModelDetails(requestBody,res, req);
       }

    } catch (error: any) {
        AddExceptionIntoDB(req,error);
        return exceptionHandler(res, 1, error.message);
    }
};

// const setDeviceInstructionLightOnOffController = async (requestQuery: any, res: Response) => {
//     let lightRequetFrom :any ='LightOffOnRequestFromLightOnOffController';
//     requestQuery.instructionLastUpdateDate =getUTCdate();
//     try {

//         console.log('check setDeviceInstructionLightOnOffController',requestQuery)
              
//         if (CommonMessage.IsValid(requestQuery.deviceId) == false) {
//             console.log('check 2833')
//             if(requestQuery.lightRequetFrom==lightRequetFrom)
//             {
//              RequestResponse.validationError(res, apiMessage.deviceSetId, status.error, []);
//             }
//             return false;
//         }
//         if (CommonMessage.IsValid(requestQuery.userId) == false) {
//             console.log('check 2841')
//             if(requestQuery.lightRequetFrom==lightRequetFrom)
//             {
//             console.log('check 2844')
//              RequestResponse.validationError(res, apiMessage.userSetId, status.error, []);
//              return false
//             }
//             console.log('check 2847',)
            

//            let getVerifyT : any = await getTokenDetail(requestQuery.access_token);
//            console.log('getVerifyT',getVerifyT)
//             if(getVerifyT != null)
//             {
//                 console.log('requestQuery.userId',requestQuery.userId)
//                 requestQuery.userId = getVerifyT.id ;
//             }          
//             else
//             {
//                 console.log('esle njsfnjsfhjksfjk',requestQuery.userId)
//                 return true;
//             }
            
//         }
//         let getLockIdByLockNumber: any = await adminLogDeviceInformationServices.getLockIdByLockNumberService(requestQuery);

//         if (getLockIdByLockNumber.rowCount == 0)
//         {           
//             RequestResponse.validationError(res, apiMessage.lockNotAvailable, status.error, []);
//             return false;
//         }

//         console.log('check 28359')
       
     
//         if (getLockIdByLockNumber.rows[0].device_light_instruction_enum_id == requestQuery.instructionDeviceLightInstructionEnumId) {
            
//             if(requestQuery.lightRequetFrom==lightRequetFrom)
//             {
//             console.log('check instruction intractionsAlready')
//             RequestResponse.validationError(res, apiMessage.intractionsAlready, status.error, []);
//             return false;
//             }
//             else
//             {            
//              return true ;  // If light is already off then below code skip ( this function call from device lock and ride end).
//             }   
           
//         }
//         requestQuery.lockId = getLockIdByLockNumber.rows[0].id;
//         requestQuery.createdonDate = getUTCdate()

//         let result: any;

//         let rideingIdResult: any = await adminLogDeviceInformationServices.getRideingIdByLockNumberService(requestQuery);

//         if (rideingIdResult.rowCount > 0) {            
//             requestQuery.rideBookingId = rideingIdResult.rows[0].id;                               
//         }
//         else {
//             requestQuery.rideBookingId = '0';
//         }
        

//     } catch (error: any) {
//         logger.error(error.message);        
//         exceptionHandler(res, 1, error.message);
//         return false;
//     }
// };

const insertVehicleModelDetails = async (requestBody: any, res: Response, req :any ) => {
    try {
        /* 	#swagger.tags = ['Master-Post']
              #swagger.description = 'Only user can add type all Parameter are mandatory in swagger for testing purpose' */

        /*	#swagger.parameters['obj'] = {
                    in: 'body',
                    description: 'add add update zone details.',
                    required: true,
                    schema: { $ref: "#/definitions/addUpdateVehicleModelDetailsController" }
            } */

        /* #swagger.security = [{
                    "apiKeyAuth": []
            }] */
        
                   
        let result: any;
                                        
        client
        .query('BEGIN')
        .then(async (res) => {

            result = result = await MasterServices.insertVehicleModel(requestBody);
            requestBody.vehicleId = result.rows[0].id ;
            return result;
        })
        .then(async (res) => {
            requestBody.mobileImageArray.imageFor= '79'
            for(let i=0; i< requestBody.mobileImageArray.length; i++) 
            {               
                requestBody.mobileImageArray[i].imageFor ='79';
                //console.log('check image array mobile',requestBody.mobileImageArray[i].imageFor)
                    result = await MasterServices.insertVehicleImages(requestBody.mobileImageArray[i],requestBody);                
            }
            return result;
        })

        .then(async (res) => {              
             //console.log('check image array admin',requestBody.adminImageArray.imageFor)
            for(let i=0; i< requestBody.adminImageArray.length; i++) 
            {            
                requestBody.adminImageArray[i].imageFor ='78';
                result = await MasterServices.insertVehicleImages(requestBody.adminImageArray[i],requestBody);               
            }
            return result;
        })
        .then((res) => {
            return client.query('commit');
        })
        .then((r) => {
            if (result.rowCount > 0) 
            {                
                RequestResponse.success(res, apiMessage.addVehicleDetails, status.success, []);                                                                           
                return true ;                                      
            } 
            else 
            {                 
                 RequestResponse.success(res, apiMessage.somethingWentWrong, status.info, []);                    
                 return false;
            }
        })
        .catch((err) => {
            client.query('rollback');   
            AddExceptionIntoDB(req,err);             
                exceptionHandler(res, 1, err.message);                
            return  false 
        })
        .catch((err) => {
            AddExceptionIntoDB(req,err);
             exceptionHandler(res, 1, err.message);                
            return false 
        });
        

    } catch (error: any) {
        AddExceptionIntoDB(req,error);

        return exceptionHandler(res, 1, error.message);
    }
};


const updateVehicleModelDetails = async (requestBody: any, res: Response, req :any) => {
    try {
        /* 	#swagger.tags = ['Master-Post']
              #swagger.description = 'Only user can add type all Parameter are mandatory in swagger for testing purpose' */

        /*	#swagger.parameters['obj'] = {
                    in: 'body',
                    description: 'add add update zone details.',
                    required: true,
                    schema: { $ref: "#/definitions/addUpdateVehicleModelDetailsController" }
            } */

        /* #swagger.security = [{
                    "apiKeyAuth": []
            }] */       
        let result: any;
        
        let validation :any = await ValidationsVehicleModel(requestBody,res,req);

        if (validation == false) 
        {     
            return ;
        }                                   
      
        client
        .query('BEGIN')
        .then(async (res) => {

            result = await MasterServices.updateVehicleModel(requestBody);  
            return result;
        })
        .then(async (res) => {
            if(requestBody.mobileImageArray.length>0 || requestBody.adminImageArray.length >0)
            {            
            result = await MasterServices.deactiveImageOfVehicle(requestBody);
            return result;
            }
        })

        .then(async (res) => {

            if(requestBody.mobileImageArray.length>0)
            {
            for(let i=0; i< requestBody.mobileImageArray.length; i++) 
            {
                
                requestBody.mobileImageArray[i].imageFor ='79';

                if(requestBody.mobileImageArray[i].imageId ==0)
                {
                    
                    result = await MasterServices.insertVehicleImages(requestBody.mobileImageArray[i],requestBody);
                }
                else 
                {
                    
                    result = await MasterServices.updateVehicleImages(requestBody.mobileImageArray[i],requestBody);    
                }
            }
            return result;
        }
        })

        .then(async (res) => {

            if(requestBody.adminImageArray.length > 0)
            {
            for(let i=0; i< requestBody.adminImageArray.length; i++) 
            {
                
                requestBody.adminImageArray[i].imageFor ='78';
                if(requestBody.adminImageArray[i].imageId ==0)
                {
                    result = await MasterServices.insertVehicleImages(requestBody.adminImageArray[i],requestBody);
                }
                else 
                {
                    result = await MasterServices.updateVehicleImages(requestBody.adminImageArray[i],requestBody);    
                }
            }
            return result;
        }
        })
        .then((res) => {
            return client.query('commit');
        })
        .then((r) => {
            if (result.rowCount > 0) {              
                RequestResponse.success(res, apiMessage.updateVehicleDetails, status.success, []);                                                                          
                return true ;                                      
            } else {                 
                 RequestResponse.success(res, apiMessage.somethingWentWrong, status.info, []);                    
                 return false;
            }
        })
        .catch((err) => {
            client.query('rollback');     
            AddExceptionIntoDB(req,err);           
                exceptionHandler(res, 1, err.message);                
            return  false 
        })
        .catch((err) => {
            AddExceptionIntoDB(req,err);
             exceptionHandler(res, 1, err.message);                
            return false 
        });
        

    } catch (error: any) {
        AddExceptionIntoDB(req,error);

        return exceptionHandler(res, 1, error.message);
    }
};



const getVehicleModelDetails = async (req: Request, res: Response) => {
    try {
        // #swagger.tags = ['Admin-Bike-Produce']
        // #swagger.description = 'Pass bikeProduceId or 0  and status_enum_id = 0  '

      
        /*#swagger.parameters[ {
                        "name": "statusEnumId",
                        "in": "query",
                        "description": "statusEnumId",
                        "required": true,
                        "type": "integer"
                    }]
                     
        } */        
        let requestQuery =req.query;
        requestQuery.statusEnumId = '1';
        let result :any  = await MasterServices.getVehicleModelService(requestQuery, req); 
           
        let data = [];
        for (let row of result.rows) {
            let vehicleImage:any = await MasterServices.getAdminAndMobileImagesOfVehicle({ VehicleId: row.id }); 

     
            data.push({
                vehicleId :row.id ,
                modelName : row.model_name,
                brandName  : row.brand_name,
                companyName : row.company_name,       
               vehicleType  : row.vehicle_type,	
               	
               vehicleTypeName : row.vehicle_type_name,	
               breakType  : row.break_type,	
               breakTypeNameJson : row.break_type_name_json,
               
               
               breakTypeName  : row.break_type_name,	
               batteryType : row.battery_type_enum_ids,	
               batteryTypeNameJson : row.battery_type_name_json, 
               //batteryTypeName : row.battery_type_name,	 
               frameType : row.frame_type_enum_ids,
               frameTypeName : row.fram_type_name,
               batteryCapacityAh : row.battery_capacity_ah,
               batteryCapacityVolt : row.battery_capacity_volt,
               accesarries : row.accesarries_enum_ids,	
              // accesarriesName : row.accesarries_name,	
               asaccesarriesNameJson : row.asaccesarries_name_json,
               color : row.color,
               motorType  : row.motor_type,     
               statusEnumId  : row.status_enum_id,    
               statusName : row.status_name,    
               remarks : row.remarks,
               createdByUserName : row.created_by_user_name,
               createdbyLoginUserId : row.createdby_login_user_id ,
               createdonDate : row.createdon_date,
               mobileImageArray : vehicleImage.mobileImageArray	, 
               adminImageArray : vehicleImage.adminImageArray   ,
               maxRangeOn100PercentageBatteryKM :  row.max_range_100_battery_in_km                      

            });
        }

        if (result.rowCount > 0) {
            return RequestResponse.success(res, apiMessage.success, status.success, data);
        } else {
            return RequestResponse.success(res, apiMessage.recordNotFound, status.success, []);
        }
    } catch (error: any) {
        AddExceptionIntoDB(req,error);
        return exceptionHandler(res, 1, error.message);
    }
};



const getVehicleModelDetailsForTable = async (req: Request, res: Response) => {
    try {
        // #swagger.tags = ['Admin-Bike-Produce']
        // #swagger.description = 'Pass bikeProduceId or 0  and status_enum_id = 0  '

      
        /*#swagger.parameters[ {
                        "name": "statusEnumId",
                        "in": "query",
                        "description": "statusEnumId",
                        "required": true,
                        "type": "integer"
                    }]
                     
        } */        
        let requestQuery =req.query;
        requestQuery.statusEnumId = '1';
        let result :any  = await MasterServices.getVehicleModelService(requestQuery, req); 
           
        let data = [];
        for (let row of result.rows) {
           // let vehicleImage:any = await MasterServices.getAdminAndMobileImagesOfVehicle({ VehicleId: row.id });      
            data.push({
                vehicleId :row.id ,
                modelName : row.model_name,
                brandName  : row.brand_name,
                companyName : row.company_name,       
               vehicleType  : row.vehicle_type,	
               	
               vehicleTypeName : row.vehicle_type_name,	
               breakType  : row.break_type,	
               breakTypeNameJson : row.break_type_name_json,
               
               
               breakTypeName  : row.break_type_name,	
               batteryType : row.battery_type_enum_ids,	
               batteryTypeNameJson : row.battery_type_name_json, 
               //batteryTypeName : row.battery_type_name,	 
               frameType : row.frame_type_enum_ids,
               frameTypeName : row.fram_type_name,
               batteryCapacityAh : row.battery_capacity_ah,
               batteryCapacityVolt : row.battery_capacity_volt,
               accesarries : row.accesarries_enum_ids,	
              // accesarriesName : row.accesarries_name,	
               asaccesarriesNameJson : row.asaccesarries_name_json,
               color : row.color,
               motorType  : row.motor_type,     
               statusEnumId  : row.status_enum_id,    
               statusName : row.status_name,    
               remarks : row.remarks,
               createdByUserName : row.created_by_user_name,
               createdbyLoginUserId : row.createdby_login_user_id ,
               createdonDate : row.createdon_date ,
               createdOnDate : row.createdon_date,
               updatedOnDate  : row.updatedon_date,
               maxRangeOn100PercentageBatteryKM : row.max_range_100_battery_in_km                                 

            });
        }

        if (result.rowCount > 0) {
            return RequestResponse.success(res, apiMessage.success, status.success, data);
        } else {
            return RequestResponse.success(res, apiMessage.recordNotFound, status.success, []);
        }
    } catch (error: any) {   

        AddExceptionIntoDB(req,error);

        return exceptionHandler(res, 1, error.message);
        
    }
};

const getImagesBase64Service = async (req: Request, res: Response) => {
    try {
        // #swagger.tags = ['Admin-Bike-Produce']
        // #swagger.description = 'Pass bikeProduceId or 0  and status_enum_id = 0  '

      
        /*#swagger.parameters[ {
                        "name": "statusEnumId",
                        "in": "query",
                        "description": "statusEnumId",
                        "required": true,
                        "type": "integer"
                    }]
                     
        } */        
        let requestQuery =req.query;
        requestQuery.statusEnumId = '1';
        let result :any  = await MasterServices.getImagesBase64Service(requestQuery); 
           
        let data = [];
        for (let row of result.rows) {
           // let vehicleImage:any = await MasterServices.getAdminAndMobileImagesOfVehicle({ VehicleId: row.id });      
            data.push({
                            id: row.id,                            
                            image_name: row.image_name,
                            image_unique_name: row.image_unique_name,
                            image_unique_signed_url: gets3SignedUrls(row.image_unique_name),
                            status_enum_id: row.status_enum_id,                            
                            image_for : row.image_for,                                  
            });
        }

        if (result.rowCount > 0) {
            return RequestResponse.success(res, apiMessage.success, status.success, data);
        } else {
            return RequestResponse.success(res, apiMessage.recordNotFound, status.success, []);
        }
    } catch (error: any) {
        
         AddExceptionIntoDB(req,error);
       return  exceptionHandler(res, 1, error.message);
    }
};

const ValidationsVehicleModel = async (requestBody :any, res: Response, req :any) => {
    try {
        /* 	#swagger.tags = ['Master-Post']
              #swagger.description = 'Only user can add type all Parameter are mandatory in swagger for testing purpose' */

        /*	#swagger.parameters['obj'] = {
                    in: 'body',
                    description: 'add add update zone details.',
                    required: true,
                    schema: { $ref: "#/definitions/addUpdateVehicleModelDetailsController" }
            } */

        /* #swagger.security = [{
                    "apiKeyAuth": []
            }] */
        
     
        if(CommonMessage.IsValid(requestBody.vehicleId)==false)
        {
             RequestResponse.success(res, 'Please enter valid vehicle id', status.error, []);  
             return false ; 
        }

        if(CommonMessage.IsValid(requestBody.modelName)==false)
        {
             RequestResponse.success(res, 'Please enter valid model name', status.error, []);   
             return false ;
        }

        if(CommonMessage.IsValid(requestBody.brandName)==false)
        {
             RequestResponse.success(res, 'Please enter valid brand name', status.error, []);   
             return false ;
        }
      

        if(CommonMessage.IsValid(requestBody.vehicleType)==false)
        {
             RequestResponse.success(res, 'Please enter valid vehicle type', status.error, []);   
             return false ;
        }


        if(CommonMessage.IsValid(requestBody.brakeType)==false)
        {
             RequestResponse.success(res, 'Please enter valid brake type', status.error, []);   
             return false ;
        }

        if(CommonMessage.IsValid(requestBody.batteryType)==false)
        {
             RequestResponse.success(res, 'Please enter valid battery type', status.error, []); 
             return false ;  
        }
        if(CommonMessage.IsValid(requestBody.accessories)==false)
        {
             RequestResponse.success(res, 'Please enter valid accesarries', status.error, []);   
             return false ;
        }
     
        if(CommonMessage.IsValid(requestBody.frameType)==false)
        {
             RequestResponse.success(res, 'Please enter valid fram type', status.error, []); 
            return false ;  
        }
        if(CommonMessage.IsValid(requestBody.batteryCapacityAh)==false)
        {
            return RequestResponse.success(res, 'Please enter valid batteryCapacityAh', status.error, []);   
        }
        if(CommonMessage.IsValid(requestBody.batteryCapacityVolt)==false)
        {
             RequestResponse.success(res, 'Please enter valid batteryCapacityVolt', status.error, []);
             return false ;   
        }
              
        if(CommonMessage.IsValid(requestBody.color)==false)
        {
             RequestResponse.success(res, 'Please enter valid color', status.error, []);   
            return false ;
        }
      
        if(CommonMessage.IsValid(requestBody.statusEnumId)==false)
        {
         RequestResponse.success(res, 'Please enter valid status Eenum id', status.error, []);   
            return false ;
        }
        
  
        if(CommonMessage.IsValid(requestBody.actionByLoginUserId)==false)
        {
             RequestResponse.success(res, 'Please enter valid actionByLoginUserId', status.error, []);
             return false ;   
        }
        if(CommonMessage.IsValid(requestBody.maxRangeOn100PercentageBatteryKM)==false)
        {
             RequestResponse.success(res, 'Please enter valid maxRangeOn100PercentageBatteryKM', status.error, []);
             return false ;   
        }
        if(requestBody.maxRangeOn100PercentageBatteryKM < 0 || requestBody.maxRangeOn100PercentageBatteryKM >100)
        {
            RequestResponse.success(res, 'Please enter valid maxRangeOn100PercentageBatteryKM between  0 to 100', status.error, []);
             return false ;
        }
        
        
        let checkExistVehicle: any = await masterServices.checkExistVehicleModel(requestBody); 
        
        
        if(checkExistVehicle.rowCount >0)
            {
                 RequestResponse.validationError(res, 'This model name already exsit.', status.error, []);
                 return false ;
            }    
            
            return true;

    } catch (error: any) {
        AddExceptionIntoDB(req,error);

         exceptionHandler(res, 1, error.message);
         return false ;
    }
};


const insertApiException  = async (req: Request, res: Response) => {
    try {                      
          let apiRequestResult:any = await insertApiExceptionData(req)

      return RequestResponse.success(res, 'client api address', status.success, apiRequestResult);
         
        
    } catch (error: any) {
        AddExceptionIntoDB(req,error);
        return exceptionHandler(res, 1, error.message);
    }
};





const getclientIPaddress  = async (req: Request, res: Response) => {
    try {
       
        let ipaddress:any  = req.headers['x-forwarded-for'] || req.ip || req.socket.remoteAddress
       let data :any =[];   
       let ab :any ='';     
      // var clientIp =   requestIp.getClientIp(req)
       
       if(req.headers['x-forwarded-for'] ==undefined || req.headers['x-forwarded-for'] == null)
       {
        
         ab  = 'undefinde';
       }
       else 
       {
        
        ab = req.headers['x-forwarded-for'] ;
       }      
        
       data.push({
        ipAddress :req.ip, 
        reqSRt  :req.socket.remoteAddress,
        h :ab,
        ipaddress :ipaddress,
        //clientIp : clientIp,
        //reqq : req
       });
        
      return RequestResponse.success(res, 'client api address', status.success, data);
         
        
    } catch (error: any) {
        AddExceptionIntoDB(req,error);
        return exceptionHandler(res, 1, error.message);
    }
};


const getSectionFAQDetail = async (req: Request, res: Response) => {
    try {
        // #swagger.tags = ['Admin-Bike-Produce']
        // #swagger.description = 'Pass bikeProduceId or 0  and status_enum_id = 0  '

      
        /*#swagger.parameters[ {
                        "name": "statusEnumId",
                        "in": "query",
                        "description": "statusEnumId",
                        "required": true,
                        "type": "integer"
                    }]
                     
        } */        
        let requestQuery =req.query;
        requestQuery.statusEnumId = '1';
        let result :any  = await MasterServices.getSectionDetail(requestQuery, req); 
           
        let data = [];
        for (let row of result.rows) {
            requestQuery.sectionId =  row.id
            let getFAQ:any = await MasterServices.getFAQList(requestQuery,req);      
            data.push({
                            id: row.id,                            
                            sectionName: row.name,    
                            sectionSequence : row.section_sequence,                       
                            questionData :   getFAQ                            
            });
        }

        if (result.rowCount > 0) {
            return RequestResponse.success(res, apiMessage.success, status.success, data);
        } else {
            return RequestResponse.success(res, apiMessage.recordNotFound, status.success, []);
        }
    } catch (error: any) {
        
         AddExceptionIntoDB(req,error);
       return  exceptionHandler(res, 1, error.message);
    }
};

const getAllSectionFAQDetail = async (req: Request, res: Response) => {
    try {
        // #swagger.tags = ['Admin-Bike-Produce']
        // #swagger.description = 'Pass bikeProduceId or 0  and status_enum_id = 0  '

      
        /*#swagger.parameters[ {
                        "name": "statusEnumId",
                        "in": "query",
                        "description": "statusEnumId",
                        "required": true,
                        "type": "integer"
                    }]
                     
        } */        
        let requestQuery =req.query;
        requestQuery.statusEnumId = '1';               
        let data :any= [];       
           data = await MasterServices.getFAQList(requestQuery,req);               
        if (data.length > 0) {
            return RequestResponse.success(res, apiMessage.success, status.success, data);
        }
         else {
            return RequestResponse.success(res, apiMessage.recordNotFound, status.success, []);
        }
    } catch (error: any) {
        
         AddExceptionIntoDB(req,error);
       return  exceptionHandler(res, 1, error.message);
    }
};

const getSectionList = async (req: Request, res: Response) => {
    try {
        // #swagger.tags = ['Admin-Bike-Produce']
        // #swagger.description = 'Pass bikeProduceId or 0  and status_enum_id = 0  '

      
        /*#swagger.parameters[ {
                        "name": "statusEnumId",
                        "in": "query",
                        "description": "statusEnumId",
                        "required": true,
                        "type": "integer"
                    }]
                     
        } */        
        let requestQuery =req.query;
        requestQuery.statusEnumId = '1';
        let result :any  = await MasterServices.getSectionDetail(requestQuery, req); 
           
        let data = [];
        for (let row of result.rows) {
           // requestQuery.sectionId =  row.id
            //let getFAQ:any = await MasterServices.getFAQList(requestQuery,req);      
            data.push({
                            sectionId: row.id,                            
                            sectionName: row.name,   
                            sectionSequence : row.section_sequence, 
                            createdOnDate : row.createdon_date,
                            updatedOnDate  : row.updatedon_date,                           
                          //  questionData :   getFAQ                            
            });
        }

        if (result.rowCount > 0) {
            return RequestResponse.success(res, apiMessage.success, status.success, data);
        } else {
            return RequestResponse.success(res, apiMessage.recordNotFound, status.success, []);
        }
    } catch (error: any) {
        
         AddExceptionIntoDB(req,error);
       return  exceptionHandler(res, 1, error.message);
    }
};


const addeditSectionName  = async (req: Request, res: Response) => {
    try {   let requestBody = req.body;
        let addSection :any ;
        let msg :any ;
        if ( CommonMessage.IsValid(requestBody.sectionId )==false) {
            RequestResponse.validationError(res,  'please set section id ', status.error, [])            
            return  false  ;
        } 
        if ( CommonMessage.IsValid(requestBody.sectionName )==false) {
            RequestResponse.validationError(res,  apiMessage.sectionName, status.error, [])            
            return  false  ;
        } 

        
        let checkSection :any  = await MasterServices.checkSectionName(requestBody,req);
        if(checkSection.rowCount >0)
        {
            return RequestResponse.success(res, 'you can not Create duplicate section', status.success, []);  
        } 

        let FAQSequence :any  =await masterServices.getSectionSequence(req)
        

        
                
        requestBody.scection_sequence = Number(FAQSequence.rows[0].s_sequence) + 1;

        

        

        
        if(requestBody.sectionId == '0')
        {          
                msg =apiMessage.addSetion;                 
                addSection = await MasterServices.addSectionName(requestBody, req);                   
        }
        else 
        {                                                     
              
                msg =apiMessage.editSection;                                                                 
                addSection = await MasterServices.updateSectionNameService(requestBody, req);                    
        }

        if(addSection.rowCount >0)
        {
         return RequestResponse.success(res, msg, status.success, []);
      }
      else 
      {
       return RequestResponse.validationError(res, 'FAQ detail not added', status.error, []);
      }
        
    } catch (error: any) {
        AddExceptionIntoDB(req,error);
        return exceptionHandler(res, 1, error.message);
    }
};

const addFAQSequence = async (req: Request, res: Response) => {
    try {   let requestBody = req.body;
        let addSection :any ;
        let msg :any ;
        if ( CommonMessage.IsValid(requestBody.sectionId )==false) {
            RequestResponse.validationError(res,  'please set section id ', status.error, [])            
            return  false  ;
        } 
        if ( CommonMessage.IsValid(requestBody.questionIds )==false) {
            RequestResponse.validationError(res, 'please set questionIds', status.error, [])            
            return  false  ;
        } 
        if ( CommonMessage.IsValid(requestBody.loginUserId )==false) {
            RequestResponse.validationError(res,  'set login user id ', status.error, [])            
            return  false  ;
        } 

        for(let i = 0; i < requestBody.questionIds.length; i++)
        {
            requestBody.questionSequence  = i+1;
        
            requestBody.questionId=  requestBody.questionIds[i];
            addSection = await MasterServices.updateSequenceFAQ(requestBody, req);
        }

                                          

        if(addSection.rowCount >0)
        {
         return RequestResponse.success(res, 'FAQ Sequence added successfully', status.success, []);
      }
      else 
      {
       return RequestResponse.validationError(res, 'FAQ Sequence detail not added', status.error, []);
      }
        
    } catch (error: any) {
        AddExceptionIntoDB(req,error);
        return exceptionHandler(res, 1, error.message);
    }
};

const updateSequenseSection = async (req: Request, res: Response) => {
    try {   let requestBody = req.body;
        let addSection :any ;
    
        if ( CommonMessage.IsValid(requestBody.sectionsIds )==false) {
            RequestResponse.validationError(res, 'please set questionIds', status.error, [])            
            return  false  ;
        } 
        if ( CommonMessage.IsValid(requestBody.loginUserId )==false) {
            RequestResponse.validationError(res,  'set login user id ', status.error, [])            
            return  false  ;
        } 

        for(let i = 0; i < requestBody.sectionsIds.length; i++)
        {
            requestBody.sectionSequence  = i+1;
        
            requestBody.sectionId=  requestBody.sectionsIds[i];
            addSection = await MasterServices.updateSequenseSectionService(requestBody, req);
        }

                                          

        if(addSection.rowCount >0)
        {
         return RequestResponse.success(res, 'FAQ Sequence added successfully', status.success, []);
      }
      else 
      {
       return RequestResponse.validationError(res, 'FAQ Sequence detail not added', status.error, []);
      }
        
    } catch (error: any) {
        AddExceptionIntoDB(req,error);
        return exceptionHandler(res, 1, error.message);
    }
};


const faqDetailSectionWise = async (req: Request, res: Response) =>
{
     let requestBody = req.body;
     let addSection :any ;
     let addSectionFAQDetail :any ;
     let msg :any ;
     requestBody.aplicableDate = getUTCdate()
    try {

        if ( CommonMessage.IsValid(requestBody.sectionId )==false) {
            RequestResponse.validationError(res,  'please set section id', status.error, [])            
            return  false  ;
        }            
    
        if ( CommonMessage.IsValid( requestBody.question )==false) {
            return RequestResponse.validationError(res,  apiMessage.questions, status.error, [])            
                ;
        }  
        if ( CommonMessage.IsValid( requestBody.answer )==false) {
            return   RequestResponse.validationError(res,  apiMessage.answer, status.error, [])            
              ;
        }  
        if ( CommonMessage.IsValid( requestBody.faqPublishStatusEnumId )==false) {
            return   RequestResponse.validationError(res,  apiMessage.faqPublishStatusEnumId, status.error, [])            
              ;
        }  

        if ( CommonMessage.IsValid( requestBody.questionId )==false) {
            return   RequestResponse.validationError(res,  'please set questionId ', status.error, [])            
              ;
        }  


         

       


            addSectionFAQDetail   = await MasterServices.checkSectionQuestions(requestBody,req);
            if(addSectionFAQDetail.rowCount >0)
            {
                return RequestResponse.success(res, 'you can not Create duplicate Question for this section', status.success, []);  
            } 
            let getpublisheAndUnPublishDate :any  =await masterServices.getpublisheAndUnPublishDateService(requestBody, req)

          
            if(getpublisheAndUnPublishDate.rowCount >0 )
            {
                requestBody.faq_publish_status_enum_id=getpublisheAndUnPublishDate.rows[0].faq_publish_status_enum_id
                requestBody.lastPublishDate = getpublisheAndUnPublishDate.rows[0].last_publish_date ;
                requestBody.lastUnpublishDate  =getpublisheAndUnPublishDate.rows[0].last_unpublish_date;
            
                requestBody.lastPublishedUserId =  getpublisheAndUnPublishDate.rows[0].last_published_user_id ;
                requestBody.lastUnpublishedUserId = getpublisheAndUnPublishDate.rows[0].last_unpublished_user_id ;
        
            }else 
            {
                requestBody.lastPublishDate =null; 
                requestBody.lastUnpublishDate  =null;
                requestBody.lastPublishedUserId = null;
                requestBody.lastUnpublishedUserId = null ;
            }

            if(requestBody.faqPublishStatusEnumId =='87')//published
                {              
                   if(requestBody.faq_publish_status_enum_id!=requestBody.faqPublishStatusEnumId)
                   {
                     requestBody.lastPublishDate =requestBody.aplicableDate;
                     requestBody.lastPublishedUserId = requestBody.loginUserId;
                   } 
                  
                   else
                   {
                    requestBody.lastPublishedUserId =  getpublisheAndUnPublishDate.rows[0].last_published_user_id ;
                   }
                 
                }
                else if(requestBody.faqPublishStatusEnumId =='88')//unpublished
                {    
                    if(requestBody.faq_publish_status_enum_id!=requestBody.faqPublishStatusEnumId)
                    {
                     requestBody.lastUnpublishDate =requestBody.aplicableDate;
                     requestBody.lastUnpublishedUserId = requestBody.loginUserId;
                    }  else 
                    {
                        requestBody.lastUnpublishedUserId  =  getpublisheAndUnPublishDate.rows[0].last_unpublished_user_id
                    }                                                  
                }                                

                let FAQSequence :any  =await masterServices.getFAQSequence(requestBody, req)
                
                requestBody.question_sequence = Number(FAQSequence.rows[0].q_sequence) + 1
                
                
            if(requestBody.questionId == '0')
            {          
                    msg =apiMessage.addFAQ;                 
                    addSection = await MasterServices.addSectionFAQDetail(requestBody, req);                   
            }
            else 
            {                                                     
                  
                    msg =apiMessage.editFAQ;                                                                 
                    addSection = await MasterServices.editSectionFAQDetail(requestBody, req);                    
            }
                                                        
        if(addSection.rowCount >0)
         {
          return RequestResponse.success(res, msg, status.success, []);
       }
       else 
       {
        return RequestResponse.validationError(res, 'FAQ detail not added', status.error, []);
       }
         

    }
    catch (error: any) {
        AddExceptionIntoDB(req,error);
        return exceptionHandler(res, 1, error.message);
    }
}

async function publishFAQDetail  (req: Request, res: Response) {
        
    req.body.faqPublishStatusEnumId = '87';// Published
     await publishUnPublishFAQDetail(req, res);
}
async function unPublishFAQDetail  (req: Request, res: Response) {
        
    req.body.faqPublishStatusEnumId = '88';// unPublished
     await publishUnPublishFAQDetail(req, res);
}

const publishUnPublishFAQDetail = async (req: any, res: Response) =>
{
     let requestBody = req.body;
     let publishUnpublish :any ;    
     let msg :any ;
     requestBody.aplicableDate = getUTCdate()
try
{
    if ( CommonMessage.IsValid( requestBody.questionId )==false) {
        return   RequestResponse.validationError(res,  'please set questionId ', status.error, []);
    } 
    


    let getpublisheAndUnPublishDate :any  =await masterServices.getpublisheAndUnPublishDateService(requestBody, req)

          
            if(getpublisheAndUnPublishDate.rowCount >0 )
            {
                requestBody.faq_publish_status_enum_id=getpublisheAndUnPublishDate.rows[0].faq_publish_status_enum_id
                requestBody.lastPublishDate = getpublisheAndUnPublishDate.rows[0].last_publish_date ;
                requestBody.lastUnpublishDate  =getpublisheAndUnPublishDate.rows[0].last_unpublish_date;
            
                requestBody.lastPublishedUserId =  getpublisheAndUnPublishDate.rows[0].last_published_user_id ;
                requestBody.lastUnpublishedUserId = getpublisheAndUnPublishDate.rows[0].last_unpublished_user_id ;
        
            }else 
            {
                requestBody.lastPublishDate =null; 
                requestBody.lastUnpublishDate  =null;
                requestBody.lastPublishedUserId = null;
                requestBody.lastUnpublishedUserId = null ;
            }

            if(requestBody.faqPublishStatusEnumId =='87')//published
                {              
                   if(requestBody.faq_publish_status_enum_id!=requestBody.faqPublishStatusEnumId)
                   {
                     requestBody.lastPublishDate =requestBody.aplicableDate;
                     requestBody.lastPublishedUserId = requestBody.loginUserId;
                   } 
                  
                   else
                   {
                    requestBody.lastPublishedUserId =  getpublisheAndUnPublishDate.rows[0].last_published_user_id ;
                   }
                 
                }
                else if(requestBody.faqPublishStatusEnumId =='88')//unpublished
                {    
                    if(requestBody.faq_publish_status_enum_id!=requestBody.faqPublishStatusEnumId)
                    {
                     requestBody.lastUnpublishDate =requestBody.aplicableDate;
                     requestBody.lastUnpublishedUserId = requestBody.loginUserId;
                    }  else 
                    {
                        requestBody.lastUnpublishedUserId  =  getpublisheAndUnPublishDate.rows[0].last_unpublished_user_id
                    }                                                  
                }                                

    publishUnpublish =await masterServices.publishUnPublishFAQDetailService(requestBody, req)
        
    if(publishUnpublish.rowCount >0)
    {
     return RequestResponse.success(res, msg, status.success, []);
  }
  else 
  {
   return RequestResponse.validationError(res, 'FAQ detail not updated', status.error, []);
  } 
}
catch (error: any) {
    AddExceptionIntoDB(req,error);
    return exceptionHandler(res, 1, error.message);
}
    
}

export default {
    getStatesController,
    getCitiesController,
    getUnitController,
    getVehicleModelController,
    addUpdateVehicleModelDetailsController,
    getZoneListController,
    getVehicleListController,
    getVehicleTypeListController,
    getMapCity,
    getMapState,
    getMapCountry ,
    insertVehicleModelDetailsController ,
    getVehicleModelDetails,
    getclientIPaddress ,
    insertApiException ,
    getVehicleModelDetailsForTable,
    getImagesBase64Service ,
    getSectionFAQDetail,
    faqDetailSectionWise ,
    getSectionList,
    unPublishFAQDetail,
    publishFAQDetail,
    getAllSectionFAQDetail ,
    addeditSectionName ,
    addFAQSequence ,
    updateSequenseSection

    
};
