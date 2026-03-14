import { client } from '../../Config/db.connection';
import { DB_CONFIGS } from '../../Config/db.queries';
import { getUTCdate } from '../../helper/datetime';
import { AddExceptionIntoDB } from '../../helper/responseHandler';
class AddLog {
    constructor() {}

    addDeviceInstructionLog(deviceDetails: any) {
        let actionOnDate = getUTCdate();

        let query: any = {
            text: DB_CONFIGS.deviceInformationLog.addInstructionLog(),
            values: [
                deviceDetails.lockId,
                deviceDetails.lockNumber,
                deviceDetails.deviceLockAndUnlockStatus,
                deviceDetails.deviceLockAndUnlockStatusName,
                deviceDetails.instructionId,
                deviceDetails.instructionName,
                deviceDetails.statusEnumId,
                deviceDetails.actionRemarks,
                actionOnDate,
                deviceDetails.createdByLoginUserId,
                deviceDetails.createdByUserTypeEnumId,
                deviceDetails.rideBookingId,
                deviceDetails.device_lock_unlock_communication_enum_id,
                deviceDetails.remarks
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

    addInstructionPowerOnOffLog(deviceDetails: any) {
        let actionOnDate = getUTCdate();

        let query: any = {
            text: DB_CONFIGS.deviceInformationLog.addInstructionPowerOnOffLogQ(),
            values: [
                deviceDetails.lockId,
                deviceDetails.powerOnOffStatusEnumId,
                deviceDetails.powerInstructionEnumId,

                deviceDetails.statusEnumId,
                deviceDetails.actionRemarks,
                actionOnDate,

                deviceDetails.createdByLoginUserId,
                deviceDetails.rideBookingId,
                deviceDetails.remarks
            ]
        };

        //console.log('check qyery' ,query)
        return new Promise(async (resolve, reject) => {
            try {
                let result = await client.query(query);
                resolve(result);
            } catch (error) {
                reject(error);
            }
        });
    }
    async addDeviceRegistrationLog(deviceDetails: any) {
        let actionOnDate = getUTCdate();
        let query: any = {
            text: DB_CONFIGS.deviceInformationLog.addDeviceRegistrationLog(),
            values: [
                deviceDetails?.lockId,
                deviceDetails?.dId,
                1,
                'Device Registration',
                actionOnDate,
                null,
                17,
                deviceDetails?.dN,
                deviceDetails?.rNumber,
                true,
                deviceDetails?.imeiN,
                deviceDetails?.sN,
                deviceDetails?.odom,
                deviceDetails?.rT,
                deviceDetails?.cN,
                deviceDetails?.dOM,
                deviceDetails?.dOS
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
    async updateDeviceInformationLog(deviceDetails: any) {
        let actionOnDate = getUTCdate();
        let query: any = {
            text: DB_CONFIGS.deviceInformationLog.addDeviceInformationLog(),
            values: [
                deviceDetails.lockId,
                deviceDetails.deviceId,
                1,
                'Update Device Information',
                actionOnDate,
                null,
                17,
                deviceDetails?.location,
                deviceDetails?.latitude,
                deviceDetails?.longitude,
                deviceDetails?.altitude,
                deviceDetails?.speed,
                deviceDetails?.battery,
                deviceDetails?.internal_batt_v,
                deviceDetails?.external_batt_v,
                deviceDetails?.rideBookingId
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

    async updateDeviceInformationLogFromMultiPart(deviceDetails: any) {
        let actionOnDate = getUTCdate();
        let query: any = {
            text: DB_CONFIGS.deviceInformationLog.addDeviceInformationLog(),
            values: [
                deviceDetails.lockId,
                deviceDetails.dId,
                1,
                'Update Device Information',
                actionOnDate,
                null,
                17,
                deviceDetails?.loc,
                deviceDetails?.lat,
                deviceDetails?.long,
                deviceDetails?.alt,
                deviceDetails?.sp,
                deviceDetails?.pebv, // check krna h battery par ebvp
                deviceDetails?.ibv,
                deviceDetails?.ebv,
                deviceDetails?.latitudeDb,
                deviceDetails?.longitudeDb,
                deviceDetails?.distanceInMeters,
                deviceDetails?.rideBookingId
            ]
        };

        //console.log('check distance ')
        return new Promise(async (resolve, reject) => {
            try {
                let result = await client.query(query);
                resolve(result);
            } catch (error) {
                reject(error);
            }
        });
    }

    async insertDeviceLightInstrusctions(deviceDetails: any) {
        let query: any = {
            text: DB_CONFIGS.adminQueries.adminDashboardQueries.insertDeviceLightInstructionsQuery(),
            values: [
                deviceDetails.lockId,
                deviceDetails.rideBookingId,
                deviceDetails.instructionDeviceLightInstructionEnumId,
                deviceDetails.statusEnumId,
                deviceDetails.createdonDate,
                deviceDetails.userId
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

    async addDeviceLightInformationslog(deviceDetails: any) {
        let createdonDate: any = getUTCdate();
        //   console.log('deviceDetails.userId',deviceDetails.userId)
        let query: any = {
            text: DB_CONFIGS.adminQueries.adminDashboardQueries.addDeviceLightInformationslogQuery(),
            values: [
                deviceDetails.lockId,
                deviceDetails.deviceId,
                deviceDetails.rideBookingId,
                deviceDetails.deviceLightStatusEnumId,
                deviceDetails.deviceLightInstructionEnumId,
                deviceDetails.statusEnumId,
                deviceDetails.remarks,
                createdonDate,
                deviceDetails.userId,
                deviceDetails.instructionId,
                deviceDetails.deviceLockAndUnlockStatus,

                deviceDetails.beepInstructionEnumIdLog,
                deviceDetails.beepStatusEnumId,
                deviceDetails.latitude,
                deviceDetails.longitude,
                deviceDetails.mapCityId,
                deviceDetails.areaId,
                deviceDetails.device_lock_unlock_communication_enum_id,
                deviceDetails.powerOnOffStatusEnumId,
                deviceDetails.powerInstructionEnumId,
                deviceDetails.actionRemarks,

                deviceDetails?.latitudeDb,
                deviceDetails?.longitudeDb,
                deviceDetails?.distanceInMeters
                //  deviceDetails?.distanceInMeters
            ]
        };

        //    console.log('check error for addDeviceLightInformationslog', query);

        return new Promise(async (resolve, reject) => {
            try {
                let result = await client.query(query);
                resolve(result);
            } catch (error) {
                reject(error);
            }
        });
    }
    async getRideingIdByLockNumberService(deviceDetails: any) {
        let query: any = {
            text: DB_CONFIGS.adminQueries.adminDashboardQueries.getRideingIdByLockNumber(),
            values: [deviceDetails.lockId]
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

    async getLockUnLockCommodsService(dbLockUnlockCommondid: any) {
        let query: any = {
            text: DB_CONFIGS.adminQueries.adminDashboardQueries.getLockUnLockCommods(),
            values: [dbLockUnlockCommondid]
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

    async updateAreaCityInLockDetail(deviceDetails: any) {
        let query: any = {
            text: DB_CONFIGS.adminQueries.adminDashboardQueries.updateAreaCityInLockDetail(),
            values: [deviceDetails.area_id, deviceDetails.map_city_id, deviceDetails.lockId]
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

    async addDeviceLockCountService(deviceDetails: any) {
        let query: any = {
            text: DB_CONFIGS.adminQueries.adminDashboardQueries.addDeviceLockCountQuery(),
            values: [deviceDetails.counts, deviceDetails.rideBookingId]
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

    async addDeviceUnLockCountService(deviceDetails: any) {
        let query: any = {
            text: DB_CONFIGS.adminQueries.adminDashboardQueries.addDeviceUnLockCounttQuery(),
            values: [deviceDetails.counts, deviceDetails.rideBookingId]
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

    async addLightOffCountService(deviceDetails: any) {
        let query: any = {
            text: DB_CONFIGS.adminQueries.adminDashboardQueries.addLightOffCountQuery(),
            values: [deviceDetails.counts, deviceDetails.rideBookingId]
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

    async addLightOnCountService(deviceDetails: any) {
        let query: any = {
            text: DB_CONFIGS.adminQueries.adminDashboardQueries.addLightOnCountQuery(),
            values: [deviceDetails.counts, deviceDetails.rideBookingId]
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
    async getLockStatusService() {
        let query: any = {
            text: DB_CONFIGS.adminQueries.adminDashboardQueries.getLockStatus()
            // values: [deviceDetails.deviceId]
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

    async getLockIdByLockNumberService(deviceDetails: any) {
        let query: any = {
            text: DB_CONFIGS.adminQueries.adminDashboardQueries.getLockIdByLockNumber(),
            values: [deviceDetails.deviceId]
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

    async deviceLogInfoReport(deviceDetails: any) {
        let query: any = {
            text: DB_CONFIGS.deviceLogInfoReports.LogInfoReportsQuery(),
            values: [
                deviceDetails.lockId,
                deviceDetails.fromDate,
                deviceDetails.toDate,
                deviceDetails.speed,

                deviceDetails.latitude,
                deviceDetails.longitude,
                deviceDetails.battery,

                deviceDetails.internal_batt_v,
                deviceDetails.external_batt_v,
                deviceDetails.altitude,
                deviceDetails.deviceLightStatusEnumId,
                deviceDetails.deviceLightInstructionEnumId,
                deviceDetails.instructionId,
                deviceDetails.deviceLockAndUnlockStatus,
                deviceDetails.beepInstructionEnumId,
                deviceDetails.beepStatusEnumId,
                deviceDetails.powerOnOffStatusEnumId
            ]
        };

        //   console.log('check query', query)
        return new Promise(async (resolve, reject) => {
            try {
                let result = await client.query(query);
                resolve(result);
            } catch (error) {
                reject(error);
            }
        });
    }

    async insertBeepInstrusctions(deviceDetails: any) {
        let query: any = {
            text: DB_CONFIGS.adminQueries.adminDashboardQueries.insertBeepInstructionsQuery(),
            values: [
                deviceDetails.lockId,
                deviceDetails.rideBookingId,
                deviceDetails.beepInstructionEnumId,
                deviceDetails.statusEnumId,
                deviceDetails.createdonDate,
                deviceDetails.userId,
                deviceDetails.latitude,
                deviceDetails.longitude,
                deviceDetails.mapCityId,
                deviceDetails.areaId
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

    async addBeepOffCountService(deviceDetails: any) {
        let query: any = {
            text: DB_CONFIGS.adminQueries.adminDashboardQueries.addBeepOffCountQuery(),
            values: [deviceDetails.counts, deviceDetails.rideBookingId]
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

    async addBeepOnCountService(deviceDetails: any) {
        let query: any = {
            text: DB_CONFIGS.adminQueries.adminDashboardQueries.addBeepOnCountQuery(),
            values: [deviceDetails.counts, deviceDetails.rideBookingId]
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

    async getBikeStatusAndZoneService(deviceDetails: any) {
        let query: any = {
            text: DB_CONFIGS.adminQueries.adminDashboardQueries.getBikeStatusAndZone(),
            values: [deviceDetails.lockId]
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

    async addRidebookingBeepOnLatLogJson(latLongJsonData: any, rideBookingId: any, areaId: any, mapCityId: any) {
        let query: any = {
            text: DB_CONFIGS.adminQueries.adminDashboardQueries.addRidebookingBeepOnLatLogJsonQ(),
            values: [latLongJsonData, rideBookingId, areaId, mapCityId]
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

    async addRidebookingBeepOffLatLogJson(latLongJsonData: any, rideBookingId: any) {
        let query: any = {
            text: DB_CONFIGS.adminQueries.adminDashboardQueries.addRidebookingBeepOffLatLogJsonQ(),
            values: [latLongJsonData, rideBookingId]
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

    async getUserForDipositRechargeList(requestBody: any) {
        let query: any = {
            text: DB_CONFIGS.customerQueries.getUserForDipositRechargeList(),
            values: [requestBody.userName, requestBody.mobile]
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

export default new AddLog();
