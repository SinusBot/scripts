registerPlugin({
    name: 'No Recording!',
    version: '3.0.0',
    backends: ['ts3'],
    description: 'This script will kick anyone who attempts to record.',
    author: 'SinusBot Team', // Michael Friese, Max Schmitt, Jonas Bögle
    vars: [{
        name: 'kickMessage',
        title: 'The optional kick message.',
        type: 'string',
        placeholder: 'No recording on our server!'
    }]
}, (_, config) => {
    const event = require('event')

    const kickMessage = config.kickMessage || 'No recording on our server!'

    event.on('clientRecord', client => {
        client.kickFromServer(kickMessage)
    })
})