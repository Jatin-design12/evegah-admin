import Router from 'express';
import adminController from '../Controller/adminController/admin.controller';
import mastersController from '../Controller/mastersController/masters.controller';

//const { catchErrors } = require('../helper/errorHandling');
const router = Router();
//router.use(cookieParser());
///get master api
router.get('/getStates', adminController.verifyTokenController, mastersController.getStatesController);
router.get('/getCities', adminController.verifyTokenController, mastersController.getCitiesController);
router.get('/api/v1/getUnit', adminController.verifyTokenController, mastersController.getUnitController);
router.get('/api/v1/getVehicleModel', adminController.verifyTokenController, mastersController.getVehicleModelController);
router.post('/api/v1/addUpdateVehicleModelDetails', adminController.verifyTokenController, mastersController.addUpdateVehicleModelDetailsController);
router.get('/api/v1/getZoneList', adminController.verifyTokenController, mastersController.getZoneListController);
router.get('/api/v1/getVehicleList', adminController.verifyTokenController, mastersController.getVehicleListController);

router.get('/api/v1/getVehicleTypeList', adminController.verifyTokenController, mastersController.getVehicleTypeListController);

router.get('/getMapCity', adminController.verifyTokenController, mastersController.getMapCity);
router.get('/getMapState', adminController.verifyTokenController, mastersController.getMapState);
router.get('/getMapCountry', adminController.verifyTokenController, mastersController.getMapCountry);

router.post('/insertVehicleModelDetail', adminController.verifyTokenController, mastersController.insertVehicleModelDetailsController);

router.get('/getVehicleModelDetails', adminController.verifyTokenController, mastersController.getVehicleModelDetails);

router.get('/getclientIPaddress', mastersController.getclientIPaddress);

router.post('/insertApiExceptionData', adminController.verifyTokenController, mastersController.insertApiException);

router.get('/getVehicleModelDetailsForTable', adminController.verifyTokenController, mastersController.getVehicleModelDetailsForTable);

router.get('/getVehicleModelImagesBase64', adminController.verifyTokenController, mastersController.getImagesBase64Service);
router.get('/getSectionFAQDetail', adminController.verifyTokenController, mastersController.getSectionFAQDetail);

router.post('/AddSectionAndFAQDetail', mastersController.faqDetailSectionWise);
router.get('/getSectionList', adminController.verifyTokenController, mastersController.getSectionList);

router.post('/unPublishFAQDetail', adminController.verifyTokenController, mastersController.unPublishFAQDetail);
router.post('/publishFAQDetail', adminController.verifyTokenController, mastersController.publishFAQDetail);

router.get('/getAllSectionFAQDetail', adminController.verifyTokenController, mastersController.getAllSectionFAQDetail);

router.post('/addEditSectionName', mastersController.addeditSectionName);

router.post('/addFAQSequence', mastersController.addFAQSequence);

router.post('/addSectionSequense', mastersController.updateSequenseSection);

export default router;
