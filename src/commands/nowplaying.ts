import { ChatInputCommandInteraction, SlashCommandBuilder } from "discord.js"
import { splitBar } from "string-progressbar"
import { bot } from "../main"
import { createEmbedMessage, replyToInteraction } from "../utils"

import { i18n } from "../configurations/I18n"

export default {
    data: new SlashCommandBuilder().setName("nowplaying").setDescription(i18n.__("nowplaying.description")),
    execute(interaction: ChatInputCommandInteraction) {
        const queue = bot.queues.get(interaction.guild!.id)

        if (!queue || !queue.songs.length)
            return replyToInteraction(interaction, i18n.__mf("common.errorNotQueue"), true)

        const song = queue.songs[0]
        const seek = queue.resource.playbackDuration / 1000
        const left = song.duration - seek

        let nowPlaying = createEmbedMessage()
            .setTitle(i18n.__("nowplaying.embedTitle"))
            .setDescription(`${song.title}\n${song.url}`)

        if (song.duration > 0) {
            nowPlaying.addFields({
                name: "\u200b",
                value:
                    new Date(seek * 1000).toISOString().substr(11, 8) +
                    "[" +
                    splitBar(song.duration == 0 ? seek : song.duration, seek, 20)[0] +
                    "]" +
                    (song.duration == 0 ? " ◉ " : new Date(song.duration * 1000).toISOString().substr(11, 8)),
                inline: false
            })

            nowPlaying.setFooter({
                text: i18n.__mf("nowplaying.timeRemaining", {
                    time: new Date(left * 1000).toISOString().substr(11, 8)
                })
            })
        }

        return interaction.reply({ embeds: [nowPlaying] })
    }
}
