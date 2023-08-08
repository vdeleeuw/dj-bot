import { DiscordGatewayAdapterCreator, joinVoiceChannel } from "@discordjs/voice"
import { ChatInputCommandInteraction, PermissionsBitField, SlashCommandBuilder, TextChannel } from "discord.js"
import { bot } from "../main"
import { i18n } from "../configurations"
import { createEmbedMessage, replyToInteraction } from "../utils"
import { MusicQueue, Playlist as Playlist, Song } from "../models"

export default {
    data: new SlashCommandBuilder()
        .setName("playlist")
        .setDescription(i18n.__("playlist.description"))
        .addStringOption((option) =>
            option.setName("query").setDescription(i18n.__("playlist.description")).setRequired(true)
        ),
    permissions: [
        PermissionsBitField.Flags.Connect,
        PermissionsBitField.Flags.Speak,
        PermissionsBitField.Flags.AddReactions,
        PermissionsBitField.Flags.ManageMessages
    ],
    async execute(interaction: ChatInputCommandInteraction, input: string) {
        let argQuery = interaction.options.getString("query")
        if (!argQuery) argQuery = input

        const guildMember = interaction.guild!.members.cache.get(interaction.user.id)
        const { channel } = guildMember!.voice

        if (!channel) return replyToInteraction(interaction, i18n.__mf("common.errorNotChannel"), true)

        const queue = bot.queues.get(interaction.guild!.id)

        if (queue && channel.id !== queue.connection.joinConfig.channelId)
            return replyToInteraction(interaction, i18n.__mf("common.errorNotInSameChannel"), true)

        let playlist

        try {
            playlist = await Playlist.from(argQuery, argQuery)
        } catch (error) {
            console.error(error)
            return replyToInteraction(interaction, i18n.__mf("playlist.errorNotFoundPlaylist"), true)
        }

        if (queue) {
            queue.songs.push(...playlist.videos)
        } else {
            const newQueue = new MusicQueue({
                interaction,
                textChannel: interaction.channel! as TextChannel,
                connection: joinVoiceChannel({
                    channelId: channel.id,
                    guildId: channel.guild.id,
                    adapterCreator: channel.guild.voiceAdapterCreator as DiscordGatewayAdapterCreator
                })
            })

            bot.queues.set(interaction.guild!.id, newQueue)
            newQueue.songs.push(...playlist.videos)
            newQueue.enqueue(playlist.videos[0])
        }

        let playlistEmbed = createEmbedMessage()
            .setTitle(`${playlist?.data?.title ?? i18n.__("playlist.defaultTitle")}`)
            .setDescription(
                playlist.videos
                    .map((song: Song, index: number) => `${index + 1}. ${song.title}`)
                    .join("\n")
                    .slice(0, 4092)
                    .concat("...")
            )
            .setURL(playlist.url)

        if (interaction.replied)
            return interaction.editReply({
                content: i18n.__mf("playlist.startedPlaylist", { author: interaction.user.id }),
                embeds: [playlistEmbed]
            })
        interaction
            .reply({
                content: i18n.__mf("playlist.startedPlaylist", { author: interaction.user.id }),
                embeds: [playlistEmbed]
            })
            .catch(console.error)
    }
}
