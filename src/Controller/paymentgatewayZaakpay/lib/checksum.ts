import CryptoJS from "crypto-js"
import config from '../../../Config/config'

let secretkey :any = config.zaakPaymentConfigKeys.ZAAKPAY_SECRETKEY;

class ChecksumString
{
 constructor(){}


 getChecksumString(data:any) {
  var checksumstring = "";
  var checksumsequence = ["amount","bankid","buyerAddress",
        "buyerCity","buyerCountry","buyerEmail","buyerFirstName","buyerLastName","buyerPhoneNumber","buyerPincode",
        "buyerState","currency","debitorcredit","merchantIdentifier","merchantIpAddress","mode","orderId",
        "product1Description","product2Description","product3Description","product4Description",
        "productDescription","productInfo","purpose","returnUrl","shipToAddress","shipToCity","shipToCountry",
        "shipToFirstname","shipToLastname","shipToPhoneNumber","shipToPincode","shipToState","showMobile","txnDate",
        "txnType","zpPayOption"];
  for (var seq in checksumsequence) {
    for (var key in data) {
      if((key.toString()) === checksumsequence[seq]) {
        if(data[key].toString() !== "") {
          checksumstring += key+"="+data[key].toString()+"&";
        }
      }
    }
  }
  return checksumstring;
}

getResponseChecksumString(data:any) {
  var checksumstring = "";
  var checksumsequence = ["amount","bank","bankid","cardId",
        "cardScheme","cardToken","cardhashid","doRedirect","orderId",
        "paymentMethod","paymentMode","responseCode","responseDescription",
        "productDescription","product1Description","product2Description",
        "product3Description","product4Description","pgTransId","pgTransTime"];

  for (var seq in checksumsequence) {
    for (var key in data) {
      if((key.toString()) === checksumsequence[seq]) {
        checksumstring += key+"="+data[key].toString()+"&";
      }
    }
  }
  return checksumstring;
}

calculateChecksum(checksumstring:any) {
  return CryptoJS.HmacSHA256(checksumstring,secretkey);
}
}
export default new ChecksumString();