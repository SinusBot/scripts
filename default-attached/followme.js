registerPlugin({
    name: 'Follow Me',
    version: '3.0',
    backends: ['ts3', 'discord'],
    description: 'The bot will follow the movements of any of the clients given',
    author: 'Michael Friese <michael@sinusbot.com>, Max Schmitt <max@schmitt.mx>',
    vars: [{
        name: 'clientUids',
        title: 'Comma-separated list of client-UIDs that the bot should follow',
        type: 'string'
    }]
}, (_, {clientUids}) => {
    const engine = require('engine')
    const backend = require('backend')
    const event = require('event')

    if (!clientUids) {
        engine.log('No client-UIDs set.')
        return
    }

    const uids = clientUids.trim().split(',')
    event.on('clientMove', ({ client, toChannel }) => {
        if (toChannel && uids.includes(client.uid())) {
            backend.getBotClient().moveTo(toChannel)
        }
    })
})