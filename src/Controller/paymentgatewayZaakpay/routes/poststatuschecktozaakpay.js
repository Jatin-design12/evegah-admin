var express = require('express');
var router = express.Router();
var checksum = require('../lib/checksum');
const checkstatusurl = require('../lib/config');


router.get('/checktxn',function(req,res,next) {
  res.render('poststatuschecktozaakpay');
});

router.post('/checktxn',function(req,res,next) {
  var json_data = {
    'merchantIdentifier': req.body.merchantIdentifier,
    'mode': req.body.mode,
    'orderDetail': {
      'orderId': req.body.orderId
    }
  }
  var json_string=JSON.stringify(json_data);
  //console.log(json_data);
  
  var calculatedchecksum = checksum.calculateChecksum(json_string).toString();
  
  var url = checkstatusurl.merchantInfo.checkStatusApi;
  


  res.render('checktxn', {
        data: json_data,
        checksum: calculatedchecksum,
        url: url
    });
  // res.end();
});
module.exports = router;
