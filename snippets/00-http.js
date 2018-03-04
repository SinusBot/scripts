// import modules
var engine = require('engine');

// define data that should be sent
var sendData = JSON.stringify({ foo: 'bar' });

// send request
http({
    'method': 'POST',
    'url': 'http://example.com',
    'timeout': 6000,
    'maxSize': 1024 * 1024 * 5,
    'body': sendData,
    'headers': {
        'Content-Type': 'application/json',
        'Content-Length': sendData.length
    }
}, function (error, response) {
    
    // check if request was successfull
    if (response.statusCode != 200) {
        engine.log(error);
        return;
    }
    
    // parse JSON response
    var res;
    try {
        res = JSON.parse(response.data);
    } catch (err) {
        engine.log(err.message);
    }
    
    // check if parsing was successfull
    if (res === undefined) {
        engine.log("Error in JSON!");
        return;
    }
    
    // success!
    engine.log(res);
});
