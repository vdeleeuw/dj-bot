import { DiscordGatewayAdapterCreator, joinVoiceChannel } from "@discordjs/voice"
import { ChatInputCommandInteraction, PermissionsBitField, SlashCommandBuilder, TextChannel } from "discord.js"
import { bot } from "../main"
import { i18n } from "../configurations"
import { createEmbedMessage } from "../utils"
import { MusicQueue, Playlist as Playlist, Song } from "../models"

export default {
    data: new SlashCommandBuilder()
        .setName("playlist")
        .setDescription(i18n.__("playlist.description"))
        .addStringOption((option) =>
            option.setName("playlist").setDescription("Playlist name or link").setRequired(true)
        ),
    permissions: [
        PermissionsBitField.Flags.Connect,
        PermissionsBitField.Flags.Speak,
        PermissionsBitField.Flags.AddReactions,
        PermissionsBitField.Flags.ManageMessages
    ],
    async execute(interaction: ChatInputCommandInteraction) {
        let argPlaylistName = interaction.options.getString("playlist")

        const guildMemer = interaction.guild!.members.cache.get(interaction.user.id)
        const { channel } = guildMemer!.voice

        const queue = bot.queues.get(interaction.guild!.id)

        if (!channel)
            return interaction
                .reply({ content: i18n.__("playlist.errorNotChannel"), ephemeral: true })
                .catch(console.error)

        if (queue && channel.id !== queue.connection.joinConfig.channelId)
            if (interaction.replied)
                return interaction
                    .editReply({
                        content: i18n.__mf("play.errorNotInSameChannel", { user: interaction.client.user!.username })
                    })
                    .catch(console.error)
            else
                return interaction
                    .reply({
                        content: i18n.__mf("play.errorNotInSameChannel", { user: interaction.client.user!.username }),
                        ephemeral: true
                    })
                    .catch(console.error)

        let playlist

        try {
            playlist = await Playlist.from(argPlaylistName!.split(" ")[0], argPlaylistName!)
        } catch (error) {
            console.error(error)

            if (interaction.replied)
                return interaction
                    .editReply({ content: i18n.__("playlist.errorNotFoundPlaylist") })
                    .catch(console.error)
            else
                return interaction
                    .reply({ content: i18n.__("playlist.errorNotFoundPlaylist"), ephemeral: true })
                    .catch(console.error)
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
            .setTitle(`${playlist?.data?.title ?? "Playlist"}`)
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
