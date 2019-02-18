registerPlugin({
    name: 'Demo http json Script',
    version: '1.0.0',
    description: 'This example actually does nothing',
    author: 'Author <author@example.com>',
    requiredModules: ['http'], // <-- don't forget this!
    vars: []
}, function(_, config, meta) {
    // import modules
    var engine = require('engine');
    var http = require('http');

    // define data that should be sent
    var sendData = JSON.stringify({ foo: 'bar' });

    // send request
    http.simpleRequest({
        'method': 'POST',
        'url': 'https://example.com',
        'timeout': 6000,
        'body': sendData,
        'headers': {
            'Content-Type': 'application/json',
            'Content-Length': sendData.length
        }
    }, function (error, response) {
        if (error) {
            engine.log("Error: " + error);
            return;
        }
        
        if (response.statusCode != 200) {
            engine.log("HTTP Error: " + response.status);
            return;
        }
        
        // parse JSON response
        var res;
        try {
            res = JSON.parse(response.data.toString());
        } catch (err) {
            engine.log(err.message);
        }
        
        // check if parsing was successfull
        if (res === undefined) {
            engine.log("Invalid JSON.");
            return;
        }
        
        // success!
        engine.log(res);
    });
});