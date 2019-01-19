registerPlugin({
    name: 'AloneMode',
    version: '2.0',
    description: 'This script will save CPU and bandwidth by stopping or muting the bot when nobody is listening anyways.',
    author: 'Michael Friese <michael@sinusbot.com>',
    vars: [{
        name: 'mode',
        title: 'Mode',
        type: 'select',
        options: [
            'mute only',
            'stop playback'
        ]
    }]
}, (_, { mode }) => {
    const engine = require('engine')
    const backend = require('backend')
    const event = require('event')
    const audio = require('audio')
    const media = require('media')

    let isMuted = false
    let lastPosition = 0
    let lastTitle

    audio.setMute(false)

    event.on('clientMove', () => {
        let currentChannelClientCount = backend.getCurrentChannel().getClientCount()
        if (currentChannelClientCount > 1 && isMuted) {
            isMuted = false
            engine.log('Ending AloneMode...')
            if (mode == 0) {
                audio.setMute(false)
            } else {
                lastTitle.play()
                audio.seek(lastPosition)
                engine.log(`Seeking to ${lastPosition}`)

            }
            return
        }
        if (currentChannelClientCount <= 1 && audio.isPlaying()) {
            isMuted = true
            engine.log('Starting AloneMode...')
            if (mode == 0) {
                audio.setMute(true)
            } else {
                lastPosition = getPos()
                engine.log(`Pos is ${lastPosition}`)
                lastTitle = media.getCurrentTrack()
                media.stop()
            }
        }
    })
})