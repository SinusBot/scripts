registerPlugin({
    name: 'Bookmarks!',
    version: '2.0',
    description: 'Enter .bookmark to save the current position, enter .resume to seek to the bookmarked position.',
    author: 'Michael Friese <michael@sinusbot.com> & maxibanki <max@schmitt.mx>',
    vars: []
}, function (sinusbot, config) {

    var store = require('store'),
        media = require('media'),
        backend = require('backend'),
        audio = require('audio');

    var event = require('event');
    event.on('chat', function (ev) {
        ev.client.chat('Hi, ' + ev.client.name() + ', you just wrote: ' + ev.text);
    });

    event.on('chat', function (ev) {
        engine.log(ev.text);
        if (ev.text == '.bookmark') {
            engine.log("bookmark");
            var track = media.getCurrentTrack();
            if (!track) return;
            var pos = audio.getTrackPosition();
            store.set(track.ID(), pos);
            backend.getCurrentChannel().chat('Position saved for track ' + track.uuid + ' at ' + pos + 'ms.');
        }
        if (ev.text == '.resume') {
            engine.log("resume");
            var track = media.getCurrentTrack();
            if (!track) return;
            var pos = store.get(track.ID());
            if (!pos) {
                backend.getCurrentChannel().chat('No position found, sorry.');
                return;
            }
            audio.seek(pos);
            backend.getCurrentChannel().chat('Resumed at ' + pos + 'ms.');
        }
    });
});