import { ChatInputCommandInteraction, SlashCommandBuilder } from "discord.js"
import { bot } from "../main"
import { i18n } from "../configurations/I18n"
import { canEditQueue } from "../utils/QueueUtils"

export default {
    data: new SlashCommandBuilder().setName("pause").setDescription(i18n.__("pause.description")),
    execute(interaction: ChatInputCommandInteraction) {
        const guildMemer = interaction.guild!.members.cache.get(interaction.user.id)
        const queue = bot.queues.get(interaction.guild!.id)

        if (!queue) return interaction.reply({ content: i18n.__("pause.errorNotQueue") }).catch(console.error)

        if (!canEditQueue(guildMemer!)) return i18n.__("common.errorNotChannel")

        if (queue.player.pause()) {
            const content = { content: i18n.__mf("pause.result", { author: interaction.user.id }) }

            if (interaction.replied) interaction.followUp(content).catch(console.error)
            else interaction.reply(content).catch(console.error)

            return true
        }
    }
}
