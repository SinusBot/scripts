registerPlugin({
    name: 'Speech Recognition Demo',
    version: '1.0',
    description: 'This is a simple script that will stop playback when you say "stop"',
    author: 'Michael Friese <michael@sinusbot.com>',
    vars: [],
    voiceCommands: ['stop']
}, function(_, config) {
    var event = require('event');
    var engine = require('engine');
    var audio = require('audio');
    var media = require('media');

    audio.setAudioReturnChannel(2);

    event.on('speech', function(ev) {
        if (ev.text == 'stop') {
            engine.log('Stopping playback on behalf of client ' + ev.client.nick());
            media.stop();
        } else {
            engine.log(ev.client.nick() + ' just said ' + ev.text);
        }
    });
});