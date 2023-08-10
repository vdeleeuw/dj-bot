import {
    ChatInputCommandInteraction,
    CommandInteraction,
    MessageReaction,
    PermissionsBitField,
    SlashCommandBuilder,
    User
} from "discord.js"
import { bot } from "../main"
import { Song } from "../models"
import { createEmbedMessage, replyToInteraction } from "../utils"
import { i18n } from "../configurations/I18n"

export default {
    data: new SlashCommandBuilder().setName("queue").setDescription(i18n.__("queue.description")),
    permissions: [PermissionsBitField.Flags.AddReactions, PermissionsBitField.Flags.ManageMessages],
    async execute(interaction: ChatInputCommandInteraction) {
        const queue = bot.queues.get(interaction.guild!.id)
        if (!queue || !queue.songs.length)
            return replyToInteraction(interaction, i18n.__mf("common.errorNotQueue"), true)

        let currentPage = 0
        const embeds = generateQueueEmbed(interaction, queue.songs)

        await replyToInteraction(interaction, i18n.__mf("queue.loading"))

        if (interaction.replied)
            await interaction.editReply({
                content: `**${i18n.__mf("queue.currentPage")} ${currentPage + 1}/${embeds.length}**`,
                embeds: [embeds[currentPage]]
            })

        const queueEmbed = await interaction.fetchReply()

        try {
            await queueEmbed.react("⬅️")
            await queueEmbed.react("⏹")
            await queueEmbed.react("➡️")
        } catch (error: any) {
            console.error(error)
            return interaction.followUp(error.message).catch(console.error)
        }

        const filter = (reaction: MessageReaction, user: User) =>
            ["⬅️", "⏹", "➡️"].includes(reaction.emoji.name!) && interaction.user.id === user.id

        const collector = queueEmbed.createReactionCollector({ filter, time: 60000 })

        collector.on("collect", async (reaction, user) => {
            try {
                if (reaction.emoji.name === "➡️") {
                    if (currentPage < embeds.length - 1) {
                        currentPage++
                        queueEmbed.edit({
                            content: i18n.__mf("queue.currentPage", { page: currentPage + 1, length: embeds.length }),
                            embeds: [embeds[currentPage]]
                        })
                    }
                } else if (reaction.emoji.name === "⬅️") {
                    if (currentPage !== 0) {
                        --currentPage
                        queueEmbed.edit({
                            content: i18n.__mf("queue.currentPage", { page: currentPage + 1, length: embeds.length }),
                            embeds: [embeds[currentPage]]
                        })
                    }
                } else {
                    collector.stop()
                    reaction.message.reactions.removeAll()
                }
                await reaction.users.remove(interaction.user.id)
            } catch (error: any) {
                console.error(error)
                return interaction.followUp(error.message).catch(console.error)
            }
        })
    }
}

function generateQueueEmbed(interaction: CommandInteraction, songs: Song[]) {
    let embeds = []
    let k = 50

    for (let i = 0; i < songs.length; i += 50, k += 50) {
        const current = songs.slice(i, k)
        let j = i

        const info = current.map((track) => `${++j} - ${track.title}`).join("\n")

        const embed = createEmbedMessage()
            .setTitle(i18n.__("queue.embedTitle"))
            .setThumbnail(interaction.guild?.iconURL()!)
            .setDescription(
                i18n.__mf("queue.embedCurrentSong", { title: songs[0].title, url: songs[0].url, info: info })
            )
        embeds.push(embed)
    }

    return embeds
}
