import { Env } from "..";
import { editInteractionMessage, getMember, sendMessage } from "./rest";
import {APIContextMenuDMInteraction, APIMessage, APIGuildMember, InteractionResponseType, MessageFlags, APIEmbed, APIChatInputApplicationCommandGuildInteraction, ApplicationCommandOptionType, APIContextMenuInteractionData, APIContextMenuGuildInteraction, APIInteractionDataResolved} from "discord-api-types/v10"

interface Report {
    message: APIMessage
    token: string,
    reason: string | null,
    author: APIGuildMember | null,
    reportee: APIGuildMember | null,
    guildId: string | null
}

function reportToEmbed(
    report: Report
): APIEmbed {
    return {
        author: {
            name: 'Message source verified',
            url: `https://discord.com/channels/@me/${report.message.channel_id}/${report.message.id}`,
            icon_url: 'https://cdn.discordapp.com/emojis/751159037378297976.png?quality=lossless'
        },
        title: `DM Report ${((report.author) ? `from ${report.author.user?.username}` : '(unfinished)')}`,
        description: `||\`\`\`\n${report.message.content}\n\`\`\`||`,
        fields: ((report.author && report.reportee) ? [
            {
                name: 'Reporter',
                inline: true,
                value: `<@${report.author.user?.id ?? ''}>`
            },
            {
                name: 'Reported',
                inline: true,
                value: `<@${report.reportee.user?.id ?? ''}>`
            },
            {
                name: 'Reason',
                inline: false,
                value: report.reason ?? 'No reason provided.'
            }
        ] :undefined),
        footer: ((report.guildId) ? {text: `Reported to ${report.guildId}`} : {text: 'Use the /report command in a server using this bot to complete your report'})
    }
}

export async function isUserMember(
    userId: string,
    guildId: string,
    token: string
): Promise<boolean> {
    return (await getMember(guildId, userId, token)).ok
}

export async function startReport(
    messageData: APIContextMenuDMInteraction,
    env: Env
): Promise<Response> {
    console.log(JSON.stringify(messageData,null,2))
    if (messageData.data.type == 3) {
        const message = messageData.data.resolved.messages[messageData.data.target_id]
        if (message.author.id == messageData.user.id) {
            return new Response(JSON.stringify({
                type: InteractionResponseType.ChannelMessageWithSource,
                data: {
                    flags: MessageFlags.Ephemeral,
                    content: 'You cannot self-report'
                }
            }, null, 2), { headers: { "Content-Type": "application/json;charset=UTF-8" }, status: 200 })
        }
        const report: Report = {
            message: message,
            token: messageData.token,
            reason: null,
            author: null,
            reportee: null,
            guildId: null
        }
        await env.DB.put(
            messageData.user.id,
            JSON.stringify(report),
            {
                expirationTtl: 600
            }
        )
        return new Response(JSON.stringify({
            type: InteractionResponseType.ChannelMessageWithSource,
            data: {
                flags: MessageFlags.Ephemeral,
                embeds: [reportToEmbed(report)]
            }
        }, null, 2), { headers: { "Content-Type": "application/json;charset=UTF-8" }, status: 200 })
    }
    return new Response(JSON.stringify({
        type: InteractionResponseType.ChannelMessageWithSource,
        data: {
            flags: MessageFlags.Ephemeral,
            content: 'Failed to make report'
        }
    }, null, 2), { headers: { "Content-Type": "application/json;charset=UTF-8" }, status: 200 })
}

export async function finishReport(
    interaction: APIChatInputApplicationCommandGuildInteraction,
    env: Env
): Promise<Response> {
    const report: Report | null = await env.DB.get(interaction.member.user.id, 'json')
    if (!report) {
        return new Response(JSON.stringify({
            type: InteractionResponseType.ChannelMessageWithSource,
            data: {
                flags: MessageFlags.Ephemeral,
                content: 'Failed to find report'
            }
        }, null, 2), { headers: { "Content-Type": "application/json;charset=UTF-8" }, status: 200 })
    }
    const authorReq = await getMember(interaction.guild_id, interaction.member.user.id, env.TOKEN)
    const reporteeReq = await getMember(interaction.guild_id, report.message.author.id, env.TOKEN)
    if (!authorReq.ok || !reporteeReq.ok) {
        return new Response(JSON.stringify({
            type: InteractionResponseType.ChannelMessageWithSource,
            data: {
                flags: MessageFlags.Ephemeral,
                content: 'Reporter/Reportee/Bot not in server'
            }
        }, null, 2), { headers: { "Content-Type": "application/json;charset=UTF-8" }, status: 200 })
    }
    report.author = await authorReq.json()
    report.reportee = await reporteeReq.json()
    report.guildId = interaction.guild_id
    if (interaction.data.options) {
        const reason = interaction.data.options[0]
        report.reason = ((reason.type == ApplicationCommandOptionType.String) ? reason.value : null)
    }
    const channelToPublish = await env.DB.get(interaction.guild_id)
    if (channelToPublish) {
        await sendMessage(
            channelToPublish,
            env.TOKEN,
            {embeds: [reportToEmbed(report)]}
        )
        await editInteractionMessage(
            env.APP_ID,
            env.TOKEN,
            {embeds: [reportToEmbed(report)], flags: MessageFlags.Ephemeral}
        )
        await env.DB.delete(interaction.member.user.id)
        return new Response(JSON.stringify({
            type: InteractionResponseType.ChannelMessageWithSource,
            data: {
                flags: MessageFlags.Ephemeral,
                embeds: [reportToEmbed(report)]
            }
        }, null, 2), { headers: { "Content-Type": "application/json;charset=UTF-8" }, status: 200 })
    }
    return new Response(JSON.stringify({
        type: InteractionResponseType.ChannelMessageWithSource,
        data: {
            flags: MessageFlags.Ephemeral,
            content: 'Server not taking reports'
        }
    }, null, 2), { headers: { "Content-Type": "application/json;charset=UTF-8" }, status: 200 })
}

export async function setChannel(
    interaction: APIChatInputApplicationCommandGuildInteraction,
    env: Env
): Promise<Response> {
    if (interaction.data.options) {
        const channel = interaction.data.options[0]
        if (channel.type == ApplicationCommandOptionType.Channel) {
            await env.DB.put(interaction.guild_id, channel.value)
            return new Response(JSON.stringify({
                type: InteractionResponseType.ChannelMessageWithSource,
                data: {
                    flags: MessageFlags.Ephemeral,
                    content: `Logging channel set to <#${channel.value}>`
                }
            }, null, 2), { headers: { "Content-Type": "application/json;charset=UTF-8" }, status: 200 })
        }
    }
    return new Response(JSON.stringify({
        type: InteractionResponseType.ChannelMessageWithSource,
        data: {
            flags: MessageFlags.Ephemeral,
            content: 'failed to set logging channel'
        }
    }, null, 2), { headers: { "Content-Type": "application/json;charset=UTF-8" }, status: 200 })
}