import { client } from '../../Config/db.connection';
import { DB_CONFIGS } from '../../Config/db.queries';
import { gets3SignedUrls } from '../../helper/common-function';
import { getUTCdate } from '../../helper/datetime';
import { AddExceptionIntoDB } from '../../helper/responseHandler';
class MasterServices {
    constructor() {}
    async getStates(data: any) {
        const query = DB_CONFIGS.addressQueries.getStates(data.country_id);
        return new Promise(async (resolve, reject) => {
            try {
                let result = await client.query(query);
                resolve(result);
            } catch (error) {
                reject(error);
            }
        });
    }

    async getCities(data: any) {
        const query = DB_CONFIGS.addressQueries.getCities(data.state_id);
        return new Promise(async (resolve, reject) => {
            try {
                let result = await client.query(query);
                resolve(result);
            } catch (error) {
                reject(error);
            }
        });
    }


    async getUnit(data: any) {
        let query: any = {
            text: DB_CONFIGS.enumQueries.getUnitDetails(),
            values: [data.unitId, data.statusEnumId]
        };
        return new Promise(async (resolve, reject) => {
            try {
                let result = await client.query(query);
                resolve(result);
            } catch (error) {
                reject(error);
            }
        });
    }
    async getVehicleModel(data: any) {
        let query: any = {
            text: DB_CONFIGS.enumQueries.getVehicleModelDetails(),
            values: [data.VehicleId, data.statusEnumId]
        };
        
        return new Promise(async (resolve, reject) => {
            try {
                let result = await client.query(query);
                resolve(result);
            } catch (error) {
                reject(error);
            }
        });
    }
    

   
    async addUpdateVehicleModel(data: any) {
        let actionOnDate = getUTCdate();
        let query: any = {
            text: DB_CONFIGS.enumQueries.addUpdateVehicleModelDetails(),
            values: [
                data.vehicleId,
                data.vehicleType,
                data.modelName,
                data.brakesType,
                data.brandName,
                data.frameType,
                data.tiersSize,
                data.minHireTime,
                data.length,
                data.lengthUnit,
                data.width,
                data.widthUnit,
                data.weight,
                data.weightUnit,
                data.height,
                data.heightUnit,
                data.statusEnumId,
                data.remark,
                data.actionByLoginUserId,
                data.actionByUserTypeEnumId,
                actionOnDate,
                data.minimumRentRate
            ]
        };
        return new Promise(async (resolve, reject) => {
            try {
                let result = await client.query(query);
                resolve(result);
            } catch (error) {
                reject(error);
            }
        });
    }
    async getZoneList(data: any) {
        let query: any = {
            text: DB_CONFIGS.adminQueries.adminDashboardQueries.getZoneList(),
            values: []
        };
        return new Promise(async (resolve, reject) => {
            try {
                let result = await client.query(query);
                resolve(result);
            } catch (error) {
                reject(error);
            }
        });
    }
    async getVehicleList(data: any) {
        let query: any = {
            text: DB_CONFIGS.enumQueries.getVehicleList(),
            values: []
        };
        return new Promise(async (resolve, reject) => {
            try {
                let result = await client.query(query);
                resolve(result);
            } catch (error) {
                reject(error);
            }
        });
    }

    async addImagesOfVehicle(vehicleDetails: any) {
        let actionOnDate = getUTCdate();

        return new Promise(async (resolve, reject) => {
            if (!vehicleDetails.vehicleImage) {
                return resolve(false);
            }
            let finalResult: any = [];
            vehicleDetails.vehicleImage.forEach(async (element: any) => {

                
                    let query: any = {

                        text: DB_CONFIGS.enumQueries.addVehicleImage(),
                        values: [

                            vehicleDetails.vehicleId,
                            element.image_name,
                            element.image_unique_name,
                            
                            vehicleDetails.statusEnumId,
                            actionOnDate,
                            vehicleDetails.actionByLoginUserId,
    
                            vehicleDetails.actionByUserTypeEnumId,
                            element.imageSerialNumber,
                            element.imageFor,
                        ]
                    };
                                                                             
                try {
                    let result = await client.query(query);
                    finalResult.push(result);
                } catch (error) {
                    reject(error);
                }
            });
            resolve(true);
        });
    }

    async updateVehicleImages(imageDetails: any,vehicleDetails :any) {
      
        let actionOnDate = getUTCdate();
        let query: any = {
            text: DB_CONFIGS.enumQueries.updateVehicleImage(),
            values: [ 
                imageDetails.imageId,                
                vehicleDetails.vehicleId,
                imageDetails.image_name,
                imageDetails.image_unique_name,
                
                vehicleDetails.statusEnumId,
                actionOnDate,
                vehicleDetails.actionByLoginUserId,
                
                imageDetails.imageSerialNumber,
                imageDetails.imageFor
            ]
        };

        
        return new Promise(async (resolve, reject) => {
            try {
                let result = await client.query(query);
                resolve(result);
            } catch (error) {
                reject(error);
            }
        });
    }

    async insertVehicleImages(imageDetails: any ,vehicleDetails :any) {
        let actionOnDate = getUTCdate();
        let query: any = {
            text: DB_CONFIGS.enumQueries.addVehicleImage(),
            values: [                 
                vehicleDetails.vehicleId,
                imageDetails.image_name,
                imageDetails.image_unique_name,
                
                vehicleDetails.statusEnumId,
                actionOnDate,
                vehicleDetails.actionByLoginUserId,
                
                imageDetails.imageSerialNumber,
                imageDetails.imageFor
            ]
        };
        
        return new Promise(async (resolve, reject) => {
            try {
                let result = await client.query(query);
                resolve(result);
            } catch (error) {
                reject(error);
            }
        });
    }

    async deactiveImageOfVehicle(vehicleDetails: any) {
        let query: any = {
            text: DB_CONFIGS.enumQueries.deactiveVehicleImage(),
            values: [vehicleDetails.vehicleId]
        };
        return new Promise(async (resolve, reject) => {
            try {
                let result = await client.query(query);
                resolve(result);
            } catch (error) {
                reject(error);
            }
        });
    }




    async deleteUnUsedImageOfVehicle(vehicleDetails: any) {
        let query: any = {
            text: DB_CONFIGS.enumQueries.deleteUnUsedImageOFVehicleByVehicleId(),
            values: [vehicleDetails.vehicleId]
        };
        return new Promise(async (resolve, reject) => {
            try {
                let result = await client.query(query);
                resolve(result);
            } catch (error) {
                reject(error);
            }
        });
    }

    async getImagesOfVehicle(vehicleDetails: any) {
        let query: any = {
            text: DB_CONFIGS.enumQueries.getImageByVehicleId(),
            values: [vehicleDetails.VehicleId]
        };
        return new Promise(async (resolve, reject) => {
            try {
                let imageArray: any = [];
                let result: any = await client.query(query);
                for (let row of result.rows) {                                       
                    imageArray.push({
                        id: row.id,
                        vehicleId: row.vehicle_id,
                        image_name: row.image_name,
                        image_unique_name: row.image_unique_name,
                        image_unique_signed_url: gets3SignedUrls(row.image_unique_name),
                        status_enum_id: row.status_enum_id,
                        imageSerialNumber:row.image_serial_number,
                        image_for : row.image_for,
                    });
                }
                resolve(imageArray);
            } catch (error) {
                reject(error);
            }
        });
    }

    async getAdminAndMobileImagesOfVehicle(vehicleDetails: any) {
        let query: any = {
            text: DB_CONFIGS.enumQueries.getImageByVehicleId(),
            values: [vehicleDetails.VehicleId]
        };
        return new Promise(async (resolve, reject) => {
            try {
                let imageArray: any;
                let MobileImageArray: any = [];
                let AdminImageArray: any =[];
                let result: any = await client.query(query);
                for (let row of result.rows) {
                    
                    
                    if(row.image_for ==79)// mobole
                    {
                        
                        MobileImageArray.push({
                            id: row.id,
                            imageId : row.id,
                            vehicleId: row.vehicle_id,
                            image_name: row.image_name,
                            image_unique_name: row.image_unique_name,
                            image_unique_signed_url: gets3SignedUrls(row.image_unique_name),
                            status_enum_id: row.status_enum_id,
                            imageSerialNumber:row.image_serial_number,
                            image_for : row.image_for,
                        });
                    }
                    else if (row.image_for == 78)
                    {
                        
                        AdminImageArray.push({
                            
                            id: row.id,
                            imageId : row.id,
                            vehicleId: row.vehicle_id,
                            image_name: row.image_name,
                            image_unique_name: row.image_unique_name,
                            image_unique_signed_url: gets3SignedUrls(row.image_unique_name),
                            status_enum_id: row.status_enum_id,
                            imageSerialNumber:row.image_serial_number,
                            image_for : row.image_for,
                        });
                    }                                                                    
                    
                }
                imageArray ={
                    mobileImageArray : MobileImageArray,
                    adminImageArray : AdminImageArray
                   }
                
                resolve(imageArray);
            } catch (error) {
                reject(error);
            }
        });
    }


    async getImagesBase64Service(data: any) {
        let query: any = {
            text: DB_CONFIGS.enumQueries.getImageBase64Q(),   
            values: [data.imageId]         
        };
        
        return new Promise(async (resolve, reject) => {
            try {
                let result = await client.query(query);
                resolve(result);
            } catch (error) {
                reject(error);
            }
        });
    }
    
    async getVehicleTypeList(data: any) {
        let query: any = {
            text: DB_CONFIGS.areaMasters.getVehicleTypeList()            
        };
        
        return new Promise(async (resolve, reject) => {
            try {
                let result = await client.query(query);
                resolve(result);
            } catch (error) {
                reject(error);
            }
        });
    }

    async getMapCity(mapStateId : any ) {
        let query: any = {
            text: DB_CONFIGS.mapAddressQueries.getMapCity(),
            values: [mapStateId.mapStateId]           
        };

        return new Promise(async (resolve, reject) => {
            try {
                let result = await client.query(query);
                resolve(result);
            } catch (error) {
                reject(error);
            }
        });
    }
    

    async getMapState(mapCountryId : any ) {
        let query: any = {
            text: DB_CONFIGS.mapAddressQueries.getMapStates(),
            values: [mapCountryId.mapCountryId]           
        };

        return new Promise(async (resolve, reject) => {
            try {
                let result = await client.query(query);
                resolve(result);
            } catch (error) {
                reject(error);
            }
        });
    }

    async getMapCountry() {
        let query: any = {
            text: DB_CONFIGS.mapAddressQueries.getmapCountry()
            //values: [mapCountryId.mapCountryId]           
        };

        return new Promise(async (resolve, reject) => {
            try {
                let result = await client.query(query);
                resolve(result);
            } catch (error) {
                reject(error);
            }
        });
    }


    async insertVehicleModel(data: any) {
        let actionOnDate = getUTCdate();
        let query: any = {
            text: DB_CONFIGS.enumQueries.insertVehicleModelQuery(),
            values: [

                
                data.modelName,
                data.brandName ,            
           
                data.vehicleType,
                data.brakeType ,
                data.batteryType,
            
                data.frameType ,
                data.batteryCapacityAh ,
                data.batteryCapacityVolt,

                data.accessories,           
                data.color,
                data.motorType ,

                data.statusEnumId,
                data.remark,
                
                data.actionByLoginUserId,                
                actionOnDate   ,
                data.maxRangeOn100PercentageBatteryKM           
            ]
        };

        
        return new Promise(async (resolve, reject) => {
            try {
                let result = await client.query(query);
                resolve(result);
            } catch (error) {
                reject(error);
            }
        });
    }

    async updateVehicleModel(data: any) {
        let actionOnDate = getUTCdate();
        let query: any = {
            text: DB_CONFIGS.enumQueries.updateVehicleModelQuery(),
            values: [

                data.vehicleId,
                data.modelName,
                data.brandName ,                
           
                data.vehicleType,
                data.brakeType ,
                data.batteryType,
            
                data.frameType ,
                data.batteryCapacityAh ,
                data.batteryCapacityVolt,

                data.accessories,
           
                data.color,
                data.motorType,
                data.statusEnumId,
                data.remark,
                
                data.actionByLoginUserId,                
                actionOnDate  ,
                data.maxRangeOn100PercentageBatteryKM             
            ]
        };

        
        return new Promise(async (resolve, reject) => {
            try {
                let result = await client.query(query);
                resolve(result);
            } catch (error) {
                reject(error);
            }
        });
    }
     async getVehicleModelService(modelDetail: any, req :any) {
        let query: any = { text: DB_CONFIGS.enumQueries.getVehicleModel(), values: [modelDetail.vehicleId,modelDetail.statusEnumId] };
        return new Promise(async (resolve, reject) => {
            try {
               
                let result = await client.query(query);
                resolve(result);
                
            } catch (error) {
                req.dbquery = query.text;
                req.dbqueryParameters =query.values ;
                AddExceptionIntoDB(req,error);
                reject(error);
            }
        });
    }

    async checkExistVehicleModel(details: any) {
        let query: any = {
            text: DB_CONFIGS.enumQueries.checkExistVehicleModelQuery(),
            values: [details.modelName,details.vehicleId]           
        };
        

        return new Promise(async (resolve, reject) => {
            try {
                let result = await client.query(query);
                resolve(result);
            } catch (error) {
                reject(error);
            }
        });
    }


    async checkSectionQuestions(details: any ,req :any) {
        let requestBody = details;
        let query: any = {
            text: DB_CONFIGS.mastersQueries.checkSectionQuestionExist(),
            values: [requestBody.question,requestBody.questionId ,requestBody.sectionId]           
        };
        

        return new Promise(async (resolve, reject) => {
            try {
                let result = await client.query(query);
                resolve(result);
            } catch (error) {
                reject(error);
            }
        });
    }

    async getpublisheAndUnPublishDateService(details: any ,req :any) {
        let requestBody = details;
        let query: any = {
            text: DB_CONFIGS.mastersQueries.getpublisheAndUnPublishDateQuery(),
            values: [requestBody.questionId]           
        };
        

        return new Promise(async (resolve, reject) => {
            try {
                let result = await client.query(query);
                resolve(result);
            } catch (error) {
                reject(error);
            }
        });
    }
    
    async checkSectionName(details: any, req :any) {
        let requestBody:any = details;
        let query: any = {
            text: DB_CONFIGS.mastersQueries.checkSetionNameExist(),
            values: [requestBody.sectionName ,requestBody.sectionId]           
        };
        

        return new Promise(async (resolve, reject) => {
            try {
                let result = await client.query(query);
                resolve(result);
            } catch (error) {
                reject(error);
            }
        });
    }
    
    async addSectionName(details: any,req :any) {
        let requestBody = details;
        requestBody.statusEnumId = '1';
        requestBody.aplicableDate = getUTCdate()
        let query: any = {
            text: DB_CONFIGS.mastersQueries.addSectionName(),
            values: [requestBody.sectionName ,requestBody.statusEnumId,requestBody.aplicableDate,requestBody.loginUserId,requestBody.scection_sequence]           
        };
        

        return new Promise(async (resolve, reject) => {
            try {
                let result = await client.query(query);
                resolve(result);
            } catch (error) {
                reject(error);
            }
        });
    }

        
    async updateSectionNameService(details: any,req :any) {
        let requestBody = details;
        requestBody.statusEnumId = '1';
        requestBody.aplicableDate = getUTCdate()
        let query: any = {
            text: DB_CONFIGS.mastersQueries.updateSectionName(),
            values: [requestBody.sectionId,requestBody.sectionName ,requestBody.statusEnumId,requestBody.aplicableDate,requestBody.loginUserId]           
        };
        

        return new Promise(async (resolve, reject) => {
            try {
                let result = await client.query(query);
                resolve(result);
            } catch (error) {
                reject(error);
            }
        });
    }

    async addSectionFAQDetail(details: any,req :any) {
        let requestBody = details;
        requestBody.statusEnumId = '1';
        requestBody.aplicableDate = getUTCdate()
        let query: any = {
            text: DB_CONFIGS.mastersQueries.addFAQDetail(),
            values: [requestBody.question,requestBody.answer,requestBody.faqPublishStatusEnumId,requestBody.sectionId,requestBody.statusEnumId,requestBody.aplicableDate,requestBody.loginUserId,
                requestBody.lastPublishDate ,requestBody.lastUnpublishDate,requestBody.lastPublishedUserId,requestBody.lastUnpublishedUserId,requestBody.question_sequence]           
        };
        

        return new Promise(async (resolve, reject) => {
            try {
                let result = await client.query(query);
                resolve(result);
            } catch (error) {
                reject(error);
            }
        });
    }

    async getFAQSequence(details: any,req :any) {
        let requestBody = details;
      
        let query: any = {
            text: DB_CONFIGS.mastersQueries.addFAQSequenceDetail(),
            values: [requestBody.sectionId]           
        };    
        return new Promise(async (resolve, reject) => {
            try {
                let result = await client.query(query);
                resolve(result);
            } catch (error) {
                reject(error);
            }
        });
    }
    async getSectionSequence(req :any) {      
      
        let query: any = {
            text: DB_CONFIGS.mastersQueries.getSectionSequenceDetail()
           // values: [requestBody.sectionId]           
        };    
        return new Promise(async (resolve, reject) => {
            try {
                let result = await client.query(query);
                resolve(result);
            } catch (error) {
                reject(error);
            }
        });
    }
    

    async editSectionFAQDetail(details: any,req :any) {
        let requestBody = details;
        requestBody.statusEnumId = '1';
        requestBody.aplicableDate = getUTCdate()
        let query: any = {
            text: DB_CONFIGS.mastersQueries.editFAQDetail(),
            values: [requestBody.questionId,requestBody.question,requestBody.answer,requestBody.faqPublishStatusEnumId,requestBody.sectionId,requestBody.statusEnumId,requestBody.aplicableDate,requestBody.loginUserId,
                requestBody.lastPublishDate ,requestBody.lastUnpublishDate,requestBody.lastPublishedUserId,requestBody.lastUnpublishedUserId]     
        };
        

        return new Promise(async (resolve, reject) => {
            try {
                let result = await client.query(query);
                resolve(result);
            } catch (error) {
                reject(error);
            }
        });
    }

    async updateSequenceFAQ(details: any,req :any) {
        let requestBody = details;
        requestBody.statusEnumId = '1';
        requestBody.aplicableDate = getUTCdate()
        let query: any = {
            text: DB_CONFIGS.mastersQueries.updateSequenseFAQ(),
            values: [requestBody.questionId,requestBody.questionSequence ,requestBody.aplicableDate,requestBody.loginUserId]     
        };
        

        return new Promise(async (resolve, reject) => {
            try {
                let result = await client.query(query);
                resolve(result);
            } catch (error) {
                reject(error);
            }
        });
    }
    async updateSequenseSectionService(details: any,req :any) {
        let requestBody = details;
        requestBody.statusEnumId = '1';
        requestBody.aplicableDate = getUTCdate()
        let query: any = {
            text: DB_CONFIGS.mastersQueries.updateSequenseSection(),
            values: [requestBody.sectionId,requestBody.sectionSequence ,requestBody.aplicableDate,requestBody.loginUserId]     
        };
        

        return new Promise(async (resolve, reject) => {
            try {
                let result = await client.query(query);
                resolve(result);
            } catch (error) {
                reject(error);
            }
        });
    }



    
    async publishUnPublishFAQDetailService(details: any,req :any) {
        let requestBody = details;
        requestBody.statusEnumId = '1';
        requestBody.aplicableDate = getUTCdate()
        let query: any = {
            text: DB_CONFIGS.mastersQueries.publishUnpublishFAQDetail(),
            values: [requestBody.questionId,requestBody.faqPublishStatusEnumId,requestBody.aplicableDate,requestBody.loginUserId,
                requestBody.lastPublishDate ,requestBody.lastUnpublishDate,requestBody.lastPublishedUserId,requestBody.lastUnpublishedUserId]           
        };
        

        return new Promise(async (resolve, reject) => {
            try {
                let result = await client.query(query);
                resolve(result);
            } catch (error) {
                reject(error);
            }
        });
    }

    async getSectionDetail(details: any, req :any) {
        let requestBody:any = details;
        let query: any = {
            text: DB_CONFIGS.mastersQueries.getSectionList(),
            values: [requestBody.sectionId]           
        };
        

        return new Promise(async (resolve, reject) => {
            try {
                let result = await client.query(query);
                resolve(result);
            } catch (error) {
                reject(error);
            }
        });
    }
    

    async getFAQList( requestQuery :any , req:any) {
        let query: any = { text: DB_CONFIGS.mastersQueries.getFAQListQuery(),
            values: [requestQuery.questionId,requestQuery.sectionId,requestQuery.faqPublishStatusEnumId] };
             
        return new Promise<string>(async (resolve, reject) => {
            try {
                let questionData: any = [];                
                let result: any = await client.query(query);
                for (let row of result.rows) {
                    questionData.push({
                    id : row.id,
                    questionId : row.id,
                    question : row.question,
                    answer : row.answer,
                    faqPublishStatusEnumId : row.faq_publish_status_enum_id,
                    faqPublishStatusEnumName : row.faq_publish_status_enum_name,
                    sectionId : row.section_id,
                    statusEnumId : row.status_enum_id,
                    sectionName : row.section_name,
                    createdonDate : row.createdon_date,
                    lastPublishDate : row.last_publish_date,
                    lastUnpublishDate  : row.last_unpublish_date,
                    questionSequence : row.question_sequence ,
                    sectionSequence  : row.section_sequence
                    });
                }
                resolve(questionData);
            } catch (error) {
                req.dbquery = query.text;
                req.dbqueryParameters =query.values ;
                AddExceptionIntoDB(req,error);
                reject(error);
            }
        });
    }

}




export default new MasterServices();
