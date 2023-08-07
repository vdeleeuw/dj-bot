import { ChatInputCommandInteraction, SlashCommandBuilder } from "discord.js"
import { bot } from "../main"
import { i18n } from "../configurations/I18n"
import { canEditQueue } from "../utils/QueueUtils"

export default {
    data: new SlashCommandBuilder().setName("shuffle").setDescription(i18n.__("shuffle.description")),
    execute(interaction: ChatInputCommandInteraction) {
        const queue = bot.queues.get(interaction.guild!.id)
        const guildMember = interaction.guild!.members.cache.get(interaction.user.id)

        if (!queue)
            return interaction
                .reply({ content: i18n.__("shuffle.errorNotQueue"), ephemeral: true })
                .catch(console.error)

        if (!guildMember || !canEditQueue(guildMember)) return i18n.__("common.errorNotChannel")

        let songs = queue.songs

        for (let i = songs.length - 1; i > 1; i--) {
            let j = 1 + Math.floor(Math.random() * i)
            ;[songs[i], songs[j]] = [songs[j], songs[i]]
        }

        queue.songs = songs

        const content = { content: i18n.__mf("shuffle.result", { author: interaction.user.id }) }

        if (interaction.replied) interaction.followUp(content).catch(console.error)
        else interaction.reply(content).catch(console.error)
    }
}
