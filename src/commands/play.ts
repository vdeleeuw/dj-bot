import { DiscordGatewayAdapterCreator, joinVoiceChannel } from "@discordjs/voice"
import { ChatInputCommandInteraction, PermissionsBitField, SlashCommandBuilder, TextChannel } from "discord.js"
import { i18n } from "../configurations/I18n"
import { spotifyPlaylistPattern, youtubePlaylistPattern } from "../models/constants/Patterns"
import { MusicQueue, Song } from "../models"
import { bot } from "../main"

export default {
    data: new SlashCommandBuilder()
        .setName("play")
        .setDescription(i18n.__("play.description"))
        .addStringOption((option) =>
            option.setName("query").setDescription("The song you want to play").setRequired(true)
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

        if (!channel)
            return interaction.reply({ content: i18n.__("play.errorNotChannel"), ephemeral: true }).catch(console.error)

        const queue = bot.queues.get(interaction.guild!.id)

        if (queue && channel.id !== queue.connection.joinConfig.channelId)
            return interaction
                .reply({
                    content: i18n.__mf("play.errorNotInSameChannel", { user: bot.client.user!.username }),
                    ephemeral: true
                })
                .catch(console.error)

        const url = argQuery

        if (interaction.replied) await interaction.editReply(i18n.__mf("play.loading")).catch(console.error)
        else await interaction.reply(i18n.__mf("play.loading")).catch(console.error)

        if (new RegExp(youtubePlaylistPattern).test(url)) {
            await interaction.editReply(i18n.__mf("play.errorIsYoutubePlaylist")).catch(console.error)
            return bot.slashCommandsMap.get("playlist")!.execute(interaction, url)
        } else if (new RegExp(spotifyPlaylistPattern).test(url)) {
            await interaction.editReply(i18n.__mf("play.errorIsSpotifyPlaylist")).catch(console.error)
            return bot.slashCommandsMap.get("playlist")!.execute(interaction, url)
        }

        let song

        try {
            song = await Song.from(url, url)
        } catch (error: any) {
            console.error(error)

            if (error.name == "NoResults")
                return interaction
                    .reply({ content: i18n.__mf("play.errorNoResults", { url: `<${url}>` }), ephemeral: true })
                    .catch(console.error)

            if (error.name == "InvalidURL")
                return interaction
                    .reply({ content: i18n.__mf("play.errorInvalidURL", { url: `<${url}>` }), ephemeral: true })
                    .catch(console.error)

            if (interaction.replied)
                return await interaction.editReply({ content: i18n.__("common.errorCommand") }).catch(console.error)
            else
                return interaction
                    .reply({ content: i18n.__("common.errorCommand"), ephemeral: true })
                    .catch(console.error)
        }

        if (queue) {
            queue.enqueue(song)
            return (interaction.channel as TextChannel)
                .send({ content: i18n.__mf("play.queueAdded", { title: song.title, author: interaction.user.id }) })
                .catch(console.error)
        }

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

        newQueue.enqueue(song)
        interaction.deleteReply().catch(console.error)
    }
}
