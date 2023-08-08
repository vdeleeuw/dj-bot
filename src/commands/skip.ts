import { ChatInputCommandInteraction, SlashCommandBuilder } from "discord.js"
import { bot } from "../main"
import { i18n } from "../configurations/I18n"
import { canEditQueue } from "../utils/QueueUtils"
import { replyToInteraction } from "../utils"

export default {
    data: new SlashCommandBuilder().setName("skip").setDescription(i18n.__("skip.description")),
    execute(interaction: ChatInputCommandInteraction) {
        const queue = bot.queues.get(interaction.guild!.id)
        const guildMember = interaction.guild!.members.cache.get(interaction.user.id)

        if (!queue) return replyToInteraction(interaction, i18n.__mf("common.errorNotQueue"), true)

        if (!canEditQueue(guildMember!))
            return replyToInteraction(interaction, i18n.__mf("common.errorNotChannel"), true)

        queue.player.stop(true)

        return replyToInteraction(interaction, i18n.__mf("skip.result", { author: interaction.user.id }))
    }
}
