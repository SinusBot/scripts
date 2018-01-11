// import modules
var engine = require('engine');

// send request
sinusbot.http({
    'method': 'GET',
    'url': 'http://example.com',
    'timeout': 6000,
}, function (error, response) {

    // check if request was successfull
    if (response.statusCode != 200) {
        engine.log(error);
        return;
    }

    // success!
    engine.log(res);
});
