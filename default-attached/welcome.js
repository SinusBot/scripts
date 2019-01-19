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
}, (_, { message, type }) => {
    const event = require('event')

    event.on('clientMove', ({ client, fromChannel }) => {
        let msg = message
        msg = msg.replace(/%n/g, client.name())
        if (!fromChannel) {
            if (type == 0) {
                client.chat(msg)
            } else {
                client.poke(msg)
            }
        }
    })
})