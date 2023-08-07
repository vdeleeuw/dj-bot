import { Client, GatewayIntentBits, Partials } from "discord.js"
import { Bot, Spotify } from "./models"

export const bot = new Bot(
    new Client({
        intents: [
            GatewayIntentBits.DirectMessages,
            GatewayIntentBits.Guilds,
            GatewayIntentBits.GuildMessages,
            GatewayIntentBits.GuildMessageReactions,
            GatewayIntentBits.GuildVoiceStates,
            GatewayIntentBits.MessageContent
        ]
    })
)

export const spotify = new Spotify()
