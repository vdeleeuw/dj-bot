import { config } from "../../utils/ConfigUtils"
import axios from "axios"
import { spotifyLoginUrl, spotifyPlaylistsUrl, spotifyTracksUrl } from "../constants"

export class Spotify {
    private token: string
    private expiration: Date = new Date()

    private clientId: string
    private clientSecret: string

    public constructor() {
        this.clientId = config.spotify.client_id
        this.clientSecret = config.spotify.client_secret
    }

    public async authorize() {
        if (this.expiration.getTime() < new Date().getTime()) {
            const options = {
                headers: {
                    "Content-Type": "application/x-www-form-urlencoded"
                }
            }
            const postData = [
                "grant_type=client_credentials",
                `client_id=${this.clientId}`,
                `client_secret=${this.clientSecret}`
            ].join("&")
            try {
                const response = axios.post(spotifyLoginUrl, postData, options)
                this.token = (await response).data.access_token
                this.expiration = new Date(new Date().getTime() + (await response).data.expires_in * 1000)
            } catch (err: any) {
                console.error("Error during spotify token retrieve", err?.code)
                throw err
            }
        }
    }

    public async getArtistAndNameFromTrack(trackId: string): Promise<string> {
        await this.authorize()
        const options = {
            headers: {
                Authorization: `Bearer ${this.token}`
            }
        }
        try {
            const response = axios.get(`${spotifyTracksUrl}${trackId}`, options)
            return `${(await response).data.name} ${(await response).data.artists.map((x: any) => x.name).join(" ")}`
        } catch (err: any) {
            console.error("Error during spotify track search", err?.code)
            throw err
        }
    }

    public async getArtistsAndNamesFromPlaylist(playlistId: string): Promise<string[]> {
        await this.authorize()
        let options = {
            headers: {
                Authorization: `Bearer ${this.token}`
            },
            params: {
                fields: "tracks(items(track(name,artists(name))),next)"
            }
        }
        try {
            const result: string[] = []
            let url = `${spotifyPlaylistsUrl}${playlistId}`

            while (url) {
                const response = await axios.get(`${url}`, options)
                // workarround because next returns non formatted data
                const tracks = options.params.fields ? response.data?.tracks?.items : response.data?.items
                url = options.params.fields ? response.data?.tracks?.next : response.data?.next

                for (const item of tracks) {
                    const trackInfo = `${item?.track?.name} - ${item?.track?.artists.map((a: any) => a.name).join(" ")}`
                    result.push(trackInfo)
                }

                options.params.fields = ""
            }

            return result
        } catch (err: any) {
            console.error("Error during spotify playlist retrieve", err?.code)
            throw err
        }
    }
}
