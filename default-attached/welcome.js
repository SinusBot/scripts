registerPlugin({
    name: 'Welcome!',
    version: '2.0',
    description: 'This plugin will let the bot greet everyone.',
    author: 'Michael Friese <michael@sinusbot.com>',
    vars: [{
        name: 'message',
        title: 'The message that should be displayed. (%n = nickname)',
        type: 'string'
    }, {
        name: 'type',
        title: 'Message-Type',
        type: 'select',
        options: [
            'Private chat',
            'Poke'
        ]
    }]
}, function (sinusbot, config) {
    var event = require('event');
    event.on('clientMove', function (ev) {
        var msg = config.message;
        msg = msg.replace(/%n/g, ev.client.name());
        if (ev.fromChannel == undefined) {
            if (config.type == 0) {
                ev.client.chat(msg);
            } else {
                ev.client.poke(msg);
            }
            return;
        }
    });
});