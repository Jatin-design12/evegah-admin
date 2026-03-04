
interface getEnumDetailsRes {
    enum_id: Number;
    enum_type_name: string;
    name: string;
    display_name: string;
    status: string;
}

interface AddUserDetails {
    customerId: number;
    customerName: string;
    referralCode: string;
    mobileNumber: string;
    stateId: number;
    cityId: number;
    statusEnumId: number;
    actionOnDate: string;
}

interface IAddUerMailDetail {
    templateId: number;
    email: Array<any>;
    message: string;
    emailId: string;
    subject: string;
    statusEnumId: Number;
    actionbyUserTypeEnumId: Number;
    createdbyLoginuserId: Number;
    actionbyLoginUserId: Number;
    actionOnDate: string;
    userDetail: any;
}

interface IGetZoneWiseAllotmentList {
    zoneId?: number;
}
interface IAllotmentDetails {
    vehicleId: number;
    uId: number;
    zoneId: number;
    statusEnumId: number;
    remark: string;
    actionByLoginUserId: number;
    actionByUserTypeEnumId: number;
    actionOnDate: string;
    bikeAllotmentId?: number;
    bikeId?: number;
    lockId?: number;
}

interface IZone {
    zoneId: number;
    name: string;
    latitude: string;
    longitude: string;
    zoneSize: number;
    zoneCapacity: number;
    zoneAddress: string;
    cityId: number;
    stateId: number;
    statusEnumId: number;
    remark: string;
    actionByLoginUserId: number;
    actionByUserTypeEnumId: number;
    actionOnDate: Date;
}
export { getEnumDetailsRes, AddUserDetails, IAddUerMailDetail, IGetZoneWiseAllotmentList, IAllotmentDetails, IZone };
