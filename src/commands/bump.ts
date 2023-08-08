import { ChatInputCommandInteraction, PermissionsBitField, SlashCommandBuilder, TextChannel } from "discord.js"
import { bot } from "../main"
import { i18n } from "../configurations"
import { Song } from "../models"
import { replyToInteraction } from "../utils"

export default {
    data: new SlashCommandBuilder()
        .setName("bump")
        .setDescription(i18n.__("bump.description"))
        .addStringOption((option) =>
            option.setName("query").setDescription(i18n.__("bump.optionQueryDescription")).setRequired(true)
        ),
    permissions: [
        PermissionsBitField.Flags.Connect,
        PermissionsBitField.Flags.Speak,
        PermissionsBitField.Flags.AddReactions,
        PermissionsBitField.Flags.ManageMessages
    ],
    async execute(interaction: ChatInputCommandInteraction) {
        let argQuery = interaction.options.getString("query")

        const guildMember = interaction.guild!.members.cache.get(interaction.user.id)
        const { channel } = guildMember!.voice

        if (!channel) return replyToInteraction(interaction, i18n.__mf("common.errorNotChannel"), true)

        const queue = bot.queues.get(interaction.guild!.id)

        if (queue && channel.id !== queue.connection.joinConfig.channelId)
            return replyToInteraction(
                interaction,
                i18n.__mf("common.errorNotInSameChannel", { user: interaction.client.user!.username }),
                true
            )

        try {
            if (queue) {
                const song = await Song.from(argQuery!, argQuery!)
                queue.enqueueNext(song)
                return replyToInteraction(interaction, i18n.__mf("bump.queueAdded", { title: song!.title, author: interaction.user.id }))
            } else {
                return await bot.slashCommandsMap.get("play")!.execute(interaction, argQuery)
            }
        } catch (error) {
            console.error(error)
            return replyToInteraction(interaction, i18n.__mf("common.errorSongNotFound"), true)
        }
    }
}
