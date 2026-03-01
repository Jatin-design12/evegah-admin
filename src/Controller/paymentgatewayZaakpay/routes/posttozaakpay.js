var express = require('express');
var checksum = require('../lib/checksum');
const transacturl = require('../lib/config');
var router = express.Router();

router.get('/transact',function(req,res,next) {
  res.render('test_merchant_input');
});

router.post('/transact', function(req, res, next) {
  req.body.merchantIdentifier='fb2016ffd3a64b2994a6289dc2b671a4';
  
  req.body.buyerEmail='shriram@gmail.com';
  
  var checksumstring = checksum.getChecksumString(req.body);
  
  var calculatedchecksum = checksum.calculateChecksum(checksumstring);
  
  var url = transacturl.merchantInfo.transactApi;
  //console.log(url);

  res.render('transact', {
        data: req.body,
        checksum: calculatedchecksum,
        checksumstring: checksumstring,
        url:url
    });
  
  res.end();
});

module.exports = router;
