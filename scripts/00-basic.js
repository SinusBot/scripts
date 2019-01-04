// @ts-check
registerPlugin({
    name: 'Example script',
    version: '1.0.0',
    backends: ['ts3', 'discord'],
    description: 'This is a script description',
    author: 'name <email@example.com>',
    vars: []
}, (sinusbot, config) => {
    // import modules
    const engine = require('engine');
    const event = require('event');
    
    // listen for chat event
    event.on('chat', ({client, text}) => {
        engine.log(`${client.name()} wrote ${text}`);
        client.chat(`Hi ${client.name()}, you just wrote: ${text}`);
    });
});
