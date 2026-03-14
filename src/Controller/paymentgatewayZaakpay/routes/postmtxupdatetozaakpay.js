var express = require('express');
var router = express.Router();
var checksum = require('../lib/checksum');
const updateurl = require('../lib/config');

router.get('/refundtxn', function (req, res, next) {
    res.render('postmtxupdatetozaakpay');
});

router.post('/refundtxn', function (req, res, next) {
    var ref_json = {
        merchantIdentifier: req.body.merchantIdentifier,
        orderDetail: {
            orderId: req.body.orderId,
            amount: req.body.amount
        },
        mode: req.body.mode,
        updateDesired: req.body.updateDesired,
        updateReason: req.body.updateReason
    };

    var fin_json = JSON.stringify(ref_json);

    var calculatedchecksum = checksum.calculateChecksum(fin_json).toString();

    var url = updateurl.merchantInfo.updateApi;

    res.render('refundtxn', {
        data: ref_json,
        checksum: calculatedchecksum,
        url: url
    });
    // res.end();
});

module.exports = router;
