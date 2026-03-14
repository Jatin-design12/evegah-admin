var express = require('express');
var checksum = require('../lib/checksum');
var router = express.Router();

router.post('/response', function (req, res, next) {
    //console.log(res);
    var checksumstring = checksum.getResponseChecksumString(req.body);
    var calculatedchecksum = checksum.calculateChecksum(checksumstring);

    res.render('response', {
        data: req.body,
        isChecksumValid: calculatedchecksum.toString() === req.body.checksum.toString()
    });

    res.end();
});

module.exports = router;
