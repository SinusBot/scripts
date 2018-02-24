// @ts-check
registerPlugin({
    name: 'Example script',
    version: '1.0.0',
    backends: ['ts3', 'discord'],
    description: 'This is a script description',
    author: 'name <email@example.com>',
    vars: []
}, function (sinusbot, config) {
    // import modules
    var engine = require('engine');
    var event = require('event');
    
    // listen for chat event
    event.on('chat', function (ev) {
        engine.log(ev.client.name() + ' wrote ' + ev.text);
        ev.client.chat('Hi ' + ev.client.name() + ', you just wrote: ' + ev.text);
    });
});
