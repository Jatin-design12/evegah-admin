import Router from 'express';
import adminController from '../Controller/adminController/admin.controller';
import areaController from '../Controller/adminController/area.Controller';
import geofenceController from '../Controller/adminController/geofence.controller';
import rideBookingController from '../Controller/rideBookingController/ride.booking.controller';
import paymentIntegrationController from '../Controller/paymentIntegrationController/payment.integration.controller';
const router = Router();
//router.use(cookieParser());
//post
// check deployment 
router.post('/adminLogin', adminController.adminLoginService);
//router.use();

router.post('/ResetpasswordEMailGeneration', adminController.verifyTokenController, adminController.ResetpasswordEMailGenerationService);
router.post('/updateAdminPasswordByEmail', adminController.verifyTokenController, adminController.updateAdminPasswordByEmailService);
router.post('/updateAdminPassword', adminController.verifyTokenController, adminController.AdminUpdatePasswordService);
//get
router.get('/GetEnumDetail', adminController.verifyTokenController, adminController.GetEnumDetailService);
router.post('/addUpdateZone', adminController.verifyTokenController, adminController.addUpdateZoneController);
router.get('/getZone', adminController.verifyTokenController, adminController.getZoneController);

router.post('/api/v1/addUpdateBikeProduce',  adminController.verifyTokenController,adminController.addUpdateBikeProduceController);
router.get('/api/v1/getBikeProduceDetails',  adminController.getBikeProduceDetailsController);

router.post('/api/v1/addUpdateBikeAllotment', adminController.verifyTokenController, adminController.addUpdateBikeAllotmentController);
router.get('/api/v1/getAllotmentDetails', adminController.verifyTokenController, adminController.getAllotmentDetailsController);

router.get('/api/v1/getZoneWiseList', adminController.verifyTokenController, adminController.getZoneWiseListController);
router.get('/api/v1/getZoneWiseListByBiKeAllotment', adminController.verifyTokenController, adminController.getZoneWiseListByBiKeAllotmentController);
router.post('/api/v1/activeInactiveBikeAllotment', adminController.verifyTokenController, adminController.activeInactiveBikeAllotmentController);
router.get('/getDevice', adminController.getDeviceController);
router.get('/addDevice', adminController.addDeviceController);
router.get('/lockAndUnlockDevice', adminController.verifyTokenController, adminController.lockAndUnlockDeviceController);
router.get('/api/v1/getDashboardCard', adminController.verifyTokenController, adminController.getDashboardCardController);
router.post('/deviceRegistration', adminController.deviceRegistrationController);
router.post('/deviceRegistrationText', adminController.deviceRegistrationUsingTextController);
router.get('/deviceRegistration2', adminController.deviceRegistration2Controller);
router.get('/dR', adminController.deviceRegistration3Controller);
router.get('/getDeviceInstructions', adminController.getDeviceInstructions);
router.get('/deleteDevice', adminController.deleteDeviceController);
router.get('/addDeviceIdAndInstruction', adminController.verifyTokenController, adminController.addDeviceIdAndInstruction);
router.get('/setInstructionToLockUnlockDevice', adminController.verifyTokenController, adminController.setInstructionToLockUnlockDeviceController);
router.get('/unlockDevice', adminController.unlockDeviceController);
router.get('/lockDevice', adminController.lockDeviceController);

router.get('/updateDeviceInformation', adminController.updateDeviceInformation);

router.post('/updateWithdrawRequestFromAdmin', adminController.verifyTokenController, adminController.updateWithdrawRequestFromAdminController);
router.get('/getWithdrawnList', adminController.verifyTokenController, adminController.getWithdrawnListController);
router.post('/logOutAdminController', adminController.verifyTokenController, adminController.logOutAdminController);
router.post('/addLog', adminController.addLogController);
router.get('/uDIM', adminController.updateDeviceInformationMultipart);
router.get('/getProduceBikeBatteryStatus', adminController.verifyTokenController, adminController.getProduceBikeBatteryStatusController);
router.post('/qrDecrypted', adminController.verifyTokenController, adminController.qrDecrypted);
router.post('/updateUserMinimumWalletBalanceValues', adminController.verifyTokenController, adminController.updateUserMinimumWalletBalanceValuesController);
router.get('/getMinimumWalletBalanceHistory', adminController.verifyTokenController, adminController.getMinimumWalletBalanceHistoryController);

router.get('/getWellcomMSG', adminController.getWellcomMSG);

router.get('/api/v1/getRideBookedList', adminController.verifyTokenController, adminController.getRideBookedList);
router.get('/api/v1/getLatLogList', adminController.verifyTokenController, adminController.getLatLog);

router.get('/api/v1/getAvaialableBikeList', adminController.verifyTokenController, adminController.getAvaialableBikeList);
router.get('/api/v1/getDeviceStatusDebug', adminController.verifyTokenController, adminController.getDeviceStatusDebugController);
router.post('/api/v1/addUpdateAreaDetail', adminController.verifyTokenController, areaController.addUpdateAreaDetailController);

router.get('/api/v1/getMapAreaDetails', adminController.verifyTokenController, areaController.getMapAreaDetail);
router.get('/api/v1/getAreaDetails', adminController.verifyTokenController, areaController.getAreaDetail);
router.get('/api/v1/getUndermaintenanceBikeList', adminController.verifyTokenController, adminController.getUndermaintenanceBikeList);
router.post('/api/v1/addUpdateFarePlan', adminController.verifyTokenController, areaController.insertFarePlanDetailDetailController);

router.get('/api/v1/getFarePlanDetail', adminController.verifyTokenController, areaController.getfarePlanDetail);

router.get('/api/v1/getReportBike', adminController.verifyTokenController, areaController.getReportBikeData);


router.get('/getAreaMapCityState', adminController.verifyTokenController, areaController.getAreaMapCityState);

router.get('/getLockDetailForTestPage',  adminController.verifyTokenController,adminController.getLockDetailForTestPage);

router.get('/getLockStatusList', adminController.verifyTokenController, adminController.getLockStatusList);


router.post('/setDeviceLightOnInstruction', adminController.verifyTokenController, adminController.setDeviceLightOnInstructionController);
router.post('/setDeviceLightOffInstruction', adminController.verifyTokenController, adminController.setDeviceLightOffInstructionController);


router.get('/DeviceLightOff',  adminController.lightOffToDeviceController);
router.get('/DeviceLightOn',  adminController.lightOnToDeviceController);



router.get('/api/v1/getMapAreaDetail', adminController.verifyTokenController, areaController.getMapAreaDetail);


router.get('/api/v1/getzoneDetailWithBikeCountList',adminController.verifyTokenController,  areaController.getzoneDetailWithBikeCountList);

router.post('/setBeepOnInstruction', adminController.verifyTokenController, adminController.setBeepOnInstructionController);
router.post('/setBeepOffInstruction',adminController.verifyTokenController,  adminController.setBeepOffInstructionController);

router.get('/setBeepOn', adminController.setBeepOnController);
router.get('/setBeepOff', adminController.setBeepOffController);

router.post('/FindPointInCircle',  geofenceController.FindPointInCircle);
router.post('/FindPointInRectangle',  geofenceController.FindPointInRectangle);
router.post('/FindPointInPolygon',  geofenceController.FindPointInPolygon);
router.post('/FindPointNearestPoint',  geofenceController.FindPointNearestPoint);
router.post('/FindPointNearestPointDistance',  geofenceController.FindPointNearestPointDistance);


router.post('/addUpdateMapCity', areaController.addUpdateMapCityDetailController);
router.get('/getCityDataForTable', areaController.getCityDataForTable);
router.get('/getMapCityDetail', areaController.getMapCityDetail);
router.get('/getMapCityDetailsForSearche', areaController.getMapCityDetailsForSearche);

router.get('/getOutSideGeoFanceBikeList' ,adminController.verifyTokenController, adminController.getOutSideGeoFanceBikeList);

router.get('/calculateDistance' , rideBookingController.calculateDistance);

router.get('/calculateDistance1' , rideBookingController.calculateDistance1);
router.get('/getBikeDetailZoneWiseForMap' , adminController.getBikeDetailZoneWiseController);
router.get('/getzoneDetailWithAllTypeBikeCountList' , areaController.getzoneDetailWithAllTypeBikeCountList);

router.post('/getMapCityDetailForReport', areaController.getMapCityDetailForReport);
router.post('/getMapAreaDetailForReport', areaController.getMapAreaDetailForReport);
router.post('/getZoneDetailForReport', areaController.getZoneDetailForReportController);

//adminController.verifyTokenController,
router.get('/getDepositAndRidingOrRechargeAmount',  adminController.getDepositAndRidingOrRechargeAmountController);
router.get('/getUserForAddDepositRechargeList',  adminController.getUserForAddDepositRechargeList);

router.get('/getUserPaymentOnlineTransaction',  paymentIntegrationController.getUserPaymentOnlineTransactionServiceController);






export default router;
