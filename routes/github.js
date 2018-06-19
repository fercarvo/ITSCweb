var express = require('express');
var router = express.Router();
var { github_secret, project_refresh_scripts } = require('../util/DB.js')
const { exec } = require('child_process');

router.post('/github/webhook', function(req, res, next) {
    var github_header = req.headers['X-Hub-Signature']
    
    if (github_header && github_header === github_secret) {
        exec(project_refresh_scripts, (error, stdout, stderr) => {
            if (error) {
              console.error(`exec error: ${error}`);
              return;
            }
            console.log(`stdout: ${stdout}`);
            console.log(`stderr: ${stderr}`);
        });

        res.send('Ok')
    } else {
        res.status(401).send('Unauthorized')
    }

})