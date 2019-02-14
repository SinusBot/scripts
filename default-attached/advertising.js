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
        placeholder: '5',
        default: 5
    }, {
        name: 'order',
        title: 'Order',
        type: 'select',
        options: [
            'line by line (default)',
            'random'
        ],
        default: '0'
    }, {
        name: 'type',
        title: 'Broadcast-Type',
        type: 'select',
        options: [
            'Channel',
            'Server'
        ],
        default: '0'
    }]
}, (_, {ads, order, type, interval}) => {
    const backend = require('backend')
    const engine = require('engine')

    ads = ads ? ads.split('\n').map(line => line.trim().replace(/\r/g, '')) : []

    if (ads.length === 0) {
        engine.log('There are no ads configured.')
        return
    }
    if (interval <= 3) {
        engine.log('The interval is too small, use a value bigger than 3 seconds.')
        return
    }

    const RANDOM = '1';
    const SERVER = '1';

    let index = -1

    setInterval(() => {
        switch (order) {
            case RANDOM:
                index = Math.floor(Math.random() * ads.length)
                break
            default:
                index = (++index % ads.length)
        }

        switch (type) {
            case SERVER:
                backend.chat(ads[index])
                break
            default:
                backend.getCurrentChannel().chat(ads[index])
        }
    }, interval * 1000)
})