registerPlugin({
    name: 'Chuck Norris Speech API',
    version: '1.1',
    backends: ["ts3"],
    description: 'This is a simple script that will write you Chuck Norris jokes when you say "joke"',
    author: 'maxibanki <max@schmitt.mx> & irgendwer <Jonas@sandstorm-projects.de>',
    vars: [{
        name: 'msgtype',
        title: 'message type',
        type: 'select',
        options: ['Poke', 'Private message', 'Channel message', 'Say it']
    }],
    voiceCommands: ['joke']
}, function (sinusbot, config) {
    var engine = require('engine')
    var event = require('event')
    var audio = require('audio')
    var backend = require('backend')

    audio.setAudioReturnChannel(0x2);

    event.on('speech', function (ev) {
        if (ev.text == 'joke') {
            engine.log('Writes a joke to ' + ev.clientId);
            sinusbot.http({
                "method": "GET",
                "url": "http://api.icndb.com/jokes/random",
                "timeout": 6000,
                "headers": [{
                    "Content-Type": "application/json"
                },]
            }, function (error, response) {
                if (response.statusCode != 200) {
                    engine.log(error);
                    return;
                }
                var joke = unescape(JSON.parse(response.data).value.joke).replace('&quot;', '\"');
                engine.log("received joke: " + joke);
                switch (config.msgtype) {
                    case 0:
                        if (joke.length > 100) {
                            engine.log("over 100");
                            var joke = joke.substring(0, 96) + '...';
                        }
                        ev.client.poke(joke);
                        break;
                    case 1:
                        ev.client.chat(joke);
                    case 2:
                        backend.getCurrentChannel().chat(joke);
                        break;
                    default:
                        audio.say(joke);
                        break;
                }
            });
        } else {
            engine.log('Client ' + ev.client.name() + ' just said ' + ev.text);
        }
    });
});
