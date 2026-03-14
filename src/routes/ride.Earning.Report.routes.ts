import Router from 'express';
import rideEarningReportController from '../Controller/rideEarningReportController/ride.earning.report.controller';
import adminController from '../Controller/adminController/admin.controller';
import loginfoReportController from '../Controller/rideEarningReportController/device.loginfo.report.controller';
const router = Router();

router.post('/api/v1/getUserWiseRideEarningReport', adminController.verifyTokenController, rideEarningReportController.getUserWiseRideEarningReport);
router.post('/api/v1/getbikeWiseRideEarningReport', adminController.verifyTokenController, rideEarningReportController.getbikeWiseRideEarningReport);

router.post('/api/v1/getRideEarningDetailReport', adminController.verifyTokenController, rideEarningReportController.getRideEarningDetailReport);

router.get('/api/v1/getDeviceLogInfoReport', adminController.verifyTokenController, loginfoReportController.getDeviceLogInfoReport);

export default router;
