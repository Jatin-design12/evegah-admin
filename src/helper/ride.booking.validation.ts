export const rideBookingValidation = async (requestBody: any) => {
    let message;
    if (!requestBody.id) {
        return (message = 'Please Enter Valid User Id.');
    }
    if (!requestBody.bikeId) {
        return (message = 'Please Enter Valid bikeId Id.');
    }

};
