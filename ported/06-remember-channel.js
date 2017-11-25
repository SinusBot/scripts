registerPlugin({
    name: 'Remember Last Channel',
    version: '2.0',
    description: 'This script will remember, which channel the bot was last moved to and will set it as default channel on join.',
    author: 'Michael Friese <michael@sinusbot.com> & maxibanki <max@schmitt.mx>',
    vars: []
}, function (sinusbot, config) {
    var event = require('event');
    var backend = require('backend');
    var engine = require('engine');
    event.on('clientMove', function (ev) {
        if (ev.client.uniqueID() == backend.getBotClient().uniqueID()) {
            engine.setDefaultChannelID(ev.toChannel.ID());
        }
    });
});