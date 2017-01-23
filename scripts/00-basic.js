registerPlugin({
    name: 'Scriptname',
    version: '0.0.1',
    backends: ['ts3', 'discord'],
    engine: '>= 0.9.16',
    description: 'This a example script',
    author: 'name <foo@bar.com>',
    vars: []
}, function(sinusbot, config) {
    var engine = require('engine');
    var backend = require('backend');
    var event = require('event');

    event.on('chat', function(ev) {
        if (!ev.client.isSelf()) {
            engine.log('Somebody wrote something...');
            ev.client.chat('Hi, ' + ev.client.name() + ', you just wrote: ' + ev.text);
        }
    });

});
