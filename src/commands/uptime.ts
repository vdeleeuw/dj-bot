import { ChatInputCommandInteraction, SlashCommandBuilder } from "discord.js"
import { bot } from "../main"
import { i18n } from "../configurations/I18n"
import { replyToInteraction } from "../utils"

export default {
    data: new SlashCommandBuilder().setName("uptime").setDescription(i18n.__("uptime.description")),
    execute(interaction: ChatInputCommandInteraction) {
        let seconds = Math.floor(bot.client.uptime! / 1000)
        let minutes = Math.floor(seconds / 60)
        let hours = Math.floor(minutes / 60)
        let days = Math.floor(hours / 24)

        seconds %= 60
        minutes %= 60
        hours %= 24

        return replyToInteraction(
            interaction,
            i18n.__mf("uptime.result", { days: days, hours: hours, minutes: minutes, seconds: seconds })
        )
    }
}
