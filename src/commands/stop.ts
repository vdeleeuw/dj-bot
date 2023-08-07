import { ChatInputCommandInteraction, SlashCommandBuilder } from "discord.js"
import { bot } from "../main"
import { i18n } from "../configurations/I18n"
import { canEditQueue } from "../utils/QueueUtils"

export default {
    data: new SlashCommandBuilder().setName("stop").setDescription(i18n.__("stop.description")),
    execute(interaction: ChatInputCommandInteraction) {
        const queue = bot.queues.get(interaction.guild!.id)
        const guildMemer = interaction.guild!.members.cache.get(interaction.user.id)

        if (!queue) return interaction.reply(i18n.__("stop.errorNotQueue")).catch(console.error)
        if (!guildMemer || !canEditQueue(guildMemer)) return i18n.__("common.errorNotChannel")

        queue.stop()

        interaction.reply({ content: i18n.__mf("stop.result", { author: interaction.user.id }) }).catch(console.error)
    }
}
