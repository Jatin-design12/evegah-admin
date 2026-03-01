import { client } from '../../Config/db.connection';
import { DB_CONFIGS } from '../../Config/db.queries';
import { getUTCdate } from '../../helper/datetime';
import { AddExceptionIntoDB } from '../../helper/responseHandler';

class RideEarningReport
{

    constructor(){}


    
async userWiseRideEarningReports(data :any) {
    let query: any = {
        text: DB_CONFIGS.RideEarningReports.userWiseRideEarningQuery(),
        values: [data.fromDate,data.toDate,data.userId,data.bikeId,data.bikeRideingStatusEnumId,data.userName,data.mobileNo,data.lockNumber,
            data.mapStateId,data.mapCityId,data.startAreaTypeEnumId,data.startAreaId, data.startZoneId,
            data.endAreaId, data.endZoneId] 
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


async bikeWiseRideEarningReport(data :any) {
    let query: any = {
        text: DB_CONFIGS.RideEarningReports.bikeWiseRideEarningQuery(),
        values: [data.fromDate,data.toDate,data.userId,data.bikeId,data.bikeRideingStatusEnumId,data.userName,data.mobileNo,data.lockNumber,
            data.mapStateId,data.mapCityId,data.startAreaTypeEnumId,data.startAreaId, data.startZoneId,
            data.endAreaId, data.endZoneId]
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

async getRideReportDetail(fromDate :any,toDate: any,rideEnumIdStatus: any) {
    let query: any = {
        text: DB_CONFIGS.RideEarningReports.rideReportDetailQuery(),
        values: [fromDate,toDate,rideEnumIdStatus]
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

async userIdOrBikeIdWiseRideEarningDetailReport(data:any ) {
    let query: any = {
        text: DB_CONFIGS.RideEarningReports.userIdOrBikeIdWiseRideEarningDetailQuery(),
        values: [data.fromDate,data.toDate,data.userId,data.bikeId,data.bikeRideingStatusEnumId,data.userName,data.mobileNo,data.lockNumber,
                 data.mapStateId,data.mapCityId,data.startAreaTypeEnumId,data.startAreaId, data.startZoneId,
                 data.endAreaId, data.endZoneId]
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

export default new RideEarningReport()