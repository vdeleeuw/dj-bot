export interface Config {
    discord: ConfigDiscord
    spotify: ConfigSpotify
}

interface ConfigDiscord {
    token: string
    idle_time: number
    locale: string
}

interface ConfigSpotify {
    client_id: string
    client_secret: string
}
