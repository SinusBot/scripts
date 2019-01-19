registerPlugin({
    name: 'Follow Me',
    version: '2.0',
    description: 'The bot will follow the movements of any of the clients given',
    author: 'Michael Friese <michael@sinusbot.com>',
    vars: [{
        name: 'clientUids',
        title: 'Comma-separated list of client-ids that the bot should follow',
        type: 'string'
    }]
}, (_, { clientUids }) => {
    const engine = require('engine')
    const backend = require('backend')
    const event = require('event')

    if (!clientUids) {
        engine.log('Invalid clientUids')
        return
    }
    const uids = clientUids.split(',')
    event.on('clientMove', ({ client, toChannel }) => {
        if (uids.includes(client.uniqueID()) && toChannel) {
            engine.log(`Following ${client.name()}`)
            backend.getBotClient().moveTo(toChannel)
        }
    })

    engine.log('Follow Me initialized...')
})