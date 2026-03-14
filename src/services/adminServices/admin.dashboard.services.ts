import { client } from '../../Config/db.connection';
import { DB_CONFIGS } from '../../Config/db.queries';
import { getUTCdate } from '../../helper/datetime';
import GetUserServices from '../userServices/user.get.services';
import CommonMessage from '../../helper/common.validation';
import adminControllers from '../../Controller/adminController/admin.controller';
import logger from '../../Config/logging';

import adminLogDeviceInformationServices from '../../services/adminServices/admin.logDeviceInformation.services';
import status from '../../helper/status';

import AreaMasters from '../../services/adminServices/admin.area.services';

import { exceptionHandler } from '../../helper/responseHandler';
import RequestResponse from '../../helper/responseClass';
import { apiMessage } from '../../helper/api-message';
import { checkGeoInOout, checkVaidLatLong } from '../../helper/common-function';
import { AddExceptionIntoDB } from '../../helper/responseHandler';

const crypto = require('crypto');

const ONLINE_DEVICE_STATE_ENUM_ID = 23;
const OFFLINE_DEVICE_STATE_ENUM_ID = 24;
const DEVICE_STATUS_RECENT_WINDOW_SECONDS = Number(process.env.DEVICE_STATUS_RECENT_WINDOW_SECONDS || 900);

const resolveDeviceStatus = (deveiceStateEnumId: any, deviceLastRequestTime: any, dbDeviceStatus: any) => {
    const stateEnumId = Number(deveiceStateEnumId);

    if (stateEnumId === ONLINE_DEVICE_STATE_ENUM_ID) {
        return 'Online';
    }

    if (stateEnumId === OFFLINE_DEVICE_STATE_ENUM_ID) {
        if (CommonMessage.IsValid(deviceLastRequestTime) === true) {
            const nowTime = new Date().getTime();
            const lastRequestTime = new Date(deviceLastRequestTime).getTime();
            const timeDifferenceInSeconds = Math.floor((nowTime - lastRequestTime) / 1000);

            if (Number.isFinite(timeDifferenceInSeconds) && timeDifferenceInSeconds >= 0 && timeDifferenceInSeconds <= DEVICE_STATUS_RECENT_WINDOW_SECONDS) {
                return 'Online';
            }
        }

        return 'Offline';
    }

    if (CommonMessage.IsValid(dbDeviceStatus) === true) {
        return dbDeviceStatus;
    }

    return 'Offline';
};

class DashboardServices {
    constructor() {}

    async addUpdateZoneDetails(data: any, req: any) {
        let actionOnDate = getUTCdate();
        let query: any = {
            text: DB_CONFIGS.adminQueries.adminDashboardQueries.addUpdateZone(),
            values: [
                data.zoneId,
                data.name,
                data.latitude,
                data.longitude,
                data.zoneSize,
                data.zoneCapacity,
                data.zoneAddress,
                data.areaId,
                // data.stateId,
                data.statusEnumId,
                data.remark,
                data.actionByLoginUserId,
                data.actionByUserTypeEnumId,
                actionOnDate
            ]
        };
        return new Promise<string>(async (resolve, reject) => {
            try {
                let result = await client.query(query);
                resolve(result);
            } catch (error) {
                req.dbquery = query.text;
                req.dbqueryParameters = query.values;
                AddExceptionIntoDB(req, error);
                reject(error);
            }
        });
    }

    async getZoneDetails(data: any, req: any) {
        let query: any = {
            text: DB_CONFIGS.adminQueries.adminDashboardQueries.getZone(),
            values: [data.zoneId, data.statusEnumId, data.areaId]
        };
        return new Promise(async (resolve, reject) => {
            try {
                let result = await client.query(query);
                resolve(result);
            } catch (error) {
                req.dbquery = query.text;
                req.dbqueryParameters = query.values;
                AddExceptionIntoDB(req, error);
                reject(error);
            }
        });
    }

    async getDeviceDetails(data: any, req: any) {
        let query: any = {
            text: DB_CONFIGS.adminQueries.adminDashboardQueries.getDeviceDetail(),
            values: [data.deviceName]
        };
        return new Promise(async (resolve, reject) => {
            try {
                let result = await client.query(query);
                resolve(result);
            } catch (error) {
                req.dbquery = query.text;
                req.dbqueryParameters = query.values;
                AddExceptionIntoDB(req, error);
                reject(error);
            }
        });
    }

    async addUpdateDeviceDetails(data: any, req: any) {
        let query: any = {
            text: DB_CONFIGS.adminQueries.adminDashboardQueries.addDevice(),
            values: [data.deviceName, data.location, data.latitude, data.longitude, data.deviceStatus]
        };
        return new Promise(async (resolve, reject) => {
            try {
                let result = await client.query(query);
                resolve(result);
            } catch (error) {
                req.dbquery = query.text;
                req.dbqueryParameters = query.values;
                AddExceptionIntoDB(req, error);
                reject(error);
            }
        });
    }

    async lockAndUnlockDevice(data: any, req: any) {
        let query: any = {
            text: DB_CONFIGS.adminQueries.adminDashboardQueries.lockAndUnlockDevice(),
            values: [data.deviceName, data.deviceStatus]
        };
        return new Promise(async (resolve, reject) => {
            try {
                let result = await client.query(query);
                resolve(result);
            } catch (error) {
                req.dbquery = query.text;
                req.dbqueryParameters = query.values;
                AddExceptionIntoDB(req, error);
                reject(error);
            }
        });
    }

    async getDashboardCount(req: any) {
        let query: any = {
            text: DB_CONFIGS.adminQueries.adminDashboardQueries.getDashboardCard(),
            values: []
        };
        return new Promise(async (resolve, reject) => {
            try {
                let result = await client.query(query);
                resolve(result);
            } catch (error) {
                logger.error('[DashboardServices.getDashboardCount] query failed: ' + query.text);
                logger.error('[DashboardServices.getDashboardCount] error: ' + (error as any)?.message);
                logger.error('[DashboardServices.getDashboardCount] stack: ' + ((error as any)?.stack || 'no-stack'));
                req.dbquery = query.text;
                req.dbqueryParameters = query.values;
                AddExceptionIntoDB(req, error);
                reject(error);
            }
        });
    }
    //----------------------------------test api now-----------------------------------------------------//
    async deviceRegistration(deviceDetails: any, req: any) {
        let actionOnDate = getUTCdate();
        let query: any = {
            text: DB_CONFIGS.adminQueries.adminDashboardQueries.deviceRegistration(),
            values: [deviceDetails.deviceName, deviceDetails.registrationNumber, deviceDetails.latitude, deviceDetails.longitude, actionOnDate]
        };

        return new Promise(async (resolve, reject) => {
            try {
                let result = await client.query(query);
                resolve(result);
            } catch (error) {
                req.dbquery = query.text;
                req.dbqueryParameters = query.values;
                AddExceptionIntoDB(req, error);
                reject(error);
            }
        });
    }

    async deviceRegistrationByAdmin(deviceDetails: any, req: any) {
        let actionOnDate = getUTCdate();
        let query: any = {
            text: DB_CONFIGS.adminQueries.adminDashboardQueries.deviceRegistrationByAdmin(),
            values: [deviceDetails.lockId, deviceDetails.registartionStatus]
        };

        return new Promise(async (resolve, reject) => {
            try {
                let result = await client.query(query);
                resolve(result);
            } catch (error) {
                req.dbquery = query.text;
                req.dbqueryParameters = query.values;
                AddExceptionIntoDB(req, error);
                reject(error);
            }
        });
    }

    async deviceRegistration2(deviceDetails: any, req: any) {
        let actionOnDate = getUTCdate();
        let query: any = {
            text: DB_CONFIGS.adminQueries.adminDashboardQueries.deviceRegistration2(),
            values: [deviceDetails.deviceName, actionOnDate]
        };

        return new Promise(async (resolve, reject) => {
            try {
                let result = await client.query(query);
                resolve(result);
            } catch (error) {
                req.dbquery = query.text;
                req.dbqueryParameters = query.values;
                AddExceptionIntoDB(req, error);
                reject(error);
            }
        });
    }

    async deviceRegistration3(deviceDetails: any, req: any) {
        let actionOnDate = getUTCdate();
        let query: any = {
            text: DB_CONFIGS.adminQueries.adminDashboardQueries.deviceRegistration3(),
            values: [
                deviceDetails.deviceName,
                deviceDetails.registrationNumber,
                deviceDetails.imeiNumber,
                deviceDetails.serialNumber,
                deviceDetails.odometer,
                deviceDetails.runTime,
                deviceDetails.chassisNumber,
                deviceDetails.dateOfManufacture,
                deviceDetails.dateOfService,
                actionOnDate,
                deviceDetails.deviceId
            ]
        };

        return new Promise(async (resolve, reject) => {
            try {
                let result = await client.query(query);
                resolve(result);
            } catch (error) {
                req.dbquery = query.text;
                req.dbqueryParameters = query.values;
                AddExceptionIntoDB(req, error);
                reject(error);
            }
        });
    }

    async deviceRegistration4(deviceDetails: any, req: any) {
        let actionOnDate = getUTCdate();
        let query: any = {
            text: DB_CONFIGS.adminQueries.adminDashboardQueries.deviceRegistration4(),
            values: [deviceDetails.rN, deviceDetails.sNumber, deviceDetails.cN, deviceDetails.dOM, actionOnDate, deviceDetails.dId]
        };

        return new Promise(async (resolve, reject) => {
            try {
                let result = await client.query(query);
                resolve(result);
            } catch (error) {
                req.dbquery = query.text;
                req.dbqueryParameters = query.values;
                AddExceptionIntoDB(req, error);
                reject(error);
            }
        });
    }

    async updateDeviceInformation(deviceDetails: any, req: any) {
        let actionOnDate = getUTCdate();
        let query: any = {
            text: DB_CONFIGS.adminQueries.adminDashboardQueries.updateDeviceInformation(),
            values: [
                deviceDetails.location,
                deviceDetails.latitude,
                deviceDetails.longitude,
                deviceDetails.altitude,
                deviceDetails.speed,
                deviceDetails.battery,
                deviceDetails.internal_batt_v,
                deviceDetails.external_batt_v,
                actionOnDate,
                deviceDetails.deviceId
            ]
        };

        return new Promise(async (resolve, reject) => {
            try {
                let result = await client.query(query);
                resolve(result);
            } catch (error) {
                req.dbquery = query.text;
                req.dbqueryParameters = query.values;
                AddExceptionIntoDB(req, error);
                reject(error);
            }
        });
    }

    // async updateDeviceInformationInMultiPart(deviceDetails: any) {
    //     let actionOnDate = getUTCdate();
    //     let query: any;

    //     if  ( CommonMessage.IsValid(deviceDetails.lat)==true && CommonMessage.IsValid(deviceDetails.long)==true ) {
    //        console.log('checkyyy8uiou9ii66oprtyuiodtj ','ihjj')
    //         query = {
    //             text: DB_CONFIGS.adminQueries.adminDashboardQueries.updateDeviceInformationPart1(),
    //             values: [deviceDetails.lat, deviceDetails.long, actionOnDate, deviceDetails.dId]
    //         };
    //         console.log('checkyyy8uiou9ii66oprtyuiodtj ','ihjj')

    //     }

    //     if (CommonMessage.IsValid(deviceDetails.ibv)==true ){
    //         query = {
    //             text: DB_CONFIGS.adminQueries.adminDashboardQueries.updateDeviceInternalBattery(),
    //             values: [deviceDetails.ibv,actionOnDate, deviceDetails.dId]
    //         };

    //     }

    //     if (CommonMessage.IsValid(deviceDetails.ebv)==true  ){
    //         query = {
    //             text: DB_CONFIGS.adminQueries.adminDashboardQueries.updateDeviceExternalBattery(),
    //             values: [deviceDetails.ebv, actionOnDate, deviceDetails.dId]
    //         };

    //     }

    //    if (CommonMessage.IsValid(deviceDetails.sp)==true  )
    //       {

    //         query = {
    //             text: DB_CONFIGS.adminQueries.adminDashboardQueries.updateDeviceSpeed(),
    //             values: [deviceDetails.sp, actionOnDate, deviceDetails.dId]
    //         };

    //     }

    //     if (CommonMessage.IsValid(deviceDetails.alt)==true )
    //     {

    //       query = {
    //           text: DB_CONFIGS.adminQueries.adminDashboardQueries.updateDeviceAltitude(),
    //           values: [deviceDetails.alt,actionOnDate, deviceDetails.dId]
    //       };

    //   }

    //     if (CommonMessage.IsValid(deviceDetails.loc)==true )
    //       {

    //         query = {
    //             text: DB_CONFIGS.adminQueries.adminDashboardQueries.updateDeviceLocations(),
    //             values: [deviceDetails.loc, actionOnDate, deviceDetails.dId]
    //         };

    //     }

    //     return new Promise(async (resolve, reject) => {
    //         try {

    //             let result =null;

    //             console.log('12')
    //             if(CommonMessage.IsValid(query)==true)
    //             {
    //                 console.log('13')
    //                 result = await client.query(query);
    //             }
    //             console.log('check quer  completed',query)
    //             resolve(result);
    //         } catch (error) {
    //             reject(error);
    //         }
    //     });
    // }

    async updateDeviceInformationInMultiPart(deviceDetails: any, req: any) {
        let actionOnDate = getUTCdate();
        let querylatlong: any;
        let queryibv: any;
        let queryebv: any;
        let querysp: any;
        let queryAltitude: any;
        let queryLocations: any;
        let queryRideBookinglatlongJson: any;
        let queryBetterPersentage: any;
        let deviceStateEnumId: any = 23;
        let res = '';
        let lastRequestTime: any = getUTCdate();
        let beepResult: any;
        let updateLockDetailWithMEotherParamter: any;

        //   await addDeviceDataFromTest(apiResponse.data)

        await this.setDeviceLastRequestTimeAndConnection(lastRequestTime, deviceStateEnumId, deviceDetails.lockId, req);

        if (CommonMessage.IsValid(deviceDetails.lat) == true && CommonMessage.IsValid(deviceDetails.long) == true) {
            let vaidLatLongResult: any = await checkVaidLatLong(deviceDetails.lat, deviceDetails.long);

            if (vaidLatLongResult != 'correct') {
                return false;
            }

            querylatlong = {
                text: DB_CONFIGS.adminQueries.adminDashboardQueries.updateDeviceInformationPart1(),
                values: [deviceDetails.lat, deviceDetails.long, actionOnDate, deviceDetails.dId, deviceDetails.distanceInMeters]
            };

            //console.log('check jhh,querylatlong',querylatlong)

            deviceDetails.latitude = deviceDetails.lat;
            deviceDetails.longitude = deviceDetails.long;
            deviceDetails.deviceId = deviceDetails.dId;
            // await setBeepOnInstructionController(deviceDetails,'check')
            // await setBeepOffInstructionController(deviceDetails,'check')

            let rideingIdResult: any = await adminLogDeviceInformationServices.getRideingIdByLockNumberService(deviceDetails);

            if (rideingIdResult.rowCount > 0) // for device  lock count rideing wise
            {
                deviceDetails.rideBookingId = rideingIdResult.rows[0].id;

                let latLongJsonData = {
                    latitude: deviceDetails.lat,
                    longitude: deviceDetails.long
                };
                queryRideBookinglatlongJson = {
                    text: DB_CONFIGS.rideBooking.addRidebookingLatLogJson(),
                    values: [latLongJsonData, deviceDetails.rideBookingId, deviceDetails.lat, deviceDetails.long, deviceDetails.distanceInMeters]
                };

                //   console.log('check query',queryRideBookinglatlongJson)
            }
        }

        if (CommonMessage.IsValid(deviceDetails.ibv) == true) {
            queryibv = {
                text: DB_CONFIGS.adminQueries.adminDashboardQueries.updateDeviceInternalBattery(),
                values: [deviceDetails.ibv, actionOnDate, deviceDetails.dId]
            };
        }

        if (CommonMessage.IsValid(deviceDetails.ebv) == true) {
            queryebv = {
                text: DB_CONFIGS.adminQueries.adminDashboardQueries.updateDeviceExternalBattery(),
                values: [deviceDetails.ebv, actionOnDate, deviceDetails.dId]
            };
        }

        if (CommonMessage.IsValid(deviceDetails.sp) == true) {
            querysp = {
                text: DB_CONFIGS.adminQueries.adminDashboardQueries.updateDeviceSpeed(),
                values: [deviceDetails.sp, actionOnDate, deviceDetails.dId]
            };
        }

        if (CommonMessage.IsValid(deviceDetails.alt) == true) {
            queryAltitude = {
                text: DB_CONFIGS.adminQueries.adminDashboardQueries.updateDeviceAltitude(),
                values: [deviceDetails.alt, actionOnDate, deviceDetails.dId]
            };
        }

        if (CommonMessage.IsValid(deviceDetails.loc) == true) {
            queryLocations = {
                text: DB_CONFIGS.adminQueries.adminDashboardQueries.updateDeviceLocations(),
                values: [deviceDetails.loc, actionOnDate, deviceDetails.dId]
            };
        }

        if (CommonMessage.IsValid(deviceDetails.pebv) == true) {
            queryBetterPersentage = {
                text: DB_CONFIGS.adminQueries.adminDashboardQueries.updateDeviceBetterPersentage(),
                values: [deviceDetails.pebv, actionOnDate, deviceDetails.dId]
            };
        }
        //console.log('check query for queryBetterPersentage',queryBetterPersentage)

        if (CommonMessage.IsValid(deviceDetails.device_lock_unlock_communication_enum_id) == true) {
            //console.log('check query for queryBetterPersentage',deviceDetails)

            if (CommonMessage.IsValid(deviceDetails.statesince) == false) {
                deviceDetails.statesince = null;
            }

            if (CommonMessage.IsValid(deviceDetails.statesince) == false) {
                deviceDetails.devicetime = null;
            }

            if (CommonMessage.IsValid(deviceDetails.fixtime) == false) {
                deviceDetails.fixtime = null;
            }
            if (CommonMessage.IsValid(deviceDetails.deveice_state_enum_id) == false) {
                deviceDetails.deveice_state_enum_id = '23';
            }
            if (CommonMessage.IsValid(deviceDetails.powerOnOffStatusEnumId) == false) {
                deviceDetails.powerOnOffStatusEnumId = null;
            }

            if (CommonMessage.IsValid(deviceDetails.valid) == false) {
                deviceDetails.valid = null;
            }

            updateLockDetailWithMEotherParamter = {
                text: DB_CONFIGS.adminQueries.adminDashboardQueries.updateLockDetailWithMEotherParamter(),
                values: [
                    deviceDetails.dId,
                    // deviceDetails.moving ,
                    // data.statesEnumId ,
                    deviceDetails.disabled,

                    deviceDetails.statesince,
                    deviceDetails.devicetime,

                    deviceDetails.fixtime,
                    deviceDetails.valid, // data.isvalid_deevice_packet ,
                    deviceDetails.deveice_state_enum_id,
                    actionOnDate, // data.device_last_request_time,
                    deviceDetails.powerOnOffStatusEnumId
                ]
            };
            //console.log('check  query',updateLockDetailWithMEotherParamter)
        }

        let queryNumber: any = '0';

        return new Promise(async (resolve, reject) => {
            try {
                let result = null;

                if (CommonMessage.IsValid(querylatlong) == true) {
                    queryNumber = '1';
                    //console.log('check  query querylatlong ' ,queryNumber)
                    result = await client.query(querylatlong);
                }
                if (CommonMessage.IsValid(queryibv) == true) {
                    queryNumber = '2';
                    //  console.log('check  query queryibv' ,queryNumber)

                    result = await client.query(queryibv);
                }
                if (CommonMessage.IsValid(queryebv) == true) {
                    queryNumber = '3';
                    //console.log('check  query queryebv' ,queryNumber)

                    result = await client.query(queryebv);
                }
                if (CommonMessage.IsValid(querysp) == true) {
                    queryNumber = '4';
                    // console.log('check  query querysp' ,queryNumber)

                    result = await client.query(querysp);
                }
                if (CommonMessage.IsValid(queryAltitude) == true) {
                    queryNumber = '5';
                    // console.log('check  query queryAltitude' ,queryNumber)

                    result = await client.query(queryAltitude);
                }
                if (CommonMessage.IsValid(queryLocations) == true) {
                    queryNumber = '6';
                    // console.log('check  query queryLocations' ,queryNumber)

                    result = await client.query(queryLocations);
                }
                if (CommonMessage.IsValid(queryRideBookinglatlongJson) == true) {
                    queryNumber = '7';
                    // console.log('check  query queryRideBookinglatlongJson' ,queryNumber)

                    result = await client.query(queryRideBookinglatlongJson);
                }

                if (CommonMessage.IsValid(queryBetterPersentage) == true) {
                    queryNumber = '8';
                    //  console.log('check  query queryBetterPersentage' ,queryNumber)
                    result = await client.query(queryBetterPersentage);
                }
                if (CommonMessage.IsValid(updateLockDetailWithMEotherParamter) == true) {
                    queryNumber = '9';
                    // console.log('check  query updateLockDetailWithMEotherParamter' ,queryNumber)
                    result = await client.query(updateLockDetailWithMEotherParamter);
                    //console.log('check  result result ' ,result)
                }

                resolve(result);
            } catch (error) {
                if (queryNumber == '1') {
                    //console.log('check  query catch error'   ,queryNumber)
                    req.dbquery = querylatlong.text;
                    req.dbqueryParameters = querylatlong.values;
                } else if (queryNumber == '2') {
                    //console.log('check  query catch error'   ,queryNumber)
                    req.dbquery = queryibv.text;
                    req.dbqueryParameters = queryibv.values;
                } else if (queryNumber == '3') {
                    // console.log('check  query catch error'   ,queryNumber)
                    req.dbquery = queryebv.text;
                    req.dbqueryParameters = queryebv.values;
                } else if (queryNumber == '4') {
                    // console.log('check  query catch error'   ,queryNumber)
                    req.dbquery = querysp.text;
                    req.dbqueryParameters = querysp.values;
                } else if (queryNumber == '5') {
                    //console.log('check  query catch error'   ,queryNumber)
                    req.dbquery = queryAltitude.text;
                    req.dbqueryParameters = queryAltitude.values;
                } else if (queryNumber == '6') {
                    //  console.log('check  query catch error'   ,queryNumber)
                    req.dbquery = queryLocations.text;
                    req.dbqueryParameters = queryLocations.values;
                } else if (queryNumber == '7') {
                    // console.log('check  query catch error'   ,queryNumber)
                    req.dbquery = queryRideBookinglatlongJson.text;
                    req.dbqueryParameters = queryRideBookinglatlongJson.values;
                } else if (queryNumber == '8') {
                    //  console.log('check  query catch error'   ,queryNumber)
                    req.dbquery = queryBetterPersentage.text;
                    req.dbqueryParameters = queryBetterPersentage.values;
                } else if (queryNumber == '9') {
                    // console.log('check  query catch error'   ,queryNumber)
                    req.dbquery = updateLockDetailWithMEotherParamter.text;
                    req.dbqueryParameters = updateLockDetailWithMEotherParamter.values;
                }

                // console.log('check  error' ,error)
                AddExceptionIntoDB(req, error);
                reject(error);
            }
        });
    }

    async checkDeviceRegistrationName(deviceDetails: any, req: any) {
        let query: any = {
            text: DB_CONFIGS.adminQueries.adminDashboardQueries.checkDuplicateDevice(),
            values: [deviceDetails.deviceName]
        };

        return new Promise(async (resolve, reject) => {
            try {
                let result = await client.query(query);
                resolve(result);
            } catch (error) {
                req.dbquery = query.text;
                req.dbqueryParameters = query.values;
                AddExceptionIntoDB(req, error);
                reject(error);
            }
        });
    }

    async deleteDevice(deviceDetails: any, req: any) {
        let query: any = {
            text: DB_CONFIGS.adminQueries.adminDashboardQueries.deviceDelete(),
            values: [deviceDetails.deviceName]
        };

        return new Promise(async (resolve, reject) => {
            try {
                let result = await client.query(query);
                resolve(result);
            } catch (error) {
                req.dbquery = query.text;
                req.dbqueryParameters = query.values;
                AddExceptionIntoDB(req, error);
                reject(error);
            }
        });
    }

    async addDeviceIdAndInstruction(deviceDetails: any, req: any) {
        let query: any = {
            text: DB_CONFIGS.adminQueries.adminDashboardQueries.addDeviceIdAndInstruction(),
            values: [deviceDetails.deviceId, deviceDetails.instructionId]
        };

        return new Promise(async (resolve, reject) => {
            try {
                let result = await client.query(query);
                resolve(result);
            } catch (error) {
                req.dbquery = query.text;
                req.dbqueryParameters = query.values;
                AddExceptionIntoDB(req, error);
                reject(error);
            }
        });
    }

    async getDeviceInstruction(deviceDetails: any, req: any) {
        let query: any = {
            text: DB_CONFIGS.adminQueries.adminDashboardQueries.getDeviceLockAndLightInstructionDeviceId(),
            values: [deviceDetails.dId]
        };

        return new Promise(async (resolve, reject) => {
            try {
                let result = await client.query(query);
                resolve(result);
            } catch (error) {
                req.dbquery = query.text;
                req.dbqueryParameters = query.values;
                AddExceptionIntoDB(req, error);
                reject(error);
            }
        });
    }
    async setDeviceLastRequestTimeAndConnection(lastRequestTime: any, deviceStateEnumId: any, lockId: any, req: any) {
        let query: any = {
            text: DB_CONFIGS.adminQueries.adminDashboardQueries.setDeviceLastTimeAndConnectionQuery(),
            values: [lastRequestTime, deviceStateEnumId, lockId]
        };

        // console.log('check values', query)
        return new Promise(async (resolve, reject) => {
            try {
                let result = await client.query(query);
                resolve(result);
            } catch (error) {
                req.dbquery = query.text;
                req.dbqueryParameters = query.values;
                AddExceptionIntoDB(req, error);
                reject(error);
            }
        });
    }

    async getDeviceTime(req: any) {
        let query: any = {
            text: DB_CONFIGS.adminQueries.adminDashboardQueries.getDeviceLastTime()
        };

        return new Promise(async (resolve, reject) => {
            try {
                let result = await client.query(query);
                resolve(result);
            } catch (error) {
                req.dbquery = query.text;
                req.dbqueryParameters = query.values;
                AddExceptionIntoDB(req, error);
                reject(error);
            }
        });
    }

    async updateDeviceState(currentTime: any) {
        let query: any = {
            text: DB_CONFIGS.adminQueries.adminDashboardQueries.updateDeviceStateTime(),
            values: [currentTime]
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
    async insertScheduleTime(scheduleTime: any, req: any) {
        let query: any = {
            text: DB_CONFIGS.adminQueries.adminDashboardQueries.insertSheduletime(),
            values: [scheduleTime]
        };

        return new Promise(async (resolve, reject) => {
            try {
                let result = await client.query(query);
                resolve(result);
            } catch (error) {
                req.dbquery = query.text;
                req.dbqueryParameters = query.values;
                AddExceptionIntoDB(req, error);
                reject(error);
            }
        });
    }

    async updateScheduleTime(scheduleTime: any, id: any, req: any) {
        let query: any = {
            text: DB_CONFIGS.adminQueries.adminDashboardQueries.updateSheduletime(),
            values: [scheduleTime, id]
        };

        return new Promise(async (resolve, reject) => {
            try {
                let result = await client.query(query);
                resolve(result);
            } catch (error) {
                req.dbquery = query.text;
                req.dbqueryParameters = query.values;
                AddExceptionIntoDB(req, error);
                reject(error);
            }
        });
    }
    async changeDeviceRegistrationStatus(deviceDetails: any, req: any) {
        let registrationStatus = true;
        let query: any = {
            text: DB_CONFIGS.adminQueries.adminDashboardQueries.changeDeviceRegistrationStatus(),
            values: [registrationStatus, deviceDetails.dId]
        };

        return new Promise(async (resolve, reject) => {
            try {
                let result = await client.query(query);
                resolve(result);
            } catch (error) {
                req.dbquery = query.text;
                req.dbqueryParameters = query.values;
                AddExceptionIntoDB(req, error);
                reject(error);
            }
        });
    }

    async setInstructionToLockUnlockDevice(deviceDetails: any, req: any) {
        let query: any = {
            text: DB_CONFIGS.adminQueries.adminDashboardQueries.setInstructionToLockUnlockDevice(),
            values: [deviceDetails.instructionId, deviceDetails.deviceId, deviceDetails.instructionLastUpdateDate]
        };

        return new Promise(async (resolve, reject) => {
            try {
                let result = await client.query(query);
                resolve(result);
            } catch (error) {
                req.dbquery = query.text;
                req.dbqueryParameters = query.values;
                AddExceptionIntoDB(req, error);
                reject(error);
            }
        });
    }

    async unlockDevice(deviceDetails: any, req: any) {
        let instructionId = 4;
        let query: any = {
            text: DB_CONFIGS.adminQueries.adminDashboardQueries.UnlockDevice(),
            values: [deviceDetails.lockStatus, instructionId, deviceDetails.dId, deviceDetails.lastUpdateTime]
        };

        return new Promise(async (resolve, reject) => {
            try {
                let result = await client.query(query);
                resolve(result);
            } catch (error) {
                req.dbquery = query.text;
                req.dbqueryParameters = query.values;
                AddExceptionIntoDB(req, error);
                reject(error);
            }
        });
    }

    async lockDevice(deviceDetails: any, req: any) {
        let instructionId = 4;
        let query: any = {
            text: DB_CONFIGS.adminQueries.adminDashboardQueries.lockDevice(),
            values: [deviceDetails.lockStatus, instructionId, deviceDetails.dId, deviceDetails.lastUpdateTime]
        };

        return new Promise(async (resolve, reject) => {
            try {
                let result = await client.query(query);
                resolve(result);
            } catch (error) {
                req.dbquery = query.text;
                req.dbqueryParameters = query.values;
                AddExceptionIntoDB(req, error);
                reject(error);
            }
        });
    }

    async updateWithdrawRequestFromAdminSide(user: any, req: any) {
        return new Promise(async (resolve, reject) => {
            let finalResult: any = [];
            user.requestId.forEach(async (value: any, i: number) => {
                user.requestId = value;
                let actionOnDate = getUTCdate();
                let query: any = {
                    text: DB_CONFIGS.customerQueries.updateStatusOfWithdrawRequest(),
                    values: [user.withdrawRequestStatusEnumId, actionOnDate, user.requestId, actionOnDate, user.processing_user_id]
                };
                //console.log('check quary getWithdrawRequestFromUser',query)
                try {
                    let result = await client.query(query);
                    finalResult.push(result);
                } catch (error) {
                    req.dbquery = query.text;
                    req.dbqueryParameters = query.values;
                    AddExceptionIntoDB(req, error);
                    reject(error);
                }
            });
            resolve(finalResult);
        });
    }

    async updateStatusCancelledOfWithdrawRequest(user: any, req: any) {
        return new Promise(async (resolve, reject) => {
            let finalResult: any = [];
            // user.requestId.forEach(async (value: any, i: number) => {
            //     user.requestId = value;
            let actionOnDate = getUTCdate();
            let query: any = {
                text: DB_CONFIGS.customerQueries.updateStatusCancelledOfWithdrawRequest(),
                values: [user.withdrawRequestStatusEnumId, actionOnDate, user.requestId, actionOnDate, user.cancelled_user_id, user.remarks]
            };
            // console.log('check quary getWithdrawRequestFromUser',query)
            try {
                let result = await client.query(query);
                finalResult.push(result);
            } catch (error) {
                req.dbquery = query.text;
                req.dbqueryParameters = query.values;
                AddExceptionIntoDB(req, error);
                reject(error);
            }
            // });
            resolve(finalResult);
        });
    }

    async completeWithdrawRequestFromAdminSide(user: any, req: any) {
        return new Promise(async (resolve, reject) => {
            const wId = crypto.randomBytes(8).toString('hex');

            let finalResult: any = [];
            user.requestId.forEach(async (value: any, i: number) => {
                let actionOnDate = getUTCdate();
                user.requestId = value;
                user.payment_id = 'with_' + wId;
                user.entity = 'Withdrawn';
                user.currency = 'INR';
                user.status = 'captured';
                user.method = 'Cash';
                user.description = 'Amount Withdrawn';

                let query: any = {
                    text: DB_CONFIGS.customerQueries.completeTheWithdrawnRequest(),
                    values: [
                        user.withdrawRequestStatusEnumId,
                        user.payment_id,
                        user.entity,
                        user.currency,
                        user.status,
                        user.method,
                        user.description,
                        actionOnDate,
                        user.requestId,
                        actionOnDate,
                        user.completed_user_id
                    ]
                };

                try {
                    let result: any = await client.query(query);

                    if (result.rowCount > 0) {
                        await updateWalletBalanceOfUser(user.requestId, req);
                    }
                    finalResult.push(result);
                } catch (error) {
                    req.dbquery = query.text;
                    req.dbqueryParameters = query.values;
                    AddExceptionIntoDB(req, error);
                    reject(error);
                }
            });
            resolve(finalResult);
        });
    }

    async getWithdrawRequestFromAdminSide(user: any, req: any) {
        let query: any = { text: DB_CONFIGS.customerQueries.getWithdrawRequestList(), values: [user.requestId, user.withdrawRequestStatusEnumId, user.id] };

        //  console.log('check quary getWithdrawRequestList',query)
        return new Promise(async (resolve, reject) => {
            try {
                let result = await client.query(query);
                resolve(result);
            } catch (error) {
                req.dbquery = query.text;
                req.dbqueryParameters = query.values;
                AddExceptionIntoDB(req, error);
                reject(error);
            }
        });
    }

    async getWithdrawTransaction(user: any, req: any) {
        let query: any = { text: DB_CONFIGS.customerQueries.getWithdrawnTransaction(), values: [user.id] };
        return new Promise(async (resolve, reject) => {
            try {
                let result = await client.query(query);
                resolve(result);
            } catch (error) {
                req.dbquery = query.text;
                req.dbqueryParameters = query.values;
                AddExceptionIntoDB(req, error);
                reject(error);
            }
        });
    }

    async getAllTransaction(user: any, req: any) {
        let query: any = { text: DB_CONFIGS.userTransaction.getAllTransaction(), values: [user.id, user.userName, user.mobileNo, user.transactionTypeEnumId] };

        return new Promise(async (resolve, reject) => {
            try {
                let result = await client.query(query);
                resolve(result);
            } catch (error) {
                req.dbquery = query.text;
                req.dbqueryParameters = query.values;
                AddExceptionIntoDB(req, error);
                reject(error);
            }
        });
    }
    async bikeBatteryStatusLessThenTwenty(requestQuery: any, req: any) {
        let query: any = {
            text: DB_CONFIGS.adminQueries.adminDashboardQueries.getProduceBikeBatteryStatusLessThenTwenty(),
            values: [requestQuery.mapCountryName, requestQuery.mapStateName, requestQuery.mapCityName]
        };

        return new Promise<string>(async (resolve, reject) => {
            try {
                let batteryArray: any = [];
                let geoFenceInOutResut: any = '';
                let result: any = await client.query(query);
                for (let row of result.rows) {
                    // let geoFenceInOut :any ='GeoIn';

                    // geoFenceInOutResut =await checkGeoInOout(row.beep_status_enum_id,row.beep_instruction_enum_id);

                    //console.log('kajfhajkhfds,geoFenceInOut',geoFenceInOutResut ,checkGeoInOout(row.beep_status_enum_id,row.beep_instruction_enum_id))
                    batteryArray.push({
                        bikeProduceId: row.id,
                        bikeName: row.bike_name,
                        batteryPercentage: row.battery,
                        batteryPercentageTime: row.lastupdateddateforbatterypercentage,
                        deveiceStateEnumId: row.deveice_state_enum_id,
                        deveiceStatus: resolveDeviceStatus(row.deveice_state_enum_id, row.device_last_request_time, row.deveice_status),
                        internalBattV: row.internal_batt_v,
                        externalBattV: row.external_batt_v,
                        lockNumber: row.lock_number,
                        latitude: row.latitude,
                        longitude: row.longitude,
                        bikeBookedStatus: row.bike_booked_status,
                        bikeBookedStatusName: row.bike_booked_status_name, //bike_booked_status === '13' ? 'Riding' : 'Not Riding',
                        zoneName: row.zone_name,
                        deviceLightStatusEnumId: row.device_light_status_enum_id,
                        deviceLightStatus: row.deveice_light_status,
                        deviceLightInstructionEnumId: row.device_light_instruction_enum_id,
                        deviceLightInstruction: row.device_light_instruction,
                        device_lock_and_unlock_status: row.device_lock_and_unlock_status,
                        device_lock_unlock_status: row.device_lock_unlock_status,
                        deviceLastRequestTime: row.device_last_request_time,
                        rideBookingId: row.ride_id,
                        rideBookingNo: row.ride_booking_no,
                        userName: row.user_name,
                        mobile: row.mobile,
                        beepInstructionEnumId: row.beep_instruction_enum_id,
                        beepInstructionEnumName: row.beep_instruction_enum_name,
                        beepStatusEnumId: row.beep_status_enum_id,
                        beepStatusEnumName: row.beep_status_enum_name,
                        instructionId: row.instruction_id,
                        instructionName: row.instruction_name,
                        geofenceInOutEnumId: row.geofence_inout_enum_id,
                        geoFenceInOut: row.geofence_inout_name,
                        powerOnOffStatusEnumId: row.power_on_off_status_enum_id,
                        powerOnOffStatus: row.power_on_off_status
                    });
                }
                //console.log('batteryArray',batteryArray)
                resolve(batteryArray);
            } catch (error) {
                req.dbquery = query.text;
                req.dbqueryParameters = query.values;
                AddExceptionIntoDB(req, error);
                reject(error);
            }
        });
    }
    async produceBikeBatteryStatusGraterThenTwentyAndLessThenFifty(requestQuery: any, req: any) {
        let query: any = {
            text: DB_CONFIGS.adminQueries.adminDashboardQueries.getProduceBikeBatteryStatusGraterThenTwentyAndLessThenFifty(),
            values: [requestQuery.mapCountryName, requestQuery.mapStateName, requestQuery.mapCityName]
        };
        return new Promise(async (resolve, reject) => {
            try {
                let batteryArray: any = [];
                let geoFenceInOut: any = '';
                let result: any = await client.query(query);
                for (let row of result.rows) {
                    geoFenceInOut = await checkGeoInOout(row.beep_status_enum_id, row.beep_instruction_enum_id);

                    batteryArray.push({
                        bikeProduceId: row.id,
                        bikeName: row.bike_name,
                        batteryPercentage: row.battery,
                        batteryPercentageTime: row.lastupdateddateforbatterypercentage,
                        deveiceStateEnumId: row.deveice_state_enum_id,
                        deveiceStatus: resolveDeviceStatus(row.deveice_state_enum_id, row.device_last_request_time, row.deveice_status),
                        internalBattV: row.internal_batt_v,
                        externalBattV: row.external_batt_v,
                        lockNumber: row.lock_number,
                        latitude: row.latitude,
                        longitude: row.longitude,
                        bikeBookedStatus: row.bike_booked_status,
                        bikeBookedStatusName: row.bike_booked_status_name, //bike_booked_status === '13' ? 'Riding' : 'Not Riding',
                        zoneName: row.zone_name,
                        deviceLightStatusEnumId: row.device_light_status_enum_id,
                        deviceLightStatus: row.deveice_light_status,
                        deviceLightInstructionEnumId: row.device_light_instruction_enum_id,
                        deviceLightInstruction: row.device_light_instruction,
                        device_lock_and_unlock_status: row.device_lock_and_unlock_status,
                        device_lock_unlock_status: row.device_lock_unlock_status,
                        deviceLastRequestTime: row.device_last_request_time,
                        rideBookingId: row.ride_id,
                        rideBookingNo: row.ride_booking_no,
                        userName: row.user_name,
                        mobile: row.mobile,
                        beepInstructionEnumId: row.beep_instruction_enum_id,
                        beepInstructionEnumName: row.beep_instruction_enum_name,
                        beepStatusEnumId: row.beep_status_enum_id,
                        beepStatusEnumName: row.beep_status_enum_name,
                        instructionId: row.instruction_id,
                        instructionName: row.instruction_name,
                        geofenceInOutEnumId: row.geofence_inout_enum_id,
                        geoFenceInOut: row.geofence_inout_name,
                        powerOnOffStatusEnumId: row.power_on_off_status_enum_id,
                        powerOnOffStatus: row.power_on_off_status
                    });
                }

                resolve(batteryArray);
            } catch (error) {
                req.dbquery = query.text;
                req.dbqueryParameters = query.values;
                AddExceptionIntoDB(req, error);
                reject(error);
            }
        });
    }
    async produceBikeBatteryStatusGraterThenFifty(requestQuery: any, req: any) {
        let query: any = {
            text: DB_CONFIGS.adminQueries.adminDashboardQueries.getProduceBikeBatteryStatusGraterThenFifty(),
            values: [requestQuery.mapCountryName, requestQuery.mapStateName, requestQuery.mapCityName]
        };
        return new Promise(async (resolve, reject) => {
            try {
                let batteryArray: any = [];
                let geoFenceInOut: any = '';
                let result: any = await client.query(query);
                for (let row of result.rows) {
                    geoFenceInOut = await checkGeoInOout(row.beep_status_enum_id, row.beep_instruction_enum_id);

                    batteryArray.push({
                        bikeProduceId: row.id,
                        bikeName: row.bike_name,
                        batteryPercentage: row.battery,
                        batteryPercentageTime: row.lastupdateddateforbatterypercentage,
                        deveiceStateEnumId: row.deveice_state_enum_id,
                        deveiceStatus: resolveDeviceStatus(row.deveice_state_enum_id, row.device_last_request_time, row.deveice_status),
                        internalBattV: row.internal_batt_v,
                        externalBattV: row.external_batt_v,
                        lockNumber: row.lock_number,
                        latitude: row.latitude,
                        longitude: row.longitude,
                        bikeBookedStatus: row.bike_booked_status,
                        bikeBookedStatusName: row.bike_booked_status_name, //bike_booked_status === '13' ? 'Riding' : 'Not Riding',
                        zoneName: row.zone_name,
                        deviceLightStatusEnumId: row.device_light_status_enum_id,
                        deviceLightStatus: row.deveice_light_status,
                        deviceLightInstructionEnumId: row.device_light_instruction_enum_id,
                        deviceLightInstruction: row.device_light_instruction,
                        device_lock_and_unlock_status: row.device_lock_and_unlock_status,
                        device_lock_unlock_status: row.device_lock_unlock_status,
                        deviceLastRequestTime: row.device_last_request_time,
                        rideBookingId: row.ride_id,
                        rideBookingNo: row.ride_booking_no,
                        userName: row.user_name,
                        mobile: row.mobile,
                        beepInstructionEnumId: row.beep_instruction_enum_id,
                        beepInstructionEnumName: row.beep_instruction_enum_name,
                        beepStatusEnumId: row.beep_status_enum_id,
                        beepStatusEnumName: row.beep_status_enum_name,
                        instructionId: row.instruction_id,
                        instructionName: row.instruction_name,
                        geofenceInOutEnumId: row.geofence_inout_enum_id,
                        geoFenceInOut: row.geofence_inout_name,
                        powerOnOffStatusEnumId: row.power_on_off_status_enum_id,
                        powerOnOffStatus: row.power_on_off_status
                    });
                }

                resolve(batteryArray);
            } catch (error) {
                req.dbquery = query.text;
                req.dbqueryParameters = query.values;
                AddExceptionIntoDB(req, error);
                reject(error);
            }
        });
    }
    async updateUserMinimumWalletBalanceValues(details: any, req: any) {
        let query: any = {
            text: DB_CONFIGS.adminQueries.adminDashboardQueries.changesMinimumWalletBalance(),
            values: [details.enum_id, details.enum_value, details.enum_value]
        };
        //  console.log('🚀 ~ file: admin.dashboard.services.ts ~ line 567 ~ DashboardServices ~ updateUserMinimumWalletBalanceValues ~ query', query);
        return new Promise<string>(async (resolve, reject) => {
            try {
                let result = await client.query(query);
                resolve(result);
            } catch (error) {
                req.dbquery = query.text;
                req.dbqueryParameters = query.values;
                AddExceptionIntoDB(req, error);
                reject(error);
            }
        });
    }
    async addMinimumWalletBalanceHistory(minWalletAmountDetails: any, req: any) {
        let actionOnDate = getUTCdate();
        let query: any = {
            text: DB_CONFIGS.adminQueries.adminDashboardQueries.addMinimumWalletBalanceHistory(),
            values: [
                minWalletAmountDetails.enum_value,
                1,
                actionOnDate,
                minWalletAmountDetails.actionByLoginUserId,
                minWalletAmountDetails.actionByUserTypeEnumId,
                minWalletAmountDetails.actionByLoginUserId,
                actionOnDate,
                minWalletAmountDetails.actionByUserTypeEnumId,
                minWalletAmountDetails.enum_id
            ]
        };
        //  console.log('🚀 ~ file: admin.dashboard.services.ts ~ line 567 ~ DashboardServices ~ updateUserMinimumWalletBalanceValues ~ query', query);
        return new Promise<string>(async (resolve, reject) => {
            try {
                let result = await client.query(query);
                resolve(result);
            } catch (error) {
                req.dbquery = query.text;
                req.dbqueryParameters = query.values;
                AddExceptionIntoDB(req, error);
                reject(error);
            }
        });
    }
    async getMinimumWalletBalanceHistory(minWalletAmountDetails: any, req: any) {
        let query: any = { text: DB_CONFIGS.adminQueries.adminDashboardQueries.getMinimumWalletBalanceHistory(), values: [minWalletAmountDetails.id] };
        return new Promise(async (resolve, reject) => {
            try {
                let result = await client.query(query);
                resolve(result);
            } catch (error) {
                req.dbquery = query.text;
                req.dbqueryParameters = query.values;
                AddExceptionIntoDB(req, error);
                reject(error);
            }
        });
    }

    async setDeviceLightOnOffInstruction(deviceDetails: any, req: any) {
        let query: any = {
            text: DB_CONFIGS.adminQueries.adminDashboardQueries.setDeviceLightOnOffInstructionQuery(),
            values: [deviceDetails.instructionDeviceLightInstructionEnumId, deviceDetails.lockId, deviceDetails.instructionLastUpdateDate]
        };

        return new Promise(async (resolve, reject) => {
            try {
                let result = await client.query(query);
                resolve(result);
            } catch (error) {
                req.dbquery = query.text;
                req.dbqueryParameters = query.values;
                AddExceptionIntoDB(req, error);
                reject(error);
            }
        });
    }

    // async setDeviceLightOffInstruction(deviceDetails: any) {
    //     let query: any = {
    //         text: DB_CONFIGS.adminQueries.adminDashboardQueries.setDeviceLightOffInstructionQuery(),
    //         values: [deviceDetails.deviceId]
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

    async LightOnOffByDeviceService(deviceDetails: any, req: any) {
        // deviceDetails.createdonDate is used for last lcok and unlock date and time

        let query: any = {
            text: DB_CONFIGS.adminQueries.adminDashboardQueries.lightOnOffDeviecQuery(),
            values: [deviceDetails.deviceLightStatusEnumId, deviceDetails.device_lock_detail_light_instruction_enum_id, deviceDetails.lockId, deviceDetails.createdonDate]
        };

        return new Promise(async (resolve, reject) => {
            try {
                let result = await client.query(query);
                resolve(result);
            } catch (error) {
                req.dbquery = query.text;
                req.dbqueryParameters = query.values;
                AddExceptionIntoDB(req, error);
                reject(error);
            }
        });
    }

    async setDeviceBeepOnOffInstruction(deviceDetails: any, req: any) {
        let query: any = {
            text: DB_CONFIGS.adminQueries.adminDashboardQueries.setDeviceBeepOnOffInstructionQuery(),
            values: [deviceDetails.beepInstructionEnumId, deviceDetails.lockId, deviceDetails.instructionLastUpdateDate]
        };

        return new Promise(async (resolve, reject) => {
            try {
                let result = await client.query(query);
                resolve(result);
            } catch (error) {
                req.dbquery = query.text;
                req.dbqueryParameters = query.values;
                AddExceptionIntoDB(req, error);
                reject(error);
            }
        });
    }

    async setBikeGeoInOut(deviceDetails: any, req: any) {
        let query: any = {
            text: DB_CONFIGS.adminQueries.adminDashboardQueries.setBikeGeoInOutQuery(),
            values: [deviceDetails.geofence_inout_enum_id, deviceDetails.bikeId]
        };

        return new Promise(async (resolve, reject) => {
            try {
                let result = await client.query(query);
                resolve(result);
            } catch (error) {
                req.dbquery = query.text;
                req.dbqueryParameters = query.values;
                AddExceptionIntoDB(req, error);
                reject(error);
            }
        });
    }

    async beepOnOffByDeviceService(deviceDetails: any, req: any) {
        let query: any = {
            text: DB_CONFIGS.adminQueries.adminDashboardQueries.beepOnOffDeviecQuery(),
            values: [deviceDetails.beepStatusEnumId, deviceDetails.beep_instruction_enum_id, deviceDetails.lockId, deviceDetails.createdonDate]
        };

        return new Promise(async (resolve, reject) => {
            try {
                let result = await client.query(query);
                resolve(result);
            } catch (error) {
                req.dbquery = query.text;
                req.dbqueryParameters = query.values;
                AddExceptionIntoDB(req, error);
                reject(error);
            }
        });
    }

    //-----
    async getOutSideGeoFanceBikeListZoneWise(bikeDetail: any, req: any) {
        let query: any = {
            text: DB_CONFIGS.bikeProduce.getOutSideGeoFanceBikeListQ(),
            values: [bikeDetail.zoneId]
        };

        return new Promise<string>(async (resolve, reject) => {
            try {
                let bikeProduceDetails: any = [];

                let result: any = await client.query(query);
                for (let row of result.rows) {
                    bikeProduceDetails.push({
                        id: row.id,

                        lockId: row.lock_id,
                        lockNumber: row.lock_number,
                        bikeName: row.bike_name,
                        deveiceStateEnumId: row.deveice_state_enum_id,
                        deveiceStatus: resolveDeviceStatus(row.deveice_state_enum_id, row.device_last_request_time, row.deveice_status),
                        device_lock_and_unlock_status: row.device_lock_and_unlock_status,
                        device_lock_unlock_status: row.device_lock_unlock_status,
                        location: row.location,
                        latitude: row.latitude,
                        longitude: row.longitude,
                        altitude: row.altitude,
                        zoneName: row.zone_name,
                        batteryPercentage: row.battery,
                        deviceLightStatusEnumId: row.device_light_status_enum_id,
                        deviceLightStatus: row.deveice_light_status,
                        deviceLightInstructionEnumId: row.device_light_instruction_enum_id,
                        deviceLightInstruction: row.device_light_instruction,
                        deviceLastRequestTime: row.device_last_request_time,

                        beepStatusEnumId: row.beep_status_enum_id,
                        beepStatusName: row.beep_status_name,
                        beepInstructionEnumId: row.beep_instruction_enum_id,
                        beepInstructionName: row.beep_instruction_name,

                        rideBookingNo: row.ride_booking_no,
                        mapCityId: Number(row.map_city_id),
                        mapCityName: row.map_city_name,
                        userCityName: row.user_city_name,
                        mapDrawObjectEnumId: row.map_draw_object_enum_id,
                        mapDrawObjectName: row.map_draw_object_status,
                        mapDrawObject: row.map_draw_object,
                        mapDrawObjectAddress: row.map_draw_object_address,

                        areaId: Number(row.area_id),
                        areaName: row.area_name,
                        areaMapDrawObjectEnumId: row.area_map_draw_object_enum_id,
                        areaMapDrawObjectName: row.area_map_draw_object_status,
                        areaMapDrawObject: row.area_map_draw_object,
                        areaMapDrawObjectAddress: row.area_map_draw_object_address,
                        instructionId: row.instruction_id,
                        instructionName: row.instruction_name,
                        bikeStatusName: row.bike_booked_status_name,
                        bikeStatusEnumId: row.deveice_state_enum_id,
                        geofenceInOutEnumId: row.geofence_inout_enum_id,
                        geoFenceInOut: row.geofence_inout_name
                    });
                }
                resolve(bikeProduceDetails);
            } catch (error) {
                req.dbquery = query.text;
                req.dbqueryParameters = query.values;
                AddExceptionIntoDB(req, error);
                reject(error);
            }
        });
    }

    async getActiveBikeListZoneWise(bikeDetail: any, req: any) {
        let query: any = {
            text: DB_CONFIGS.bikeProduce.activeRideList(),
            values: [bikeDetail.zoneId]
        };
        return new Promise<string>(async (resolve, reject) => {
            try {
                let bikeProduceDetails: any = [];

                let result: any = await client.query(query);
                for (let row of result.rows) {
                    bikeProduceDetails.push({
                        userId: row.user_id,
                        mobile: row.mobile,
                        userName: row.user_name,
                        bikeId: row.bike_id,

                        fromRideTime: row.from_ride_time,
                        toRideTime: row.to_ride_time,

                        lockId: row.lock_id,
                        lockNumber: row.lock_number,
                        bikeName: row.bike_name,
                        deveiceStateEnumId: row.deveice_state_enum_id,
                        deveiceStatus: resolveDeviceStatus(row.deveice_state_enum_id, row.device_last_request_time, row.deveice_status),
                        device_lock_and_unlock_status: row.device_lock_and_unlock_status,
                        device_lock_unlock_status: row.device_lock_unlock_status,
                        location: row.location,
                        latitude: row.latitude,
                        longitude: row.longitude,
                        altitude: row.altitude,
                        zoneName: row.zone_name,
                        batteryPercentage: row.battery,
                        deviceLightStatusEnumId: row.device_light_status_enum_id,
                        deviceLightStatus: row.deveice_light_status,
                        deviceLightInstructionEnumId: row.device_light_instruction_enum_id,
                        deviceLightInstruction: row.device_light_instruction,
                        deviceLastRequestTime: row.device_last_request_time,

                        beepStatusEnumId: row.beep_status_enum_id,
                        beepStatusName: row.beep_status_name,
                        beepInstructionEnumId: row.beep_instruction_enum_id,
                        beepInstructionName: row.beep_instruction_name,

                        rideBookingId: row.ride_booking_id,
                        rideBookingNo: row.ride_booking_no,
                        mapCityId: Number(row.map_city_id),
                        mapCityName: row.map_city_name,
                        userCityName: row.user_city_name,
                        mapDrawObjectEnumId: row.map_draw_object_enum_id,
                        mapDrawObjectName: row.map_draw_object_status,
                        mapDrawObject: row.map_draw_object,
                        mapDrawObjectAddress: row.map_draw_object_address,

                        areaId: Number(row.area_id),
                        areaName: row.area_name,
                        areaMapDrawObjectEnumId: row.area_map_draw_object_enum_id,
                        areaMapDrawObjectName: row.area_map_draw_object_status,
                        areaMapDrawObject: row.area_map_draw_object,
                        areaMapDrawObjectAddress: row.area_map_draw_object_address,
                        instructionId: row.instruction_id,
                        instructionName: row.instruction_name,
                        bikeStatusName: row.bike_booked_status_name,
                        bikeStatusEnumId: row.bike_booked_status,
                        geofenceInOutEnumId: row.geofence_inout_enum_id,
                        geoFenceInOut: row.geofence_inout_name
                    });
                }
                resolve(bikeProduceDetails);
            } catch (error) {
                req.dbquery = query.text;
                req.dbqueryParameters = query.values;
                AddExceptionIntoDB(req, error);
                reject(error);
            }
        });
    }

    async getAvaialableBikeListZoneWise(bikeDetail: any, req: any) {
        let query: any = {
            text: DB_CONFIGS.bikeProduce.availableBikeList(),
            values: [bikeDetail.zoneId]
        };
        return new Promise<string>(async (resolve, reject) => {
            try {
                let bikeProduceDetails: any = [];

                let result: any = await client.query(query);
                for (let row of result.rows) {
                    bikeProduceDetails.push({
                        bikeId: row.bike_id,

                        lockId: row.lock_id,
                        lockNumber: row.lock_number,
                        bikeName: row.bike_name,
                        deveiceStateEnumId: row.deveice_state_enum_id,
                        deveiceStatus: resolveDeviceStatus(row.deveice_state_enum_id, row.device_last_request_time, row.deveice_status),
                        device_lock_and_unlock_status: row.device_lock_and_unlock_status,
                        device_lock_unlock_status: row.device_lock_unlock_status,
                        location: row.location,
                        latitude: row.latitude,
                        longitude: row.longitude,
                        altitude: row.altitude,
                        zoneName: row.zone_name,
                        batteryPercentage: row.battery,
                        deviceLightStatusEnumId: row.device_light_status_enum_id,
                        deviceLightStatus: row.deveice_light_status,
                        deviceLightInstructionEnumId: row.device_light_instruction_enum_id,
                        deviceLightInstruction: row.device_light_instruction,
                        deviceLastRequestTime: row.device_last_request_time,

                        beepStatusEnumId: row.beep_status_enum_id,
                        beepStatusName: row.beep_status_name,
                        beepInstructionEnumId: row.beep_instruction_enum_id,
                        beepInstructionName: row.beep_instruction_name,

                        rideBookingNo: row.ride_booking_no,
                        mapCityId: Number(row.map_city_id),
                        mapCityName: row.map_city_name,
                        userCityName: row.user_city_name,
                        mapDrawObjectEnumId: row.map_draw_object_enum_id,
                        mapDrawObjectName: row.map_draw_object_status,
                        mapDrawObject: row.map_draw_object,
                        mapDrawObjectAddress: row.map_draw_object_address,

                        areaId: Number(row.area_id),
                        areaName: row.area_name,
                        areaMapDrawObjectEnumId: row.area_map_draw_object_enum_id,
                        areaMapDrawObjectName: row.area_map_draw_object_status,
                        areaMapDrawObject: row.area_map_draw_object,
                        areaMapDrawObjectAddress: row.area_map_draw_object_address,
                        instructionId: row.instruction_id,
                        instructionName: row.instruction_name,
                        bikeStatusName: row.bike_booked_status_name,
                        bikeStatusEnumId: row.bike_booked_status,
                        geofenceInOutEnumId: row.geofence_inout_enum_id,
                        geoFenceInOut: row.geofence_inout_name
                    });
                }
                resolve(bikeProduceDetails);
            } catch (error) {
                req.dbquery = query.text;
                req.dbqueryParameters = query.values;
                AddExceptionIntoDB(req, error);
                reject(error);
            }
        });
    }

    async getUnderMantanceBikeListZoneWise(bikeDetail: any, req: any) {
        let query: any = {
            text: DB_CONFIGS.bikeProduce.getUndermaintenanceBike(),
            values: [bikeDetail.zoneId]
        };
        return new Promise<string>(async (resolve, reject) => {
            try {
                let bikeProduceDetails: any = [];

                let result: any = await client.query(query);
                for (let row of result.rows) {
                    bikeProduceDetails.push({
                        bikeId: row.bike_id,

                        lockId: row.lock_id,
                        lockNumber: row.lock_number,
                        bikeName: row.bike_name,
                        deveiceStateEnumId: row.deveice_state_enum_id,
                        deveiceStatus: resolveDeviceStatus(row.deveice_state_enum_id, row.device_last_request_time, row.deveice_status),
                        device_lock_and_unlock_status: row.device_lock_and_unlock_status,
                        device_lock_unlock_status: row.device_lock_unlock_status,
                        location: row.location,
                        latitude: row.latitude,
                        longitude: row.longitude,
                        altitude: row.altitude,
                        zoneName: row.zone_name,
                        batteryPercentage: row.battery,
                        deviceLightStatusEnumId: row.device_light_status_enum_id,
                        deviceLightStatus: row.deveice_light_status,
                        deviceLightInstructionEnumId: row.device_light_instruction_enum_id,
                        deviceLightInstruction: row.device_light_instruction,
                        deviceLastRequestTime: row.device_last_request_time,

                        beepStatusEnumId: row.beep_status_enum_id,
                        beepStatusName: row.beep_status_name,
                        beepInstructionEnumId: row.beep_instruction_enum_id,
                        beepInstructionName: row.beep_instruction_name,

                        rideBookingNo: row.ride_booking_no,
                        mapCityId: Number(row.map_city_id),
                        mapCityName: row.map_city_name,
                        userCityName: row.user_city_name,
                        mapDrawObjectEnumId: row.map_draw_object_enum_id,
                        mapDrawObjectName: row.map_draw_object_status,
                        mapDrawObject: row.map_draw_object,
                        mapDrawObjectAddress: row.map_draw_object_address,

                        areaId: Number(row.area_id),
                        areaName: row.area_name,
                        areaMapDrawObjectEnumId: row.area_map_draw_object_enum_id,
                        areaMapDrawObjectName: row.area_map_draw_object_status,
                        areaMapDrawObject: row.area_map_draw_object,
                        areaMapDrawObjectAddress: row.area_map_draw_object_address,
                        instructionId: row.instruction_id,
                        instructionName: row.instruction_name,
                        bikeStatusName: row.bike_booked_status_name,
                        bikeStatusEnumId: row.bike_booked_status,
                        geofenceInOutEnumId: row.geofence_inout_enum_id,
                        geoFenceInOut: row.geofence_inout_name
                    });
                }
                resolve(bikeProduceDetails);
            } catch (error) {
                req.dbquery = query.text;
                req.dbqueryParameters = query.values;
                AddExceptionIntoDB(req, error);
                reject(error);
            }
        });
    }

    async getLastTenTransaction(user: any, req: any) {
        let query: any = { text: DB_CONFIGS.userTransaction.getLastTenTransaction(), values: [user.id] };

        return new Promise(async (resolve, reject) => {
            try {
                let result = await client.query(query);
                resolve(result);
            } catch (error) {
                req.dbquery = query.text;
                req.dbqueryParameters = query.values;
                AddExceptionIntoDB(req, error);
                reject(error);
            }
        });
    }

    async lockUnlockDeviceForThirdPartyApi(deviceDetails: any, req: any) {
        let query: any = {
            text: DB_CONFIGS.adminQueries.adminDashboardQueries.deviceLockUnlockForthirdParty(),
            values: [deviceDetails.deviceLockAndUnlockStatus, deviceDetails.lastUpdateTime, deviceDetails.lockId, deviceDetails.device_lock_unlock_communication_enum_id]
        };

        return new Promise(async (resolve, reject) => {
            try {
                let result = await client.query(query);
                resolve(result);
            } catch (error) {
                req.dbquery = query.text;
                req.dbqueryParameters = query.values;
                AddExceptionIntoDB(req, error);
                reject(error);
            }
        });
    }

    async powerOnOffForThirdPartyApi(deviceDetails: any, req: any) {
        let query: any = {
            text: DB_CONFIGS.adminQueries.adminDashboardQueries.powerOnOffForthirdParty(),
            values: [deviceDetails.powerOnOffStatusEnumId, deviceDetails.lastUpdateTime, deviceDetails.lockId]
        };

        return new Promise(async (resolve, reject) => {
            try {
                let result = await client.query(query);
                resolve(result);
            } catch (error) {
                req.dbquery = query.text;
                req.dbqueryParameters = query.values;
                AddExceptionIntoDB(req, error);
                reject(error);
            }
        });
    }

    async clearInstructionForLockUnlock(deviceDetails: any, req: any) {
        let query: any = {
            text: DB_CONFIGS.adminQueries.adminDashboardQueries.clearInstructionForLockUnlockDeviceQ(),
            values: [deviceDetails.instructionId, deviceDetails.lockId]
        };
        return new Promise(async (resolve, reject) => {
            try {
                let result = await client.query(query);
                resolve(result);
            } catch (error) {
                req.dbquery = query.text;
                req.dbqueryParameters = query.values;
                AddExceptionIntoDB(req, error);
                reject(error);
            }
        });
    }

    async clearInstructionForLightOnOffDevice(deviceDetails: any, req: any) {
        let query: any = {
            text: DB_CONFIGS.adminQueries.adminDashboardQueries.clearInstructionForLightOnOffDeviceQuery(),
            values: [deviceDetails.deviceLightInstructionEnumId, deviceDetails.lockId]
        };
        return new Promise(async (resolve, reject) => {
            try {
                let result = await client.query(query);
                resolve(result);
            } catch (error) {
                req.dbquery = query.text;
                req.dbqueryParameters = query.values;
                AddExceptionIntoDB(req, error);
                reject(error);
            }
        });
    }

    async insertVersionDetail(requestBody: any, req: any) {
        //console.log('check requestBody',requestBody)
        requestBody.date = getUTCdate();
        requestBody.versionApplyDate = requestBody.date;
        requestBody.createdOnDate = requestBody.date;
        let query: any = {
            text: DB_CONFIGS.versionQueries.insertVersion(),
            values: [
                requestBody.displayVersion,
                requestBody.actualVersion,
                requestBody.minSupportableVersion,
                requestBody.remark,
                requestBody.versionApplyDate,
                requestBody.createdOnDate,
                requestBody.createdByLoginUserId
            ]
        };
        return new Promise(async (resolve, reject) => {
            try {
                let result = await client.query(query);
                resolve(result);
            } catch (error) {
                req.dbquery = query.text;
                req.dbqueryParameters = query.values;
                AddExceptionIntoDB(req, error);
                reject(error);
            }
        });
    }

    async getVersionHistory(req: any, res: any) {
        let query: any = {
            text: DB_CONFIGS.versionQueries.getVersionHistory()
            //   values: [requestBody.newAppVersion,requestBody.appVersionName,requestBody.lastVersionUpdateDate,requestBody.versionApplyDate,requestBody.createdOnDate,requestBody.createdByLoginUserId]
        };
        return new Promise(async (resolve, reject) => {
            try {
                let result = await client.query(query);
                resolve(result);
            } catch (error) {
                req.dbquery = query.text;
                req.dbqueryParameters = query.values;
                AddExceptionIntoDB(req, error);
                reject(error);
            }
        });
    }

    async getVersionCurrentService(req: any, res: any) {
        let query: any = {
            text: DB_CONFIGS.versionQueries.getVersionCurrent()
            //   values: [requestBody.newAppVersion,requestBody.appVersionName,requestBody.lastVersionUpdateDate,requestBody.versionApplyDate,requestBody.createdOnDate,requestBody.createdByLoginUserId]
        };
        return new Promise(async (resolve, reject) => {
            try {
                let result = await client.query(query);
                resolve(result);
            } catch (error) {
                req.dbquery = query.text;
                req.dbqueryParameters = query.values;
                AddExceptionIntoDB(req, error);
                reject(error);
            }
        });
    }
    async getMiniSupportCurrentVersionService(req: any, res: any) {
        let query: any = {
            text: DB_CONFIGS.versionQueries.getMiniSupportCurrentVersion()
            //   values: [requestBody.newAppVersion,requestBody.appVersionName,requestBody.lastVersionUpdateDate,requestBody.versionApplyDate,requestBody.createdOnDate,requestBody.createdByLoginUserId]
        };
        return new Promise(async (resolve, reject) => {
            try {
                let result = await client.query(query);
                resolve(result);
            } catch (error) {
                req.dbquery = query.text;
                req.dbqueryParameters = query.values;
                AddExceptionIntoDB(req, error);
                reject(error);
            }
        });
    }

    async updateAppUserVersion(req: any, res: any) {
        //console.log('check update version',req.body)
        let requestBody = req.body;
        requestBody.date = getUTCdate();
        requestBody.versionApplyDate = requestBody.date;
        requestBody.createdOnDate = requestBody.date;

        let query: any = {
            text: DB_CONFIGS.versionQueries.updateAppUserVersion(),
            values: [
                requestBody.versionId,
                requestBody.displayVersion,
                requestBody.actualVersion,
                requestBody.minSupportableVersion,
                requestBody.actionRemark,
                requestBody.versionApplyDate,
                requestBody.createdOnDate,
                requestBody.createdByLoginUserId
            ]
        };
        //  console.log('check query', query)
        return new Promise(async (resolve, reject) => {
            try {
                let result = await client.query(query);
                resolve(result);
            } catch (error) {
                req.dbquery = query.text;
                req.dbqueryParameters = query.values;
                AddExceptionIntoDB(req, error);
                reject(error);
            }
        });
    }
    async updateOldVersion(req: any, res: any) {
        let requestBody = req.body;

        requestBody.createdOnDate = getUTCdate();
        requestBody.minSupportableVer = false;
        let query: any = {
            text: DB_CONFIGS.versionQueries.updateOldVersion(),
            values: [requestBody.minSupportableVer, requestBody.createdOnDate]
        };
        //console.log('check query', query)
        return new Promise(async (resolve, reject) => {
            try {
                let result = await client.query(query);
                resolve(result);
            } catch (error) {
                req.dbquery = query.text;
                req.dbqueryParameters = query.values;
                AddExceptionIntoDB(req, error);
                reject(error);
            }
        });
    }
}

async function updateWalletBalanceOfUser(requestId: number, req: any) {
    let query: any = '';
    let result: any;
    return new Promise(async (resolve, reject) => {
        try {
            query = { text: DB_CONFIGS.customerQueries.getWithdrawRequestList(), values: [requestId, 12, 0] };

            result = await client.query(query);
            let amount: any = '0'; // The amount is already deducted when a user request is withdrawn.
            let actionOnDate = getUTCdate();
            query = {
                text: DB_CONFIGS.customerQueries.withdrawnWalletAmountFromUserAccount(),
                values: [amount, actionOnDate, result.rows[0].user_id]
            };
            let transaction = {
                id: result.rows[0].user_id,
                paymentTransactionId: null,
                transactionType: 'Amount Withdrawn',
                walletAmount: result.rows[0].amount,
                extraCharges: 0,
                hiringCharges: 0,
                fromRideTime: null,
                toRideTime: null,
                rideBookingMinutes: null,
                withdrawnId: result.rows[0].payment_id,
                rideBookingId: null
            };
            result = await client.query(query);
            if (result.rowCount > 0) {
                await GetUserServices.insertUserAllTransactionDetails(transaction);
            }
            resolve(result);
        } catch (error) {
            req.dbquery = query.text;
            req.dbqueryParameters = query.values;
            AddExceptionIntoDB(req, error);
            reject(error);
        }
    });
}

export default new DashboardServices();
