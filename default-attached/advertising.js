registerPlugin({
    name: 'Advertising (Text)',
    version: '3.0',
    description: 'This script will announce one of the configured lines every x seconds.',
    author: 'Michael Friese <michael@sinusbot.com>, Max Schmitt <max@schmitt.mx>',
    vars: [{
        name: 'ads',
        title: 'Ads (supports bbcode)',
        type: 'multiline',
        placeholder: 'Welcome to the best TS3-Server!'
    }, {
        name: 'interval',
        title: 'Interval (in seconds)',
        type: 'number',
        placeholder: '5'
    }, {
        name: 'order',
        title: 'Order',
        type: 'select',
        options: [
            'default (line by line)',
            'random'
        ]
    }, {
        name: 'type',
        title: 'Broadcast-Type',
        type: 'select',
        options: [
            'Channel',
            'Server'
        ]
    }]
}, (_, config) => {
    const backend = require('backend')
    const engine = require('engine')

    const ads = (config && config.ads) ? config.ads.split('\n').map(e => e.trim().replace(/\r/g, '')) : []

    let counter = 0
    if (ads.length === 0) {
        engine.log("There were no ads configured.")
        return
    }

    if (config.Interval < 3) {
        engine.log("The intervall is too small, use > 3 not to be banned from the server")
        return
    }

    setInterval(() => {
        let adIdx = counter % ads.length
        // prevent overflow of the counter
        if (counter % ads.length === 0) {
            adIdx = 0
        }
        if (config.order === 1 && ads.length > 1) {
            adIdx = Math.floor(Math.random() * ads.length)
        }
        if (config.type === 0) {
            backend.getCurrentChannel().chat(ads[adIdx])
        } else {
            backend.chat(ads[adIdx])
        }
        counter++
    }, config.interval * 1000)
})