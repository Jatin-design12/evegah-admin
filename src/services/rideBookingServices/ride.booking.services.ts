import moment, { utc } from 'moment';
import { client } from '../../Config/db.connection';
import { DB_CONFIGS } from '../../Config/db.queries';
import { getUTCdate } from '../../helper/datetime';
import { AddExceptionIntoDB } from '../../helper/responseHandler';
//const date = require('date-and-time')
class RideBooking {
    constructor() {}

    async insertRideBooking(rideDetails: any) {
        let actionOnDate = getUTCdate();
        rideDetails.fromRideTime = actionOnDate;
        // console.log('check rideend  time ',rideDetails.fromRideTime)
        rideDetails.toRideTime = moment(rideDetails.fromRideTime).add(rideDetails.rideBookingMinutes, 'm').toDate();

        // console.log('check rideend  time ',rideDetails.toRideTime)
        let query: any = {
            text: DB_CONFIGS.rideBooking.insertRideBooking(),
            values: [
                rideDetails.id,
                rideDetails.vehicleId,
                rideDetails.uId,
                rideDetails.lockId,
                rideDetails.rideBookingMinutes,
                rideDetails.fromRideTime,
                rideDetails.toRideTime,
                rideDetails.ridePaymentStatus,
                rideDetails.hiringCharges,
                rideDetails.perviousCharges,
                actionOnDate,
                1,
                rideDetails.paymentTransactionId,
                rideDetails.rideStartLatitude,
                rideDetails.rideStartLongitude,
                rideDetails.bikeId,
                rideDetails.minimumHiringTime,
                rideDetails.minimumRentRate,
                rideDetails.farePlanId,
                rideDetails.rideStartAddress,
                rideDetails.rideStartExternalBatteryVoltage,
                rideDetails.rideStartInternalBatteryVoltage,
                rideDetails.rideStartZoneId,
                rideDetails.rideBookingNo,
                rideDetails.beepOnCount,
                rideDetails.beepOffCount,
                rideDetails.areaId,
                rideDetails.mapCityId,
                rideDetails.distanceInMeters,
                rideDetails.rideStartBatteryPercentage,
                rideDetails.rideRating
            ]
        };

        return new Promise(async (resolve, reject) => {
            try {
                let result = await client.query(query);
                // console.log('check inside try01 result ',result)
                resolve(result);
            } catch (error) {
                reject(error);
            }
        });
    }

    async addRideBookingRating(rideDetails: any, req: any) {
        let actionOnDate = getUTCdate();

        // console.log('check rideend  time ',rideDetails.toRideTime)
        let query: any = {
            text: DB_CONFIGS.rideBooking.addRidebookingRating(),
            values: [rideDetails.rideRating, rideDetails.rideComments, rideDetails.commentsReplyStatusEnumId, rideDetails.rideBookingId]
        };

        return new Promise(async (resolve, reject) => {
            try {
                let result = await client.query(query);
                // console.log('check inside try01 result ',result)
                resolve(result);
            } catch (error) {
                reject(error);
            }
        });
    }

    async addRidebookingCommentsReply(rideDetails: any, req: any) {
        let actionOnDate = getUTCdate();

        // console.log('check rideend  time ',rideDetails.toRideTime)
        let query: any = {
            text: DB_CONFIGS.rideBooking.addRidebookingCommentsReply(),
            values: [rideDetails.rideCommentsReply, rideDetails.commentsReplyStatusEnumId, rideDetails.rideBookingId, rideDetails.commentsReplyDate]
        };

        return new Promise(async (resolve, reject) => {
            try {
                let result = await client.query(query);
                // console.log('check inside try01 result ',result)
                resolve(result);
            } catch (error) {
                reject(error);
            }
        });
    }

    async getRideBookingDetailForCommentsReplyService(req: any) {
        let query: any = {
            text: DB_CONFIGS.rideBooking.getRideBookingDetailForCommentsReply(),
            values: [req.body.fromDate, req.body.toDate, req.body.rideRating, req.body.commentsReplyStatusEnumId, req.body.userName, req.body.mobileNo]
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

    async addWalletAmount(rideDetails: any) {
        let actionOnDate = getUTCdate();
        let query: any = {
            text: DB_CONFIGS.rideBooking.addWalletAmount(),
            values: [rideDetails.walletAmount, rideDetails.extraCharges, actionOnDate, rideDetails.id]
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
    async getWalletAmountByUserId(userId: any) {
        let query: any = {
            text: DB_CONFIGS.rideBooking.getWalletAmount(),
            values: [userId.id]
        };
        //  console.log('check amount get query',query);
        return new Promise(async (resolve, reject) => {
            try {
                let userDetail = await client.query(query);
                resolve(userDetail);
            } catch (error) {
                reject(error);
            }
        });
    }
    async getPreviousChargesByUserId(rideDetails: any) {
        let query: any = {
            text: DB_CONFIGS.rideBooking.previousCharges(),
            values: [rideDetails.id]
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
    async updateExtraCharges(rideDetails: any) {
        let actionOnDate = getUTCdate();
        let query: any = {
            text: DB_CONFIGS.rideBooking.UpdateExtraCharges(),
            values: [rideDetails.extraCharges, rideDetails.id, actionOnDate]
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
    async updateActualTime(rideDetails: any) {
        let actionOnDate = getUTCdate();
        // rideDetails.actualRideTime = actionOnDate;
        let query: any = {
            text: DB_CONFIGS.rideBooking.updateActualTimeTake(),
            values: [
                rideDetails.actualRideTime,
                rideDetails.rideBookingId,
                actionOnDate,
                rideDetails.actualRideMin,
                rideDetails.extraCharges,
                rideDetails.totalRideAmount,
                rideDetails.rideEndLatitude,
                rideDetails.rideEndLongitude,
                rideDetails.rideEndRemarks,
                rideDetails.endRideUserId,
                rideDetails.rideEndAddress,
                rideDetails.endRideZoneId,
                rideDetails.rideEndInternalBatteryVoltage,
                rideDetails.rideEndExternalBatteryVoltage,
                rideDetails.light_off_count,
                rideDetails.device_lock_count,
                rideDetails.rideEndBatteryPercentage
                //rideDetails.endRideZoneId
                // rideDetails.minimumHiringTime,
                // rideDetails.minimumRentRate,
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
    async getRideBookingDetails(rideDetails: any) {
        let query: any = {
            text: DB_CONFIGS.rideBooking.getRideBookingDetails(),
            values: [rideDetails.rideBookingId, rideDetails.statusEnumId, rideDetails.id]
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

    async updateBikeReservedAndUnReservedStatus(rideDetails: any) {
        let query: any = {
            text: DB_CONFIGS.rideBooking.updateBikeReservedAndUnReservedStatus(),
            values: [rideDetails.vehicleId, rideDetails.uId, rideDetails.lockId, rideDetails.reservedAndUnReservedStatus, rideDetails.endProductZoneId]
        };
        //    console.log('check updateBikeReservedAndUnReservedStatus',query)
        return new Promise(async (resolve, reject) => {
            try {
                let result = await client.query(query);
                resolve(result);
            } catch (error) {
                reject(error);
            }
        });
    }
    async getRideBookingHiringChargesByUserId(rideDetails: any) {
        let query: any = {
            text: DB_CONFIGS.rideBooking.getRideBookingHiringCharges(),
            values: [rideDetails.id, rideDetails.rideBookingId]
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
    async getRideBookingExtraChargesByUserId(rideDetails: any) {
        let query: any = {
            text: DB_CONFIGS.rideBooking.getRideBookingExtraCharges(),
            values: [rideDetails.id, rideDetails.rideBookingId]
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
    async getRideBookingTotalChargesByUserId(rideDetails: any) {
        let query: any = {
            text: DB_CONFIGS.rideBooking.getRideBookingTotalCharges(),
            values: [rideDetails.id, rideDetails.rideBookingId]
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

    async getWalletAmountToEnumTbl() {
        let query: any = {
            text: DB_CONFIGS.rideBooking.getLastMinAmount()
        };
        //  console.log('check amount get query',query);
        return new Promise(async (resolve, reject) => {
            try {
                let userDetail = await client.query(query);
                resolve(userDetail);
            } catch (error) {
                reject(error);
            }
        });
    }

    async getLastDepositAmount() {
        let query: any = {
            text: DB_CONFIGS.rideBooking.getLastDepositAmount()
        };
        //  console.log('check amount get query',query);
        return new Promise(async (resolve, reject) => {
            try {
                let userDetail = await client.query(query);
                resolve(userDetail);
            } catch (error) {
                reject(error);
            }
        });
    }

    async getLastMinRechargeAmountTbl() {
        let query: any = {
            text: DB_CONFIGS.rideBooking.getLastMinRechargeAmount()
        };
        //  console.log('check amount get query',query);
        return new Promise(async (resolve, reject) => {
            try {
                let userDetail = await client.query(query);
                resolve(userDetail);
            } catch (error) {
                reject(error);
            }
        });
    }

    async getBikeDetails(bikeDetails: any) {
        let query: any = {
            text: DB_CONFIGS.rideBooking.getBikeDetail(),
            values: [bikeDetails.bike]
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

    async getBikeOtherBikeAtSameLocke(bikeDetails: any) {
        let query: any = {
            text: DB_CONFIGS.rideBooking.getBikeOtherBikeAtSameLocke(),
            values: [bikeDetails.bikeId, bikeDetails.lockId, bikeDetails.status_enum_id]
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

    async getBikeOtherBikeAtSameUId(bikeDetails: any) {
        let query: any = {
            text: DB_CONFIGS.rideBooking.getBikeOtherBikeAtSameUId(),
            values: [bikeDetails.bikeId, bikeDetails.uId, bikeDetails.status_enum_id]
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

    async findNearestZone(latlogDetail: any) {
        let query: any = {
            text: DB_CONFIGS.rideBooking.findNearestZone(),
            values: [latlogDetail.dbrideEndLatitude + ' ' + latlogDetail.dbrideEndtLongitude]
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

    async getLockDetailForRideStart(bikeDetails: any) {
        let query: any = {
            text: DB_CONFIGS.rideBooking.getLockDetailForRideStartQuery(),
            values: [bikeDetails.lockId]
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

    async getZoneForRideBooking(bikeDetails: any) {
        let query: any = {
            text: DB_CONFIGS.rideBooking.getZoneForRideBooking(),
            values: [bikeDetails.modelId, bikeDetails.uId]
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

    async getAreaAndAreaType(bikeDetails: any) {
        let query: any = {
            text: DB_CONFIGS.rideBooking.getAreaAndAreaType(),
            values: [bikeDetails.zoneId]
        };

        return new Promise(async (resolve, reject) => {
            try {
                let result = await client.query(query);
                resolve(result);
            } catch (error) {
                reject(error);
            }
        });
    } //aplicableDate ,cityId ,areaTypeEnumId, modelId , areaId
    async getFarePlanDataForRideBooking(farePlan: any) {
        let query: any = {
            text: DB_CONFIGS.rideBooking.getFarePlanDataForRideBookings(),
            values: [farePlan.aplicableDate, farePlan.cityId, farePlan.areaTypeEnumId, farePlan.modelId, farePlan.areaId]
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

    async getWalletAmount(userId: any) {
        let query: any = {
            text: DB_CONFIGS.rideBooking.getWalletAmount(),
            values: [userId.userId]
        };

        return new Promise(async (resolve, reject) => {
            try {
                let userDetail = await client.query(query);
                resolve(userDetail);
            } catch (error) {
                reject(error);
            }
        });
    }

    async getUserRideStatus(user: any) {
        let query: any = {
            text: DB_CONFIGS.rideBooking.getUserRideingStatus(),
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

    async getRideBookingDetailsForEndRide(rideDetails: any) {
        let query: any = {
            text: DB_CONFIGS.rideBooking.getRideBookingDetailsForRideEnd(),
            values: [rideDetails.rideBookingId]
        };
        // console.log('check current ride query getRideBookingDetails', query);
        return new Promise(async (resolve, reject) => {
            try {
                let result = await client.query(query);
                resolve(result);
            } catch (error) {
                reject(error);
            }
        });
    }

    async checkRideStartOrNotForUserService(rideDetails: any) {
        let query: any = {
            text: DB_CONFIGS.rideBooking.checkRideStartOrNotForUser(),
            values: [rideDetails.id]
        };
        // console.log('check current ride query getRideBookingDetails', query);
        return new Promise(async (resolve, reject) => {
            try {
                let result = await client.query(query);
                resolve(result);
            } catch (error) {
                reject(error);
            }
        });
    }

    async updateBikeUndermaintenanceStatus(rideDetails: any) {
        let query: any = {
            text: DB_CONFIGS.rideBooking.updateBikeStatusMantenances(),
            values: [rideDetails.bikeId, rideDetails.vehicleId, rideDetails.uId, rideDetails.lockId, rideDetails.reservedAndUnReservedStatus]
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

    async insertBikeUnserMatenationHistory(rideDetails: any) {
        let actionOnDate = getUTCdate();
        rideDetails.fromRideTime = actionOnDate;

        let query: any = {
            text: DB_CONFIGS.rideBooking.bikeUnderMantenancesHistory(),
            values: [
                rideDetails.bikeId,
                rideDetails.vehicleId,
                rideDetails.uId,
                rideDetails.lockId,
                rideDetails.bikeStatusEnumId,
                rideDetails.remarks,
                actionOnDate,
                rideDetails.userId,
                rideDetails.statusEnumId
            ]
        };

        return new Promise(async (resolve, reject) => {
            try {
                let result = await client.query(query);
                // console.log('check inside try01 result ',result)
                resolve(result);
            } catch (error) {
                reject(error);
            }
        });
    }

    async getLockDetailForScheduleRideStartService() {
        // console.log('check result getLockDetailForScheduleRideStartService')
        let statusEnumId = 1;
        let query: any = {
            text: DB_CONFIGS.rideBooking.getLockDetailForScheduleRideStartQuery()
            // values: [statusEnumId]
        };
        // console.log('check query', query);
        return new Promise(async (resolve, reject) => {
            try {
                let result = await client.query(query);
                resolve(result);
            } catch (error) {
                reject(error);
            }
        });
    }
    async getUserTypeEnumId(userId: any) {
        let query: any = {
            text: DB_CONFIGS.rideBooking.getUserTypeEnumId(),
            values: [userId.usersId]
        };

        return new Promise(async (resolve, reject) => {
            try {
                let userDetail = await client.query(query);
                resolve(userDetail);
            } catch (error) {
                reject(error);
            }
        });
    }

    async getRideBookingByUserIdAndLockNumberService(rideDetails: any) {
        let query: any = {
            text: DB_CONFIGS.rideBooking.getRideBookingByUserIdAndLockNumber(),
            values: [rideDetails.lockId, rideDetails.statusEnumId, rideDetails.userId]
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

    async updateUnlockFlagService(rideDetails: any) {
        let actionOnDate: any = getUTCdate();
        let query: any = {
            text: DB_CONFIGS.rideBooking.updateUnlockFlag(),
            values: [rideDetails.rideStartUnlockFlagEnumId, actionOnDate, rideDetails.lockId]
        };
        //     console.log('check updateBikeReservedAndUnReservedStatus',query)
        return new Promise(async (resolve, reject) => {
            try {
                let result = await client.query(query);
                resolve(result);
            } catch (error) {
                reject(error);
            }
        });
    }

    async updatePowerOnFlagService(rideDetails: any) {
        let actionOnDate: any = getUTCdate();
        let query: any = {
            text: DB_CONFIGS.rideBooking.updatePoweronFlag(),
            values: [rideDetails.rideStartPowerFlagEnumId, actionOnDate, rideDetails.lockId]
        };
        //    console.log('check updateBikeReservedAndUnReservedStatus',query)
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

export default new RideBooking();
