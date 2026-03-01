


class Dateformats{
    constructor () {}
     getUTCdateformat() {
    let dateformat = new Date();
    return dateformat  ;    
}

 ConvertUTCtoDateformat(utcdate :any ) {
    let dateformat = new Date(utcdate);
       return dateformat ;
   }
   
   ConvertUTCtoDayformat()
   {
    const weekday = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];
    const d = new Date();
    let day = weekday[d.getUTCDay()];
    return day;
   }
  
   ConvertUTCtoDateformatWithoutTime(utcdate :any ) {
    let dateformat = new Date(utcdate);
    dateformat.setDate(dateformat.getDate())
    dateformat.setHours(0,0,0,0);
       return dateformat ;
   }

   ConvertUTCtoDateformatWithoutTimeAddEndTime(utcdate :any ) {
    let dateformat = new Date(utcdate);
    dateformat.setDate(dateformat.getDate())
    dateformat.setHours(23,59,59,999);
       return dateformat ;
   }
      
}


export default new Dateformats ();

//export { getUTCdateformat ,ConvertUTCtoDateformat};