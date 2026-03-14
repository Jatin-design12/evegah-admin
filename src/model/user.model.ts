interface CustomerMobileNumbers {
    mobile_number: number;
    status_enum_id: number;
}

interface ISendOtpRequest {
    mobile_number: number;
    otp: number;
}
interface IAddUserDetails {
    address: string;
    whatsappno: string;
    userId: Number;
    userName: string;
    referralCode: string;
    mobile: string;
    emailId: string;
    dateOfBirth: string;
    genderEnumId: Number;
    userTypeEnumId: Number;
    stateId: Number;
    cityId: Number;
    statusEnumId: Number;
    actionOnDate: string;
    minimumRentRate: Number;
}

interface ISetCreditLimitForPartner {
    userId: Number;
    //partnerId: Number;
    isCreditLimitAvailable: Boolean;
    creditCurrency: string;
    amount: Number;
    creditLimitRepayDay: Number;
    statusEnumId: Number;
    actionByLoginUserId: Number;
    actionOnDate: string;
}

interface IAddInfoBusinessToBusinessUser {
    userId: Number;
    partnerId: Number;
    customerName: string;
    emailId: string;
    phoneNumber: string;
    landlineNumber: string;
    firmName: string;
    firmAddress: string;
    firmEstablishedOnDate: string;
    dateOfBirth: string;
    stateId: Number;
    cityId: Number;
    genderEnumId: Number;
    relationshipStatusEnumId: Number;
    marriageDate: string;
    gstNumber: string;
    panNumber: string;
    aadharCardNumber: string;
    userTypeEnumId: Number;
    statusEnumId: Number;
    actionbyLoginUserId: Number;
    actionOnDate: string;
}

interface IAddUpdateMembership {
    userId: Number;
    userTypeEnumId: Number;
    statusEnumId: Number;
    actionbyLoginUserId: Number;
    actionOnDate: string;
    membershipDetail: string;
}

interface IAddUpdateDocument {
    userId: Number;
    userTypeEnumId: Number;
    statusEnumId: Number;
    actionbyLoginUserId: Number;
    actionOnDate: string;
    documentDetail: string;
}
export { CustomerMobileNumbers, ISendOtpRequest, IAddUserDetails, ISetCreditLimitForPartner, IAddInfoBusinessToBusinessUser, IAddUpdateMembership, IAddUpdateDocument };
