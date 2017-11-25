registerPlugin({
    name: 'AloneMode',
    version: '2.0',
    description: 'This script will save CPU and bandwidth by stopping or muting the bot when nobody is listening anyways.',
    author: 'Michael Friese <michael@sinusbot.com> & maxibanki <max@schmitt.mx>',
    vars: [{
        name: 'mode',
        title: 'Mode',
        type: 'select',
        options: [
            'mute only',
            'stop playback'
        ]
    }]
}, function (sinusbot, config) {
    var engine = require('engine'),
        backend = require('backend'),
        event = require('event'),
        audio = require('audio'),
        media = require('media');

    var isMuted = false,
        LastPosition = 0,
        LastTitle;

    audio.setMute(false);
    event.on('clientMove', function (ev) {
        if (backend.getCurrentChannel().getClientCount() > 1 && isMuted) {
            isMuted = false;
            engine.log('Ending AloneMode...');
            if (config.mode == 0) {
                audio.setMute(false);
            } else {
                LastTitle.play();
                audio.seek(LastPosition);
                engine.log('Seeking to ' + LastPosition);
            }
            return;
        }
        if (backend.getCurrentChannel().getClientCount() <= 1 && audio.isPlaying()) {
            isMuted = true;
            engine.log('Starting AloneMode...');
            if (config.mode == 0) {
                audio.setMute(true);
            } else {
                LastPosition = getPos();
                engine.log('Pos is ' + LastPosition);
                LastTitle = media.getCurrentTrack();
                media.stop();
            }
        }
    });
});