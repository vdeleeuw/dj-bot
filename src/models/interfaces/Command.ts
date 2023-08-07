import { SlashCommandBuilder } from "discord.js"

export interface Command {
    permissions?: string[]
    data: SlashCommandBuilder
    execute(...args: any): any
}
