import { Request, Response } from 'express';
import { FileDelete, FileUpload } from '../../services/commanServices/comman.api.services';
import { exceptionHandler, AddExceptionIntoDB } from '../../helper/responseHandler';
const fileDelete = async (req: Request, res: Response) => {
    try {
        /* 	#swagger.tags = ['Comman-api']
            #swagger.description = 'delete s3 file ' */

        /*	#swagger.parameters['obj'] = {
                in: 'body',
                description: 'User information.',
                required: true,
                schema: { $ref: "#/definitions/fileDelete" }
        } */

        /* #swagger.security = [{
                "apiKeyAuth": []
        }] */

        await FileDelete(req, res);
        return Promise.resolve({
            message: 'sucess',
            user: 200
        });
    } catch (error) {
        AddExceptionIntoDB(req, error);
        return Promise.reject({
            message: 'error',
            user: error
        });
    }
};

const fileUploadService = async (req: Request, res: Response) => {
    try {
        // #swagger.tags = ['Comman-api']
        // #swagger.description = 'Pass file to upload'

        /*#swagger.parameters[ {
                        "name": "file",
                        "in": "formData",
                        "description": "file",
                        "required": true,
                        "type": "file"
                    }] 
        } */
        await FileUpload(req, res);
        return Promise.resolve({
            message: 'success',
            user: 200
        });
    } catch (error) {
        AddExceptionIntoDB(req, error);
        return Promise.reject({
            message: 'error',
            user: error
        });
    }
};

export default {
    fileDelete,
    fileUploadService
};
