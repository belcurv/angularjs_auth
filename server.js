/*
 * server.js
*/

(function () {
    
    'use strict';
    
    // ================================== SETUP ===================================
    var express = require('express'),
        morgan  = require('morgan'),
        jwt     = require('express-jwt'),
        cors    = require('cors'),
        path    = require('path'),
        app     = express(),
        port    = process.env.PORT || 3000;


    // ============================== CONFIGURATION ===============================
    app.use(cors());
    app.use(express.static(__dirname + '/public'));
    app.use(morgan('dev'));
    
    // JWT middleware
    var authCheck = jwt({
        secret: new Buffer('YksJDIcCehIyixKWxiPlw5080StLr6feA0NxJFS0nhUIQj6_-xY0HTfEWImrSLY8', 'base64'),  // Client secret from Auth0
        audience: 'z21JLgCKTTXPTpjhUSREflDexnHrheuz' // Client ID from Auth0
    });


    // ================================ API ROUTES ================================
    app.get('/api/public', function (req, res) {
        res.json({ message: "Hello from a public endpoint, you don't need to be authenticated to see this."});
    });
    
    app.get('/api/private', authCheck, function (req, res) { // < note middleware
        res.json({ message: "Hello from a private endpoint, you DO need to be authenticated to see this!"});
    });

    // ============================ APPLICATION ROUTES ============================
    app.get('*', function (req, res) {
        // serve the view - AngularJS handles front-end routing
        res.sendFile(path.join(__dirname, '/public/index.html'));
    });


    // =============================== START SERVER ===============================
    app.listen(port, function () {
        console.log('Server listening on port ' + port);
    });

})();