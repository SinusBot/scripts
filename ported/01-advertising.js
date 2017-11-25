registerPlugin({
    name: 'Advertising (Text)',
    version: '2.0',
    description: 'This script will announce one of the configured lines every x seconds.',
    author: 'Michael Friese <michael@sinusbot.com> & maxibanki <max@schmitt.mx>',
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
}, function (sinusbot, config) {
    var backend = require('backend');
    var ads = (config && config.ads) ? config.ads.split('\n').map(function (e) {
        return e.trim().replace(/\r/g, '');
    }) : [];
    var ctr = -1;
    setInterval(function () {
        ctr++;
        if (ads.length == 0 || config.Interval < 5) return;
        var ad = ctr % ads.length;
        if (config.order == 1 && ads.length > 1) {
            ad = sinusbot.getRand(ads.length - 1);
        }
        if (config.type == 0) {
            backend.getCurrentChannel().chat(ads[ad]);
        } else {
            backend.chat(ads[ad]);
        }
    }, config.interval * 1000);
});