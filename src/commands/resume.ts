import { ChatInputCommandInteraction, SlashCommandBuilder } from "discord.js"
import { bot } from "../main"
import { i18n } from "../configurations/I18n"
import { canEditQueue } from "../utils/QueueUtils"
import { replyToInteraction } from "../utils"

export default {
    data: new SlashCommandBuilder().setName("resume").setDescription(i18n.__("resume.description")),
    execute(interaction: ChatInputCommandInteraction) {
        const queue = bot.queues.get(interaction.guild!.id)
        const guildMember = interaction.guild!.members.cache.get(interaction.user.id)

        if (!queue) return replyToInteraction(interaction, i18n.__mf("common.errorNotQueue"), true)

        if (!canEditQueue(guildMember!))
            return replyToInteraction(interaction, i18n.__mf("common.errorNotChannel"), true)

        if (queue.player.unpause()) {
            replyToInteraction(interaction, i18n.__mf("resume.resultNotPlaying", { author: interaction.user.id }))
            return true
        }

        replyToInteraction(interaction, i18n.__mf("resume.errorPlaying"))
        return false
    }
}
