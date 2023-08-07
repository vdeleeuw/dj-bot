import { CommandInteraction, EmbedBuilder, SlashCommandBuilder } from "discord.js"
import { i18n } from "../configurations/I18n"
import { bot } from "../main"
import { createEmbedMessage } from "../utils"

export default {
    data: new SlashCommandBuilder().setName("help").setDescription(i18n.__("help.description")),
    async execute(interaction: CommandInteraction) {
        let commands = bot.slashCommandsMap

        let helpEmbed = createEmbedMessage()
            .setTitle(i18n.__mf("help.embedTitle", { botname: interaction.client.user!.username }))
            .setDescription(i18n.__("help.embedDescription"))

        commands.forEach((cmd) => {
            helpEmbed.addFields({
                name: `**${cmd.data.name}**`,
                value: `${cmd.data.description}`,
                inline: true
            })
        })

        return interaction.reply({ embeds: [helpEmbed] }).catch(console.error)
    }
}
