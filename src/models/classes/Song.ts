import { AudioResource, createAudioResource } from "@discordjs/voice"
import youtube from "youtube-sr"
import { spotifySongPattern, urlPattern, youtubeVideoPattern } from "../constants"
import { spotify } from "../../main"
const { stream, video_basic_info } = require("play-dl")
import { i18n } from "../../configurations/I18n"

export interface SongData {
    url: string
    title: string
    duration: number
}

export class Song {
    public readonly url: string
    public readonly title: string
    public readonly duration: number

    public constructor({ url, title, duration }: SongData) {
        this.url = url
        this.title = title
        this.duration = duration
    }

    public static async from(url: string = "", search: string = ""): Promise<Song> {
        const isYoutubeUrl = new RegExp(youtubeVideoPattern).test(url)
        const isSpotifyUrl = new RegExp(spotifySongPattern).test(url)
        let songInfo

        if (isYoutubeUrl) {
            songInfo = await video_basic_info(url)
            return new this({
                url: songInfo.video_details.url,
                title: songInfo.video_details.title,
                duration: parseInt(songInfo.video_details.durationInSec)
            })
        } else {
            if (isSpotifyUrl) {
                const matches = new RegExp(spotifySongPattern).exec(url) ?? []
                return this.from("", await spotify.getArtistAndNameFromTrack(matches[2]))
            }
            const result = await youtube.searchOne(search)

            result ? null : console.log(`No results found for ${search}`)

            if (!result) {
                let err = new Error(`No search results found for ${search}`)
                err.name = "NoResults"
                if (new RegExp(urlPattern).test(url)) err.name = "InvalidURL"
                throw err
            }

            songInfo = await video_basic_info(`https://youtube.com/watch?v=${result.id}`)
            return new this({
                url: songInfo.video_details.url,
                title: songInfo.video_details.title,
                duration: parseInt(songInfo.video_details.durationInSec)
            })
        }
    }

    public async makeYoutubeResource(): Promise<AudioResource<Song> | void> {
        if (!this.url && this.title) {
            Object.assign(this, await Song.from("", this.title))
        }

        let playStream = await stream(this.url)

        if (!stream) return

        return createAudioResource(playStream.stream, {
            metadata: this,
            inputType: playStream.type,
            inlineVolume: true
        })
    }

    public startMessage() {
        return i18n.__mf("play.startedPlaying", { title: this.title, url: this.url })
    }
}
