// import modules
var engine = require('engine');
var http = require('http');

// send request
http.simpleRequest({
    'method': 'GET',
    'url': 'https://example.com',
    'timeout': 6000,
}, function (error, response) {
    if (error) {
        engine.log("Error: " + error);
        return;
    }
    
    if (response.statusCode != 200) {
        engine.log("HTTP Error: " + response.status);
        return;
    }
    
    // success!
    engine.log("Response: " + response.data.toString());
});
