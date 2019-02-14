registerPlugin({
    name: 'No Recording!',
    version: '3.0',
    description: 'This script will kick anyone who attempts to record.',
    author: 'Michael Friese <michael@sinusbot.com>, Max Schmitt <max@schmitt.mx>',
    vars: [{
        name: 'kickMessage',
        title: 'The optional kick message.',
        type: 'string'
    }]
}, (_, config) => {
    const event = require('event')

    const kickMessage = config.kickMessage || 'No recording on our server!'

    event.on('clientRecord', client => {
        client.kickFromServer(kickMessage)
    })
})