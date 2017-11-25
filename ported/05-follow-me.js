registerPlugin({
    name: 'Follow Me',
    version: '2.0',
    description: 'The bot will follow the movements of any of the clients given',
    author: 'Michael Friese <michael@sinusbot.com> & maxibanki <max@schmitt.mx>',
    vars: [{
        name: 'clientUids',
        title: 'Comma-separated list of client-ids that the bot should follow',
        type: 'string'
    }]
}, function (sinusbot, config) {

    var engine = require('engine'),
        backend = require('backend'),
        event = require('event');


    if (!config.clientUids) {
        engine.log('Invalid clientUids');
        return;
    }

    var uids = config.clientUids.split(',');
    event.on('clientMove', function (ev) {
        if (uids.indexOf(ev.client.uniqueID()) >= 0 && ev.toChannel != null) {
            engine.log('Following ' + ev.client.name());
            backend.getBotClient().moveTo(ev.toChannel);
            return;
        }
    });

    engine.log('Follow Me initialized...');
});