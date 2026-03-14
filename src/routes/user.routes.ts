import Router from 'express';
import userController from '../Controller/userController/user.controller';
import adminController from '../Controller/adminController/admin.controller';

const router = Router();

router.post('/AddUser', adminController.verifyTokenController, userController.AddUserService);
router.post('/CheckCustomerMobileNumber', userController.addUserCheckCustomerMobileNumberService);
router.post('/SendOtp', userController.sendOtpController);
router.get('/getUser', adminController.verifyTokenController, userController.getUserController);
router.get('/getLatestTransactionList', userController.getLatestTransactionList);

router.get('/getLastTenTransactionList', adminController.verifyTokenController, userController.getLastTenTransactionList);

router.post('/getWithdrawRequestFromUser', adminController.verifyTokenController, userController.getWithdrawRequestFromUserController);
router.post('/insertUserTransaction', adminController.verifyTokenController, userController.insertUserTransactionDetails);
router.post('/updateUserLanguage', adminController.verifyTokenController, userController.updateUserLanguageController);
router.post('/logOutUser', adminController.verifyTokenController, userController.logOutUserController);

export default router;
