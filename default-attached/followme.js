registerPlugin({
    name: 'Follow Me',
    version: '3.0',
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

    const uids = clientUids.replace(', ', ',').split(',')
    event.on('clientMove', ({ client, toChannel }) => {
        if (uids.includes(client.uniqueID()) && toChannel) {
            backend.getBotClient().moveTo(toChannel)
        }
    })
})