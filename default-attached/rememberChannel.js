registerPlugin({
    name: 'Remember Last Channel',
    version: '3.0',
    description: 'This script will remember, which channel the bot was last moved to and will set it as default channel on join.',
    author: 'Michael Friese <michael@sinusbot.com>, Max Schmitt <max@schmitt.mx>',
    vars: []
}, () => {
    const event = require('event')
    const backend = require('backend')
    const engine = require('engine')

    event.on('clientMove', ({ client, toChannel }) => {
        if (client.uniqueID() == backend.getBotClient().uniqueID()) {
            engine.setDefaultChannelID(toChannel.id())
        }
    })
})