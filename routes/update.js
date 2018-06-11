var express = require('express');
var request = require('request');
var bodyParser = require('body-parser');

var router = express.Router();

var auth = `Basic ${Buffer.from('SuperUser', 'ASCII').toString('base64')}:${Buffer.from('System', 'ASCII').toString('base64')}`
var auth2 = "Basic U3VwZXJVc2VyOlN5c3RlbQ=="

var fs = require("fs");
var request = require("request");




router.post('/update', bodyParser.text({type: '*/*'}), function (req, res, next) {

    var options = { 
    method: 'POST',
    url: 'http://localhost:8088/osgi/system/console/bundles',
    headers: 
    { 'Postman-Token': '6fd9e0f2-f3ac-44f6-acd3-54c7744c5917',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:60.0) Gecko/20100101 Firefox/60.0',
        'Cache-Control': 'no-cache',
        'Authorization': 'Basic U3VwZXJVc2VyOlN5c3RlbQ==',
        //'Content-Type': 'application/x-www-form-urlencoded',
        'content-type': 'multipart/form-data; boundary=----WebKitFormBoundary7MA4YWxkTrZu0gW' },
    formData: 
    { action: 'install',
        bundlestart: 'start',
        refreshPackages: 'refresh',
        bundlestartlevel: '1',
        bundlefile: 
        { value: fs.createReadStream("C:\\Users\\ITSC04\\Documents\\plugins\\plugins\\ec.itsc.crm_1.0.0.201806111750.jar"),
            options: 
            { filename: 'C:\\Users\\ITSC04\\Documents\\plugins\\plugins\\ec.itsc.crm_1.0.0.201806111750.jar',
            contentType: null } } } };


    request(options, function (error, response, body) {
        if (error) throw new Error(error);

        //console.log(response)
        console.log("bien")
      
        console.log(" " + response.statusCode + response.statusMessage);
        res.send(" " + response.statusCode + response.statusMessage)

      });



})

router.get('/update', function (req, res, next){
    res.render('update')
})



































module.exports = router;