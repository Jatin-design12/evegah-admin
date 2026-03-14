import Router from 'express';
import adminController from '../Controller/adminController/admin.controller';
import bookingController from '../Controller/rideBookingController/ride.booking.controller';

const router = Router();
//router.use(cookieParser());
//post
router.post('/api/v1/rideBooking', adminController.verifyTokenController, bookingController.rideBookingController);
router.post('/api/v1/updateDetailsRideEnds', adminController.verifyTokenController, bookingController.updateDetailsRideEndsController);
router.get('/api/v1/getRideBookingDetails', adminController.verifyTokenController, bookingController.getRideBookingDetailsController);
router.get('/api/v1/getRideHistory', adminController.verifyTokenController, bookingController.getRideHistoryController);
router.get('/api/v1/getLastRideBookingDetails', adminController.verifyTokenController, bookingController.getLastRideBookingDetailsController);

router.post('/api/v1/updateBikeUndermaintenance', adminController.verifyTokenController, bookingController.updateBikeUndermaintenanceController);
router.post('/api/v1/updateBikeStatusUnresurved', adminController.verifyTokenController, bookingController.updateBikeStatusUnresurvedController);

router.post('/api/v1/rideBookingValidations', adminController.verifyTokenController, bookingController.rideBookingValidationsControllerForCheckFarePlan);

//router.post('/api/v1/checkgoogleMapsClient', bookingController.checkgoogleMapsClient);

router.get('/getRideBookingByUserIdAndLockNo', adminController.verifyTokenController, bookingController.getRideBookingByUserIdAndLockNumber);
router.post('/addRideBookingRating', adminController.verifyTokenController, bookingController.addRideBookingRatingController);
router.post('/addRidebookingCommentsReply', adminController.verifyTokenController, bookingController.addRidebookingCommentsReply);

router.post('/getRideBookingDetailForCommentsReply', adminController.verifyTokenController, bookingController.getRideBookingDetailForCommentsReply);

router.post('/rideStartUnlockAndPowerOnWithTimeDifference', bookingController.rideStartWithTime);

router.post('/deviceUnlockAndPowerOnWithTime', bookingController.deviceUnlockWithTime);

router.post('/deviceLockAndPowerOffWithTime', bookingController.deviceLockWithTime);

router.post('/rideEndWithTimeDifference', bookingController.rideEndWithTime);

export default router;
