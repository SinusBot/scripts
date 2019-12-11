/**
 * @author Jonas Bögle
 * @license MIT
 * 
 * MIT License
 * 
 * Copyright (c) 2019 Jonas Bögle, Michael Friese
 * 
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 * 
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 * 
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 * 
 * Thanks to the following GitHub sponsors for supporting my work:
 * - Jay Vasallo
 * - Michael Friese
 * 
 * github.com/sponsors/irgendwr
 */
registerPlugin({
    name: 'SinusBot Commands',
    version: '1.0.0',
    description: 'Enables the default commands.',
    author: 'Jonas Bögle (@irgendwr)',
    engine: '>= 1.0.0',
    backends: ['ts3', 'discord'],
    // the next line is not required since beta.7
    //requiredModules: ['discord-dangerous'],
    autorun: true,
    vars: [
        {
            name: 'createSuccessReaction',
            title: 'Add a reaction to each command if it was successfull.',
            type: 'checkbox',
            default: false
        },
        {
            name: 'discord',
            title: 'Show discord settings',
            type: 'checkbox',
            default: true,
        },
        {
            name: 'url',
            title: 'URL to Webinterface (optional, for album covers in discord)',
            type: 'string',
            placeholder: 'i.e. https://sinusbot.example.com',
            conditions: [{ field: 'discord', value: true }],
        },
        {
            name: 'songInStatus',
            title: 'Show playing song in status.',
            type: 'checkbox',
            default: true,
            conditions: [{ field: 'discord', value: true }],
        },
        {
            name: 'deleteOldMessages',
            title: 'Delete previous responses if !playing command is used again',
            type: 'checkbox',
            default: true,
            conditions: [{ field: 'discord', value: true }],
        }
    ]
}, (_, config, meta) => {
    const event = require('event')
    const engine = require('engine')
    const backend = require('backend')
    const format = require('format')
    const audio = require('audio')
    const media = require('media')

    engine.log(`Loaded ${meta.name} v${meta.version} by ${meta.author}.`)

    /********* privileges *********/
    /* eslint-disable no-unused-vars */
    const LOGIN           = 1 <<  0;
    const LIST_FILE       = 1 <<  1;
    const UPLOAD_FILE     = 1 <<  2;
    const DELETE_FILE     = 1 <<  3;
    const EDIT_FILE       = 1 <<  4;
    const CREATE_PLAYLIST = 1 <<  5;
    const DELETE_PLAYLIST = 1 <<  6;
    const ADDTO_PLAYLIST  = 1 <<  7;
    const STARTSTOP       = 1 <<  8;
    const EDITUSERS       = 1 <<  9;
    const CHANGENICK      = 1 << 10;
    const BROADCAST       = 1 << 11;
    const PLAYBACK        = 1 << 12;
    const ENQUEUE         = 1 << 13;
    const ENQUEUENEXT     = 1 << 14;
    const EDITBOT         = 1 << 15;
    const EDITINSTANCE    = 1 << 16;
    /* eslint-enable no-unused-vars */

    const ERROR_PREFIX = '❌ ';
    const WARNING_PREFIX = '⚠ ';
    const SUCCESS_PREFIX = '✔ ';
    const USAGE_PREFIX = ERROR_PREFIX + 'Usage: ';

    const sinusbotURL = config.url;
    const REACTION_PREV = '⏮';
    const REACTION_PLAYPAUSE = '⏯';
    const REACTION_NEXT = '⏭';
    const REACTION_SUCCESS = '✅';

    // for join/leave
    const ERROR_BOT_NULL = ERROR_PREFIX+'Unable to change channel.\nTry to set a *Default Channel* in the webinterface and click save.'
    let bot = backend.getBotClient();

    /** @type {object[]} */
    let lastEmbeds = [];

    if (config.discord && engine.getBackend() != 'discord') {
        // hide discord-only settings if backend is not discord
        config.discord = false;
        engine.saveConfig(config);
    }

    event.on('load', () => {
        const command = require('command');
        if (!command) {
            engine.log('command.js library not found! Please download command.js and enable it to be able use this script!');
            return;
        }
        
        command.createCommand('register')
        .addArgument(command.createArgument('string').setName('username'))
        .help('Register a new user')
        .manual('Registers a new user bound to the Account you are using. This account has no privileges by default but can be edited by the bot administrators.')
        .exec((client, args, reply, ev) => {
            if (!engine.registrationEnabled()) {
                reply('Registration is disabled.');
                return;
            }

            // print syntax if no username given
            if (!args.username) {
                reply(USAGE_PREFIX + 'register <username>');
                return;
            }

            if (engine.getUserByName(args.username)) {
                reply(ERROR_PREFIX + 'This username already exists.');
                return;
            }

            // check if client already has a user
            let user = getUserByUid(client.uid());
            if (user) {
                reply(ERROR_PREFIX + `You already have a user with the name "${user.name()}".`);
                return;
            }

            // create user
            let newUser = engine.addUser(args.username);
            if (!newUser) {
                reply(ERROR_PREFIX + 'Unable to create user, try another username.');
                return;
            }

            if (!newUser.setUid(client.uid())) {
                newUser.delete()
                reply(ERROR_PREFIX + 'Unable to assign uid to user.');
                return;
            }
            reply(SUCCESS_PREFIX + 'Registered a user with the given name.\nThis account has no privileges by default but can be edited by the bot administrators.');
            successReaction(ev, reply);
        });
        
        command.createCommand('password')
        .alias('pass')
        .addArgument(command.createArgument('rest').setName('value'))
        .help('Change your password')
        .manual('Changes your password to <value>.')
        .checkPermission(client => getUserByUid(client.uid()))
        .exec((client, args, reply, ev) => {
            // print syntax if no value given
            if (!args.value) {
                reply(USAGE_PREFIX + 'password <value>\n'+ WARNING_PREFIX + 'Don\'t use this command in a public channel.');
                return;
            }

            if (ev.mode !== 1) {
                reply(WARNING_PREFIX + 'Don\'t use this command in a public channel.');
                return;
            }

            let user = getUserByUid(client.uid());
            if (!user) {
                reply(ERROR_PREFIX + `You don't have a user-account. Use ${format.bold('!register')} to create one.`);
                return;
            }

            // set password
            if (!user.setPassword(args.value)) {
                reply(ERROR_PREFIX + 'Unable to set password.');
                return;
            }
            reply(SUCCESS_PREFIX + 'Changed your password.');
            successReaction(ev, reply);
        });

        command.createCommand('whoami')
        .help('Show user identities')
        .manual('Shows user identities matching your ID/groups.')
        .exec((client, args, reply, ev) => {
            let users = getUsersByClient(client);
            if (users && users.length != 0) {
                reply(`You match the following users: ${users.map(user => user.name()).join(", ")}.`);
            } else {
                reply("You don't match any users.");
            }
            successReaction(ev, reply);
        });

        if (engine.getBackend() == 'discord') {
            command.createCommand('playing')
            .help('Show what\'s currently playing')
            .manual('Show what\'s currently playing')
            .exec((client, args, reply, ev) => {
                if (!audio.isPlaying()) {
                    return reply('There is nothing playing at the moment.');
                }

                backend.extended().createMessage(ev.channel.id(), getPlayingEmbed(), (err, res) => {
                    if (err) return engine.log(err);
                    if (!res) return engine.log('Error: empty response');

                    const {id, channel_id} = JSON.parse(res);

                    // messages that should be deleted
                    let deleteMsg = [];
                    const msgId = ev.message ? ev.message.ID() : null;
                    const index = lastEmbeds.findIndex(embed => embed.channelId == channel_id);
                    if (index !== -1) {
                        if (config.deleteOldMessages) {
                            // delete previous embed
                            deleteMsg.push(lastEmbeds[index].messageId);
                            // delete previous command from user
                            if (lastEmbeds[index].messageId) {
                                deleteMsg.push(lastEmbeds[index].invokeMessageId);
                            }
                        }
                        // save new embed
                        lastEmbeds[index].messageId = id;
                        lastEmbeds[index].invokeMessageId = msgId;
                    } else {
                        // save new embed
                        lastEmbeds.push({
                            channelId: channel_id,
                            messageId: id,
                            invokeMessageId: msgId
                        });
                    }

                    deleteMessages(channel_id, deleteMsg);
                    
                    wait(1000)
                    // create reaction controls
                    .then(() => createReaction(channel_id, id, REACTION_PREV))
                    .then(() => wait(150))
                    .then(() => createReaction(channel_id, id, REACTION_PLAYPAUSE))
                    .then(() => wait(150))
                    .then(() => createReaction(channel_id, id, REACTION_NEXT));
                });
                successReaction(ev, reply);
            });
        } else {
            command.createCommand('playing')
            .help('Show what\'s currently playing')
            .manual('Show what\'s currently playing')
            .exec((client, args, reply, ev) => {
                if (!audio.isPlaying()) {
                    successReaction(ev, reply);
                    return reply('There is nothing playing at the moment.');
                }

                reply(formatTrack(media.getCurrentTrack()));
                successReaction(ev, reply);
            });
        }

        command.createCommand('next')
        .help('Play the next track')
        .manual('Plays the next track (only when a playlist or queue is active).')
        .checkPermission(requirePrivileges(PLAYBACK))
        .exec((client, args, reply, ev) => {
            media.playNext();
            successReaction(ev, reply);
        });

        command.createCommand('prev')
        .alias('previous')
        .help('Play the previous track')
        .manual('Plays the previous track (only when a playlistis active).')
        .checkPermission(requirePrivileges(PLAYBACK))
        .exec((client, args, reply, ev) => {
            media.playPrevious();
            successReaction(ev, reply);
        });

        command.createCommand('search')
        .alias('s')
        .addArgument(command.createArgument('rest').setName('searchstring'))
        .help('Search for tracks')
        .manual('Searches for tracks, returns 20 results at most.')
        .checkPermission(requirePrivileges(PLAYBACK, ENQUEUE))
        .exec((client, args, reply, ev) => {
            // print syntax if no searchstring given
            if (!args.searchstring) {
                reply(USAGE_PREFIX + 'search <searchstring>');
                return;
            }

            const tracks = media.search(args.searchstring);
            if (tracks.length == 0) {
                reply('Sorry, nothing found.');
                successReaction(ev, reply);
                return;
            }

            const response = tracks.map(formatTrack).join("\n")
            reply(response);
            successReaction(ev, reply);
        });

        command.createCommand('play')
        .alias('p')
        .addArgument(command.createArgument('rest').setName('idORsearchstring', 'searchstring / uuid'))
        .help('Play a track by its id or name')
        .manual('Plays a track by its id or searches for a track and plays the first match.')
        .checkPermission(requirePrivileges(PLAYBACK))
        .exec((client, args, reply, ev) => {
            // print syntax if no idORsearchstring given
            if (!args.idORsearchstring) {
                reply(USAGE_PREFIX + 'play <searchstring / uuid>');
                return;
            }

            let track = media.getTrackByID(args.idORsearchstring);
            if (!track) {
                let tracks = media.search(args.idORsearchstring);
                if (tracks.length > 0) {
                    track = tracks[0];
                } else {
                    reply('Sorry, nothing found.');
                    return;
                }
            }

            track.play();
            reply(`Playing ${formatTrack(track)}`);
            successReaction(ev, reply);
        });

        command.createCommand('playlist')
        .addArgument(command.createArgument('rest').setName('playlistname'))
        .help('Start playing back the playlist <playlistname>')
        .manual('starts playing back the playlist <playlistname>.')
        .checkPermission(requirePrivileges(PLAYBACK))
        .exec((client, args, reply, ev) => {
            // print syntax if no playlistname given
            if (!args.playlistname) {
                reply(USAGE_PREFIX + 'playlist <playlistname>');
                return;
            }

            const match = media.getPlaylists().find(playlist => {
                // case insensitive equals
                return playlist.name() == args.playlistname || playlist.name().localeCompare(args.playlistname, undefined, { sensitivity: 'accent' }) === 0
            });

            if (!match) {
                reply('Sorry, no matching playlist found.');
                successReaction(ev, reply);
                return;
            }
            
            media.playlistPlayByID(match, 0);

            successReaction(ev, reply);
        });

        command.createCommand('queue')
        .alias('q')
        .addArgument(command.createArgument('rest').setName('idORsearchstring', 'searchstring / uuid').optional(true))
        .help('Enqueue a track or resume queue')
        .manual('Enqueue a track by its id or search for a track and enqueue the first match. When no track is provided it wil resume the queue.')
        .checkPermission(requirePrivileges(PLAYBACK, ENQUEUE))
        .exec((client, args, reply, ev) => {
            if (!args.idORsearchstring) {
                if (!audio.isPlaying()) {
                    media.playQueueNext();
                }
                return;
            }

            let track = media.getTrackByID(args.idORsearchstring);
            if (!track) {
                const tracks = media.search(args.idORsearchstring);
                if (tracks.length > 0) {
                    track = tracks[0];
                } else {
                    reply('Sorry, nothing found.');
                    return;
                }
            }

            track.enqueue();
            reply(`Added ${formatTrack(track)} to the queue`);
            successReaction(ev, reply);
        });

        command.createCommand('queuenext')
        .alias('qnext', 'qn')
        .addArgument(command.createArgument('rest').setName('idORsearchstring', 'searchstring / uuid'))
        .help('Prepends a track to the queue')
        .manual('Prepends a track by its id or searches for a track and prepends the first match to the queue.')
        .checkPermission(requirePrivileges(ENQUEUENEXT))
        .exec((client, args, reply, ev) => {
            // print syntax if no idORsearchstring given
            if (!args.idORsearchstring) {
                reply(USAGE_PREFIX + 'queuenext <searchstring / uuid>');
                return;
            }

            let track = media.getTrackByID(args.idORsearchstring);
            if (!track) {
                const tracks = media.search(args.idORsearchstring);
                if (tracks.length > 0) {
                    track = tracks[0];
                } else {
                    reply('Sorry, nothing found.');
                    return;
                }
            }

            track.enqueue();
            reply(`Added ${formatTrack(track)} to the queue`);
            successReaction(ev, reply);
        });

        command.createCommand('stop')
        .help('Stop playback')
        .manual('Stops playback.')
        .checkPermission(requirePrivileges(PLAYBACK))
        .exec((client, args, reply, ev) => {
            media.stop();
            successReaction(ev, reply);
        });

        command.createCommand('!stop')
        .help('Stop playback and remove idle-track')
        .manual('Stops playback and removes idle-track.')
        .checkPermission(requirePrivileges(PLAYBACK|EDITBOT))
        .exec((client, args, reply, ev) => {
            media.stop();
            media.clearIdleTrack();
            successReaction(ev, reply);
        });

        command.createCommand('volume')
        .alias('vol')
        .addArgument(command.createArgument('string').setName('value'))
        .help('Change the volume')
        .manual('Changes the volume.')
        .checkPermission(requirePrivileges(PLAYBACK))
        .exec((client, args, reply, ev) => {
            let value = args.value;
            let volume = audio.getVolume();

            switch (value) {
            case 'up':
                volume += 10;
                break;
            case 'dn':
            case 'down':
                volume -= 10;
                break;
            default:
                value = parseInt(value, 10);
                if (value >= 0 && value <= 100) {
                    volume = value;
                } else {
                    reply(USAGE_PREFIX + 'volume <up|down|dn|0-100>');
                    return;
                }
            }
            
            if (volume < 0) {
                volume = 0;
            } else if (volume > 100) {
                volume = 100;
            }

            audio.setVolume(volume);
            successReaction(ev, reply);
        });

        command.createCommand('stream')
        .addArgument(command.createArgument('string').setName('url'))
        .help('Stream a url')
        .manual('Streams from <url>; this may be http-streams like shoutcast / icecast or just remote soundfiles.')
        .checkPermission(requirePrivileges(PLAYBACK))
        .exec((client, args, reply, ev) => {
            // print syntax if no url given
            if (!args.url) {
                reply(USAGE_PREFIX + 'stream <url>');
                return;
            }

            if (!media.playURL(stripURL(args.url))) {
                reply(ERROR_PREFIX + 'Invalid URL.');
                return;
            }
            successReaction(ev, reply);
        });

        command.createCommand('say')
        .addArgument(command.createArgument('rest').setName('text'))
        .help('Say a text via TTS')
        .manual('Uses text-to-speech (if configured) to say the given text.')
        .checkPermission(requirePrivileges(PLAYBACK))
        .exec((client, args, reply, ev) => {
            // print syntax if no text given
            if (!args.text) {
                reply(USAGE_PREFIX + 'say <text>');
                return;
            }

            audio.say(args.text);
            successReaction(ev, reply);
        });

        command.createCommand('sayex')
        .addArgument(command.createArgument('string').setName('locale'))
        .addArgument(command.createArgument('rest').setName('text'))
        .help('Say a text via TTS with given locale')
        .manual('Uses text-to-speech (if configured) to say the given text with a given locale.')
        .checkPermission(requirePrivileges(PLAYBACK))
        .exec((client, args, reply, ev) => {
            // print syntax if no locale/text given
            if (!args.locale || !args.text) {
                reply(USAGE_PREFIX + 'sayex <locale> <text>');
                return;
            }

            audio.say(args.text, args.locale);
            successReaction(ev, reply);
        });

        command.createCommand('ttsurl')
        .addArgument(command.createArgument('string').setName('url'))
        .help('Set the TTS url.')
        .manual('Sets the TTS url.')
        .checkPermission(requirePrivileges(EDITBOT))
        .exec((client, args, reply, ev) => {
            // print syntax if no url given
            if (!args.url) {
                reply(USAGE_PREFIX + 'ttsurl <url>');
                return;
            }

            audio.setTTSURL(stripURL(args.url));
            successReaction(ev, reply);
        });

        command.createCommand('ttslocale')
        .addArgument(command.createArgument('string').setName('locale'))
        .help('Set the TTS locale.')
        .manual('Sets the TTS locale.')
        .checkPermission(requirePrivileges(EDITBOT))
        .exec((client, args, reply, ev) => {
            // print syntax if no locale given
            if (!args.locale) {
                reply(USAGE_PREFIX + 'ttslocale <locale>');
                return;
            }

            audio.setTTSDefaultLocale(args.locale);
            successReaction(ev, reply);
        });

        command.createCommand('yt')
        .addArgument(command.createArgument('string').setName('url'))
        .help('Play <url> via youtube-dl')
        .manual('Plays <url> via external youtube-dl (if enabled); beware: the file will be downloaded first and played back afterwards, so there might be a slight delay before playback starts.')
        .checkPermission(requirePrivileges(PLAYBACK))
        .exec((client, args, reply, ev) => {
            // print syntax if no url given
            if (!args.url) {
                reply(USAGE_PREFIX + 'yt <url>');
                return;
            }

            if (!media.yt(stripURL(args.url))) {
                reply(ERROR_PREFIX + 'Invalid URL.');
                return;
            }
            successReaction(ev, reply);
        });

        command.createCommand('ytdl')
        .addArgument(command.createArgument('string').setName('url'))
        .help('Download and play <url> via youtube-dl')
        .manual('Plays <url> via external youtube-dl (if enabled); beware: the file will be downloaded first and played back afterwards, so there might be a slight delay before playback starts; additionally, the file will be stored.')
        .checkPermission(requirePrivileges(PLAYBACK|UPLOAD_FILE))
        .exec((client, args, reply, ev) => {
            // print syntax if no url given
            if (!args.url) {
                reply(USAGE_PREFIX + 'ytdl <url>');
                return;
            }

            if (!media.ytdl(stripURL(args.url), true)) {
                reply(ERROR_PREFIX + 'Invalid URL.');
                return;
            }
            successReaction(ev, reply);
        });

        command.createCommand('qyt')
        .addArgument(command.createArgument('string').setName('url'))
        .help('Enqueue <url> via youtube-dl')
        .manual('Enqueues <url> via external youtube-dl (if enabled); beware: the file will be downloaded first and played back afterwards, so there might be a slight delay before playback starts.')
        .checkPermission(requirePrivileges(PLAYBACK, ENQUEUE))
        .exec((client, args, reply, ev) => {
            // print syntax if no url given
            if (!args.url) {
                reply(USAGE_PREFIX + 'qyt <url>');
                return;
            }

            if (!media.enqueueYt(stripURL(args.url))) {
                reply(ERROR_PREFIX + 'Invalid URL.');
                return;
            }
            successReaction(ev, reply);
        });

        command.createCommand('qytdl')
        .addArgument(command.createArgument('string').setName('url'))
        .help('Download and enqueue <url> via youtube-dl')
        .manual('Enqueues <url> via external youtube-dl (if enabled); beware: the file will be downloaded first and played back afterwards, so there might be a slight delay before playback starts; additionally, the file will be stored.')
        .checkPermission(requirePrivileges(PLAYBACK|UPLOAD_FILE, ENQUEUE|UPLOAD_FILE))
        .exec((client, args, reply, ev) => {
            // print syntax if no url given
            if (!args.url) {
                reply(USAGE_PREFIX + 'qytdl <url>');
                return;
            }

            if (!media.enqueueYtdl(stripURL(args.url))) {
                reply(ERROR_PREFIX + 'Invalid URL.');
                return;
            }
            successReaction(ev, reply);
        });

        command.createCommand('shuffle')
        .help('Toggle shuffle')
        .manual('Toggles shuffle.')
        .checkPermission(requirePrivileges(PLAYBACK))
        .exec((client, args, reply, ev) => {
            audio.setShuffle(!audio.isShuffle());
            reply(SUCCESS_PREFIX + `Shuffle is now ${audio.isShuffle() ? 'en' : 'dis'}abled.`);
            successReaction(ev, reply);
        });

        command.createCommand('repeat')
        .help('Toggle repeat')
        .manual('Toggles repeat.')
        .checkPermission(requirePrivileges(PLAYBACK))
        .exec((client, args, reply, ev) => {
            audio.setRepeat(!audio.isRepeat());
            reply(SUCCESS_PREFIX + `Repeat is now ${audio.isRepeat() ? 'en' : 'dis'}abled.`);
            successReaction(ev, reply);
        });

        if (engine.getBackend() == 'ts3') {
            command.createCommand('sub')
            .help('Subscribe to bot')
            .manual('Subscribes to the bot. (subscription transfer-mode only)')
            .checkPermission(() => engine.isSubscriptionMode())
            .exec((client, args, reply, ev) => {
                if (!engine.isSubscriptionMode()) {
                    reply(ERROR_PREFIX + 'This command only works if Transmit-Mode is set to Subscription.');
                    return;
                }
                client.subscribe(true);
                successReaction(ev, reply);
            });

            command.createCommand('unsub')
            .help('Unsubscribe from bot')
            .manual('Unsubscribes from the bot. (subscription transfer-mode only)')
            .checkPermission(() => engine.isSubscriptionMode())
            .exec((client, args, reply, ev) => {
                if (!engine.isSubscriptionMode()) {
                    reply(ERROR_PREFIX + 'This command only works if Transmit-Mode is set to Subscription.');
                    return;
                }
                client.subscribe(false);
                successReaction(ev, reply);
            });

            command.createCommand('subchan')
            .help('Add subscription for channel')
            .manual('Adds subscription for the channel the user is currently in. (subscription transfer-mode only)')
            .checkPermission(client => requirePrivileges(EDITBOT)(client) && engine.isSubscriptionMode())
            .exec((client, args, reply, ev) => {
                if (!engine.isSubscriptionMode()) {
                    reply(ERROR_PREFIX + 'This command only works if Transmit-Mode is set to Subscription.');
                    return;
                }
                client.getChannels()[0].subscribe(true);
                successReaction(ev, reply);
            });

            command.createCommand('unsubchan')
            .help('Remove subscription for channel')
            .manual('Removes subscription for the channel the user is currently in. (subscription transfer-mode only)')
            .checkPermission(client => requirePrivileges(EDITBOT)(client) && engine.isSubscriptionMode())
            .exec((client, args, reply, ev) => {
                if (!engine.isSubscriptionMode()) {
                    reply(ERROR_PREFIX + 'This command only works if Transmit-Mode is set to Subscription.');
                    return;
                }
                client.getChannels()[0].subscribe(false);
                successReaction(ev, reply);
            });

            command.createCommand('mode')
            .addArgument(command.createArgument('string').setName('mode'))
            .help('Change Transmit-Mode')
            .manual('Changes Transmit-Mode; 0 = to channel, 1 = subscription mode')
            .checkPermission(requirePrivileges(EDITBOT))
            .exec((client, args, reply, ev) => {
                let mode = args.mode;
                if (typeof mode === 'string') {
                    mode = mode.toLowerCase();
                }

                switch (mode) {
                case "0":
                case "chan":
                case "channel":
                    engine.setSubscriptionMode(false);
                    reply(SUCCESS_PREFIX + 'Transmit-Mode is now set to Channel (default).');
                    successReaction(ev, reply);
                    break;
                case "1":
                case "sub":
                case "subscription":
                    engine.setSubscriptionMode(true);
                    reply(SUCCESS_PREFIX + 'Transmit-Mode is now set to Subscription.');
                    successReaction(ev, reply);
                    break;
                default:
                    reply(`Transmit-Mode is currently set to ${engine.isSubscriptionMode() ? 'Subscription' : 'Channel (default)'}.\n` + USAGE_PREFIX + 'mode <0|chan(nel)|1|sub(scription)>');
                }
            });
        }

        command.createCommand('registration')
        .addArgument(command.createArgument('string').setName('value'))
        .help('Enable / disable user registration via chat')
        .manual('Enables / disables user registration via chat. Value should be either `enable` or `disable`.')
        .checkPermission(requirePrivileges(EDITBOT))
        .exec((client, args, reply, ev) => {
            switch (args.value) {
            case "enable":
                engine.enableRegistration();
                reply(SUCCESS_PREFIX + 'Registration is now enabled.');
                successReaction(ev, reply);
                break;
            case "disable":
                engine.disableRegistration();
                reply(SUCCESS_PREFIX + 'Registration is now disabled.');
                successReaction(ev, reply);
                break;
            default:
                reply(`Registartion is currently ${engine.registrationEnabled() ? 'en' : 'dis'}abled.\n` + USAGE_PREFIX + 'registration <enable|disable>');
            }
        });

        command.createCommand('prefix')
        .addArgument(command.createArgument('string').setName('prefix'))
        .help('Change command prefix')
        .manual('Changes the prefix for all core commands to <new prefix>, default is "!".')
        .checkPermission(requirePrivileges(EDITBOT))
        .exec((client, args, reply, ev) => {
            // print syntax if no prefix given
            if (!args.prefix) {
                reply(USAGE_PREFIX + 'prefix <new prefix>');
                return;
            }

            engine.setCommandPrefix(args.prefix);
            reply(SUCCESS_PREFIX + 'New prefix: ' + args.prefix);
            successReaction(ev, reply);
        });

        command.createCommand('ping')
        .help('responds with "PONG"')
        .exec((client, args, reply, ev) => {
            reply(`PONG`);
            successReaction(ev, reply);
        });

        command.createCommand('version')
        .help('Show version')
        .manual('Shows the SinusBot version.')
        .checkPermission(requirePrivileges(EDITBOT))
        .exec((client, args, reply, ev) => {
            reply(`SinusBot v${engine.version()}\nsinusbot-commands.js v${meta.version}\ncommand.js v${command.getVersion()}`);
            successReaction(ev, reply);
        });

        command.createCommand('reload')
        .help('Reload scripts')
        .manual('Reloads scripts.\nPlease Note: New scripts require a complete sinusbot restart.')
        .checkPermission(requirePrivileges(EDITBOT))
        .exec((client, args, reply, ev) => {
            reply('reloading...');
            let success = engine.reloadScripts();
            if (success) {
                reply(SUCCESS_PREFIX + `Scripts reloaded.\nNew scripts require a complete sinusbot restart.`);
                successReaction(ev, reply);
            } else {
                reply('Unable to reload scripts. Did you allow it in your `config.ini`?');
            }
        });
        
        command.createCommand('join')
        .help('Move the SinusBot to your channel')
        .manual('Moves the SinusBot into your channel.')
        .checkPermission(requirePrivileges(STARTSTOP))
        .exec((client, args, reply, ev) => {
            var channel = client.getChannels()[0]
            if (!channel) {
                return reply(ERROR_PREFIX+'I\'m unable to join your channel :(')
            }

            bot = backend.getBotClient() || bot
            if (!bot) {
                return reply(ERROR_BOT_NULL)
            }
            bot.moveTo(channel)
            successReaction(ev, reply);
        });

        if (engine.getBackend() == 'discord') {
            command.createCommand('leave')
            .help('Disconnect the SinusBot')
            .manual('Disconnects the SinusBot from the current voice channel.')
            .checkPermission(requirePrivileges(STARTSTOP))
            .exec((client, args, reply, ev) => {
                bot = backend.getBotClient() || bot
                if (!bot) {
                    return reply(ERROR_BOT_NULL)
                }
                
                bot.moveTo('')
                successReaction(ev, reply);
            });
        }
    });

    /********** !playing stuff for discord **********/
    if (engine.getBackend() == 'discord') {
        event.on('discord:MESSAGE_REACTION_ADD', ev => {
            let ename = ev.emoji.name;
            // remove 0xefb88f aka. "VARIATION SELECTOR-16" (no idea why discord puts that at the end)
            if (ename.endsWith('\ufe0f')) {
                ename = ename.slice(0, -1);
            }
            const emoji = ev.emoji.id ? `${ename}:${ev.emoji.id}` : ename;

            // ignore reactions that are not controls
            if (![REACTION_PREV, REACTION_PLAYPAUSE, REACTION_NEXT].includes(emoji)) return;

            // ignore reactions from the bot itself
            if (backend.getBotClientID().endsWith(ev.user_id)) return;

            // get user via id
            const client = backend.getClientByID(ev.guild_id ? `${ev.guild_id}/${ev.user_id}` : ev.user_id);

            // ignore if no matching user found or reaction from the bot itself
            if (!client || client.isSelf()) return;

            let callback = () => {
                // delete the rection
                deleteUserReaction(ev.channel_id, ev.message_id, ev.user_id, emoji);

                // check if user has the 'playback' permission
                if (!requirePrivileges(PLAYBACK)(client)) {
                    engine.log(`${client.nick()} is missing playback permissions for reaction controls`);
                    client.chat(ERROR_PREFIX + 'You need the playback permission to use reaction controls');
                    return;
                }

                const track = media.getCurrentTrack();

                switch (emoji) {
                case REACTION_PREV:
                    // ignore if nothing is playing
                    if (!audio.isPlaying()) return;

                    if (media.getQueue().length !== 0) {
                        // start from beginning if we're playing queue
                        audio.seek(0);
                    } else {
                        // try prev (doesn't work for queue or folder)
                        media.playPrevious();

                        // fallback: start from beginning if there is no previous track
                        if (!audio.isPlaying()) {
                            if (track) track.play();
                        }
                    }
                    break;
                case REACTION_PLAYPAUSE:
                    if (audio.isPlaying()) {
                        media.stop();
                    } else {
                        if (!track) return;
                        const pos = audio.getTrackPosition();

                        if (pos && pos < (track.duration() - 1000 /* milliseconds */)) {
                            // continue playing at last pos
                            audio.setMute(true);
                            track.play();
                            audio.seek(pos);
                            audio.setMute(false);
                        } else {
                            // or start from beginning if it already ended
                            track.play();
                        }
                    }
                    break;
                case REACTION_NEXT:
                    if (audio.isPlaying()) {
                        media.playNext();
                    } else {
                        // is something in queue?
                        if (media.getQueue().length !== 0) {
                            // resume queue
                            media.playQueueNext();
                        }
                    }
                }
            };

            // was reaction added to previous response?
            if (lastEmbeds.some(embed => embed.messageId == ev.message_id)) {
                callback();
                return;
            }

            getMessage(ev.channel_id, ev.message_id).then(msg => {
                // was reaction added to previous response of the bot?
                if (backend.getBotClientID().endsWith(msg.author.id)) {
                    callback();
                }
            })
        });

        /**
         * Called when track or it's info changes
         * @param {Track} track
         */
        const onChange = track => {
            if (config.songInStatus) {
                const prefix = '🎵 ';
                const suffix = ' 🎵';

                // set track info as status
                backend.extended().setStatus({
                    game: {
                        name: prefix + formatTrack(track) + suffix,
                        type: 2, // => 0 (game), 1 (streaming), 2 (listening)
                    },
                    status: "online",
                    afk: false
                });
            }

            // update embeds
            lastEmbeds.forEach(async embed => {
                await editMessage(embed.channelId, embed.messageId, getPlayingEmbed()).then(() => wait(100));
            });
        };

        event.on('track', onChange);
        event.on('trackInfo', onChange);
        event.on('trackEnd', () => {
            if (!config.songInStatus) {
                return;
            }
            backend.getBotClient().setDescription('');
        });
    }

    /**
     * Returns embed for current track
     */
    function getPlayingEmbed() {
        let track = media.getCurrentTrack();
        let album = track.album();
        let duration = track.duration();

        let fields = [];
        fields.push({
            name: "Duration",
            value: duration ? timestamp(duration) : 'stream',
            inline: true
        });
        if (album) {
            fields.push({
                name: "Album",
                value: album,
                inline: true
            });
        }

        return {
            embed: {
                title: formatTrack(track),
                url: sinusbotURL ? sinusbotURL : null,
                color: 0xe13438,
                thumbnail: {
                    url: sinusbotURL && track.thumbnail() ? `${sinusbotURL}/cache/${track.thumbnail()}` : null
                },
                fields: fields,
                footer: {
                    icon_url: "https://sinusbot.github.io/logo.png",
                    text: "SinusBot"
                }
            }
        };
    }


    /********** helper functions **********/

    /**
     * Returns the first user with a given UID.
     *
     * @param {string} uid UID of the client
     * @returns {User} first user with given uid
     */
    function getUserByUid(uid) {
        return engine.getUsers().find(user => user.tsUid() === uid)
    }

    /**
     * Returns alls users that match the clients UID and ServerGroups.
     *
     * @param {Client} client
     * @returns {User[]} Users that match the clients UID and ServerGroups.
     */
    function getUsersByClient(client) {
        return engine.getUsers().filter(user =>
            // does the UID match?
            client.uid() == user.uid() ||
            // does a group ID match?
            client.getServerGroups().map(group => group.id()).includes(user.groupId()) ||
            // group ID '-1' matches everyone
            user.groupId() == '-1'
        );
    }

    /**
     * Returns a function that checks if a given user has all of the required privileges.
     * @param {...number} privileges If at least one privilege matches the returned function will return true.
     */
    function requirePrivileges(...privileges) {
        return (/** @type {Client} */ client) => {
            // check if at least one user has the required privileges
            return getUsersByClient(client).some(user => {
                // check if at least one privilege is found
                return privileges.some(priv => {
                    return ((user.privileges()|user.instancePrivileges()) & priv) === priv;
                });
            });
        };
    }

    // /**
    //  * Returns a formatted string from a track.
    //  *
    //  * @param {Track} track
    //  * @returns {string} formatted string
    //  */
    // function formatTrackWithID(track) {
    //     return `${format.code(track.id())} ${formatTrack(track)}`;
    // }

    /**
     * Returns a formatted string from a track.
     *
     * @param {Track} track
     * @returns {string} formatted string
     */
    function formatTrack(track) {
        let title = track.tempTitle() || track.title();
        let artist = track.tempArtist() || track.artist();
        return artist ? `${artist} - ${title}` : title;
    }

    /**
     * Removes TeamSpeaks URL bb-code or Discords < > from a given string.
     *
     * @param {string} str
     * @returns {string} str without [URL] [/URL] and < >
     */
    function stripURL(str) {
        // don't handle non-strings, return as provided
        if (typeof str !== 'string') return str;

        // remove surrounding [URL] [/URL] tags
        let match = str.match(/\[URL\](.+)\[\/URL\]/i);
        if (match && match.length >= 2) {
            return match[1];
        }

        // remove surrounding < >
        match = str.match(/<(.+)>/);
        if (match && match.length >= 2) {
            return match[1];
        }

        // if nothing matches just return str
        return str;
    }

    /**
     * Returns a more human readable timestamp (hours:minutes:secods)
     * @param {number} milliseconds
     */
    function timestamp(milliseconds) {
        const SECOND = 1000; //milliseconds
        const MINUTE = 60 * SECOND;
        const HOUR = 60 * MINUTE;

        let seconds = Math.floor(milliseconds / SECOND);
        let minutes = Math.floor(milliseconds / MINUTE);
        let hours = Math.floor(milliseconds / HOUR);
        
        minutes = minutes % (HOUR/MINUTE);
        seconds = seconds % (MINUTE/SECOND);

        let str = '';

        if (hours !== 0) {
            str += hours + ':';
            if (minutes <= 9) {
                str += '0';
            }
        }
        str += minutes + ':';
        if (seconds <= 9) {
            str += '0';
        }
        str += seconds;

        return str;
    }

    /**
     * @ignore
     * @typedef MessageEvent
     * @type {object}
     * @property {Client} client
     * @property {Channel} channel
     * @property {string} text
     * @property {number} mode
     * @property {DiscordMessage} [message]
     */

    /**
     * Gives the user feedback if a command was successfull.
     *
     * @param {MessageEvent} ev
     * @param {(msg: string) => void} reply
     */
    function successReaction(ev, reply) {
        if (!config.createSuccessReaction) {
            return;
        }
        switch (engine.getBackend()) {
            case "discord":
                if (ev.message) ev.message.createReaction(REACTION_SUCCESS)
                return
            case "ts3":
                return reply(`${REACTION_SUCCESS} done!`)
        }
    }
    
    /**
     * Waits for given milliseconds.
     * @param {number} ms Time to wait for in milliseconds.
     * @return {Promise}
     */
    function wait(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * Adds a reaction to a message.
     * @param {string} channelID Channel ID
     * @param {string} messageID Message ID
     * @param {string} emoji Emoji
     * @return {Promise<object>}
     */
    function createReaction(channelID, messageID, emoji) {
        return discord('PUT', `/channels/${channelID}/messages/${messageID}/reactions/${emoji}/@me`, null, false);
    }

    /**
     * Removes a reaction from a message.
     * @param {string} channelID Channel ID
     * @param {string} messageID Message ID
     * @param {string} userID User ID
     * @param {string} emoji Emoji
     * @return {Promise<object>}
     */
    function deleteUserReaction(channelID, messageID, userID, emoji) {
        return discord('DELETE', `/channels/${channelID}/messages/${messageID}/reactions/${emoji}/${userID}`, null, false);
    }

    /**
     * Gets a message.
     * @param {string} channelID Channel ID
     * @param {string} messageID Message ID
     * @return {Promise<object>}
     */
    function getMessage(channelID, messageID) {
        return discord('GET', `/channels/${channelID}/messages/${messageID}`, null, true);
    }

    /**
     * Edits a message.
     * @param {string} channelID Channel ID
     * @param {string} messageID Message ID
     * @param {object} message New message
     * @return {Promise<object>}
     */
    function editMessage(channelID, messageID, message) {
        return discord('PATCH', `/channels/${channelID}/messages/${messageID}`, message, true);
    }

    /**
     * Deletes a message.
     * @param {string} channelID Channel ID
     * @param {string} messageID Message ID
     * @return {Promise<object>}
     */
    function deleteMessage(channelID, messageID) {
        return discord('DELETE', `/channels/${channelID}/messages/${messageID}`, null, false);
    }

    /**
     * Deletes multiple messages.
     * @param {string} channelID Channel ID
     * @param {string[]} messageIDs Message IDs
     * @return {Promise<object>}
     */
    function deleteMessages(channelID, messageIDs) {
        switch (messageIDs.length) {
            case 0: return Promise.resolve();
            case 1: return deleteMessage(channelID, messageIDs[0]);
            default: return discord('POST', `/channels/${channelID}/messages/bulk-delete`, {messages: messageIDs}, false);
        }
    }

    /**
     * Executes a discord API call
     * @param {string} method http method
     * @param {string} path path
     * @param {object} [data] json data
     * @param {boolean} [repsonse] `true` if you're expecting a json response, `false` otherwise
     * @return {Promise<object>}
     */
    function discord(method, path, data=null, repsonse=true) {
        return new Promise((resolve, reject) => {
            backend.extended().rawCommand(method, path, data, (err, data) => {
                if (err) return reject(err);
                if (repsonse) {
                    let res;
                    try {
                        res = JSON.parse(data);
                    } catch (err) {
                        engine.log(`${method} ${path}`);
                        engine.log('Invalid JSON: ' + data);
                        return reject(err);
                    }
                    
                    if (res === undefined) {
                        return reject('Invalid Response');
                    }

                    return resolve(res);
                }
                resolve();
            });
        });
    }
})
