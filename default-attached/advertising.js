registerPlugin({
    name: 'Advertising (Text)',
    version: '2.0',
    description: 'This script will announce one of the configured lines every x seconds.',
    author: 'Michael Friese <michael@sinusbot.com>',
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
    const helpers = require('helpers')

    const ads = (config && config.ads) ? config.ads.split('\n').map(e => e.trim().replace(/\r/g, '')) : []
    let ctr = -1

    setInterval(() => {
        ctr++
        if (ads.length == 0 || config.Interval < 5) return
        let ad = ctr % ads.length
        if (config.order == 1 && ads.length > 1) {
            ad = helpers.getRandom(ads.length - 1)
        }
        if (config.type == 0) {
            backend.getCurrentChannel().chat(ads[ad])
        } else {
            backend.chat(ads[ad])
        }
    }, config.interval * 1000)
})