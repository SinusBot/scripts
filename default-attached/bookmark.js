registerPlugin({
    name: 'Bookmarks!',
    version: '2.0.1',
    description: 'Enter .bookmark to save the current position, enter .resume to seek to the bookmarked position.',
    author: 'Michael Friese <michael@sinusbot.com> & mxschmitt <max@schmitt.mx>',
    vars: []
}, () => {
    const store = require('store')
    const media = require('media')
    const audio = require('audio')
    const event = require('event')

    const event = require("event")

    event.on("load", () => {
        //try to load the library
        const Command = require("command")
        //check if the library has been loaded successfully
        if (!Command) throw new Error("Command.js library not found! Please download Command.js and enable it to be able use this script!")

        Command.createCommand("bookmark")
            .help("saves the current position")
            .manual("saves the current position")
            .manual("can be resumed by the 'resume' command. (Seeks to the bookmarked position of the track)")
            .exec((client, args, reply) => {
                const track = media.getCurrentTrack()
                if (!track) {
                    return
                }
                const pos = audio.getTrackPosition()
                store.set(track.ID(), pos)
                reply(`Position saved for track ${track.uuid} at ${pos}ms.`)
            })

        Command.createCommand("resume")
            .help("resumes to the bookmarked position")
            .manual("resumes to the bookmarked position")
            .manual("by using the 'seek' command, it can be saved")
            .exec((client, args, reply) => {
                const track = media.getCurrentTrack()
                if (!track) {
                    return
                }
                const pos = store.get(track.ID())
                if (!pos) {
                    reply('No position found, sorry.')
                    return
                }
                audio.seek(pos)
                reply(`Resumed at ${pos}ms.`)
            })
    })
})