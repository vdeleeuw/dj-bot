import {
    AudioPlayer,
    AudioPlayerState,
    AudioPlayerStatus,
    AudioResource,
    createAudioPlayer,
    entersState,
    NoSubscriberBehavior,
    VoiceConnection,
    VoiceConnectionDisconnectReason,
    VoiceConnectionState,
    VoiceConnectionStatus
} from "@discordjs/voice"
import { CommandInteraction, Message, TextChannel, User } from "discord.js"
import { promisify } from "node:util"
import { bot } from "../../main"
import { QueueOptions } from "../interfaces"
import { config } from "../../utils"
import { i18n } from "../../configurations"
import { Song } from "./Song"

const wait = promisify(setTimeout)

export class MusicQueue {
    public readonly interaction: CommandInteraction
    public readonly connection: VoiceConnection
    public readonly player: AudioPlayer
    public readonly textChannel: TextChannel
    public readonly bot = bot

    public resource: AudioResource
    public songs: Song[] = []
    public volume = 100
    public muted = false
    public waitTimeout: NodeJS.Timeout | null

    private queueLock = false
    private readyLock = false
    private stopped = false

    public constructor(options: QueueOptions) {
        Object.assign(this, options)

        this.player = createAudioPlayer({ behaviors: { noSubscriber: NoSubscriberBehavior.Play } })
        this.connection.subscribe(this.player)

        const networkStateChangeHandler = (_: any, newNetworkState: any) => {
            const newUdp = Reflect.get(newNetworkState, "udp")
            clearInterval(newUdp?.keepAliveInterval)
        }

        this.connection.on(
            "stateChange" as any,
            async (oldState: VoiceConnectionState, newState: VoiceConnectionState) => {
                Reflect.get(oldState, "networking")?.off("stateChange", networkStateChangeHandler)
                Reflect.get(newState, "networking")?.on("stateChange", networkStateChangeHandler)

                if (newState.status === VoiceConnectionStatus.Disconnected) {
                    if (
                        newState.reason === VoiceConnectionDisconnectReason.WebSocketClose &&
                        newState.closeCode === 4014
                    ) {
                        try {
                            this.stop()
                        } catch (e) {
                            console.log(e)
                            this.stop()
                        }
                    } else if (this.connection.rejoinAttempts < 5) {
                        await wait((this.connection.rejoinAttempts + 1) * 5_000)
                        this.connection.rejoin()
                    } else {
                        this.connection.destroy()
                    }
                } else if (
                    !this.readyLock &&
                    (newState.status === VoiceConnectionStatus.Connecting ||
                        newState.status === VoiceConnectionStatus.Signalling)
                ) {
                    this.readyLock = true
                    try {
                        await entersState(this.connection, VoiceConnectionStatus.Ready, 20_000)
                    } catch {
                        if (this.connection.state.status !== VoiceConnectionStatus.Destroyed) {
                            try {
                                this.connection.destroy()
                            } catch {}
                        }
                    } finally {
                        this.readyLock = false
                    }
                }
            }
        )

        this.player.on("stateChange" as any, async (oldState: AudioPlayerState, newState: AudioPlayerState) => {
            if (oldState.status !== AudioPlayerStatus.Idle && newState.status === AudioPlayerStatus.Idle) {
                this.songs.shift()
                if (!this.songs.length) return this.stop()
                if (this.songs.length || this.resource.audioPlayer) this.processQueue()
            } else if (
                oldState.status === AudioPlayerStatus.Buffering &&
                newState.status === AudioPlayerStatus.Playing
            ) {
                this.sendPlayingMessage(newState)
            }
        })

        this.player.on("error", (error) => {
            console.error(error)
            this.songs.shift()
            this.processQueue()
        })
    }

    public enqueue(...songs: Song[]) {
        if (this.waitTimeout !== null) clearTimeout(this.waitTimeout)
        this.waitTimeout = null
        this.stopped = false
        this.songs = this.songs.concat(songs)
        this.processQueue()
    }

    public stop() {
        if (this.stopped) return

        this.stopped = true
        this.songs = []
        this.player.stop()

        this.textChannel.send(i18n.__("play.queueEnded")).catch(console.error)

        if (this.waitTimeout !== null) return

        this.waitTimeout = setTimeout(() => {
            if (this.connection.state.status !== VoiceConnectionStatus.Destroyed) {
                try {
                    this.connection.destroy()
                } catch {}
            }
            bot.queues.delete(this.interaction.guild!.id)

            this.textChannel.send(i18n.__("play.leaveChannel"))
        }, config.discord.idle_time * 1000)
    }

    public async processQueue(): Promise<void> {
        if (this.queueLock || this.player.state.status !== AudioPlayerStatus.Idle) return
        if (!this.songs.length) return this.stop()

        this.queueLock = true
        const nextSong = this.songs[0]

        try {
            const resource = await nextSong.makeYoutubeResource()
            this.resource = resource!
            this.player.play(this.resource)
            this.resource.volume?.setVolumeLogarithmic(this.volume / 100)
        } catch (error) {
            console.error(error)
            return this.processQueue()
        } finally {
            this.queueLock = false
        }
    }

    private async sendPlayingMessage(newState: any) {
        const song = (newState.resource as AudioResource<Song>).metadata

        let playingMessage: Message

        // creation message
        try {
            playingMessage = await this.textChannel.send(
                (newState.resource as AudioResource<Song>).metadata.startMessage()
            )
            await playingMessage.react("⏭")
            await playingMessage.react("⏯")
            await playingMessage.react("🔀")
            await playingMessage.react("⏹")
        } catch (error: any) {
            console.error(error)
            this.textChannel.send(error.message)
            return
        }

        const filter = (_: any, user: User) => user.id !== this.textChannel.client.user!.id

        const collector = playingMessage.createReactionCollector({
            filter,
            time: song.duration > 0 ? song.duration * 1000 : 600000
        })

        collector.on("collect", async (reaction, user) => {
            if (!this.songs) return

            Object.defineProperty(this.interaction, "user", {
                value: user
            })

            switch (reaction.emoji.name) {
                case "⏭":
                    reaction.users.remove(user).catch(console.error)
                    await this.bot.slashCommandsMap.get("skip")!.execute(this.interaction)
                    break

                case "⏯":
                    reaction.users.remove(user).catch(console.error)
                    if (this.player.state.status == AudioPlayerStatus.Playing) {
                        await this.bot.slashCommandsMap.get("pause")!.execute(this.interaction)
                    } else {
                        await this.bot.slashCommandsMap.get("resume")!.execute(this.interaction)
                    }
                    break

                case "🔀":
                    reaction.users.remove(user).catch(console.error)
                    await this.bot.slashCommandsMap.get("shuffle")!.execute(this.interaction)
                    break

                case "⏹":
                    reaction.users.remove(user).catch(console.error)
                    await this.bot.slashCommandsMap.get("stop")!.execute(this.interaction)
                    collector.stop()
                    break

                default:
                    reaction.users.remove(user).catch(console.error)
                    break
            }
        })

        collector.on("end", () => {
            playingMessage.reactions.removeAll().catch(console.error)
        })
    }
}
