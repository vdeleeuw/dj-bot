import youtube, { Playlist as YoutubePlaylist } from "youtube-sr"
import { Song } from "./Song"
import { spotifyPlaylistPattern, youtubePlaylistPattern } from "../constants"
import { spotify } from "../../main"

export class Playlist {
    public data: YoutubePlaylist | null
    public videos: Song[]
    public url: string
    public title: string

    public constructor(youtubePlaylist: YoutubePlaylist) {
        this.data = youtubePlaylist
        this.url = this?.data?.url!
        this.title = this?.data?.title!
        this.videos = this.data.videos
            .filter((video) => video.title != "Private video" && video.title != "Deleted video")
            .map((video) => {
                return new Song({
                    title: video.title!,
                    url: `https://youtube.com/watch?v=${video.id}`,
                    duration: video.duration / 1000
                })
            })
    }

    public static async from(url: string = "", search: string = "") {
        const urlYoutubeValid =  new RegExp(youtubePlaylistPattern).test(url)
        const urlSpotifyValid =  new RegExp(spotifyPlaylistPattern).test(url)

        let playlist

        if (urlYoutubeValid) {
            playlist = await youtube.getPlaylist(url)
            return new this(playlist)
        } else if (urlSpotifyValid) {
            const matches = new RegExp(spotifyPlaylistPattern).exec(url) ?? []
            const songs: Song[] = (await spotify.getArtistsAndNamesFromPlaylist(matches[2])).map(
                (x) =>
                    new Song({
                        title: x,
                        url: "",
                        duration: 0
                    })
            )
            return {
                data: null,
                videos: songs,
                url,
                title: "Spotify Playlist"
            }
        } else {
            const result = await youtube.searchOne(search, "playlist")
            playlist = await youtube.getPlaylist(result.url!)
            return new this(playlist)
        }
    }
}
