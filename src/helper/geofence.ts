/*Distance from one point (lat and long) to second point (lat and long) */
function CalculateDistance(point1_latitude:any, point1_longitude:any,point2_latitude:any, point2_longitude:any) {
    var R = 6378.137; // Radius of earth in KM
    var p1:any =[point1_latitude,point1_longitude];
    var p2:any =[point2_latitude,point2_longitude];
    var dLat = (p2[0] * Math.PI) / 180 - (p1[0] * Math.PI) / 180;
    var dLon = (p2[1] * Math.PI) / 180 - (p1[1] * Math.PI) / 180;
    var a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos((p1[0] * Math.PI) / 180) *
            Math.cos((p2[0] * Math.PI) / 180) *
            Math.sin(dLon / 2) *
            Math.sin(dLon / 2);
    var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    var d = R * c;
    return d * 1000; // meters
  }

  const IsPointExistsInCircle= async (api_circle_center_x:any,api_circle_center_y:any,radius:any,latitude:any ,longitude:any) => {
    
       const distance = CalculateDistance(api_circle_center_x,api_circle_center_y, latitude, longitude);
    if (distance > Number(radius)) 
    {
        return false; //Not exists/Outside of circle
    }
    else{
        return true;// "Exists/Inside of circle";
    }
}

const IsPointExistsInRectangle= async (api_south_point:any,api_west_point:any,api_north_point:any,api_east_point:any,latitude:any ,longitude:any) => {
    let sw:any= [api_south_point,api_west_point];
   let ne:any= [api_north_point,api_east_point]
   if (latitude < sw[0] || latitude > ne[0] || longitude < sw[1] || longitude > ne[1]) 
 {
     return false; //Not exists/Outside of Rectangle
 }
 else{
     return true;// "Exists/Inside of Rectangle";
 }
}

const IsPointExistsInPolygon= async (api_polygon_db:any,api_polygon_multiarray:any,latitude:any ,longitude:any) => {
   let polyArray:any=[];
   const x = latitude;
   const y = longitude;

   if (api_polygon_db!=null){
    for (let rowinside of api_polygon_db) {
        let polyTemp:any=[];
        polyTemp.push(rowinside.x)
        polyTemp.push(rowinside.y)
        polyArray.push(polyTemp);
    }
   }
   else if(api_polygon_multiarray !=null)
   {
       polyArray=api_polygon_multiarray;
   }

   const bounds = PolygongetBounds(polyArray);
   // Check if point P lies within the min/max boundary of our polygon
   if (x < bounds.sw[0] || x > bounds.ne[0] || y < bounds.sw[1] || y > bounds.ne[1])
    {
      return false;// "Not exists/Outside of Polygon";
    }

    let intersect = 0;


    // Geofencing method (aka Even–odd rule)
    // See more at: https://en.wikipedia.org/wiki/Even%E2%80%93odd_rule
    // Now for each path of our polygon we'll count how many times our imaginary
    // line crosses our paths, if it crosses even number of times, our point P is
    // outside of our polygon, odd number our point is within our polygon
    for (let i = 0; i < polyArray.length; i++) {
      // Check if pont P lies on a vertices of our polygon
      if (x === polyArray[i][0] && y === polyArray[i][1]) 
       {
         //return true;
         return true // "Exists/Inside of Polygon";
       }

       let j = i !== polyArray.length - 1 ? i + 1 : 0;

       // Check if Py (y-component of our point P) is with the y-boundary of our path
       if (
           (polyArray[i][1] < polyArray[j][1] && y >= polyArray[i][1] && y <= polyArray[j][1]) ||
           (polyArray[i][1] > polyArray[j][1] && y >= polyArray[j][1] && y <= polyArray[i][1])
          ) {
           // Check if Px (x-componet of our point P) crosses our path
            let sx =
            polyArray[i][0] +
            ((polyArray[j][0] - polyArray[i][0]) * (y - polyArray[i][1])) /
              (polyArray[j][1] - polyArray[i][1]);
            if (sx >= x) intersect += 1;
           }
        }
      if( intersect % 2 === 0 )
       {
         return false;// "Not exists/Outside of Polygon"
       }
     else{
         return true;// "Exists/Inside of Polygon";
       }
 }

function PolygongetBounds(points:any) {

    let arrX = [];
    let arrY = [];
  
    for (let i in points) {
        arrX.push(points[i][0]);
        arrY.push(points[i][1]);
    }
  
    return {
        sw: [Math.min.apply(null, arrX), Math.min.apply(null, arrY)],
        ne: [Math.max.apply(null, arrX), Math.max.apply(null, arrY)],
    };
  }

export default {
    CalculateDistance,
    IsPointExistsInCircle,
    IsPointExistsInRectangle,
    IsPointExistsInPolygon
};