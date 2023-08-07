import {
    ApplicationCommandDataResolvable,
    ChatInputCommandInteraction,
    Client,
    Collection,
    Events,
    Interaction,
    REST,
    Routes,
    Snowflake
} from "discord.js"
import { readdirSync } from "fs"
import { join } from "path"
import { Command } from "../interfaces/Command"
import { config } from "../../utils/ConfigUtils"
import { MusicQueue } from "./MusicQueue"

export class Bot {
    public commands = new Collection<string, Command>()
    public slashCommands = new Array<ApplicationCommandDataResolvable>()
    public slashCommandsMap = new Collection<string, Command>()
    public queues = new Collection<Snowflake, MusicQueue>()

    public constructor(public readonly client: Client) {
        this.client.login(config.discord.token)

        this.client.on("ready", () => {
            console.log(`${this.client.user!.username} ready!`)
            this.registerSlashCommands()
        })

        this.client.on("warn", (info) => console.log(info))
        this.client.on("error", console.error)

        this.onInteractionCreate()
    }

    private async registerSlashCommands() {
        const rest = new REST({ version: "9" }).setToken(config.discord.token)

        const commandFiles = readdirSync(join(__dirname, "../..", "commands")).filter((file) => !file.endsWith(".map"))

        for (const file of commandFiles) {
            const command = await import(join(__dirname, "../..", "commands", `${file}`))

            this.slashCommands.push(command.default.data)
            this.slashCommandsMap.set(command.default.data.name, command.default)
        }

        await rest.put(Routes.applicationCommands(this.client.user!.id), { body: this.slashCommands })
    }

    private async onInteractionCreate() {
        this.client.on(Events.InteractionCreate, async (interaction: Interaction): Promise<any> => {
            if (!interaction.isChatInputCommand()) return

            const command = this.slashCommandsMap.get(interaction.commandName)
            if (!command) return

            command.execute(interaction as ChatInputCommandInteraction)
        })
    }
}
