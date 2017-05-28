var sendData = JSON.stringify({ foo: 'bar' });

sinusbot.http({
    'method': 'POST',
    'url': 'http://example.com',
    'timeout': 6000,
    'maxSize': 1024 * 1024 * 5,
    'data': sendData,
    'headers': {
        'Content-Type': 'application/json',
        'Content-Length': sendData.length
    }
}, function (error, response) {
    if (response.statusCode != 200) {
        engine.log(error);
        return;
    }
    var res;
    try {
        res = JSON.parse(response.data);
    } catch (err) {
        engine.log(err.message);
    }
    if (res === undefined) {
        engine.log("Error in JSON!");
        return;
    }
    engine.log(res);
});