import { GuildMember } from "discord.js"

export const canEditQueue = (member: GuildMember) => member.voice.channelId === member.guild.members.me!.voice.channelId
