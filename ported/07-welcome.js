registerPlugin({
    name: 'Welcome!',
    version: '2.1',
    description: 'This plugin will let the bot greet everyone.',
    author: 'Michael Friese <michael@sinusbot.com> & maxibanki <max@schmitt.mx>',
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
    }, {
        name: 'newline',
        title: 'How new lines should be handled',
        type: 'select',
        options: [
            'normal (one message with multiple lines)',
            'multiple messages (a new message for each line)'
        ],
        // only show this when private chat is selected
        conditions: [{
            field: 'type',
            value: 0
        }]
    }]
}, function (sinusbot, config) {
    var engine = require('engine');
    var event = require('event');

    config.type = config.type || 0;
    config.newline = config.newline || 0;
    engine.saveConfig(config);

    event.on('clientMove', function (ev) {
        var msg = config.message;
        msg = msg.replace(/%n/g, ev.client.name());

        if (ev.fromChannel == undefined) {
            if (config.type == 0) {
                if (config.newline == 0) {
                    ev.client.chat(msg);
                } else {
                    msg.split('\n').forEach(function (line) {
                        ev.client.chat(line)
                    });
                }
            } else {
                ev.client.poke(msg);
            }
        }
    });
});
