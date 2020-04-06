registerPlugin({
    name: 'Welcome!',
    version: '3.0.0',
    backends: ['ts3'],
    description: 'This plugin will let the bot greet everyone.',
    author: 'SinusBot Team', // Michael Friese, Max Schmitt, Jonas Bögle
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
}, (_, { message, type }) => {
    const event = require('event')

    event.on('clientMove', ({ client, fromChannel }) => {
        let msg = message.replace('%n', client.name())
        if (!fromChannel) {
            if (type == '0') {
                client.chat(msg)
            } else {
                client.poke(msg)
            }
        }
    })
})