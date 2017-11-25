registerPlugin({
    name: 'No Recording!',
    version: '2.0',
    description: 'This script will kick anyone who attempts to record.',
    author: 'Michael Friese <michael@sinusbot.com> & maxibanki <max@schmitt.mx>',
    vars: [{
        name: 'kickMessage',
        title: 'The optional kick message.',
        type: 'string'
    }]
}, function (sinusbot, config) {
    var engine = require('engine');
    var event = require('event'),
        kickMessage = config.kickMessage ? config.kickMessage : 'No recording on our server!';
    event.on('clientRecord', function (ev) {
        ev.kickFromServer(kickMessage)
    });
});