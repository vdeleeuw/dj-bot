import { EmbedBuilder } from "discord.js"

export const createEmbedMessage = (): EmbedBuilder =>
    new EmbedBuilder().setColor("Random").setFooter({ text: "Made by vdeleeuw with ❤" }).setTimestamp()
