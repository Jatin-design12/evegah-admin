import { apiMessage } from './api-message';

export const zoneValidation = async (requestBody: any) => {
    let message;
    if (!requestBody.areaId) {
        return (message = 'Please Enter Valid City');
    }    
    if (!requestBody.name || requestBody.name.trim() === '') {
        return (message = 'Please Enter Valid Zone Name.');
    }
    if (!requestBody.latitude || requestBody.latitude.trim() === '') {
        return (message = 'Please Enter Valid Zone latitude.');
    }
    if (!requestBody.longitude || requestBody.longitude.trim() === '') {
        return (message = 'Please Enter Valid Zone longitude.');
    }

    if (requestBody.zoneSize <= 0) {
        return (message = apiMessage.validZoneSize);
    }

    if (requestBody.zoneCapacity <= 0) {
        return (message = apiMessage.validCapacity);
    }
};
