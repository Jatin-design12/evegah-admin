
import { apiMessage } from '../helper/api-message';
import  Dateformats from './../helper/utcdate';


class CommonMessage{
    constructor () {}
 IsValid  (parameter_value: any) 
 {
    let message =true;
    if (parameter_value ==='' || parameter_value==null || parameter_value==undefined) // || parameter_value=='null'
    {
        //console.log('chech vvv out',parameter_value)
        return (message = false);
    }
    return message
}


IsValidDate(isodate :any)
   {
    
    let  regexp = new RegExp(/^(((2000|2400|2800|((17|18|19|2[0-9])(0[48]|[2468][048]|[13579][26])))-02-29)|(((17|18|19|2[0-9])[0-9]{2})-02-(0[1-9]|1[0-9]|2[0-8]))|(((17|18|19|2[0-9])[0-9]{2})-(0[13578]|10|12)-(0[1-9]|[12][0-9]|3[01]))|(((17|18|19|2[0-9])[0-9]{2})-(0[469]|11)-(0[1-9]|[12][0-9]|30)))T([01][0-9]|[2][0-3]):[0-5][0-9]:[0-5][0-9]\.[0-9]{3}Z$/);
    let result= regexp.test(isodate)
    if(result == false)
    {
       return false;
    }
    
    
    const dateformat:any = Dateformats.ConvertUTCtoDateformat(isodate);
    
    if(isNaN(Number(dateformat)))
    {
         return  false;
     } 
    return true;
}



IsRateValid  (parameter_value: any) 
{
   let message =true;

   
   if (parameter_value==undefined) {
       //console.log('chech vvv out',parameter_value)
       return (message = false);
   }
   return message
}

IsNumberValid  (parameter_value: any) 
{
   let message =true;

   if (!parameter_value ||parameter_value==null || parameter_value==undefined) {
       //console.log('chech vvv out',parameter_value)
       return (message = false);
   }
   return message
}

IsStringValid  (parameter_value: number) 
{
   let message =true

   if (typeof parameter_value=='number') {
       //console.log('chech vvv out',parameter_value)
       return (message = false);
   }
   return message
}
IsValidAction  (parameter_value: string) 
{
   let message =false    
    if(parameter_value ==='insert')
    {
        return (message = true) 
    }
    if(parameter_value ==='update') 
    {
        return (message = true) 
     } 
    if(parameter_value ==='activeOrDeactive')
    { 
        return (message = true) 
    }
    
   return message
}

 ErrorMessage (message_code :any,additionalInfo :any) 
{    
    
    let message ='';
    switch (message_code) {
        case 1: 
        message=additionalInfo +  apiMessage.dIdNotNull;
        break;
      case 2:
        message=additionalInfo + 'value is not found.' ;
        break;
       ;
       case 3:
        message='Some request parameters are missing.' ;
        break;
       ;
       case 4:
        message=  apiMessage.validMSg + additionalInfo ;
        break;
       ;
       case 5:
        message=  apiMessage.validMSg + additionalInfo + ' Format' ;
        break;
       ;

       case 6:
        message=  additionalInfo.from  + ' can not be greater than to ' + additionalInfo.to ;
        break;  
        
        case 7:
            message=  'Incorect ' + additionalInfo;
            break;  
        default: 
        message='No message code found' ;
        break;

    }
    return message;
}


IsValidDateYYYYMMDDFormate(dateYYYYMMDD :any)// example date= 2023-11-20 
   {
    
    let  regexp = new RegExp(/^(((2000|2400|2800|((17|18|19|2[0-9])(0[48]|[2468][048]|[13579][26])))-02-29)|(((17|18|19|2[0-9])[0-9]{2})-02-(0[1-9]|1[0-9]|2[0-8]))|(((17|18|19|2[0-9])[0-9]{2})-(0[13578]|10|12)-(0[1-9]|[12][0-9]|3[01]))|(((17|18|19|2[0-9])[0-9]{2})-(0[469]|11)-(0[1-9]|[12][0-9]|30)))$/);
    let result= regexp.test(dateYYYYMMDD)
    if(result == false)
    {
       return false;
    }        
    const dateformat:any = Dateformats.ConvertUTCtoDateformat(dateYYYYMMDD);
    
    if(isNaN(Number(dateformat)))
    {
         return  false;
     } 
    return true;
}
}

export default new CommonMessage();