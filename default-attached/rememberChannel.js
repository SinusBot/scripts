registerPlugin({
    name: 'Remember Last Channel',
    version: '3.0.0',
    backends: ['ts3', 'discord'],
    description: 'This script will remember, which channel the bot was last moved to and will set it as default channel on join.',
    author: 'SinusBot Team', // Michael Friese, Max Schmitt, Jonas Bögle
    vars: []
}, () => {
    const event = require('event')
    const engine = require('engine')

    event.on('clientMove', ({ client, toChannel }) => {
        if (toChannel && client.isSelf()) {
            engine.setDefaultChannelID(toChannel.id())
        }
    })
})