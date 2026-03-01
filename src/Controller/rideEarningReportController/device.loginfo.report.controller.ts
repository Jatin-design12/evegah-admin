import { NextFunction, Request, Response } from 'express';
const { parse } = require('querystring');

import status from '../../helper/status';
import RideEarningReport from  '../../services/rideEarningServices/ride.earningreport.services';
import { exceptionHandler,AddExceptionIntoDB  } from '../../helper/responseHandler';
import RequestResponse from '../../helper/responseClass';
import { apiMessage } from '../../helper/api-message';
import logger from '../../Config/logging';
import  CommonMessage  from '../../helper/common.validation';

import  Dateformats from '../../helper/utcdate';
import { fromDateTodateValidations } from '../../helper/common-function';
import adminLogDeviceInformationServices from '../../services/adminServices/admin.logDeviceInformation.services';

const getDeviceLogInfoReport = async (req: Request, res: Response) => {
    try {
        let requestQuery = req.query;
        let result: any;
        if ( CommonMessage.IsValid(requestQuery.lockId)==false ) 
        {
             RequestResponse.validationError(res,apiMessage.lockIdset, status.success, []);             
             return false ;
        }  

        if(CommonMessage.IsValid(requestQuery.speed)==false)
        {
            requestQuery.speed ='both'
        }
        else 
        {
            if(requestQuery.speed !='available' && requestQuery.speed !='not available')
            {
                requestQuery.speed ='both'
            }           
        }
        
        if(CommonMessage.IsValid(requestQuery.latitude)==false)
        {
            requestQuery.latitude ='both'
        }
        else 
        {
            if(requestQuery.latitude !='available' && requestQuery.latitude !='not available')
            {
                requestQuery.latitude ='both'
            }           
        }

        if(CommonMessage.IsValid(requestQuery.longitude)==false)
        {
            requestQuery.longitude ='both'
        }
        else 
        {
            if(requestQuery.longitude !='available' && requestQuery.longitude !='not available')
            {
                requestQuery.longitude ='both'
            }           
        }
        
        if(CommonMessage.IsValid(requestQuery.altitude)==false)
        {
            requestQuery.altitude ='both'
        }
        else 
        {
            if(requestQuery.altitude !='available' && requestQuery.altitude !='not available')
            {
                requestQuery.altitude ='both'
            }           
        }

        
        if(CommonMessage.IsValid(requestQuery.battery)==false)
        {
            requestQuery.battery ='both'
        }
        else 
        {
            if(requestQuery.battery !='available' && requestQuery.battery !='not available')
            {
                requestQuery.battery ='both'
            }           
        }

        if(CommonMessage.IsValid(requestQuery.internal_batt_v)==false)
        {
            requestQuery.internal_batt_v ='both'
            
        }
        else 
        {
            if(requestQuery.internal_batt_v !='available' && requestQuery.internal_batt_v !='not available')
            {
                
                requestQuery.internal_batt_v ='both'
            }           
        }
        
        
        if(CommonMessage.IsValid(requestQuery.external_batt_v)==false)
        {
            requestQuery.external_batt_v ='both'
        }
        else 
        {
            if(requestQuery.external_batt_v !='available' && requestQuery.external_batt_v !='not available')
            {
                requestQuery.external_batt_v ='both'
            }           
        }
     

        if(CommonMessage.IsValid(requestQuery.deviceLightStatusEnumId)==false)
        {
            requestQuery.deviceLightStatusEnumId ='both'
        }
        else 
        {
            if(requestQuery.deviceLightStatusEnumId !='available' && requestQuery.deviceLightStatusEnumId !='not available')
            {
                requestQuery.deviceLightStatusEnumId ='both'
            }           
        }
		 
        if(CommonMessage.IsValid(requestQuery.deviceLightInstructionEnumId)==false)
        {
            requestQuery.deviceLightInstructionEnumId ='both'
        }
        else 
        {
            if(requestQuery.deviceLightInstructionEnumId !='available' && requestQuery.deviceLightInstructionEnumId !='not available')
            {
                requestQuery.deviceLightInstructionEnumId ='both'
            }           
        }


		
        if(CommonMessage.IsValid(requestQuery.instructionId)==false)
        {
            requestQuery.instructionId ='both'
        }
        else 
        {
            if(requestQuery.instructionId !='available' && requestQuery.instructionId !='not available')
            {
                requestQuery.instructionId ='both'
            }           
        }
		
        if(CommonMessage.IsValid(requestQuery.deviceLockAndUnlockStatus)==false)
        {
            requestQuery.deviceLockAndUnlockStatus ='both'
        }
        else 
        {
            if(requestQuery.deviceLockAndUnlockStatus !='available' && requestQuery.deviceLockAndUnlockStatus !='not available')
            {
                requestQuery.deviceLockAndUnlockStatus ='both'
            }           
        }

      
        if(CommonMessage.IsValid(requestQuery.beepInstructionEnumId)==false)
        {
            requestQuery.beepInstructionEnumId ='both'
        }
        else 
        {
            if(requestQuery.beepInstructionEnumId !='available' && requestQuery.beepInstructionEnumId !='not available')
            {
                requestQuery.beepInstructionEnumId ='both'
            }           
        }
		
        if(CommonMessage.IsValid(requestQuery.beepStatusEnumId)==false)
        {
            requestQuery.beepStatusEnumId ='both'
        }
        else 
        {
            if(requestQuery.beepStatusEnumId !='available' && requestQuery.beepStatusEnumId !='not available')
            {
                requestQuery.beepStatusEnumId ='both'
            }           
        }
        if(CommonMessage.IsValid(requestQuery.powerOnOffStatusEnumId)==false)
        {
            requestQuery.powerOnOffStatusEnumId ='both'
        }
        else 
        {
            if(requestQuery.powerOnOffStatusEnumId !='available' && requestQuery.powerOnOffStatusEnumId !='not available')
            {
                requestQuery.powerOnOffStatusEnumId ='both'
            }           
        }
    

        if( await fromDateTodateValidations(requestQuery.fromDate,apiMessage.fromDate ,requestQuery.toDate,apiMessage.toDate,res) == false) 
        {
          return ;
        }      
        let  from_date :any =  Dateformats.ConvertUTCtoDateformatWithoutTime(requestQuery.fromDate) // new Date()
        let  to_date :any =  Dateformats.ConvertUTCtoDateformatWithoutTimeAddEndTime(requestQuery.toDate) // new Date() 
        requestQuery.fromDate =  from_date;
        requestQuery.toDate =  to_date;
         result = await adminLogDeviceInformationServices.deviceLogInfoReport(requestQuery);
        let  report: any = [];
        
        
        if (result.rowCount > 0) {
        for (let row of result.rows) {
            report.push({                        
                id:row.id,
                ride_booking_id: row.ride_booking_id ,
                ride_booking_no : row.ride_booking_no,
                lock_id:  row.lock_id ,
                device_id  :row.device_id,  

                device_lock_and_unlock_status  : row.device_lock_and_unlock_status ,
                lock_status : row.lock_status,
                instruction_name : row.instruction_name ,
                instruction_id : row.instruction_id ,

                speed : row.speed,

                device_light_status_enum_id:  row.device_light_status_enum_id  ,
                deveice_light_status : row.deveice_light_status ,
                device_light_instruction_enum_id : row.device_light_instruction_enum_id,
                device_light_instruction : row.device_light_instruction,
                
                latitude : row.latitude,
                longitude :  row.longitude,
                altitude :  row.altitude,   

                battery  : row.battery,
                internal_batt_v :  row.internal_batt_v,
                external_batt_v  : row.external_batt_v ,

                createdon_date : row.createdon_date, 

                beepInstructionEnumId : row.beep_instruction_enum_id,
                beepInstructionName : row.beep_instruction,
                beepStatusEnumId : row.beep_status_enum_id,
                beepStatusName : row.beep_status,
                powerOnOffStatusEnumId : row.power_status_enum_id ,
                powerOnOffStatus : row.power_status
            });
        }

       
            return RequestResponse.success(res, apiMessage.success, status.success, report);
        } else {
            return RequestResponse.validationError(res, apiMessage.dataNotAvailable, status.error, []);
        }
    } catch (error: any) {
        AddExceptionIntoDB(req,error);

        return exceptionHandler(res, 1, error.message);
    }
};



export default {getDeviceLogInfoReport}