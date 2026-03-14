import { Request, Response } from 'express';
import status from '../../helper/status';
import RequestResponse from '../../helper/responseClass';
import logger from '../../Config/logging';
import { exceptionHandler, AddExceptionIntoDB } from '../../helper/responseHandler';

const FindPointInCircle = async (req: Request, res: Response) => {
    try {
        let requestBody = req.body;

        const distance = Distance(requestBody.center, requestBody.point);
        if (distance > Number(requestBody.radius)) {
            return RequestResponse.success(res, 'Success', status.info, 'Not exists/Outside of circle');
        } else {
            return RequestResponse.success(res, 'Success', status.info, 'Exists/Inside of circle');
        }
    } catch (error: any) {
        AddExceptionIntoDB(req, error);
        return exceptionHandler(res, 1, error.message);
    }
};

const FindPointInRectangle = async (req: Request, res: Response) => {
    try {
        let requestBody = req.body;
        const x = requestBody.point[0];
        const y = requestBody.point[1];

        if (x < requestBody.sw[0] || x > requestBody.ne[0] || y < requestBody.sw[1] || y > requestBody.ne[1]) {
            return RequestResponse.success(res, 'Success', status.info, 'Not exists/Outside of Rectangle');
        } else {
            return RequestResponse.success(res, 'Success', status.info, 'Exists/Inside of Rectangle');
        }
    } catch (error: any) {
        AddExceptionIntoDB(req, error);
        return exceptionHandler(res, 1, error.message);
    }
};

const FindPointInPolygon = async (req: Request, res: Response) => {
    try {
        let requestBody = req.body;
        const x = requestBody.point[0];
        const y = requestBody.point[1];
        const bounds = PolygongetBounds(requestBody.polygonpoint);

        // Check if point P lies within the min/max boundary of our polygon
        if (x < bounds.sw[0] || x > bounds.ne[0] || y < bounds.sw[1] || y > bounds.ne[1]) {
            //return false;
            return RequestResponse.success(res, 'Success', status.info, 'Not exists/Outside of Polygon');
        }

        let intersect = 0;

        // Geofencing method (aka Even–odd rule)
        // See more at: https://en.wikipedia.org/wiki/Even%E2%80%93odd_rule
        // Now for each path of our polygon we'll count how many times our imaginary
        // line crosses our paths, if it crosses even number of times, our point P is
        // outside of our polygon, odd number our point is within our polygon
        for (let i = 0; i < requestBody.polygonpoint.length; i++) {
            // Check if pont P lies on a vertices of our polygon
            if (x === requestBody.polygonpoint[i][0] && y === requestBody.polygonpoint[i][1]) {
                //return true;
                return RequestResponse.success(res, 'Success', status.info, 'Exists/Inside of Polygon');
            }

            let j = i !== requestBody.polygonpoint.length - 1 ? i + 1 : 0;

            // Check if Py (y-component of our point P) is with the y-boundary of our path
            if (
                (requestBody.polygonpoint[i][1] < requestBody.polygonpoint[j][1] && y >= requestBody.polygonpoint[i][1] && y <= requestBody.polygonpoint[j][1]) ||
                (requestBody.polygonpoint[i][1] > requestBody.polygonpoint[j][1] && y >= requestBody.polygonpoint[j][1] && y <= requestBody.polygonpoint[i][1])
            ) {
                // Check if Px (x-componet of our point P) crosses our path
                let sx =
                    requestBody.polygonpoint[i][0] +
                    ((requestBody.polygonpoint[j][0] - requestBody.polygonpoint[i][0]) * (y - requestBody.polygonpoint[i][1])) / (requestBody.polygonpoint[j][1] - requestBody.polygonpoint[i][1]);
                if (sx >= x) intersect += 1;
            }
        }
        if (intersect % 2 === 0) {
            return RequestResponse.success(res, 'Success', status.info, 'Not exists/Outside of Polygon');
        } else {
            return RequestResponse.success(res, 'Success', status.info, 'Exists/Inside of Polygon');
        }
    } catch (error: any) {
        AddExceptionIntoDB(req, error);
        return exceptionHandler(res, 1, error.message);
    }
};

const FindPointNearestPoint = async (req: Request, res: Response) => {
    try {
        let requestBody = req.body;
        const distance = Distance(requestBody.point1, requestBody.point2);
        if (distance > Number(requestBody.radius)) {
            return RequestResponse.success(res, 'Success', status.info, 'Not exists/Outside of point1');
        } else {
            return RequestResponse.success(res, 'Success', status.info, 'Exists/Inside of point1');
        }
    } catch (error: any) {
        AddExceptionIntoDB(req, error);
        return exceptionHandler(res, 1, error.message);
    }
};

const FindPointNearestPointDistance = async (req: Request, res: Response) => {
    try {
        let requestBody = req.body;
        const distance = Distance(requestBody.point1, requestBody.point2);
        let result = [{ distance: distance }];
        return RequestResponse.success(res, 'Success', status.info, result);
    } catch (error: any) {
        AddExceptionIntoDB(req, error);
        return exceptionHandler(res, 1, error.message);
    }
};

function Distance(p1: any, p2: any) {
    var R = 6378.137; // Radius of earth in KM
    var dLat = (p2[0] * Math.PI) / 180 - (p1[0] * Math.PI) / 180;
    var dLon = (p2[1] * Math.PI) / 180 - (p1[1] * Math.PI) / 180;
    var a = Math.sin(dLat / 2) * Math.sin(dLat / 2) + Math.cos((p1[0] * Math.PI) / 180) * Math.cos((p2[0] * Math.PI) / 180) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
    var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    var d = R * c;
    return d * 1000; // meters
}

function PolygongetBounds(points: any) {
    let arrX = [];
    let arrY = [];

    for (let i in points) {
        arrX.push(points[i][0]);
        arrY.push(points[i][1]);
    }

    return {
        sw: [Math.min.apply(null, arrX), Math.min.apply(null, arrY)],
        ne: [Math.max.apply(null, arrX), Math.max.apply(null, arrY)]
    };
}

export default {
    FindPointInCircle,
    FindPointInRectangle,
    FindPointInPolygon,
    FindPointNearestPoint,
    FindPointNearestPointDistance
};
