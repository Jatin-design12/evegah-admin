import Router from 'express';
import zaakpaymentController from './payment.gateway.zaakpay.Controller';
import adminController from '../../Controller/adminController/admin.controller';
import path from 'path';
import config from '../../Config/config';

const router = Router();

//Payments and payment gateway related api
router.all('/' + config.zaakPaymentConfigKeys.ZAAKPAY_TRANSACTIONPAGE, adminController.verifyTokenController, zaakpaymentController.paymentTransactionController);
router.post('/' + config.zaakPaymentConfigKeys.ZAAKPAY_RESPONSEPAGE, zaakpaymentController.transactionResponseController);
//router.all('/'+config.zaakPaymentConfigKeys.ZAAKPAY_CHECKTRANSACTIONSTATUSPAGE, adminController.verifyTokenController, zaakpaymentController.checkTransactionStatusController);

router.all('/' + config.zaakPaymentConfigKeys.ZAAKPAY_CHECKTRANSACTIONSTATUSPAGE, zaakpaymentController.checkTransactionStatusController);
router.all('/' + config.zaakPaymentConfigKeys.ZAAKPAY_REFUNDTRANSACTIONPAGE, adminController.verifyTokenController, zaakpaymentController.refundTransactionController);

router.all('/testEJSFile', zaakpaymentController.testEJSFile);

//router.set('views', path.join(__dirname, 'views'));

export default router;
