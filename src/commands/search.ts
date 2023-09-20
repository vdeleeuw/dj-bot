import {
    ActionRowBuilder,
    ChatInputCommandInteraction,
    SlashCommandBuilder,
    StringSelectMenuBuilder,
    StringSelectMenuInteraction
} from "discord.js"
import youtube, { Video } from "youtube-sr"
import { bot } from "../main"
import { i18n } from "../configurations/I18n"
import { replyToInteraction } from "../utils"

export default {
    data: new SlashCommandBuilder()
        .setName("search")
        .setDescription(i18n.__("search.description"))
        .addStringOption((option) =>
            option.setName("query").setDescription(i18n.__("search.optionQueryDescription")).setRequired(true)
        ),
    async execute(interaction: ChatInputCommandInteraction) {
        const query = interaction.options.getString("query", true)
        const member = interaction.guild!.members.cache.get(interaction.user.id)

        if (!member?.voice.channel) return replyToInteraction(interaction, i18n.__mf("common.errorNotChannel"), true)

        const search = query

        await interaction.reply("⏳ Loading...").catch(console.error)

        let results: Video[] = []

        try {
            results = await youtube.search(search, { limit: 10, type: "video" })
        } catch (error: any) {
            console.error(error)
            return replyToInteraction(interaction, i18n.__mf("common.errorCommand"), true)
        }

        if (!results) return

        const options = results!.map((video) => {
            return {
                label: video.title ?? "",
                value: video.url
            }
        })

        const row = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(
            new StringSelectMenuBuilder()
                .setCustomId("search-select")
                .setPlaceholder(i18n.__("search.placeholder"))
                .setMinValues(1)
                .setMaxValues(10)
                .addOptions(options)
        )

        const followUp = await interaction.followUp({
            content: i18n.__("search.choose"),
            components: [row]
        })

        followUp
            .awaitMessageComponent({
                time: 30000
            })
            .then((selectInteraction) => {
                if (!(selectInteraction instanceof StringSelectMenuInteraction)) return

                selectInteraction.update({ content: i18n.__("search.loading"), components: [] })

                bot.slashCommandsMap
                    .get("play")!
                    .execute(interaction, selectInteraction.values[0])
                    .then(() => {
                        selectInteraction.values.slice(1).forEach((url) => {
                            bot.slashCommandsMap.get("play")!.execute(interaction, url)
                        })
                    })
            })
            .catch(console.error)
    }
}
