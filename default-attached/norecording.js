registerPlugin({
    name: 'No Recording!',
    version: '2.0',
    description: 'This script will kick anyone who attempts to record.',
    author: 'Michael Friese <michael@sinusbot.com>',
    vars: [{
        name: 'kickMessage',
        title: 'The optional kick message.',
        type: 'string'
    }]
}, (_, config) => {
    const event = require('event')
    
    const kickMessage = config.kickMessage || 'No recording on our server!'

    event.on('clientRecord', ev => {
        ev.kickFromServer(kickMessage)
    })
})