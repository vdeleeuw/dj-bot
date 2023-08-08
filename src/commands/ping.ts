import { ChatInputCommandInteraction, SlashCommandBuilder } from "discord.js"
import { i18n } from "../configurations/I18n"
import { replyToInteraction } from "../utils"

export default {
    data: new SlashCommandBuilder().setName("ping").setDescription(i18n.__("ping.description")),
    execute(interaction: ChatInputCommandInteraction) {
        return replyToInteraction(
            interaction,
            i18n.__mf("ping.result", { ping: Math.round(interaction.client.ws.ping) }),
            true
        )
    }
}
