import { BooleanCache, ChatInputCommandInteraction, EmbedBuilder } from "discord.js"

export const createEmbedMessage = (): EmbedBuilder =>
    new EmbedBuilder().setColor("Random").setFooter({ text: "Made by vdeleeuw with ❤" }).setTimestamp()

export const replyToInteraction = async (
    interaction: ChatInputCommandInteraction,
    message: string,
    ephemeral: boolean = false
): Promise<any> => {
    return interaction.replied
        ? interaction
              .editReply({
                  content: message
              })
              .catch(console.error)
        : interaction
              .reply({
                  content: message,
                  ephemeral: ephemeral
              })
              .catch(console.error)
}
