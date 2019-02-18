registerPlugin({
    name: 'Demo http basic Script',
    version: '1.0.0',
    description: 'This example actually does nothing',
    author: 'Author <author@example.com>',
    requiredModules: ['http'], // <-- don't forget this!
    vars: []
}, function(_, config, meta) {
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
});