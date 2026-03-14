import { client } from '../../Config/db.connection';
import { DB_CONFIGS } from '../../Config/db.queries';
import { getUTCdate } from '../../helper/datetime';
import request from 'request';
import config from '../../Config/config';
import { AddExceptionIntoDB } from '../../helper/responseHandler';
import { calculateSecond } from '../../helper/common-function';
class InwardServices {
    constructor() {}

    async checkDuplicateUIdForBike(inwardDetails: any) {
        let query: any = {
            text: DB_CONFIGS.inwardQueries.bikeInward.checkUIdNumber(),
            values: [inwardDetails.vehicleModelUId, inwardDetails.bikeInwardId]
        };

        return new Promise<string>(async (resolve, reject) => {
            try {
                let result = await client.query(query);
                resolve(result);
            } catch (error) {
                reject(error);
            }
        });
    }

    async updateBikeAllocatedToProduction(inwardDetails: any) {
        let query: any = {
            text: DB_CONFIGS.inwardQueries.bikeInward.updateBikeAllocatedToProduction(),
            values: [inwardDetails.uId]
        };

        return new Promise<string>(async (resolve, reject) => {
            try {
                let result = await client.query(query);
                resolve(result);
            } catch (error) {
                reject(error);
            }
        });
    }

    async insertBikeUId(inwardDetails: any) {
        let actionOnDate = getUTCdate();
        let query: any = {
            text: DB_CONFIGS.inwardQueries.bikeInward.insertUIdNumber(),
            values: [
                inwardDetails.vehicleId,
                inwardDetails.vehicleModelUId,
                inwardDetails.statusEnumId,
                inwardDetails.remark,
                inwardDetails.actionByLoginUserId,
                inwardDetails.actionByUserTypeEnumId,
                actionOnDate,
                inwardDetails.inwardDate
            ]
        };

        return new Promise<string>(async (resolve, reject) => {
            try {
                let result = await client.query(query);
                resolve(result);
            } catch (error) {
                reject(error);
            }
        });
    }
    async updateUIdNumber(inwardDetails: any) {
        let actionOnDate = getUTCdate();
        let query: any = {
            text: DB_CONFIGS.inwardQueries.bikeInward.updateUIdNumberByInward(),
            values: [
                inwardDetails.vehicleModelUId,
                inwardDetails.statusEnumId,
                inwardDetails.remark,
                actionOnDate,
                inwardDetails.actionByLoginUserId,
                inwardDetails.vehicleId,
                inwardDetails.inwardDate,
                inwardDetails.bikeInwardId
            ]
        };

        return new Promise<string>(async (resolve, reject) => {
            try {
                let result = await client.query(query);
                resolve(result);
            } catch (error) {
                reject(error);
            }
        });
    }

    async getBikeInwardDetails(inwardDetails: any) {
        let query: any = {
            text: DB_CONFIGS.inwardQueries.bikeInward.getBikeInwardDetails(),
            values: [inwardDetails.bikeInwardId, inwardDetails.statusEnumId, inwardDetails.bikeStatusEnumId]
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
    async checkLockNumber(lockInwardDetails: any) {
        let query: any = {
            text: DB_CONFIGS.inwardQueries.lockInward.checkLockNumber(),
            values: [lockInwardDetails.dId]
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

    async IMEIAndLockNumberExitService(lockInwardDetails: any) {
        let query: any = {
            text: DB_CONFIGS.inwardQueries.lockInward.IMEIAndLockNumberExit(),
            values: [lockInwardDetails.imeiN, lockInwardDetails.dId]
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

    async insertLockDetails(lockInwardDetails: any) {
        let actionOnDate = getUTCdate();
        let query: any = {
            text: DB_CONFIGS.inwardQueries.lockInward.insertLockDetails(),
            values: [
                lockInwardDetails.lockNumber,
                lockInwardDetails.statusEnumId,
                lockInwardDetails.remark,
                lockInwardDetails.actionByLoginUserId,
                lockInwardDetails.actionByUserTypeEnumId,
                actionOnDate,
                lockInwardDetails.instructionId,
                lockInwardDetails.deviceLightStatusEnumId,
                lockInwardDetails.deviceLightInstructionEnumId,
                lockInwardDetails.deviceLockAndUnlockStatus,
                lockInwardDetails.beepInstructionEnumId,
                lockInwardDetails.beepStatusEnumId,
                lockInwardDetails.lastDistanceInMeters,
                lockInwardDetails.totalDistanceInMeters,
                lockInwardDetails.inwardDate,
                lockInwardDetails.lockIMEINumber
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

    async updateLockDetailsSever(lockInwardDetails: any) {
        let actionOnDate = getUTCdate();
        let query: any = {
            text: DB_CONFIGS.inwardQueries.lockInward.updateLockDetails(),
            values: [
                lockInwardDetails.lockNumber,
                lockInwardDetails.statusEnumId,
                lockInwardDetails.remark,
                lockInwardDetails.instructionId,
                actionOnDate,
                lockInwardDetails.actionByLoginUserId,
                lockInwardDetails.lockId,
                lockInwardDetails.inwardDate,
                lockInwardDetails.lockIMEINumber
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

    async getLockInwardDetails(lockInwardDetails: any) {
        let query: any = {
            text: DB_CONFIGS.inwardQueries.lockInward.getLockInward(),
            values: [lockInwardDetails.lockInwardId, lockInwardDetails.statusEnumId]
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
    async getUidList(lockInwardDetails: any) {
        let query: any = {
            text: DB_CONFIGS.inwardQueries.bikeInward.getUidListByVehicleId(),
            values: [lockInwardDetails.vehicleId, lockInwardDetails.bikeProduceAllotmentId, lockInwardDetails.bikeZoneAllotmentAllotmentId]
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

    async getUidListWithBiekAndLockList(lockInwardDetails: any) {
        let query: any = {
            text: DB_CONFIGS.inwardQueries.bikeInward.getUidListWithBiekAndLock(),
            values: [lockInwardDetails.vehicleId, lockInwardDetails.bikeProduceAllotmentId, lockInwardDetails.bikeZoneAllotmentAllotmentId]
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

    async getLockList() {
        let query: any = {
            text: DB_CONFIGS.inwardQueries.lockInward.getLockList(),
            values: []
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

    async activeInactiveLockNumber(lockInwardDetails: any) {
        let actionOnDate = getUTCdate();
        let query: any = {
            text: DB_CONFIGS.inwardQueries.lockInward.activeInactiveLockNumber(),
            values: [lockInwardDetails.statusEnumId, actionOnDate, lockInwardDetails.lockId]
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

    async activeInactiveUid(bikeInwardDetails: any) {
        let actionOnDate = getUTCdate();
        let query: any = {
            text: DB_CONFIGS.inwardQueries.bikeInward.activeInactiveUidNumber(),
            values: [bikeInwardDetails.statusEnumId, actionOnDate, bikeInwardDetails.bikeInwardId]
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

    async getLockDetailsFromDevice(lockDetails: any) {
        let query: any = {
            text: DB_CONFIGS.inwardQueries.lockInward.LockDetailsFromDevice(),
            values: [lockDetails]
        };
        return new Promise(async (resolve, reject) => {
            try {
                let result = await client.query(query);
                resolve(lockDetails);
            } catch (error) {
                reject(error);
            }
        });
    }

    async getRegistrationStatusOfLock(lockDetails: any) {
        let query: any = {
            text: DB_CONFIGS.adminQueries.adminDashboardQueries.checkRegistrationStatus(),
            values: [lockDetails]
        };
        //console.log('check quer deviceCurrentStatus',query)
        return new Promise(async (resolve, reject) => {
            try {
                let result = await client.query(query);
                resolve(result);
            } catch (error) {
                reject(error);
            }
        });
    }

    async deviceInternalCallingTime() {
        let query: any = {
            text: DB_CONFIGS.adminQueries.adminDashboardQueries.deviceInternalCallingTimeQ()
            //values: [lockDetails]
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

    async deleteLock(lockInwardDetails: any) {
        let query: any = {
            text: DB_CONFIGS.inwardQueries.lockInward.deleteLockDetails(),
            values: [lockInwardDetails.lockId]
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

    async getLockDetails(lockInwardDetails: any) {
        let query: any = {
            text: DB_CONFIGS.inwardQueries.lockInward.getLockDetails(),
            values: [lockInwardDetails.lockId]
        };

        return new Promise(async (resolve, reject) => {
            try {
                let result: any = await client.query(query);
                let lockDetails = [];
                let apiCallingTime: any = '10';
                let deviceInternalCallingTimeResult: any = await this.deviceInternalCallingTime();
                if (deviceInternalCallingTimeResult.rows.count > 0) {
                    apiCallingTime = deviceInternalCallingTimeResult.rows[0]?.enum_key;
                }
                for (let row of result.rows) {
                    // checkTimeData.lastdevicerequesttime_DB = getLockDetails.rows[0].lastdevicerequesttime
                    let lastUpdateTime: any = getUTCdate();
                    let timeDifference: any = await calculateSecond(row.lastdevicerequesttime, lastUpdateTime);
                    lockDetails.push({
                        lockId: row.id,
                        lockNumber: row.lock_number,
                        statusEnumId: row.status_enum_id,
                        registrationNumber: row.registration_number,
                        location: row.location,
                        latitude: row.latitude,
                        longitude: row.longitude,
                        altitude: row.altitude,
                        speed: row.speed,
                        battery: row.battery,
                        internalBattV: row.internal_batt_v,
                        externalBattV: row.external_batt_v,
                        deviceLockAndUnlockStatus: row.device_lock_and_unlock_status,
                        deviceLockAndUnlockStatusName: row.device_lock_and_unlock_status_name, // === '2' ? 'Lock' : 'UnLock',

                        deveice_state_enum_id: Number(row.deveice_state_enum_id),
                        device_state_enum_id: Number(row.deveice_state_enum_id),

                        deveiceState: row.deveice_state,
                        deviceState: row.deveice_state,
                        device_last_request_time: row.device_last_request_time,
                        instructionId: row.instruction_id,
                        registrationStatus: row.registartion_status,
                        imeiNumber: row.imei_number,
                        serialNumber: row.serial_number,
                        odometer: row.odometer,
                        runTime: row.run_time,
                        chassisNumber: row.chassis_number,
                        dateOfManufacture: row.date_of_manufacture,
                        dateOfService: row.date_of_service,
                        deviceLightInstructionEnumId: row.device_light_instruction_enum_id,
                        deviceLightInstruction: row.device_light_instruction,
                        deviceLightStatus: row.device_light_status,
                        deviceLightStatusEnumId: row.device_light_status_enum_id,
                        powerOnOffStatusEnumId: row.power_on_off_status_enum_id,
                        powerOnOffStatus: row.power_on_off_status,
                        lastdevicerequesttime: row.lastdevicerequesttime,
                        IntervalTime: apiCallingTime,
                        apiCalledTime: timeDifference
                    });
                }
                resolve(lockDetails);
            } catch (error) {
                reject(error);
            }
        });
    }
    async updateLockAllotmentStatus(lockInwardDetails: any) {
        let query: any = {
            text: DB_CONFIGS.inwardQueries.lockInward.updateLockAllotmentStatus(),
            values: [lockInwardDetails.lockId]
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

    async checkLockNumberExitService(lockInwardDetails: any) {
        let query: any = {
            text: DB_CONFIGS.inwardQueries.lockInward.checkLockNumberExit(),
            values: [lockInwardDetails.lockNumber, lockInwardDetails.lockId]
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

    async checimeiNumberExitService(lockInwardDetails: any) {
        let query: any = {
            text: DB_CONFIGS.inwardQueries.lockInward.checimeiNumberExit(),
            values: [lockInwardDetails.lockIMEINumber, lockInwardDetails.lockId]
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

    async checkLockNameExitService(lockdetail: any) {
        let query: any = {
            text: DB_CONFIGS.inwardQueries.lockInward.checkLockNameExit(),
            values: [lockdetail.name]
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

    async checkUniqueIdExitService(uniqueid: any) {
        let query: any = {
            text: DB_CONFIGS.inwardQueries.lockInward.checkuniqueidExit(),
            values: [uniqueid]
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
    async checkdeviceidExitService(deviceid: any) {
        let query: any = {
            text: DB_CONFIGS.inwardQueries.lockInward.checkdeviceidExit(),
            values: [deviceid]
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

    async checkDeviceStateExitService(state: any) {
        let query: any = {
            text: DB_CONFIGS.inwardQueries.lockInward.checkDeviceStateExit(),
            values: [state]
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

    async insertDeviceStateService(state: any) {
        let status_enum_id: any = '1';
        let actionOnDate = getUTCdate();
        let query: any = {
            text: DB_CONFIGS.inwardQueries.lockInward.insertDeviceState(),
            values: [state, status_enum_id, actionOnDate]
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
    async insertDeviceDetailForUserAPIService(data: any) {
        let inwardDate: any = getUTCdate();
        let query: any = {
            text: DB_CONFIGS.inwardQueries.lockInward.insertDeviceDetailForUserAPIQuery(),
            values: [
                data.name,
                data.deviceid,
                data.uniqueid,
                data.moving,
                data.ignition,
                data.statesEnumId,
                data.type,
                data.disabled,
                data.created_at_date,
                data.accountid,
                data.statesince_date,
                data.protocol,
                data.servertime,
                data.devicetime,
                data.fixtime,
                data.valid, // data.isvalid_deevice_packet ,
                data.course,
                data.address,
                data.accuracy,
                data.network,
                data.location,
                data.latitude,
                data.longitude,
                data.altitude,
                data.speed,
                data.battery,
                data.internal_batt_v,
                data.external_batt_v,
                data.device_lock_and_unlock_status,
                data.instruction_id,
                data.registartion_status,
                data.uniqueid,
                data.allotment_status_id,
                data.deveice_state_enum_id,
                data.device_last_request_time,
                data.uniqueid, //data.lock_number,
                data.statusEnumId,
                data.createdon_date,
                data.remarks,
                data.em_devece_type,
                data.me_state_name,
                inwardDate,
                data.powerOnOff,
                data.lastdevicerequesttime
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

    async checkLockIdervice(lockInwardDetails: any) {
        let query: any = {
            text: DB_CONFIGS.inwardQueries.lockInward.checkLockIdExit(),
            values: [lockInwardDetails.lockId]
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

    async checkLockIdExitForDeleteService(lockInwardDetails: any) {
        let query: any = {
            text: DB_CONFIGS.inwardQueries.lockInward.checkLockIdExitForDelete(),
            values: [lockInwardDetails.lockNumber]
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

    async insertPostBodyDataService(data: any, actionDate: any) {
        let query: any = {
            text: DB_CONFIGS.inwardQueries.lockInward.insertPostBodyDataQuery(),
            values: [data, actionDate]
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

    async insertGetBodyDataService(dataDetail: any, actionDate: any) {
        let query: any = {
            text: DB_CONFIGS.inwardQueries.lockInward.insertGetBodyDataQuery(),
            values: [dataDetail, actionDate]
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

    //1-------------------
    async updateBikeLockAllotmentStatus(inwardDetails: any) {
        let query: any = {
            text: DB_CONFIGS.inwardQueries.bikeInward.updateBikeLockAllotmentStatus(),
            values: [inwardDetails.lockId, inwardDetails.allotmentStatusId]
        };

        return new Promise<string>(async (resolve, reject) => {
            try {
                let result = await client.query(query);
                resolve(result);
            } catch (error) {
                reject(error);
            }
        });
    }

    async activeDeactiveBikeService(inwardDetails: any) {
        let query: any = {
            text: DB_CONFIGS.inwardQueries.bikeInward.activeDeactiveBike(),
            values: [inwardDetails.statusEnumId, inwardDetails.bikeId]
        };

        return new Promise<string>(async (resolve, reject) => {
            try {
                let result = await client.query(query);
                resolve(result);
            } catch (error) {
                reject(error);
            }
        });
    }

    //---2

    async updateBikeAllocatedToInward(inwardDetails: any) {
        let query: any = {
            text: DB_CONFIGS.inwardQueries.bikeInward.updateBikeAllocatedToInward(),
            values: [inwardDetails.uId, inwardDetails.allotmentStatusId, inwardDetails.statusEnumId]
        };

        return new Promise<string>(async (resolve, reject) => {
            try {
                let result = await client.query(query);
                resolve(result);
            } catch (error) {
                reject(error);
            }
        });
    }

    //---3

    async updateBikeUIdStatusFromBikeProduce(inwardDetails: any) {
        let query: any = {
            text: DB_CONFIGS.inwardQueries.bikeInward.updateBikeUIdStatusFromBikeProduce(),
            values: [inwardDetails.uId, inwardDetails.allotmentStatusId]
        };

        return new Promise<string>(async (resolve, reject) => {
            try {
                let result = await client.query(query);
                resolve(result);
            } catch (error) {
                reject(error);
            }
        });
    }

    // console.log('link', config.serverUrl + `/getLockDetailsFromDevice?lockId=${lockDetails.lockId}`);
    // return new Promise((resolve, reject) => {
    //     request(
    //         {
    //             method: 'GET',
    //             url: config.serverUrl + `/getLockDetailsFromDevice?lockId=${lockDetails.lockId}`
    //         },
    //         (err, body) => {
    //             if (err) {
    //                 console.log(err);
    //             } else {
    //                 if (body) {
    //                     resolve(JSON.parse(body.body));
    //                 } else {
    //                     resolve(body);
    //                 }
    //             }
    //         }
    //     );
    // });

    // async insertApiRequestAndResponceService(requestData :any,RequestFrom :any,createdonDate:any) {
    //     let query: any = {
    //         text: DB_CONFIGS.inwardQueries.lockInward.insertApiRequestAndResponceDataQuery(),
    //         values: [requestData ,RequestFrom ,createdonDate]
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

    async insertApiRequestService(queryDetail: any, requestData: any) {
        let actionDate: any = getUTCdate();
        let query: any = {
            text: DB_CONFIGS.inwardQueries.lockInward.insertApiRequestDataQuery(),
            values: [
                queryDetail.frontendOptionName,
                queryDetail.frontendPageName,
                queryDetail.frontendActionName,
                queryDetail.apiMethodEnumId,
                queryDetail.apiUrl,
                queryDetail.apiRequestFromEnumId,
                queryDetail.access_token,
                requestData,
                actionDate,
                queryDetail.custumNodeLoginUserId,
                queryDetail.requestIpAddress,
                queryDetail.customeNodelockNumber
            ]
        };

        //  console.log('check data ', query)
        return new Promise(async (resolve, reject) => {
            try {
                let result = await client.query(query);
                resolve(result);
            } catch (error) {
                reject(error);
            }
        });
    }

    async updateApiResponceDataService(requestResponseId: any, responseData: any, responseStatusEnumId: any, exceptionFull: any, exceptionName: any, exceptionMessage: any) {
        let query: any = {
            text: DB_CONFIGS.inwardQueries.lockInward.updateApiResponceDataQuery(),
            values: [requestResponseId, responseData, responseStatusEnumId, exceptionFull, exceptionName, exceptionMessage]
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

    async insertApiResponceDataService(requestResponseId: any, responceData: any) {
        let query: any = {
            text: DB_CONFIGS.inwardQueries.lockInward.insertApiResponceDataQuery(),
            values: [requestResponseId, responceData]
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
    async insertApiExceptionService(exData: any) {
        let actionDate: any = getUTCdate();

        let query: any = {
            text: DB_CONFIGS.inwardQueries.lockInward.insertApiExceptionDataQuery(),
            values: [
                exData.customDBApiRequestId,
                exData.exceptionFull,
                exData.exceptionName,

                exData.exceptionMessage,
                exData.dbquery,
                exData.dbqueryParameters,
                exData.exceptionStack,

                exData.resolvedStatusEnumId,
                exData.resolvedRemarks,
                actionDate,

                exData.createdbyLoginUserId,
                exData.customError
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

    async getLastRequestTimeForTime(lockInwardDetails: any) {
        let query: any = {
            text: DB_CONFIGS.adminQueries.adminDashboardQueries.checkLastReuestTimeForDevice(),
            values: [lockInwardDetails.lockNumber]
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

export default new InwardServices();
