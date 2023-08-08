import { ChatInputCommandInteraction, SlashCommandBuilder } from "discord.js"
import { bot } from "../main"
import { i18n } from "../configurations/I18n"
import { canEditQueue } from "../utils/QueueUtils"
import { replyToInteraction } from "../utils"

export default {
    data: new SlashCommandBuilder().setName("pause").setDescription(i18n.__("pause.description")),
    execute(interaction: ChatInputCommandInteraction) {
        const guildMember = interaction.guild!.members.cache.get(interaction.user.id)
        const queue = bot.queues.get(interaction.guild!.id)

        if (!queue) return replyToInteraction(interaction, i18n.__mf("common.errorNotQueue"), true)

        if (!canEditQueue(guildMember!))
            return replyToInteraction(interaction, i18n.__mf("common.errorNotChannel"), true)

        if (queue.player.pause()) {
            return replyToInteraction(interaction, i18n.__mf("pause.result", { author: interaction.user.id }))
        }
    }
}
