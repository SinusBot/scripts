registerPlugin({
    name: 'AloneMode',
    version: '3.1',
    backends: ['ts3', 'discord'],
    description: 'This script will save CPU and bandwidth by stopping or muting the bot when nobody is listening anyways.',
    author: 'Michael Friese <michael@sinusbot.com>, Max Schmitt <max@schmitt.mx>',
    vars: [{
        name: 'mode',
        title: 'Mode',
        type: 'select',
        options: [
            'mute only',
            'stop playback'
        ]
    }]
}, (_, {mode}) => {
    const engine = require('engine')
    const backend = require('backend')
    const event = require('event')
    const audio = require('audio')
    const media = require('media')

    const MUTE_ONLY = '1'

    let isMuted = false
    let lastPosition = 0
    let lastTrack

    audio.setMute(false)

    event.on('clientMove', () => {
        let currentChannel = backend.getCurrentChannel()
        let clients = currentChannel ? currentChannel.getClientCount() : 0

        if (clients > 1 && isMuted) {
            isMuted = false
            engine.log('Ending AloneMode...')

            if (mode == MUTE_ONLY) {
                audio.setMute(false)
            } else {
                if (lastTrack) {
                    lastTrack.play()
                    audio.seek(lastPosition)
                    engine.log(`Seeking to ${lastPosition} of track '${lastTrack.title()}'`)
                }
            }
        } else if (clients <= 1 && audio.isPlaying()) {
            isMuted = true
            engine.log('Starting AloneMode...')
            
            if (mode == MUTE_ONLY) {
                audio.setMute(true)
            } else {
                lastPosition = audio.getTrackPosition()
                lastTrack = media.getCurrentTrack()
                engine.log(`Position ${lastPosition} saved for track '${lastTrack.title()}'`)
                media.stop()
            }
        }
    })
})
