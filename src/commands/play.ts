import { DiscordGatewayAdapterCreator, joinVoiceChannel } from "@discordjs/voice"
import { ChatInputCommandInteraction, PermissionsBitField, SlashCommandBuilder, TextChannel } from "discord.js"
import { i18n } from "../configurations/I18n"
import { spotifyPlaylistPattern, youtubePlaylistPattern } from "../models/constants/Patterns"
import { MusicQueue, Song } from "../models"
import { bot } from "../main"
import { replyToInteraction } from "../utils"

export default {
    data: new SlashCommandBuilder()
        .setName("play")
        .setDescription(i18n.__("play.description"))
        .addStringOption((option) =>
            option.setName("query").setDescription(i18n.__("play.description")).setRequired(true)
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
            return replyToInteraction(
                interaction,
                i18n.__mf("common.errorNotInSameChannel", { user: bot.client.user!.username }),
                true
            )

        const url = argQuery

        await replyToInteraction(interaction, i18n.__mf("play.loading"))

        if (new RegExp(youtubePlaylistPattern).test(url)) {
            await replyToInteraction(interaction, i18n.__mf("play.errorIsYoutubePlaylist"))
            return bot.slashCommandsMap.get("playlist")!.execute(interaction, url)
        } else if (new RegExp(spotifyPlaylistPattern).test(url)) {
            await replyToInteraction(interaction, i18n.__mf("play.errorIsSpotifyPlaylist"))
            return bot.slashCommandsMap.get("playlist")!.execute(interaction, url)
        }

        let song

        try {
            song = await Song.from(url, url)
        } catch (error: any) {
            console.error(error)

            if (error.name == "NoResults")
                return replyToInteraction(interaction, i18n.__mf("play.errorNoResults", { url: `<${url}>` }), true)

            if (error.name == "InvalidURL")
                return replyToInteraction(interaction, i18n.__mf("play.errorInvalidURL", { url: `<${url}>` }), true)

            replyToInteraction(interaction, i18n.__mf("common.errorCommand"), true)
        }

        if (queue) {
            queue.enqueue(song!)
            return replyToInteraction(
                interaction,
                i18n.__mf("play.queueAdded", { title: song!.title, author: interaction.user.id })
            )
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
        newQueue.enqueue(song!)
    }
}
