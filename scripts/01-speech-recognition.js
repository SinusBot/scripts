registerPlugin({
    name: 'Chuck Norris Speech API',
    version: '1.0',
    backends: ["ts3"],
    description: 'This is a simple script that will write you Chuck Norris jokes when you say "joke"',
    author: 'maxibanki <info@schmitt-max.com> & irgendwer <Jonas@sandstorm-projects.de>',
    vars: [{
        name: 'msgtype',
        title: 'message type',
        type: 'select',
        options: ['Poke', 'Private message', 'Channel message', 'Say it']
    }],
    voiceCommands: ['joke']
}, function(sinusbot, config) {
    sinusbot.setARC(2);
    sinusbot.on('speech', function(ev) {
        if (ev.text == 'joke') {
            sinusbot.log('Writes a joke to ' + ev.clientId);
            sinusbot.http({
                "method": "GET",
                "url": "http://api.icndb.com/jokes/random",
                "timeout": 6000,
                "headers": [{
                    "Content-Type": "application/json"
                }, ]
            }, function(error, response) {
                if (response.statusCode != 200) {
                    sinusbot.log(error);
                    return;
                }
                var joke = unescape(JSON.parse(response.data).value.joke).replace('&quot;', '\"');
                sinusbot.log("received joke: " + joke);
                if (config.msgtype == 0) {
                    if (joke.length > 100) {
                        console.log("over 100");
                        var joke = joke.substring(0, 96) + '...';
                    }
                    sinusbot.poke(ev.clientId, joke);
                } else if (config.msgtype == 1) {
                    sinusbot.chatPrivate(ev.clientId, joke);
                } else if (config.msgtype == 2) {
                    sinusbot.chatChannel(joke);
                } else {
                    sinusbot.say(joke);
                }
            });
        } else {
            sinusbot.log('Client ' + ev.clientId + ' just said ' + ev.text);
        }
    });
});