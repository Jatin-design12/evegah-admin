import { client } from '../../Config/db.connection';
import { DB_CONFIGS } from '../../Config/db.queries';
import { getUTCdate } from '../../helper/datetime';
import { AddExceptionIntoDB } from '../../helper/responseHandler';
class AreaMasters {
    constructor() {}

    async insertAreaDetails(areaDetails: any, req: any) {
        let actionsDate = getUTCdate();
        let query: any = {
            text: DB_CONFIGS.areaMasters.insertAreaDetail(),
            values: [
                areaDetails.name,
                areaDetails.areaTypeEnumId,
                areaDetails.statusEnumId,
                actionsDate,
                areaDetails.createdById,
                areaDetails.mapCityId,
                areaDetails.placeId,
                areaDetails.PinCode,
                areaDetails.fullAddress,
                areaDetails.mapDrawObjectEnumId,
                areaDetails.mapDrawObject,
                areaDetails.mapDrawObjectAddress,
                areaDetails.center, //city_api_circle_center ,
                areaDetails.radius, //city_api_circle_redius,
                areaDetails.sw, //city_api_south_west_point,
                areaDetails.ne, //city_api_north_east_point,
                areaDetails.polygonpoint, //city_api_polygon,
                areaDetails.polygonpoint2 //city_api_db_polygon
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

    async updateAreaDetails(areaDetails: any, req: any) {
        let actionsDate = getUTCdate();
        let query: any = {
            text: DB_CONFIGS.areaMasters.updateAreaDetail(),
            values: [
                areaDetails.areaId,
                areaDetails.name,
                areaDetails.areaTypeEnumId,
                areaDetails.statusEnumId,
                actionsDate,
                areaDetails.createdById,
                areaDetails.mapCityId,
                areaDetails.placeId,
                areaDetails.PinCode,
                areaDetails.fullAddress,
                areaDetails.mapDrawObjectEnumId,
                areaDetails.mapDrawObject,
                areaDetails.mapDrawObjectAddress,
                areaDetails.center, //city_api_circle_center ,
                areaDetails.radius, //city_api_circle_redius,
                areaDetails.sw, //city_api_south_west_point,
                areaDetails.ne, //city_api_north_east_point,
                areaDetails.polygonpoint, //city_api_polygon,
                areaDetails.polygonpoint2 //city_api_db_polygon
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

    async getStateId(stateId: any, req: any) {
        let query: any = {
            text: DB_CONFIGS.areaMasters.getStatesForArea(),
            values: [stateId]
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

    async getCityData(cityId: any, req: any) {
        let query: any = {
            text: DB_CONFIGS.areaMasters.getCities(),
            values: [cityId]
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

    async getMapStateId(stateId: any, req: any) {
        let query: any = {
            text: DB_CONFIGS.areaMasters.getMapStatesForArea(),
            values: [stateId]
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

    async getMapCityData(mapCityId: any, req: any) {
        let query: any = {
            text: DB_CONFIGS.areaMasters.getMapCities(),
            values: [mapCityId]
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

    async checkMapAreaNameExists(areaId: any, name: any, mapCityId: any, req: any) {
        let query: any = {
            text: DB_CONFIGS.areaMasters.checkMapAreaNameExists(),
            values: [areaId, name, mapCityId]
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

    async checkMapCountryNameExists(mapCountryName: any, mapCountryId: any, req: any) {
        let query: any = {
            text: DB_CONFIGS.areaMasters.checkMapCountryNameExistsQuery(),
            values: [mapCountryName, mapCountryId]
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

    async checkMapStateNameExists(mapStateName: any, mapCountryId: any, req: any) {
        let query: any = {
            text: DB_CONFIGS.areaMasters.checkMapStateNameExistsQuery(),
            values: [mapStateName, mapCountryId]
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

    async checkMapCityNameForSearchExistsQuery(mapCityName: any, mapStateId: any, req: any) {
        let query: any = {
            text: DB_CONFIGS.areaMasters.checkMapCityNameForSearchExistsQuery(),
            values: [mapCityName, mapStateId]
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

    async checkMapCityNameExists(mapcityName: any, mapStateId: any, mapcityId: any, req: any) {
        let query: any = {
            text: DB_CONFIGS.areaMasters.checkMapCityNameExistsQuery(),
            values: [mapcityName, mapStateId, mapcityId]
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

    async checkUserCityNameExists(userCityName: any, mapStateId: any, mapcityId: any, req: any) {
        let query: any = {
            text: DB_CONFIGS.areaMasters.checkUserCityNameExistsQuery(),
            values: [userCityName, mapStateId, mapcityId]
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

    async addMapCountryName(countryDatail: any, req: any) {
        let query: any = {
            text: DB_CONFIGS.areaMasters.insertMapCountryQuery(),
            values: [countryDatail.mapCountryName, countryDatail.statusEnumId, countryDatail.actionsDate, countryDatail.createdById]
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

    async addMapStateName(statedtail: any, req: any) {
        let actionsDate = getUTCdate();
        let query: any = {
            text: DB_CONFIGS.areaMasters.insertMapStateQuery(),
            values: [statedtail.mapStateName, statedtail.mapCountryId, statedtail.statusEnumId, actionsDate, statedtail.createdById]
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

    async addMapCityName(cityDetail: any, req: any) {
        let actionsDate = getUTCdate();

        let query: any = {
            text: DB_CONFIGS.areaMasters.insertMapCityQuery(),
            values: [
                cityDetail.mapCityName,
                cityDetail.mapStateId,
                cityDetail.statusEnumId,
                actionsDate,
                cityDetail.createdById,
                cityDetail.userCityName,
                cityDetail.pinCode,
                cityDetail.fullAddress,
                cityDetail.placeId,
                cityDetail.mapDrawObjectEnumId,
                cityDetail.mapDrawObject,
                cityDetail.mapDrawObjectAddress,
                cityDetail.center, //city_api_circle_center ,
                cityDetail.radius, //city_api_circle_redius,
                cityDetail.sw, //city_api_south_west_point,
                cityDetail.ne, //city_api_north_east_point,
                cityDetail.polygonpoint, //city_api_polygon,
                cityDetail.polygonpoint2 //city_api_db_polygon
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

    async updateMapCityName(cityDetail: any, req: any) {
        let actionsDate = getUTCdate();
        let query: any = {
            text: DB_CONFIGS.areaMasters.updateMapCityQuery(),
            values: [
                cityDetail.mapCityId,
                cityDetail.mapCityName,
                cityDetail.mapStateId,
                cityDetail.statusEnumId,
                actionsDate,
                cityDetail.createdById,
                cityDetail.userCityName,
                cityDetail.pinCode,
                cityDetail.fullAddress,
                cityDetail.placeId,
                cityDetail.mapDrawObjectEnumId,
                cityDetail.mapDrawObject,
                cityDetail.mapDrawObjectAddress,
                cityDetail.center, //city_api_circle_center ,
                cityDetail.radius, //city_api_circle_redius,
                cityDetail.sw, //city_api_south_west_point,
                cityDetail.ne, //city_api_north_east_point,
                cityDetail.polygonpoint, //city_api_polygon,
                cityDetail.polygonpoint2 //city_api_db_polygon
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

    // async getAreaCityStates() {
    //     let query: any = {
    //         text: DB_CONFIGS.areaMasters.getAreaCityState(),
    //        // values: [areaId,name,cityId]
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

    async getAreaMapCityStates(req: any) {
        let query: any = {
            text: DB_CONFIGS.areaMasters.getAreaMapCityState()
            // values: [areaId,name,cityId]
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

    async getAreaDetail(areaId: any, mapCityId: any, req: any) {
        let query: any = {
            text: DB_CONFIGS.areaMasters.getAreaDetails(),
            values: [areaId, mapCityId]
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

    async getMapAreaDetailsForSearche(mapCountryName: any, mapStateName: any, mapCityName: any, areaId: any, req: any) {
        let query: any = {
            text: DB_CONFIGS.areaMasters.getMapAreaDetailsForSearche(),
            values: [mapCountryName, mapStateName, mapCityName, areaId]
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

    async getfareIdList(farePlanId: any, req: any) {
        let query: any = {
            text: DB_CONFIGS.farePlanMasters.getfareIdList(),
            values: [farePlanId]
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

    async insertFarePlanDetail(fareDetails: any, req: any) {
        let actionsDate = getUTCdate();

        let query: any = {
            text: DB_CONFIGS.farePlanMasters.insertFarePlanDetail(),
            values: [
                fareDetails.mapCityId,
                fareDetails.areaTypeEnumId,
                fareDetails.areaId,
                fareDetails.modelId,
                fareDetails.aplicableDate,
                fareDetails.perMinuteRateMonday,
                fareDetails.perMinuteRateTuesday,
                fareDetails.perMinuteRateWednesday,
                fareDetails.perMinuteRateThursday,
                fareDetails.perMinuteRateFriday,
                fareDetails.perMinuteRateSaturday,
                fareDetails.perMinuteRateSunday,
                fareDetails.statusEnumId,
                actionsDate,
                fareDetails.createdyId,
                fareDetails.hireTimeInMinuts
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

    async updateFarePlanDetail(fareDetails: any, req: any) {
        let actionsDate = getUTCdate();
        let query: any = {
            text: DB_CONFIGS.farePlanMasters.updateFarePlanDetail(),
            values: [
                fareDetails.farePlanId,

                fareDetails.mapCityId,
                fareDetails.areaTypeEnumId,
                fareDetails.areaId,

                fareDetails.modelId,
                fareDetails.aplicableDate,
                fareDetails.perMinuteRateMonday,
                fareDetails.perMinuteRateTuesday,

                fareDetails.perMinuteRateWednesday,
                fareDetails.perMinuteRateThursday,
                fareDetails.perMinuteRateFriday,

                fareDetails.perMinuteRateSaturday,
                fareDetails.perMinuteRateSunday,
                fareDetails.statusEnumId,

                actionsDate,

                fareDetails.createdyId,
                fareDetails.hireTimeInMinuts
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

    async getFarePlanDetail(farePlanId: any, mapCityId: any, modelId: any, areaId: any, statusEnumId: any, req: any) {
        let query: any = {
            text: DB_CONFIGS.farePlanMasters.getFarePlanDetails(),
            values: [farePlanId, mapCityId, modelId, areaId, statusEnumId]
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

    async getAreaData(areaId: any, req: any) {
        let query: any = {
            text: DB_CONFIGS.farePlanMasters.getArea(),
            values: [areaId]
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

    async getUidModelData(uId: any, modelId: any, req: any) {
        let query: any = {
            text: DB_CONFIGS.farePlanMasters.getuidModelData(),
            values: [uId, modelId]
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

    async getQrNumberExistDataService(uId: any, qrNumber: any, req: any) {
        let query: any = {
            text: DB_CONFIGS.farePlanMasters.getQrNumberExistData(),
            values: [uId, qrNumber]
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
    async getModelData(modelId: any, req: any) {
        let query: any = {
            text: DB_CONFIGS.farePlanMasters.getModel(),
            values: [modelId]
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

    async getLockNumber(lockId: any, req: any) {
        let query: any = {
            text: DB_CONFIGS.farePlanMasters.getLockNumber(),
            values: [lockId]
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

    async getFarePlanExit(farePlanId: any, mapCityId: any, modelId: any, areaTypeEnumId: any, areaId: any, aplicableDate: any, req: any) {
        let query: any = {
            text: DB_CONFIGS.farePlanMasters.checkFareCloseExists(),
            values: [farePlanId, mapCityId, modelId, areaTypeEnumId, areaId, aplicableDate]
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

    async getMapAreaDetail(areaId: any, mapCityId: any, req: any) {
        let query: any = {
            text: DB_CONFIGS.areaMasters.getMapAreaDetails(),
            values: [areaId, mapCityId, req.query.areaTypeEnumId]
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

    async getCityDataForTable(req: any) {
        let query: any = {
            text: DB_CONFIGS.areaMasters.getCityDataForTableQuery()
            //values: [areaId,mapCityId]
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

    async getCityDataForDetail(mapCityId: any, req: any) {
        let query: any = {
            text: DB_CONFIGS.areaMasters.getMapCityDetailQuery(),
            values: [mapCityId]
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

    async getReportBikeData(userId: any, rideBookingId: any, ridestatus: any, RequestrideFromDate: any, RequestrideToDate: any, bikeId: any, rideEndByUser: any, req: any) {
        let query: any = {
            text: DB_CONFIGS.farePlanMasters.getReportBike(),
            values: [userId, rideBookingId]
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

    async getzoneDetailWithBikeCountListService(mapCountryName: any, mapStateName: any, mapCityName: any, req: any) {
        let query: any = {
            text: DB_CONFIGS.areaMasters.getzoneDetailWithBikeCountList(),
            values: [mapCountryName, mapStateName, mapCityName]
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

    async getAreaDetailWithBikeCountListService(mapCountryName: any, mapStateName: any, mapCityName: any, req: any) {
        let query: any = {
            text: DB_CONFIGS.areaMasters.getAreaDetailWithBikeCountList(),
            values: [mapCountryName, mapStateName, mapCityName]
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

    async getzoneDetailWithBikeAllTypeCountService(mapCountryName: any, mapStateName: any, mapCityName: any, zoneId: any, req: any) {
        let query: any = {
            text: DB_CONFIGS.areaMasters.getzoneDetailWithBikeAllTypeCountList(),
            values: [mapCountryName, mapStateName, mapCityName, zoneId]
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

    async getAreaDetailWithBikeCountListZone(zoneId: any, mapCityId: any, req: any) {
        let query: any = {
            text: DB_CONFIGS.areaMasters.getzoneDetailWithBikeCountList1(),
            values: [zoneId, mapCityId]
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

    async getMapCityDetailsForSearche(mapCountryName: any, mapStateName: any, mapCityName: any, req: any) {
        let query: any = {
            text: DB_CONFIGS.areaMasters.getMapCityDetailsForSearcheQ(),
            values: [mapCountryName, mapStateName, mapCityName]
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

    async getCityAreaForBeepOnOffService(lockId: any, req: any) {
        let query: any = {
            text: DB_CONFIGS.areaMasters.getCityAreaForBeepOnOff(),
            values: [lockId]
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

    async getCityDataForDetailForReport(mapStateId: any, req: any) {
        let query: any = {
            text: DB_CONFIGS.areaMasters.getMapCityDetailReportQuery(),
            values: [mapStateId]
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

    async getMapAreaDetailReport(req: any) {
        let query: any = {
            text: DB_CONFIGS.areaMasters.getMapAreaDetailsReport(),
            values: [req.body.areaId, req.body.mapCityId, req.body.areaTypeEnumId]
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

    async getZoneDetailReport(req: any) {
        let query: any = {
            text: DB_CONFIGS.areaMasters.getZoneDetailForReport(),
            values: [req.body.zoneId, req.body.areaId]
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

export default new AreaMasters();
