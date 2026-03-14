import { client } from '../../Config/db.connection';
import { DB_CONFIGS } from '../../Config/db.queries';
import { getUTCdate } from '../../helper/datetime';
import { IAllotmentDetails, IGetZoneWiseAllotmentList } from '../../model/admin.model';
import { AddExceptionIntoDB } from '../../helper/responseHandler';
class AllotmentServices {
    constructor() {}

    async getZoneWiseAllotmentList(allotmentDetails: IGetZoneWiseAllotmentList, req: any) {
        let query: any = {
            text: DB_CONFIGS.allotment.getZoneWiseDetails(),
            values: [allotmentDetails.zoneId]
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
    async getZoneListByBikeAllotment(allotmentDetails: IGetZoneWiseAllotmentList, req: any) {
        let query: any = {
            text: DB_CONFIGS.allotment.getZoneListByBikeAllotment(),
            values: [allotmentDetails.zoneId]
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

    async getBikeAllotmentDataForEditService(allotmentDetails: any, req: any) {
        let query: any = {
            text: DB_CONFIGS.allotment.getBikeAllotmentDataForEdit(),
            values: [allotmentDetails.bikeAllotmentId]
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

    async getBikeForAllotmentService(allotmentDetails: any, req: any) {
        let query: any = {
            text: DB_CONFIGS.allotment.getBikeForAllotment(),
            values: [allotmentDetails.vehicleId, allotmentDetails.uId]
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

    async insertBikeAllotment(allotmentDetails: IAllotmentDetails, req: any) {
        let actionOnDate = getUTCdate();
        let query: any = {
            text: DB_CONFIGS.allotment.insertBikeAllotment(),
            values: [
                allotmentDetails.vehicleId,
                allotmentDetails.uId,
                allotmentDetails.zoneId,
                allotmentDetails.statusEnumId,
                allotmentDetails.remark,
                allotmentDetails.actionByLoginUserId,
                allotmentDetails.actionByUserTypeEnumId,
                actionOnDate,
                allotmentDetails.bikeId,
                allotmentDetails.lockId
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

    async deActiveAllotmentBike(allotmentDetails: IAllotmentDetails, req: any) {
        let actionOnDate = getUTCdate();
        let status_enum_id: any = 2;
        let query: any = {
            text: DB_CONFIGS.allotment.deActiveAllotmentBike(),
            values: [allotmentDetails.bikeAllotmentId, allotmentDetails.actionByLoginUserId, actionOnDate, status_enum_id]
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
    async updateBikeAllotment(allotmentDetails: IAllotmentDetails, req: any) {
        let actionOnDate = getUTCdate();
        let query: any = {
            text: DB_CONFIGS.allotment.updateBikeAllotment(),
            values: [
                allotmentDetails.vehicleId,
                allotmentDetails.uId,
                allotmentDetails.zoneId,
                allotmentDetails.statusEnumId,
                allotmentDetails.remark,
                allotmentDetails.actionByLoginUserId,
                allotmentDetails.actionByUserTypeEnumId,
                actionOnDate,
                allotmentDetails.bikeAllotmentId
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
    async getBikeAllotmentDetails(allotmentDetails: any, req: any) {
        let query: any = {
            text: DB_CONFIGS.allotment.getAllotmentDetails(),
            values: [allotmentDetails.bikeAllotmentId, allotmentDetails.statusEnumId]
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
    async activeInactiveBikeAllotment(allotmentDetails: any, req: any) {
        let query: any = {
            text: DB_CONFIGS.allotment.activeInactiveAllotment(),
            values: [allotmentDetails.statusEnumId, allotmentDetails.bikeAllotmentId]
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
    async updateZoneAllotmentStatusForProduceBike(allotmentDetails: any, req: any) {
        let query: any = {
            text: DB_CONFIGS.bikeProduce.updateZoneAllotmentStatusForProduceBike(),
            values: [allotmentDetails.vehicleId, allotmentDetails.uId, allotmentDetails.zoneId]
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
    async updateUIdStatusFromZoneAllotment(allotmentDetails: any, req: any) {
        let query: any = {
            text: DB_CONFIGS.inwardQueries.bikeInward.updateUIdStatusFromZoneAllotment(),
            values: [allotmentDetails.uId]
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

    async checkSameCombinationBikeNotAlloted(allotmentDetails: IAllotmentDetails, req: any) {
        let query: any = {
            text: DB_CONFIGS.allotment.checkSameCombinationBikeNotAlloted(),
            values: [allotmentDetails.uId, allotmentDetails.vehicleId, allotmentDetails.bikeAllotmentId]
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

    async getLockDetailForTestPageService(lockDetail: any, req: any) {
        let query: any = {
            text: DB_CONFIGS.allotment.getLockDetailForTestPage(),
            values: [lockDetail.lockNumber, lockDetail.deviceLockAndUnlockStatus, lockDetail.deviceLightStatusEnumId, lockDetail.beepStatusEnumId]
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
}
export default new AllotmentServices();
