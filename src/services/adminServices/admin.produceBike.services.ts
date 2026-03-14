import { client } from '../../Config/db.connection';
import { DB_CONFIGS } from '../../Config/db.queries';
import { getUTCdate } from '../../helper/datetime';
import { generatedQrCodeForVehicles } from '../../helper/common-function';
import { encrypt } from '../../helper/common-function';
import { AddExceptionIntoDB } from '../../helper/responseHandler';
class BikeProduce {
    constructor() {}

    async insertBikeProduce(bikeProduceDetails: any) {
        let actionOnDate = getUTCdate();
        let data = {
            vehicleId: bikeProduceDetails.vehicleId,
            uId: bikeProduceDetails.uId,
            lockId: bikeProduceDetails.lockId
        };
        let encryptData = encrypt(JSON.stringify(bikeProduceDetails.qrNumber));

        let qr = await generatedQrCodeForVehicles({ encryptQr: encryptData });

        let query: any = {
            text: DB_CONFIGS.bikeProduce.insertBikeProduce(),
            values: [
                bikeProduceDetails.vehicleId,
                bikeProduceDetails.uId,
                bikeProduceDetails.lockId,
                bikeProduceDetails.statusEnumId,
                qr,
                bikeProduceDetails.remark,
                bikeProduceDetails.actionByLoginUserId,
                bikeProduceDetails.actionByUserTypeEnumId,
                actionOnDate,
                encryptData,
                bikeProduceDetails.zoneId,
                bikeProduceDetails.bikeName,
                bikeProduceDetails.geofence_inout_enum_id,
                bikeProduceDetails.qrNumber
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

    async updateQRcodeForBikeProduce(bikeProduceDetails: any) {
        let actionOnDate = getUTCdate();

        let encryptData = encrypt(JSON.stringify(bikeProduceDetails.qrNumber));

        let qr = await generatedQrCodeForVehicles({ encryptQr: encryptData });
        let query: any = {
            text: DB_CONFIGS.bikeProduce.updateQRcodeForBikeProduce(),
            values: [bikeProduceDetails.bikeProduceId, bikeProduceDetails.qrNumber, encryptData.toString(), qr, bikeProduceDetails.remark, bikeProduceDetails.actionByLoginUserId, actionOnDate]
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

    async updateBikeProduce(bikeProduceDetails: any) {
        let actionOnDate = getUTCdate();
        let data = {
            vehicleId: bikeProduceDetails.vehicleId,
            uId: bikeProduceDetails.uId,
            lockId: bikeProduceDetails.lockId
        };
        let encryptData = encrypt(JSON.stringify(data));

        let qr = await generatedQrCodeForVehicles({ encryptQr: encryptData });
        let query: any = {
            text: DB_CONFIGS.bikeProduce.updateBikeProduce(),
            values: [
                bikeProduceDetails.vehicleId,
                bikeProduceDetails.uId,
                bikeProduceDetails.lockId,
                bikeProduceDetails.statusEnumId,
                qr,
                bikeProduceDetails.remark,
                bikeProduceDetails.actionByLoginUserId,
                bikeProduceDetails.actionByUserTypeEnumId,
                actionOnDate,
                encryptData.toString(),
                bikeProduceDetails.bikeProduceId,
                bikeProduceDetails.zoneId
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

    async getBikeProduceDetails(bikeProduceDetails: any) {
        let query: any = {
            text: DB_CONFIGS.bikeProduce.getBikeProduceDetails(),
            values: [bikeProduceDetails.bikeProduceId, bikeProduceDetails.statusEnumId]
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

    async updateUIdStatusFromBikeProduce(bikeProduceDetails: any) {
        let query: any = {
            text: DB_CONFIGS.inwardQueries.bikeInward.updateUIdStatusFromBikeProduce(),
            values: [bikeProduceDetails.uId]
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

    async getBikeReservedUnReservedStatus(bikeProduceDetails: any) {
        let query: any = {
            text: DB_CONFIGS.bikeProduce.getBikeReservedUnReservedStatus(),
            values: [bikeProduceDetails.vehicleId, bikeProduceDetails.uId, bikeProduceDetails.lockId]
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

    async calculateDistance(latlogDetail: any) {
        let query: any = {
            text: DB_CONFIGS.rideBooking.findNearestZone(),
            values: [latlogDetail.rideEndLatitude + ' ' + latlogDetail.rideEndtLongitude]
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

    async getEncryptedData(bikeProduceDetails: any) {
        let query: any = {
            text: DB_CONFIGS.bikeProduce.getEncryptedData(),
            values: [bikeProduceDetails.qrString]
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

    async getBikeQRData(bikeProduceDetails: any) {
        let query: any = {
            text: DB_CONFIGS.bikeProduce.getBikeId(),
            values: [bikeProduceDetails.lockNumber]
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
    async checkSameCombinationBikeNotProduce(bikeProduceDetails: any) {
        let query: any = {
            text: DB_CONFIGS.bikeProduce.checkSameCombinationBikeNotProduce(),
            values: [bikeProduceDetails.uId, bikeProduceDetails.lockId, bikeProduceDetails.bikeProduceId]
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

    async checkSameCombinationLockNumberWithBikeNotProduce(bikeProduceDetails: any) {
        let query: any = {
            text: DB_CONFIGS.bikeProduce.checkSameCombinationBikeNotProduce(),
            values: [bikeProduceDetails.lockId, bikeProduceDetails.bikeProduceId]
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

    async checkSameCombinationUIdWithBikeNotProduce(bikeProduceDetails: any) {
        let query: any = {
            text: DB_CONFIGS.bikeProduce.checkSameCombinationBikeNotProduce(),
            values: [bikeProduceDetails.uId, bikeProduceDetails.bikeProduceId]
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
    async checkNameBikeExitOrNot(bikeProduceDetails: any) {
        let query: any = {
            text: DB_CONFIGS.bikeProduce.checkNameBikeExitOrNot(),
            values: [bikeProduceDetails.bikeName, bikeProduceDetails.bikeProduceId]
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

    async getBookedBikeList(bikeProduceDetails: any) {
        let query: any = {
            text: DB_CONFIGS.bikeProduce.activeRideListWithMapCitySearch(),
            values: [bikeProduceDetails.mapCountryName, bikeProduceDetails.mapStateName, bikeProduceDetails.mapCityName, bikeProduceDetails.rideBookingId]
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

    async getDeveiceLatLog(deviceId: any) {
        let query: any = {
            text: DB_CONFIGS.bikeProduce.deviceLatLog(),
            values: [deviceId.deviceId]
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

    async getDeveiceLatLogAll(deviceData: any) {
        let query: any = {
            text: DB_CONFIGS.bikeProduce.deviceLatLogAll(),
            values: [deviceData.searchRef || '', Boolean(deviceData.exactOnly)]
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

    async getAvailableBikeList(bikeDetail: any) {
        let query: any = {
            text: DB_CONFIGS.bikeProduce.availableBikeListWithMapCitySearch(),
            values: [bikeDetail.mapCountryName, bikeDetail.mapStateName, bikeDetail.mapCityName, bikeDetail.lockId]
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
    async availableLockUnlockCardDetailService(bikeDetail: any) {
        let query: any = {
            text: DB_CONFIGS.bikeProduce.availableLockUnlockCardDetail(),
            values: [bikeDetail.mapCountryName, bikeDetail.mapStateName, bikeDetail.mapCityName, bikeDetail.lockId]
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

    async getUndermaintenanceBikeList(bikeProduceDetail: any) {
        let query: any = {
            text: DB_CONFIGS.bikeProduce.getUndermaintenanceBikeWithMapCitySearch(),
            values: [bikeProduceDetail.mapCountryName, bikeProduceDetail.mapStateName, bikeProduceDetail.mapCityName, bikeProduceDetail.lockId]
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

    async getOutSideGeoFanceBikeListServce(bikeDetail: any) {
        let query: any = {
            text: DB_CONFIGS.bikeProduce.getOutSideGeoFanceBikeListMaCitySearchQ(),
            values: [bikeDetail.mapCountryName, bikeDetail.mapStateName, bikeDetail.mapCityName]
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

export default new BikeProduce();
