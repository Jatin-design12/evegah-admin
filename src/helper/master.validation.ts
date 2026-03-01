export const vehicleValidation = async (requestBody: any) => {
    let message;
    if (!requestBody.vehicleType) {
        return (message = 'Please Enter Valid vehicle Type.');
    }
    if (!requestBody.vehicleType) {
        return (message = 'Please Enter Valid vehicle Type.');
    }
    if (!requestBody.modelName || requestBody.modelName.trim() === '') {
        return (message = 'Please Enter Valid vehicle Model Name.');
    }
    if (!requestBody.brakesType || requestBody.brakesType.trim() === '') {
        return (message = 'Please Enter Valid vehicle Brakes Type.');
    }
    if (!requestBody.brandName || requestBody.brandName.trim() === '') {
        return (message = 'Please Enter Valid vehicle Brand Name.');
    }
    if (!requestBody.frameType || requestBody.frameType.trim() === '') {
        return (message = 'Please Enter Valid vehicle Frame Type.');
    }
    if (!requestBody.tiersSize || requestBody.tiersSize <= 0) {
        return (message = 'Please Enter Valid vehicle Tiers Size.');
    }
    if (!requestBody.length || requestBody.length <= 0) {
        return (message = 'Please Enter Valid vehicle Length.');
    }   
    if (!requestBody.lengthUnit) {
        return (message = 'Please Enter Valid vehicle Length Unit.');
    }
    if (!requestBody.height || requestBody.height <= 0) {
        return (message = 'Please Enter Valid vehicle Height.');
    }

    if (!requestBody.heightUnit) {
        return (message = 'Please Enter Valid vehicle Height Unit.');
    }
    if (!requestBody.width || requestBody.width <= 0) {
        return (message = 'Please Enter Valid vehicle width');
    }
    if (!requestBody.widthUnit) {
        return (message = 'Please Enter Valid vehicle Width Unit');
    }    
};
