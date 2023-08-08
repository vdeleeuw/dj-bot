import { ChatInputCommandInteraction, SlashCommandBuilder } from "discord.js"
import { bot } from "../main"
import { i18n } from "../configurations/I18n"
import { canEditQueue } from "../utils/QueueUtils"
import { replyToInteraction } from "../utils"

export default {
    data: new SlashCommandBuilder().setName("shuffle").setDescription(i18n.__("shuffle.description")),
    execute(interaction: ChatInputCommandInteraction) {
        const queue = bot.queues.get(interaction.guild!.id)
        const guildMember = interaction.guild!.members.cache.get(interaction.user.id)

        if (!queue) return replyToInteraction(interaction, i18n.__mf("common.errorNotQueue"), true)

        if (!guildMember || !canEditQueue(guildMember))
            return replyToInteraction(interaction, i18n.__mf("common.errorNotChannel"), true)

        let songs = queue.songs

        for (let i = songs.length - 1; i > 1; i--) {
            let j = 1 + Math.floor(Math.random() * i)
            ;[songs[i], songs[j]] = [songs[j], songs[i]]
        }

        return replyToInteraction(interaction, i18n.__mf("shuffle.result", { author: interaction.user.id }))
    }
}
