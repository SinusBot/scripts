registerPlugin({
    name: 'Bookmarks!',
    version: '3.0',
    description: 'Enter .bookmark to save the current position, enter .resume to seek to the bookmarked position.',
    author: 'Michael Friese <michael@sinusbot.com>, Max Schmitt <max@schmitt.mx>',
    vars: []
}, () => {
    const store = require('store')
    const media = require('media')
    const audio = require('audio')
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
                store.set(track.id(), pos)
                reply(`Position saved for track '${track.title()}' at ${pos} ms`)
            })

        Command.createCommand("resume")
            .help("resumes to the bookmarked position")
            .manual("resumes to the bookmarked position (use bookmark command to set)")
            .exec((client, args, reply) => {
                const track = media.getCurrentTrack()
                if (!track) {
                    return
                }
                const pos = store.get(track.id())
                if (!pos) {
                    reply('No position found, sorry.')
                    return
                }
                audio.seek(pos)
                reply(`Resumed at ${pos} ms of track '${track.title()}'`)
            })
    })
})