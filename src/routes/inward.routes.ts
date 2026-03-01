import Router from 'express';
import adminController from '../Controller/adminController/admin.controller';

import inwardController from '../Controller/inwardController/inward.controller';

const router = Router();

//post
router.post('/api/v1/addUpdateBikeInward', adminController.verifyTokenController, inwardController.addUpdateBikeInwardController);
router.get('/api/v1/getBikeInwardDetails', adminController.verifyTokenController, inwardController.getBikeInwardDetailsController);
router.post('/api/v1/addUpdateLockInward', adminController.verifyTokenController, inwardController.addUpdateLockInwardController);
router.get('/api/v1/getLockInwardDetails', adminController.verifyTokenController, inwardController.getLockInwardDetailsController);
router.get('/api/v1/getUidListByVehicleId', adminController.verifyTokenController, inwardController.getUidListByVehicleIdController);
router.get('/api/v1/getLockList', adminController.verifyTokenController, inwardController.getLockListController);

router.post('/api/v1/activeInactiveLockInward', adminController.verifyTokenController, inwardController.activeInactiveLockInwardController);


router.post('/api/v1/activeInactiveBikeInward', adminController.verifyTokenController, inwardController.activeInactiveBikeInwardController);
router.get('/getLockDetailsFromDevice', adminController.verifyTokenController, inwardController.getLockDetailsFromDeviceController);
router.post('/deleteLockInward', adminController.verifyTokenController, inwardController.deleteLockInwardController);

router.get('/api/v1/getUidListWithBiekAndLock', adminController.verifyTokenController, inwardController.getUidListWithBiekAndLockController);
router.post('/insertPostBodyData',  inwardController.insertPostBodyData);

router.get('/insertGetBodyData',  inwardController.insertGetBodyData);

router.post('/bikeProduceActiveDeactive', adminController.verifyTokenController,  inwardController.bikeProduceActiveDeactive);

router.post('/deviceRegistrationByAdmin',  adminController.verifyTokenController, inwardController.deviceRegistrationByAdmin);

router.post('/mb/deviceLockForThirdParty',  inwardController.deviceLockForThirdParty);
router.post('/mb/deviceUnlockForThirdParty',  inwardController.deviceUnlockForThirdParty);
router.post('/mb/deviceUnlockByBle',  inwardController.deviceUnlockByBle);
router.post('/mb/deviceLockByBle',  inwardController.deviceLockByBle);
router.post('/mb/updateLockDetailFromMQTT',  inwardController.updateLockDetailFromMQTT);

router.post('/mb/devicePowerOnForThirdParty',  inwardController.powerOnForThirdParty);
router.post('/mb/devicePowerOffForThirdParty',  inwardController.powerOffForThirdParty);
 
router.post('/clearInstructionForLockUnlock',  inwardController.clearInstructionForLockUnlock);
router.post('/clearInstructionForLightOnOff',  inwardController.clearInstructionForLightOnOff);

//router.post('/rideStartWithTime', inwardController.rideStartWithTime);
// 8de4fa4d
export default router;
