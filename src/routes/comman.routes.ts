import Router from 'express';
import cookieParser from 'cookie-parser';
 import commanApiController from '../Controller/commanController/comman.api.controller';

const router = Router();
router.use(cookieParser());

router.post('/fileDelete', commanApiController.fileDelete);
 router.post('/fileUpload', commanApiController.fileUploadService);
export default router;
