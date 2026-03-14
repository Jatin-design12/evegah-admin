import Router from 'express';
import adminController from '../Controller/adminController/admin.controller';
import paymentController from '../Controller/paymentIntegrationController/payment.integration.controller';

const router = Router();
//router.use(cookieParser());
///get master api
router.post('/api/v1/order', adminController.verifyTokenController, paymentController.paymentOrderController);
router.post('/api/v1/verifyPayment', adminController.verifyTokenController, paymentController.verifyPaymentController);
router.get('/api/v1/getAllPayments', adminController.verifyTokenController, paymentController.getAllPaymentsController);
router.post('/api/v1/payout', adminController.verifyTokenController, paymentController.payoutController);
router.post('/api/v1/addAmountToUserWallet', adminController.verifyTokenController, paymentController.addAmountToUserWallet);
router.post('/api/v1/payExtraCharges', adminController.verifyTokenController, paymentController.addAmountToUserWallet);
router.post('/api/v1/addAmountToUserWalletByAdmin', adminController.verifyTokenController, paymentController.addAmountToUserWalletByAdmin);

router.post('/api/v1/addDepositAmountToUserWalletByAdmin', adminController.verifyTokenController, paymentController.addDepositAmountToUserWalletByAdmin);
router.post('/api/v1/addDepositAmountToUserWalletToApp', paymentController.addDepositAmountToUserWalletToApp);

router.post('/api/v1/addUserRechargeAmount', adminController.verifyTokenController, paymentController.addUserRechargeAmount);
router.post('/api/v1/aadUserRechargeAmountByAdmin', adminController.verifyTokenController, paymentController.aadUserRechargeAmountByAdmin);

router.post('/api/v1/cancelWithdrawRequestFromUser', adminController.verifyTokenController, paymentController.cancelWithdrawRequestFromUserController);

router.post('/api/v1/addAppVersionDetail', paymentController.addAppVersionDetail);
router.post('/api/v1/updateAppVersionDetail', paymentController.updateAppVersionDetail);

router.get('/api/v1/getVersionHistory', paymentController.getVersionHistoryController);

router.get('/api/v1/getCurrentVersion', paymentController.getVersionCurrentController);

router.post('/api/v1/addDepositAndRechargeAmountToUserWallet', paymentController.addDepositAndRechargeAmountToUserWalletToApp);

router.post('/api/v1/gatPaymentOrderDetail', paymentController.gatPaymentOrderDetail);

router.get('/api/v1/CheckPaymentOrderDetailByOrderId', paymentController.CheckPaymentOrderDetailByOrderId);

router.get('/api/v1/CheckPaymentOrderDetailByOrderIdOnlyOrderIsCheck', paymentController.CheckPaymentOrderDetailByOrderIdOnlyOrderIsCheck);

export default router;
