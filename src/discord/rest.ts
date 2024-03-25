import { RESTPostAPIChannelMessageJSONBody } from "discord-api-types/v10"

export const DISCORD_BASE_URL: string = 'https://discord.com/api/v10/'
export const AMP_UA: string = "DiscordBot (AMP V1.0, NodeJs, CloudFlare Workers)"

export async function editInteractionMessage(
    appId: string,
    token: string,
    message: RESTPostAPIChannelMessageJSONBody
): Promise<Response> {
    return await fetch(
        `${DISCORD_BASE_URL}webhooks/${appId}/${token}/messages/@original`,
        {
            method: 'PATCH',
            headers: {
                "User-Agent": AMP_UA,
                "Content-Type": "application/json"
            },
            body: JSON.stringify(message)
        }
    )
}

export async function sendMessage(
    channelId: string,
    token: string,
    message: RESTPostAPIChannelMessageJSONBody
): Promise<Response> {
    return await fetch(
        `${DISCORD_BASE_URL}channels/${channelId}/messages`,
        {
            method: 'POST',
            headers: {
                "User-Agent": AMP_UA,
                "Content-Type": "application/json",
                authorization: `Bot ${token}`
            },
            body: JSON.stringify(message)
        }
    )
}

export async function ban(
    guildId: string,
    userId: string,
    token: string,
    reason: string = 'Unknown AutoMod Plus+ action'
): Promise<Response> {
    return await fetch(
        `${DISCORD_BASE_URL}guilds/${guildId}/bans/${userId}`,
        {
            method: 'PUT',
            headers: {
                "User-Agent": AMP_UA,
                "Content-Type": "application/json",
                "X-Audit-Log-Reason": reason,
                authorization: `Bot ${token}`
            }
        }
    )
}

export async function kick(
    guildId: string,
    userId: string,
    token: string,
    reason: string = 'Unknown AutoMod Plus+ action'
): Promise<Response> {
    return await fetch(
        `${DISCORD_BASE_URL}guilds/${guildId}/members/${userId}`,
        {
            method: 'DELETE',
            headers: {
                "User-Agent": AMP_UA,
                "Content-Type": "application/json",
                "X-Audit-Log-Reason": reason,
                authorization: `Bot ${token}`
            }
        }
    )
}

export async function timeout(
    guildId: string,
    userId: string,
    time: number,
    token: string,
    reason: string = 'Unknown AutoMod Plus+ action'
): Promise<Response> {
    return await fetch(
        `${DISCORD_BASE_URL}guilds/${guildId}/members/${userId}`,
        {
            method: 'PATCH',
            headers: {
                "User-Agent": AMP_UA,
                "Content-Type": "application/json",
                "X-Audit-Log-Reason": reason,
                authorization: `Bot ${token}`
            },
            body: JSON.stringify({
                communication_disabled_until: new Date((new Date()).getTime() + time).toISOString()
            })
        }
    )
}

export async function addRole(
    guildId: string,
    userId: string,
    roleId: string,
    token: string,
    reason: string = 'Unknown AutoMod Plus+ action'
): Promise<Response> {
    return await fetch(
        `${DISCORD_BASE_URL}guilds/${guildId}/members/${userId}/roles/${roleId}`,
        {
            method: 'PUT',
            headers: {
                "User-Agent": AMP_UA,
                "Content-Type": "application/json",
                "X-Audit-Log-Reason": reason,
                authorization: `Bot ${token}`
            }
        }
    )
}

export async function removeRole(
    guildId: string,
    userId: string,
    roleId: string,
    token: string,
    reason: string = 'Unknown AutoMod Plus+ action'
): Promise<Response> {
    return await fetch(
        `${DISCORD_BASE_URL}guilds/${guildId}/members/${userId}/roles/${roleId}`,
        {
            method: 'DELETE',
            headers: {
                "User-Agent": AMP_UA,
                "Content-Type": "application/json",
                "X-Audit-Log-Reason": reason,
                authorization: `Bot ${token}`
            }
        }
    )
}

export async function getMember(
    guildId: string,
    userId: string,
    token: string
): Promise<Response> {
    return await fetch(
        `${DISCORD_BASE_URL}guilds/${guildId}/members/${userId}`,
        {
            headers: {
                "User-Agent": AMP_UA,
                "Content-Type": "application/json",
                authorization: `Bot ${token}`
            }
        }
    )
}