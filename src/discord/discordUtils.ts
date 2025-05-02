import { sql } from "@vercel/postgres";
import { Permissions, Snowflake } from "discord-api-types/globals"
import { APIGuildMember, APIMessage, RESTDeleteAPIChannelResult, RESTGetAPIChannelMessageResult, RESTGetAPIChannelMessagesQuery, RESTGetAPIChannelMessagesResult, RESTGetAPIGuildChannelsResult, RESTGetAPIGuildMemberResult, RESTGetAPIGuildMembersQuery, RESTGetAPIGuildMembersResult, RESTGetAPIWebhookWithTokenMessageResult, RESTPatchAPIChannelJSONBody, RESTPatchAPIChannelMessageJSONBody, RESTPatchAPIChannelMessageResult, RESTPatchAPIChannelResult, RESTPatchAPIWebhookWithTokenMessageJSONBody, RESTPatchAPIWebhookWithTokenMessageResult, RESTPostAPIChannelMessageJSONBody, RESTPostAPIChannelMessageResult, RESTPostAPIChannelMessagesThreadsResult, RESTPostAPIGuildChannelJSONBody, RESTPostAPIGuildChannelResult, RESTPostAPIGuildForumThreadsJSONBody, RESTPostAPIInteractionCallbackJSONBody, RESTPostAPIInteractionCallbackWithResponseResult, RESTPostAPIWebhookWithTokenJSONBody, RESTPostAPIWebhookWithTokenQuery, RESTPostAPIWebhookWithTokenResult, RESTPutAPIApplicationCommandsJSONBody, RESTPutAPIApplicationCommandsResult, RESTPutAPIApplicationGuildCommandsJSONBody, RESTPutAPIApplicationGuildCommandsResult, RouteBases, Routes } from "discord-api-types/v10";
import { getProfiles } from "./hypixelUtils";
import { SkyBlockProfileMember } from "@zikeji/hypixel/dist/types/Augmented/SkyBlock/ProfileMember";
import { addDiscordRole, getDiscordRole, updateDiscordRoleExp } from "./utils";

export interface DiscordPermissions {
    create_instant_invite?: boolean;
    kick_members?: boolean;
    ban_members?: boolean;
    administrator?: boolean;
    manage_channels?: boolean;
    manage_guild?: boolean;
    add_reactions?: boolean;
    view_audit_log?: boolean;
    priority_speaker?: boolean;
    stream?: boolean;
    view_channel?: boolean;
    send_messages?: boolean;
    send_tts_messages?: boolean;
    manage_messages?: boolean;
    embed_links?: boolean;
    attach_files?: boolean;
    read_message_history?: boolean;
    mention_everyone?: boolean;
    use_external_emojis?: boolean;
    view_guild_insights?: boolean;
    connect?: boolean;
    speak?: boolean;
    mute_members?: boolean;
    deafen_members?: boolean;
    move_members?: boolean;
    use_vad?: boolean;
    change_nickname?: boolean;
    manage_nicknames?: boolean;
    manage_roles?: boolean;
    manage_webhooks?: boolean;
    manage_guild_expressions?: boolean;
    use_application_commands?: boolean;
    request_to_speak?: boolean;
    manage_events?: boolean;
    manage_threads?: boolean;
    create_public_threads?: boolean;
    create_private_threads?: boolean;
    use_external_stickers?: boolean;
    send_messages_in_threads?: boolean;
    start_embedded_activities?: boolean;
    moderate_members?: boolean;
    view_creator_monetization_analytics?: boolean;
    use_soundboard?: boolean;
    create_guild_expressions?: boolean;
    create_events?: boolean;
    use_external_sounds?: boolean;
    send_voice_messages?: boolean;
    send_polls?: boolean;
    use_external_apps?: boolean;
}

export const DISCORD_EPOCH = 1420070400000;

/**
 * Converts a snowflake ID string into a JS Date object using the provided epoch (in ms), or Discord's epoch if not provided
 * @param {Snowflake} snowflake The snowflake ID to convert
 * @param {number} [epoch=DISCORD_EPOCH] The epoch to use when converting the snowflake
 * @returns {Date} The Date object equivalent to the given snowflake ID
 */
export function ConvertSnowflakeToDate(snowflake: Snowflake, epoch: number = DISCORD_EPOCH): Date {
	// Convert snowflake to BigInt to extract timestamp bits
	// https://discord.com/developers/docs/reference#snowflakes
	const milliseconds = BigInt(snowflake) >> BigInt(22);
	return new Date(Number(milliseconds) + epoch);
}

export async function InstallGlobalCommands(
    commands: RESTPutAPIApplicationCommandsJSONBody
): Promise<RESTPutAPIApplicationCommandsResult | undefined> {
    if (!process.env.DISCORD_CLIENT_ID) throw new Error('DISCORD_CLIENT_ID is not defined');
    if (!process.env.DISCORD_TOKEN) throw new Error('DISCORD_TOKEN is not defined');
    
    const endpoint = Routes.applicationCommands(process.env.DISCORD_CLIENT_ID);
    const url = RouteBases.api + endpoint;

    const res = await fetch(url, {
        headers: {
            Authorization: `Bot ${process.env.DISCORD_TOKEN}`,
            'Content-Type': 'application/json',
        },
        method: 'PUT',
        body: JSON.stringify(commands),
    });

    let data;
    try {
        data = await res.json() as RESTPutAPIApplicationCommandsResult;
    } catch (err) {
        console.error(err);
        console.error(JSON.stringify(err));
        console.error("res", res);
    }
    
    if (!res.ok) {
        if (res.status === 429) {
            const retryAfter = res.headers.get('retry-after');
            if (retryAfter && !isNaN(Number(retryAfter))) {
                await new Promise(res => setTimeout(res, Number(retryAfter) * 1000));
                return await InstallGlobalCommands(commands);
            }
        }
        console.error(data);
        console.error(JSON.stringify(data));
    }

    return data;
}

export async function InstallGuildCommands(
    guildId: Snowflake,
    commands: RESTPutAPIApplicationGuildCommandsJSONBody
): Promise<RESTPutAPIApplicationGuildCommandsResult | undefined> {
    if (!process.env.DISCORD_CLIENT_ID) throw new Error('DISCORD_CLIENT_ID is not defined');
    if (!process.env.DISCORD_TOKEN) throw new Error('DISCORD_TOKEN is not defined');
    
    const endpoint = Routes.applicationGuildCommands(process.env.DISCORD_CLIENT_ID, guildId);
    const url = RouteBases.api + endpoint;

    const res = await fetch(url, {
        headers: {
            Authorization: `Bot ${process.env.DISCORD_TOKEN}`,
            'Content-Type': 'application/json',
        },
        method: 'PUT',
        body: JSON.stringify(commands),
    });

    let data;
    try {
        data = await res.json() as RESTPutAPIApplicationGuildCommandsResult;
    } catch (err) {
        console.error(err);
        console.error(JSON.stringify(err));
        console.error("res", res);
    }
    
    if (!res.ok) {
        if (res.status === 429) {
            const retryAfter = res.headers.get('retry-after');
            if (retryAfter && !isNaN(Number(retryAfter))) {
                await new Promise(res => setTimeout(res, Number(retryAfter) * 1000));
                return await InstallGuildCommands(guildId, commands);
            }
        }
        console.error(data);
        console.error(JSON.stringify(data));
    }

    return data;
}

export async function CreateChannel(
    guildId: Snowflake,
    options: RESTPostAPIGuildChannelJSONBody
): Promise<RESTPostAPIGuildChannelResult | undefined> {
    if (!process.env.DISCORD_CLIENT_ID) throw new Error('DISCORD_CLIENT_ID is not defined');
    if (!process.env.DISCORD_TOKEN) throw new Error('DISCORD_TOKEN is not defined');
    
    const endpoint = Routes.guildChannels(guildId);
    const url = RouteBases.api + endpoint;

    const res = await fetch(url, {
        headers: {
            Authorization: `Bot ${process.env.DISCORD_TOKEN}`,
            'Content-Type': 'application/json',
        },
        method: 'POST',
        body: JSON.stringify(options),
    });

    let data;
    try {
        data = await res.json() as RESTPostAPIGuildChannelResult;
    } catch (err) {
        console.error(err);
        console.error(JSON.stringify(err));
        console.error("res", res);
    }
    
    if (!res.ok) {
        if (res.status === 429) {
            const retryAfter = res.headers.get('retry-after');
            if (retryAfter && !isNaN(Number(retryAfter))) {
                await new Promise(res => setTimeout(res, Number(retryAfter) * 1000));
                return await CreateChannel(guildId, options);
            }
        }
        console.error(data);
        console.error(JSON.stringify(data));
    }

    return data;
}
export async function EditChannel(
    channelId: Snowflake,
    options: RESTPatchAPIChannelJSONBody
): Promise<RESTPatchAPIChannelResult | undefined> {
    if (!process.env.DISCORD_CLIENT_ID) throw new Error('DISCORD_CLIENT_ID is not defined');
    if (!process.env.DISCORD_TOKEN) throw new Error('DISCORD_TOKEN is not defined');
    
    const endpoint = Routes.channel(channelId);
    const url = RouteBases.api + endpoint;

    const res = await fetch(url, {
        headers: {
            Authorization: `Bot ${process.env.DISCORD_TOKEN}`,
            'Content-Type': 'application/json',
        },
        method: 'PATCH',
        body: JSON.stringify(options),
    });

    let data;
    try {
        data = await res.json() as RESTPatchAPIChannelResult;
    } catch (err) {
        console.error(err);
        console.error(JSON.stringify(err));
        console.error("res", res);
    }
    
    if (!res.ok) {
        if (res.status === 429) {
            const retryAfter = res.headers.get('retry-after');
            if (retryAfter && !isNaN(Number(retryAfter))) {
                await new Promise(res => setTimeout(res, Number(retryAfter) * 1000));
                return await EditChannel(channelId, options);
            }
        }
        console.error(data);
        console.error(JSON.stringify(data));
    }

    return data;
}
export async function DeleteChannel(channelId: Snowflake): Promise<RESTDeleteAPIChannelResult | undefined> {
    if (!process.env.DISCORD_CLIENT_ID) throw new Error('DISCORD_CLIENT_ID is not defined');
    if (!process.env.DISCORD_TOKEN) throw new Error('DISCORD_TOKEN is not defined');
    
    const endpoint = Routes.channel(channelId);
    const url = RouteBases.api + endpoint;

    const res = await fetch(url, {
        headers: {
            Authorization: `Bot ${process.env.DISCORD_TOKEN}`,
        },
        method: 'DELETE',
    });

    let data;
    try {
        data = await res.json() as RESTDeleteAPIChannelResult;
    } catch (err) {
        console.error(err);
        console.error(JSON.stringify(err));
        console.error("res", res);
    }
    
    if (!res.ok) {
        if (res.status === 429) {
            const retryAfter = res.headers.get('retry-after');
            if (retryAfter && !isNaN(Number(retryAfter))) {
                await new Promise(res => setTimeout(res, Number(retryAfter) * 1000));
                return await DeleteChannel(channelId);
            }
        }
        console.error(data);
        console.error(JSON.stringify(data));
    }

    return data;
}
export async function SendMessage(
    channelId: Snowflake,
    messageData: RESTPostAPIChannelMessageJSONBody,
    attachmentURLs?: {
        id: number,
        url: string,
        filename: string
    }[]
): Promise<RESTPostAPIChannelMessageResult | undefined> {
    if (!process.env.DISCORD_CLIENT_ID) throw new Error('DISCORD_CLIENT_ID is not defined');
    if (!process.env.DISCORD_TOKEN) throw new Error('DISCORD_TOKEN is not defined');

    const endpoint = Routes.channelMessages(channelId);
    const url = RouteBases.api + endpoint;

    const formData = new FormData();
    formData.append('payload_json', JSON.stringify(messageData));
    if (attachmentURLs) {
        await Promise.all(attachmentURLs.map(async (attachment) => {
            const blob = await fetch(attachment.url).then(res => res.blob());
            formData.append(`files[${attachment.id}]`, blob, attachment.filename);
        }));
    }

    const res = await fetch(url, {
        headers: {
            Authorization: `Bot ${process.env.DISCORD_TOKEN}`,
        },
        method: 'POST',
        body: formData,
    });

    let data;
    try {
        data = await res.json() as RESTPostAPIChannelMessageResult;
    } catch (err) {
        console.error(err);
        console.error(JSON.stringify(err));
        console.error("res", res);
    }
    
    if (!res.ok) {
        if (res.status === 429) {
            const retryAfter = res.headers.get('retry-after');
            if (retryAfter && !isNaN(Number(retryAfter))) {
                await new Promise(res => setTimeout(res, Number(retryAfter) * 1000));
                return await SendMessage(channelId, messageData);
            }
        }
        console.error(data);
        console.error(JSON.stringify(data));
    }

    return data;
}
export async function EditMessage(
    channelId: Snowflake,
    messageId: Snowflake,
    messageData: RESTPatchAPIChannelMessageJSONBody,
    attachmentURLs?: {
        id: number,
        url: string,
        filename: string
    }[]
): Promise<RESTPatchAPIChannelMessageResult | undefined> {
    if (!process.env.DISCORD_CLIENT_ID) throw new Error('DISCORD_CLIENT_ID is not defined');
    if (!process.env.DISCORD_TOKEN) throw new Error('DISCORD_TOKEN is not defined');

    const endpoint = Routes.channelMessage(channelId, messageId);
    const url = RouteBases.api + endpoint;

    const formData = new FormData();
    formData.append('payload_json', JSON.stringify(messageData));
    if (attachmentURLs) {
        await Promise.all(attachmentURLs.map(async (attachment) => {
            const blob = await fetch(attachment.url).then(res => res.blob());
            formData.append(`files[${attachment.id}]`, blob, attachment.filename);
        }));
    }

    const res = await fetch(url, {
        headers: {
            Authorization: `Bot ${process.env.DISCORD_TOKEN}`,
        },
        method: 'PATCH',
        body: formData,
    });

    let data;
    try {
        data = await res.json() as RESTPatchAPIChannelMessageResult;
    } catch (err) {
        console.error(err);
        console.error(JSON.stringify(err));
        console.error("res", res);
    }
    
    if (!res.ok) {
        if (res.status === 429) {
            const retryAfter = res.headers.get('retry-after');
            if (retryAfter && !isNaN(Number(retryAfter))) {
                await new Promise(res => setTimeout(res, Number(retryAfter) * 1000));
                return await EditMessage(channelId, messageId, messageData);
            }
        }
        console.error(data);
        console.error(JSON.stringify(data));
    }

    return data;
}
export async function DeleteMessage(
    channelId: Snowflake,
    messageId: Snowflake,
): Promise<RESTPatchAPIChannelMessageResult | undefined> {
    if (!process.env.DISCORD_CLIENT_ID) throw new Error('DISCORD_CLIENT_ID is not defined');
    if (!process.env.DISCORD_TOKEN) throw new Error('DISCORD_TOKEN is not defined');

    const endpoint = Routes.channelMessage(channelId, messageId);
    const url = RouteBases.api + endpoint;

    const res = await fetch(url, {
        headers: {
            Authorization: `Bot ${process.env.DISCORD_TOKEN}`,
        },
        method: 'DELETE',
    });

    if (res.status === 204) return;

    let data;
    try {
        data = await res.json() as RESTPatchAPIChannelMessageResult;
    } catch (err) {
        console.error(err);
        console.error(JSON.stringify(err));
        console.error("res", res);
    }
    
    if (!res.ok) {
        if (res.status === 429) {
            const retryAfter = res.headers.get('retry-after');
            if (retryAfter && !isNaN(Number(retryAfter))) {
                await new Promise(res => setTimeout(res, Number(retryAfter) * 1000));
                return await DeleteMessage(channelId, messageId);
            }
        }
        console.error(data);
        console.error(JSON.stringify(data));
    }

    return data;
}
export async function CreateInteractionResponse(
    id: Snowflake,
    token: Snowflake,
    messageData: RESTPostAPIInteractionCallbackJSONBody
): Promise<RESTPostAPIInteractionCallbackWithResponseResult | undefined> {
    if (!process.env.DISCORD_CLIENT_ID) throw new Error('DISCORD_CLIENT_ID is not defined');
    if (!process.env.DISCORD_TOKEN) throw new Error('DISCORD_TOKEN is not defined');

    const endpoint = Routes.interactionCallback(id, token);
    const url = RouteBases.api + endpoint;

    const formData = new FormData();
    formData.append('payload_json', JSON.stringify(messageData));

    const res = await fetch(url, {
        headers: {
            Authorization: `Bot ${process.env.DISCORD_TOKEN}`,
        },
        method: 'POST',
        body: formData,
    });

    let data;
    // try {
    //     data = await res.json() as RESTPostAPIInteractionCallbackWithResponseResult;
    // } catch (err) {
    //     console.error(err);
    //     console.error(JSON.stringify(err));
    //     console.error("res", res);
    // }
    
    if (!res.ok) {
        if (res.status === 429) {
            const retryAfter = res.headers.get('retry-after');
            if (retryAfter && !isNaN(Number(retryAfter))) {
                await new Promise(res => setTimeout(res, Number(retryAfter) * 1000));
                return await CreateInteractionResponse(id, token, messageData);
            }
        }
        // console.error(data);
        // console.error(JSON.stringify(data));
    }

    return data;
}
export async function FollowupMessage(
    token: Snowflake,
    messageData: RESTPatchAPIWebhookWithTokenMessageJSONBody,
    attachmentURLs?: {
        id: number,
        url: string,
        filename: string
    }[]
): Promise<RESTPatchAPIWebhookWithTokenMessageResult | undefined> {
    if (!process.env.DISCORD_CLIENT_ID) throw new Error('DISCORD_CLIENT_ID is not defined');
    if (!process.env.DISCORD_TOKEN) throw new Error('DISCORD_TOKEN is not defined');

    const endpoint = Routes.webhookMessage(process.env.DISCORD_CLIENT_ID, token, "@original");
    const url = RouteBases.api + endpoint;

    const formData = new FormData();
    formData.append('payload_json', JSON.stringify(messageData));
    if (attachmentURLs) {
        await Promise.all(attachmentURLs.map(async (attachment) => {
            const blob = await fetch(attachment.url).then(res => res.blob());
            formData.append(`files[${attachment.id}]`, blob, attachment.filename);
        }));
    }

    const res = await fetch(url, {
        headers: {
            Authorization: `Bot ${process.env.DISCORD_TOKEN}`,
        },
        method: 'PATCH',
        body: formData,
    });

    let data;
    try {
        data = await res.json() as RESTPatchAPIWebhookWithTokenMessageResult;
    } catch (err) {
        console.error(err);
        console.error(JSON.stringify(err));
        console.error("res", res);
    }
    
    if (!res.ok) {
        if (res.status === 429) {
            const retryAfter = res.headers.get('retry-after');
            console.log('FollowupMessage Retrying', retryAfter);
            if (retryAfter && !isNaN(Number(retryAfter))) {
                await new Promise(res => setTimeout(res, Number(retryAfter) * 1000));
                return await FollowupMessage(token, messageData, attachmentURLs);
            }
        }
        console.error(data);
        console.error(JSON.stringify(data));
        console.error("res", res);
        console.error("res", JSON.stringify(res));
    }

    return data;
}
export async function GetOringinalInteractionResponse(
    token: Snowflake
): Promise<RESTGetAPIWebhookWithTokenMessageResult | undefined> {
    if (!process.env.DISCORD_CLIENT_ID) throw new Error('DISCORD_CLIENT_ID is not defined');
    if (!process.env.DISCORD_TOKEN) throw new Error('DISCORD_TOKEN is not defined');

    const endpoint = Routes.webhookMessage(process.env.DISCORD_CLIENT_ID, token, "@original");
    const url = RouteBases.api + endpoint;

    const res = await fetch(url, {
        headers: {
            Authorization: `Bot ${process.env.DISCORD_TOKEN}`,
        },
        method: 'GET',
    });

    let data;
    try {
        data = await res.json() as RESTGetAPIWebhookWithTokenMessageResult;
    } catch (err) {
        console.error(err);
        console.error(JSON.stringify(err));
        console.error("res", res);
    }
    
    if (!res.ok) {
        if (res.status === 429) {
            const retryAfter = res.headers.get('retry-after');
            console.log('GetOringinalInteractionResponse Retrying', retryAfter);
            if (retryAfter && !isNaN(Number(retryAfter))) {
                await new Promise(res => setTimeout(res, Number(retryAfter) * 1000));
                return await GetOringinalInteractionResponse(token);
            }
        }
        console.error(data);
        console.error(JSON.stringify(data));
        console.error("res", res);
        console.error("res", JSON.stringify(res));
    }

    return data;
}

export async function AddGuildMemberRole(
    guildId: Snowflake,
    memberId: Snowflake,
    roleId: Snowflake
): Promise<boolean> {
    if (!process.env.DISCORD_CLIENT_ID) throw new Error('DISCORD_CLIENT_ID is not defined');
    if (!process.env.DISCORD_TOKEN) throw new Error('DISCORD_TOKEN is not defined');

    const endpoint = Routes.guildMemberRole(guildId, memberId, roleId);
    const url = RouteBases.api + endpoint;
    const res = await fetch(url, {
        headers: {
            Authorization: `Bot ${process.env.DISCORD_TOKEN}`,
        },
        method: 'PUT',
    });
    
    if (!res.ok) {
        if (res.status === 429) {
            const retryAfter = res.headers.get('retry-after');
            if (retryAfter && !isNaN(Number(retryAfter))) {
                await new Promise(res => setTimeout(res, Number(retryAfter) * 1000));
                return await AddGuildMemberRole(guildId, memberId, roleId);
            }
        }
    }

    return res.status === 204;
}
export async function RemoveGuildMemberRole(
    guildId: Snowflake,
    memberId: Snowflake,
    roleId: Snowflake
): Promise<boolean> {
    if (!process.env.DISCORD_CLIENT_ID) throw new Error('DISCORD_CLIENT_ID is not defined');
    if (!process.env.DISCORD_TOKEN) throw new Error('DISCORD_TOKEN is not defined');

    const endpoint = Routes.guildMemberRole(guildId, memberId, roleId);
    const url = RouteBases.api + endpoint;
    const res = await fetch(url, {
        headers: {
            Authorization: `Bot ${process.env.DISCORD_TOKEN}`,
        },
        method: 'DELETE',
    });
    
    if (!res.ok) {
        if (res.status === 429) {
            const retryAfter = res.headers.get('retry-after');
            if (retryAfter && !isNaN(Number(retryAfter))) {
                await new Promise(res => setTimeout(res, Number(retryAfter) * 1000));
                return await RemoveGuildMemberRole(guildId, memberId, roleId);
            }
        }
    }

    return res.status === 204;
}

export async function ListGuildMembers(
    guildId: Snowflake,
    options: RESTGetAPIGuildMembersQuery
): Promise<RESTGetAPIGuildMembersResult | undefined> {
    if (!process.env.DISCORD_CLIENT_ID) throw new Error('DISCORD_CLIENT_ID is not defined');
    if (!process.env.DISCORD_TOKEN) throw new Error('DISCORD_TOKEN is not defined');

    const endpoint = Routes.guildMembers(guildId);
    const url = RouteBases.api + endpoint + '?' + new URLSearchParams(Object.entries(options)).toString();
    const res = await fetch(url, {
        headers: {
            Authorization: `Bot ${process.env.DISCORD_TOKEN}`,
        },
        method: 'GET',
    });

    let data;
    try {
        data = await res.json() as RESTGetAPIGuildMembersResult;
    } catch (err) {
        console.error(err);
        console.error(JSON.stringify(err));
        console.error("res", res);
    }
    
    if (!res.ok) {
        if (res.status === 429) {
            const retryAfter = res.headers.get('retry-after');
            if (retryAfter && !isNaN(Number(retryAfter))) {
                await new Promise(res => setTimeout(res, Number(retryAfter) * 1000));
                return await ListGuildMembers(guildId, options);
            }
        }
        console.error(data);
        console.error(JSON.stringify(data));
    }

    return data;
}

export async function GetAllGuildMembers(
    guildId: Snowflake
): Promise<APIGuildMember[]> {
    const members: APIGuildMember[] = [];
    while (true) {
        const options = members[members.length - 1]?.user?.id ? {
            limit: 1000,
            after: members[members.length - 1].user.id
        } : {
            limit: 1000
        };
        const res = await ListGuildMembers(guildId, options);
        if (!res) break;
        members.push(...res);
        if (res.length < 1000) break;
    }
    return members;
}
export async function* GetAllGuildMembersGenerator(guildId: Snowflake): AsyncGenerator<APIGuildMember | undefined, undefined, void> {
    let members = await ListGuildMembers(guildId, {
        limit: 100,
    });
    let count = members ? members.length : 0;
    
    while (members) {
        yield members.pop();
        if (members.length === 0) {
            if (count < 100) break;
            members = await ListGuildMembers(guildId, {
                limit: 100,
                after: members[members.length - 1].user.id
            });
            count = members ? members.length : 0;
        }
    }
}

export async function GetGuildMember(
    guildId: Snowflake,
    userId: Snowflake
): Promise<RESTGetAPIGuildMemberResult | undefined> {
    if (!process.env.DISCORD_CLIENT_ID) throw new Error('DISCORD_CLIENT_ID is not defined');
    if (!process.env.DISCORD_TOKEN) throw new Error('DISCORD_TOKEN is not defined');

    const endpoint = Routes.guildMember(guildId, userId);
    const url = RouteBases.api + endpoint;
    const res = await fetch(url, {
        headers: {
            Authorization: `Bot ${process.env.DISCORD_TOKEN}`,
        },
        method: 'GET',
    });

    let data;
    try {
        data = await res.json() as RESTGetAPIGuildMemberResult;
    } catch (err) {
        console.error(err);
        console.error(JSON.stringify(err));
        console.error("res", res);
    }
    
    if (!res.ok) {
        if (res.status === 429) {
            const retryAfter = res.headers.get('retry-after');
            if (retryAfter && !isNaN(Number(retryAfter))) {
                await new Promise(res => setTimeout(res, Number(retryAfter) * 1000));
                return await GetGuildMember(guildId, userId);
            }
        }
        console.error(data);
        console.error(JSON.stringify(data));
    }

    return data;
}

export async function BanGuildMember(guildId: Snowflake, userId: Snowflake, reason: string): Promise<boolean> {
    if (!process.env.DISCORD_CLIENT_ID) throw new Error('DISCORD_CLIENT_ID is not defined');
    if (!process.env.DISCORD_TOKEN) throw new Error('DISCORD_TOKEN is not defined');

    const endpoint = Routes.guildBan(guildId, userId);
    const url = RouteBases.api + endpoint;
    const res = await fetch(url, {
        headers: {
            Authorization: `Bot ${process.env.DISCORD_TOKEN}`,
            'X-Audit-Log-Reason': reason
        },
        method: 'PUT',
    });

    return res.status === 204;
}
export async function RemoveBanGuildMember(guildId: Snowflake, userId: Snowflake, reason: string): Promise<boolean> {
    if (!process.env.DISCORD_CLIENT_ID) throw new Error('DISCORD_CLIENT_ID is not defined');
    if (!process.env.DISCORD_TOKEN) throw new Error('DISCORD_TOKEN is not defined');

    const endpoint = Routes.guildBan(guildId, userId);
    const url = RouteBases.api + endpoint;
    const res = await fetch(url, {
        headers: {
            Authorization: `Bot ${process.env.DISCORD_TOKEN}`,
            'X-Audit-Log-Reason': reason
        },
        method: 'DELETE',
    });

    return res.status === 204;
}

export async function GetChannelMessage(channelId: Snowflake, messageId: Snowflake): Promise<RESTGetAPIChannelMessageResult | undefined> {
    if (!process.env.DISCORD_CLIENT_ID) throw new Error('DISCORD_CLIENT_ID is not defined');
    if (!process.env.DISCORD_TOKEN) throw new Error('DISCORD_TOKEN is not defined');

    const endpoint = Routes.channelMessage(channelId, messageId);
    const url = RouteBases.api + endpoint;
    const res = await fetch(url, {
        headers: {
            Authorization: `Bot ${process.env.DISCORD_TOKEN}`,
        },
        method: 'GET',
    });

    let data;
    try {
        data = await res.json() as RESTGetAPIChannelMessageResult;
    } catch (err) {
        console.error(err);
        console.error(JSON.stringify(err));
        console.error("res", res);
    }
    
    if (!res.ok) {
        if (res.status === 429) {
            const retryAfter = res.headers.get('retry-after');
            if (retryAfter && !isNaN(Number(retryAfter))) {
                await new Promise(res => setTimeout(res, Number(retryAfter) * 1000));
                return await GetChannelMessage(channelId, messageId);
            }
        }
        console.error(data);
        console.error(JSON.stringify(data));
    }

    return data;
}
export async function GetChannelMessages(channelId: Snowflake, options: RESTGetAPIChannelMessagesQuery): Promise<RESTGetAPIChannelMessagesResult | undefined> {
    if (!process.env.DISCORD_CLIENT_ID) throw new Error('DISCORD_CLIENT_ID is not defined');
    if (!process.env.DISCORD_TOKEN) throw new Error('DISCORD_TOKEN is not defined');

    const endpoint = Routes.channelMessages(channelId);
    const url = RouteBases.api + endpoint + '?' + new URLSearchParams(Object.entries(options)).toString();
    const res = await fetch(url, {
        headers: {
            Authorization: `Bot ${process.env.DISCORD_TOKEN}`,
        },
        method: 'GET',
    });

    let data;
    try {
        data = await res.json() as RESTGetAPIChannelMessagesResult;
    } catch (err) {
        console.error(err);
        console.error(JSON.stringify(err));
        console.error("res", res);
    }
    
    if (!res.ok) {
        if (res.status === 429) {
            const retryAfter = res.headers.get('retry-after');
            if (retryAfter && !isNaN(Number(retryAfter))) {
                await new Promise(res => setTimeout(res, Number(retryAfter) * 1000));
                return await GetChannelMessages(channelId, options);
            }
        }
        console.error(data);
        console.error(JSON.stringify(data));
    }

    return data;
}
export async function GetAllChannelMessages(channelId: Snowflake): Promise<APIMessage[]> {
    const messages: APIMessage[] = [];
    while (true) {
        const options = messages[messages.length - 1]?.id ? {
            limit: 100,
            after: messages[messages.length - 1].id
        } : {
            limit: 100
        };
        const res = await GetChannelMessages(channelId, options);
        if (!res) break;
        messages.push(...res);
        if (res.length < 100) break;
    }
    return messages;
}
export async function* GetMessagesAfterGenerator(channelId: Snowflake, messageId: Snowflake): AsyncGenerator<APIMessage | undefined, undefined, void> {
    let messages = await GetChannelMessages(channelId, {
        limit: 100,
        after: messageId
    });
    let count = messages ? messages.length : 0;
    
    while (messages) {
        yield messages.pop();
        if (messages.length === 0) {
            if (count < 100) break;
            messages = await GetChannelMessages(channelId, {
                limit: 100,
                after: messages[messages.length - 1].id
            });
            count = messages ? messages.length : 0;
        }
    }
}

export async function CreateThread(channelId: Snowflake, options: RESTPostAPIGuildForumThreadsJSONBody): Promise<RESTPostAPIChannelMessagesThreadsResult | undefined> {
    if (!process.env.DISCORD_CLIENT_ID) throw new Error('DISCORD_CLIENT_ID is not defined');
    if (!process.env.DISCORD_TOKEN) throw new Error('DISCORD_TOKEN is not defined');

    const endpoint = Routes.threads(channelId);
    const url = RouteBases.api + endpoint;
    const res = await fetch(url, {
        headers: {
            Authorization: `Bot ${process.env.DISCORD_TOKEN}`,
            'Content-Type': 'application/json'
        },
        method: 'POST',
        body: JSON.stringify(options),
    });

    let data;
    try {
        data = await res.json() as RESTPostAPIChannelMessagesThreadsResult;
    } catch (err) {
        console.error(err);
        console.error(JSON.stringify(err));
        console.error("res", res);
    }
    
    if (!res.ok) {
        if (res.status === 429) {
            const retryAfter = res.headers.get('retry-after');
            if (retryAfter && !isNaN(Number(retryAfter))) {
                await new Promise(res => setTimeout(res, Number(retryAfter) * 1000));
                return await CreateThread(channelId, options);
            }
        }
        console.error(data);
        console.error(JSON.stringify(data));
    }

    return data;
}

export async function ExecuteWebhook(
    queryParms: RESTPostAPIWebhookWithTokenQuery,
    options: RESTPostAPIWebhookWithTokenJSONBody,
    attachmentURLs?: {
        id: number | string,
        url: string,
        filename: string
    }[]
): Promise<RESTPostAPIWebhookWithTokenResult | undefined> {
    if (!process.env.DISCORD_CLIENT_ID) throw new Error('DISCORD_CLIENT_ID is not defined');
    if (!process.env.DISCORD_TOKEN) throw new Error('DISCORD_TOKEN is not defined');
    if (!process.env.TICKET_TRANSCRIPT_WEBHOOK_ID) throw new Error('TICKET_TRANSCRIPT_WEBHOOK_ID is not defined');
    if (!process.env.TICKET_TRANSCRIPT_WEBHOOK_TOKEN) throw new Error('TICKET_TRANSCRIPT_WEBHOOK_TOKEN is not defined');

    const endpoint = Routes.webhook(process.env.TICKET_TRANSCRIPT_WEBHOOK_ID, process.env.TICKET_TRANSCRIPT_WEBHOOK_TOKEN);
    const url = RouteBases.api + endpoint + '?' + new URLSearchParams(Object.entries(queryParms)).toString();

    const formData = new FormData();
    formData.append('payload_json', JSON.stringify(options));
    if (attachmentURLs) {
        await Promise.all(attachmentURLs.map(async (attachment) => {
            const blob = await fetch(attachment.url).then(res => res.blob());
            formData.append(`files[${attachment.id}]`, blob, attachment.filename);
        }));
    }

    const res = await fetch(url, {
        headers: {
            Authorization: `Bot ${process.env.DISCORD_TOKEN}`,
        },
        method: 'POST',
        body: formData,
    });

    if (res.status === 204) return undefined;

    let data;
    try {
        data = await res.json() as RESTPostAPIWebhookWithTokenResult;
    } catch (err) {
        console.error(err);
        console.error(JSON.stringify(err));
        console.error("res", res);
    }
    
    if (!res.ok) {
        if (res.status === 429) {
            const retryAfter = res.headers.get('retry-after');
            if (retryAfter && !isNaN(Number(retryAfter))) {
                await new Promise(res => setTimeout(res, Number(retryAfter) * 1000));
                return await ExecuteWebhook(queryParms, options);
            }
        }
        console.error(data);
        console.error(JSON.stringify(data));
    }

    return data;
}

export async function GetGuildChannels(guildId: Snowflake): Promise<RESTGetAPIGuildChannelsResult | undefined> {
    if (!process.env.DISCORD_CLIENT_ID) throw new Error('DISCORD_CLIENT_ID is not defined');
    if (!process.env.DISCORD_TOKEN) throw new Error('DISCORD_TOKEN is not defined');

    const endpoint = Routes.guildChannels(guildId);
    const url = RouteBases.api + endpoint;
    const res = await fetch(url, {
        headers: {
            Authorization: `Bot ${process.env.DISCORD_TOKEN}`,
        },
        method: 'GET',
    });

    let data;
    try {
        data = await res.json() as RESTGetAPIGuildChannelsResult;
    } catch (err) {
        console.error(err);
        console.error(JSON.stringify(err));
        console.error("res", res);
    }
    
    if (!res.ok) {
        if (res.status === 429) {
            const retryAfter = res.headers.get('retry-after');
            if (retryAfter && !isNaN(Number(retryAfter))) {
                await new Promise(res => setTimeout(res, Number(retryAfter) * 1000));
                return await GetGuildChannels(guildId);
            }
        }
        console.error(data);
        console.error(JSON.stringify(data));
    }

    return data;
}

export const CheckChannelExists = {
    id: async function (guildId: Snowflake, channelID: Snowflake): Promise<
        {
            exists: false;
        } | {
            exists: true;
            channelID: Snowflake;
        }
    > {
        const channels = await GetGuildChannels(guildId);
        if (!channels) return { exists: false };

        const channel = channels.find(c => c.id === channelID);
        if (!channel) return { exists: false };

        return { exists: true, channelID: channel.id };
    },
    ids: async function (guildId: Snowflake, channelIDs: string[]): Promise<
        {
            exists: false;
        } | {
            exists: true;
            channelIDs: Snowflake[];
        }
    > {
        const channels = await GetGuildChannels(guildId);
        if (!channels) return { exists: false };

        const channelsFound = channels.filter(c => channelIDs.includes(c.id));
        if (!channelsFound) return { exists: false };

        return { exists: true, channelIDs: channelsFound.map(c => c.id) };
    },
    name: async function (guildId: Snowflake, channelName: string): Promise<
        {
            exists: false;
        } | {
            exists: true;
            channelID: Snowflake;
        }
    > {
        const channels = await GetGuildChannels(guildId);
        if (!channels) return { exists: false };

        const channel = channels.find(c => c.name === channelName);
        if (!channel) return { exists: false };

        return { exists: true, channelID: channel.id };
    },
    names: async function (guildId: Snowflake, channelNames: string[]): Promise<
        {
            exists: false;
        } | {
            exists: true;
            channelIDs: Snowflake[];
        }
    > {
        const channels = await GetGuildChannels(guildId);
        if (!channels) return { exists: false };

        const channelsFound = channels.filter(c => channelNames.includes(c.name ?? ""));
        if (!channelsFound || channelsFound.length === 0) return { exists: false };

        return { exists: true, channelIDs: channelsFound.map(c => c.id) };
    }
}

export function ToPermissions(permissions: DiscordPermissions): Permissions {
    // https://discord.com/developers/docs/topics/permissions
    let perms = 0;
    if (permissions.create_instant_invite === true)                  perms |= 0x1;
    if (permissions.kick_members === true)                           perms |= 0x2;
    if (permissions.ban_members === true)                            perms |= 0x4;
    if (permissions.administrator === true)                          perms |= 0x8;
    if (permissions.manage_channels === true)                        perms |= 0x10;
    if (permissions.manage_guild === true)                           perms |= 0x20;
    if (permissions.add_reactions === true)                          perms |= 0x40;
    if (permissions.view_audit_log === true)                         perms |= 0x80;
    if (permissions.priority_speaker === true)                       perms |= 0x100;
    if (permissions.stream === true)                                 perms |= 0x200;
    if (permissions.view_channel === true)                           perms |= 0x400;
    if (permissions.send_messages === true)                          perms |= 0x800;
    if (permissions.send_tts_messages === true)                      perms |= 0x1000;
    if (permissions.manage_messages === true)                        perms |= 0x2000;
    if (permissions.embed_links === true)                            perms |= 0x4000;
    if (permissions.attach_files === true)                           perms |= 0x8000;
    if (permissions.read_message_history === true)                   perms |= 0x10000;
    if (permissions.mention_everyone === true)                       perms |= 0x20000;
    if (permissions.use_external_emojis === true)                    perms |= 0x40000;
    if (permissions.view_guild_insights === true)                    perms |= 0x80000;
    if (permissions.connect === true)                                perms |= 0x100000;
    if (permissions.speak === true)                                  perms |= 0x200000;
    if (permissions.mute_members === true)                           perms |= 0x400000;
    if (permissions.deafen_members === true)                         perms |= 0x800000;
    if (permissions.move_members === true)                           perms |= 0x1000000;
    if (permissions.use_vad === true)                                perms |= 0x2000000;
    if (permissions.change_nickname === true)                        perms |= 0x4000000;
    if (permissions.manage_nicknames === true)                       perms |= 0x8000000;
    if (permissions.manage_roles === true)                           perms |= 0x10000000;
    if (permissions.manage_webhooks === true)                        perms |= 0x20000000;
    if (permissions.manage_guild_expressions === true)               perms |= 0x40000000;
    if (permissions.use_application_commands === true)               perms |= 0x80000000;
    if (permissions.request_to_speak === true)                       perms |= 0x100000000;
    if (permissions.manage_events === true)                          perms |= 0x200000000;
    if (permissions.manage_threads === true)                         perms |= 0x400000000;
    if (permissions.create_public_threads === true)                  perms |= 0x800000000;
    if (permissions.create_private_threads === true)                 perms |= 0x1000000000;
    if (permissions.use_external_stickers === true)                  perms |= 0x2000000000;
    if (permissions.send_messages_in_threads === true)               perms |= 0x4000000000;
    if (permissions.start_embedded_activities === true)              perms |= 0x8000000000;
    if (permissions.moderate_members === true)                       perms |= 0x10000000000;
    if (permissions.view_creator_monetization_analytics === true)    perms |= 0x20000000000;
    if (permissions.use_soundboard === true)                         perms |= 0x40000000000;
    if (permissions.create_guild_expressions === true)               perms |= 0x80000000000;
    if (permissions.create_events === true)                          perms |= 0x100000000000;
    if (permissions.use_external_sounds === true)                    perms |= 0x200000000000;
    if (permissions.send_voice_messages === true)                    perms |= 0x400000000000;
    if (permissions.send_polls === true)                             perms |= 0x2000000000000;
    if (permissions.use_external_apps === true)                      perms |= 0x4000000000000;
    return perms.toString();
}

export function formatNumber(num: number, decimals = 2): string {
    if (num >= 1_000_000_000_000) return (num / 1_000_000_000_000).toFixed(decimals) + 'T';
    if (num >= 1_000_000_000) return (num / 1_000_000_000).toFixed(decimals) + 'B';
    if (num >= 1_000_000) return (num / 1_000_000).toFixed(decimals) + 'M';
    if (num >= 1_000) return (num / 1_000).toFixed(decimals) + 'K';
    // if whole number then return as is
    if (num % 1 === 0) return num.toString();
    return num.toFixed(decimals);
}

export interface SuperlativeCallbackSuccess {
    success: true;
    value: number;
    formattedValue: string;
    current: number;
}

export interface SuperlativeCallbackError {
    success: false;
    message: string;
    ping?: boolean;
}

async function getSuperlativeValue(
    uuid: string,
    formatValue: (value: number) => string
): Promise<SuperlativeCallbackError | SuperlativeCallbackSuccess> {
    let user = null;
    const { rows } = await sql`SELECT * FROM users WHERE uuid=${uuid}`;
    if (rows.length > 0) user = rows[0];
    if (user === null) return {
        success: false,
        message: `User not found: ${uuid}`
    };
    let value = 0;
    if (user.cataxp != null) value = user.cataxp - user.oldxp;
    return {
        success: true,
        value: value,
        formattedValue: formatValue(value),
        current: user.cataxp != null ? user.cataxp : user.oldxp
    }
}
async function updateSuperlativeValue(
    uuid: string,
    func: (profile: SkyBlockProfileMember) => number | undefined
): Promise<number | {
    success: false;
    status?: number;
    message: string;
    ping?: boolean;
    retry?: number | null;
}> {
    let totalExp = 0;
    
    let value = 0;
    const profiles = await getProfiles(uuid);
    if (profiles.success === false) return profiles;
    profiles.profiles.forEach((profile) => {
        const temp = func(profile.members[uuid]);
        if (temp && temp > 0) {
            if (value < temp) value = temp;
        }
        const exp = profile.members[uuid]?.leveling?.experience ?? 0;
        if (exp && exp > 0) {
            if (totalExp < exp) totalExp = exp;
        }
    });

    const PlayerInDB = await getDiscordRole(uuid);
    if (PlayerInDB) {
        // Superlative already has a limit on updates, so no need to check here
        // if (PlayerInDB.expupdated <= Date.now() - 1000 * 60 * 60) {
            // Update if it's been over an hour since last update
            await updateDiscordRoleExp(uuid, totalExp);
        // }
    } else {
        await addDiscordRole(uuid, null, null, totalExp);
    }
    
    return value;
}

const ServerID = "823061629812867113";
const StaticIDs = {
    Jforjo: "791380888197660722",
    Ducksicle: "474770139363934219",
    GiveawayBoat: "530082442967646230"
};
const Channels = {
    staffgeneral: "823077540654612492",
    support: "910160132233658408",
    carrierapps: "1004135601534152755",
    transcriptForum: "1320673392801878036",
    surveyResponses: "1337447048672448576",
    giveaways: "882151291340611605",
    reqgiveaways: "980520250766426142",
    flashgiveaways: "1066461763266154537",
    giveawaypayout: "1070783580617314434",
    duckoc: "1166902454496006196",
    ducklingoc: "1166900860224294932",
    nitroboosts: "982019701918035978",
    verification: "1287099048796356608",
};
const ChannelGroups = {
    tickets: "988883238292451378",
    carrytickets: "1004180629551845466",
};
const TicketTypes = [
    {
        id: "duckapp",
        name: "Duck Application",
        catagory: ChannelGroups.tickets,
        ticketName: "duck",
        // Can't open a ticket if one of the following is already open (ticketName + "-" + username)
        excludes: [
            "duck",
            "duckling"
        ]
    },
    {
        id: "ducklingapp",
        name: "Duckling Application",
        catagory: ChannelGroups.tickets,
        ticketName: "duckling",
        // Can't open a ticket if one of the following is already open (ticketName + "-" + username)
        excludes: [
            "duck",
            "duckling"
        ]
    },
    {
        id: "support",
        name: "Support",
        catagory: ChannelGroups.tickets,
        ticketName: "support",
        excludes: [
            "support"
        ]
    },
    {
        id: "sponsor",
        name: "Sponsor Giveaway",
        catagory: ChannelGroups.tickets,
        ticketName: "sponsor",
        excludes: [
            "sponsor"
        ]
    },
    {
        id: "claim",
        name: "Claim Giveaway",
        catagory: ChannelGroups.tickets,
        ticketName: "claim",
        excludes: [
            "claim"
        ]
    }
];
const TranscriptForum = {
    tags: [
        {
            id: "1320673664441782313",
            name: "duckapp",
        },
        {
            id: "1320673729675788428",
            name: "ducklingapp",
        },
        {
            id: "1320813268230733995",
            name: "support",
        },
        {
            id: "1329003228020604928",
            name: "sponsor",
        },
        {
            id: "1320812842685042698",
            name: "claim",
        }
    ]
};
const Roles = {
    owner: "823071305795633163",
    admin: "824393734921650247",
    mod_duck: "886312078611206144",
    mod_duckling: "997610270262296717",
    service_management: "1021284854626779136",
    staff: "1004180925606805614",
    trainee: "992638050377142392",
    helper: "1281079969258147870",
    verified: "1287098228067664004",
    duck_guild_member: "933258162931400764",
    duckling_guild_member: "998380474407846000",
    immune: "1276013765405704266",
    booster: "881421446017056799",
    booster2x: "993257342848213126",
    levels: [
        {
            id: "1328090605481627698",
            requirement: 44000
        },
        {
            id: "1328090513793880234",
            requirement: 40000
        },
        {
            id: "1328090470974230680",
            requirement: 36000
        },
        {
            id: "1328090385909809173",
            requirement: 32000
        },
        {
            id: "1328090310470795335",
            requirement: 28000
        },
        {
            id: "1328090223221149786",
            requirement: 24000
        },
        {
            id: "1328089436894007506",
            requirement: 0
        },
    ],
    carrier_f1_4: "1004131288023830638",
    carrier_f5_6: "1004131419553005710",
    carrier_f7: "1004131451077406750",
    carrier_m1: "1004131476650070036",
    carrier_m2: "1004131503640420424",
    carrier_m3: "1004131520656707686",
    carrier_m4: "1004131539539468369",
    carrier_m5: "1004131565124730991",
    carrier_m6: "1004131581696422109",
    carrier_m7: "1004131601971675246",
    carrier_rev: "1004131669487403078",
    carrier_tara: "1004131737795833936",
    carrier_sven: "1004131758616367225",
    carrier_eman1_3: "1004131780682596352",
    carrier_eman4: "1004131845266493500",
    carrier_inferno1_3: "1004131871774494842",
    carrier_inferno4: "1004131911263854713",
    carrier_kuudra1_2: "1119807379903623258",
    carrier_kuudra3_4: "1119807706841235496",
    carrier_kuudra5: "1119807771458670654",
    reaction: {
        partyping: [
            {
                id: "f1",
                role: "1367341590904836178",
                emoji: {
                    name: "f1",
                    id: "993373840744914994"
                }
            },
            {
                id: "f2",
                role: "1367342170289213470",
                emoji: {
                    name: "f2",
                    id: "993374018289803324"
                }
            },
            {
                id: "f3",
                role: "1367342276560289862",
                emoji: {
                    name: "f3",
                    id: "993374302189670482"
                }
            },
            {
                id: "f4",
                role: "1367342554336592013",
                emoji: {
                    name: "f4",
                    id: "993374418954895390"
                }
            },
            {
                id: "f5",
                role: "1367342642861441105",
                emoji: {
                    name: "f5",
                    id: "993374590342529024"
                }
            },
            {
                id: "f6",
                role: "1367342754463744031",
                emoji: {
                    name: "f6",
                    id: "993374890839248897"
                }
            },
            {
                id: "f7",
                role: "1367342876953935922",
                emoji: {
                    name: "f7",
                    id: "993374993088008212"
                }
            },
            {
                id: "m1",
                role: "1367343091572281436",
                emoji: {
                    name: "m1",
                    id: "993379795142447124"
                }
            },
            {
                id: "m2",
                role: "1367343201819689053",
                emoji: {
                    name: "m2",
                    id: "993379836833828888"
                }
            },
            {
                id: "m3",
                role: "1367343199974068236",
                emoji: {
                    name: "m3",
                    id: "993379969621295194"
                }
            },
            {
                id: "m4",
                role: "1367343204902506607",
                emoji: {
                    name: "m4",
                    id: "993380134855905300"
                }
            },
            {
                id: "m5",
                role: "1367343203120054353",
                emoji: {
                    name: "m5",
                    id: "993380146910347365"
                }
            },
            {
                id: "m6",
                role: "1367343197948346398",
                emoji: {
                    name: "m6",
                    id: "993380158696333312"
                }
            },
            {
                id: "m7",
                role: "1367343195159269396",
                emoji: {
                    name: "m7",
                    id: "993380168632639568"
                }
            },
            {
                id: "fishwater",
                role: "1367681222326616215",
                emoji: {
                    name: "emperorskull",
                    id: "1367680897091899413"
                }
            },
            {
                id: "fishlava",
                role: "1002999878890311771",
                emoji: {
                    name: "lava",
                    id: "1002994437644898314"
                }
            },
            {
                id: "fishevent",
                role: "1002999651584200835",
                emoji: {
                    name: "megalodon",
                    id: "1002995283485012099"
                }
            },
            {
                id: "kuudra1",
                role: "1085780744128958555",
                emoji: {
                    name: "basic",
                    id: "1085779101584986212"
                }
            },
            {
                id: "kuudra2",
                role: "1085781441121636465",
                emoji: {
                    name: "hot",
                    id: "1085778751507419196"
                }
            },
            {
                id: "kuudra3",
                role: "1085781135537213520",
                emoji: {
                    name: "burning",
                    id: "1085778750240739378"
                }
            },
            {
                id: "kuudra4",
                role: "1085781531668262952",
                emoji: {
                    name: "fiery",
                    id: "1085778748076462190"
                }
            },
            {
                id: "kuudra5",
                role: "1085781213404479518",
                emoji: {
                    name: "infernal",
                    id: "1085778746650406922"
                }
            },
            {
                id: "diana",
                role: "1003000369015689306",
                emoji: {
                    name: "diana",
                    id: "1087588824944754759"
                }
            },
            {
                id: "dragon",
                role: "1085781026929918064",
                emoji: {
                    name: "edrag",
                    id: "989041893344153620"
                }
            },
            {
                id: "bestiary",
                role: "1367683516338405499",
                emoji: {
                    name: "bestiary",
                    id: "1367685221230710874"
                }
            },
            {
                id: "mineshaft",
                role: "1304830215561678848",
                emoji: {
                    name: "mineshaft",
                    id: "1367685459588939876"
                }
            },
            {
                id: "random",
                role: "1367344619079335987",
                emoji: {
                    name: "other",
                    id: "1367685881678397541"
                }
            },
        ]
    }
};
const Surveys = [
    {
        id: "guildapp",
        name: "Guild App",
        description: "Please take a moment to complete this brief survey while you wait for assistance from a staff member.",
        questions: [
            {
                question: "Where did you find our guild?",
                options: [
                    [
                        {
                            id: "discord",
                            name: "SBZ/SBS Discord",
                            type: "button"
                        },
                        {
                            id: "forum",
                            name: "Forums",
                            type: "button"
                        },
                        {
                            id: "hypixel",
                            name: "On Hypixel",
                            type: "button"
                        },
                        {
                            id: "friend",
                            name: "A Friend",
                            type: "button"
                        },
                        {
                            id: "returning",
                            name: "I'm a Returning Member",
                            type: "button"
                        }
                    ],
                    [
                        {
                            id: "other",
                            name: "Other",
                            type: "shorttext"
                        }
                    ]
                ]
            }
        ]
    }
]
const Superlatives = [
    {
        id: "oct24",
        title: "",
        start: new Date("1 October 2024 UTC").getTime(),
        callback: undefined
    },
    {
        id: "nov24",
        title: "Enderman Slayer Experience",
        start: new Date("1 November 2024 UTC").getTime(),
        callback: async function(
            uuid: string
        ): Promise<SuperlativeCallbackError | SuperlativeCallbackSuccess> {
            return await getSuperlativeValue(uuid, (value) => formatNumber(value));
        },
        update: async function(uuid: string): Promise<number | {
            success: false;
            status?: number;
            message: string;
            ping?: boolean;
            retry?: number | null;
        }> {
            return await updateSuperlativeValue(uuid, (profile) => {
                return profile?.slayer?.slayer_bosses?.enderman?.xp;
            });
        }
    },
    {
        id: "dec24",
        title: "SkyBlock Level",
        start: new Date("1 December 2024 UTC").getTime(),
        callback: async function(
            uuid: string
        ): Promise<SuperlativeCallbackError | SuperlativeCallbackSuccess> {
            return await getSuperlativeValue(uuid, (value) => formatNumber(value));
        },
        update: async function(uuid: string): Promise<number | {
            success: false;
            status?: number;
            message: string;
            ping?: boolean;
            retry?: number | null;
        }> {
            return await updateSuperlativeValue(uuid, (profile) => {
                return profile?.leveling?.experience;
            });
        },
        ranks: {
            ducks: [
                {
                    id: "GRINCH",
                    name: "grinch",
                    requirement: 0,
                },
                {
                    id: "ELF",
                    name: "elf",
                    requirement: 32000,
                },
                {
                    id: "FROSTY",
                    name: "frosty",
                    requirement: 36000,
                },
                {
                    id: "SANTA",
                    name: "santa",
                    requirement: 40000,
                },
            ],
            ducklings: [
                {
                    id: "GRINCH",
                    name: "grinch",
                    requirement: 0,
                },
                {
                    id: "ELF",
                    name: "elf",
                    requirement: 22000,
                },
                {
                    id: "FROSTY",
                    name: "frosty",
                    requirement: 26000,
                },
                {
                    id: "SANTA",
                    name: "santa",
                    requirement: 30000,
                },
            ]
        }
    },
    {
        id: "jan25",
        title: "Claimed Bestiary Milestone",
        start: new Date("1 January 2025 UTC").getTime(),
        callback: async function(
            uuid: string
        ): Promise<SuperlativeCallbackError | SuperlativeCallbackSuccess> {
            return await getSuperlativeValue(uuid, (value) => value.toString());
        },
        update: async function(uuid: string): Promise<number | {
            success: false;
            status?: number;
            message: string;
            ping?: boolean;
            retry?: number | null;
        }> {
            return await updateSuperlativeValue(uuid, (profile) => {
                return profile?.bestiary?.milestone?.last_claimed_milestone;
            });
        },
        ranks: {
            ducks: [
                {
                    id: "PREY",
                    name: "prey",
                    requirement: 0,
                },
                {
                    id: "NOVICE",
                    name: "novice",
                    requirement: 200,
                },
                {
                    id: "HUNTER",
                    name: "hunter",
                    requirement: 250,
                },
                {
                    id: "MASTER",
                    name: "master",
                    requirement: 300,
                },
            ],
            ducklings: [
                {
                    id: "PREY",
                    name: "prey",
                    requirement: 0,
                },
                {
                    id: "NOVICE",
                    name: "novice",
                    requirement: 150,
                },
                {
                    id: "HUNTER",
                    name: "hunter",
                    requirement: 200,
                },
                {
                    id: "MASTER",
                    name: "master",
                    requirement: 250,
                },
            ]
        }
    },
    {
        id: "feb25",
        title: "Gifts Received",
        start: new Date("1 February 2025 UTC").getTime(),
        callback: async function(
            uuid: string
        ): Promise<SuperlativeCallbackError | SuperlativeCallbackSuccess> {
            return await getSuperlativeValue(uuid, (value) => value.toString());
        },
        update: async function(uuid: string): Promise<number | {
            success: false;
            status?: number;
            message: string;
            ping?: boolean;
            retry?: number | null;
        }> {
            return await updateSuperlativeValue(uuid, (profile) => {
                return profile?.player_stats?.gifts?.total_received ?? 0;
            });
        },
        ranks: {
            ducks: [
                {
                    id: "RATTLE",
                    name: "rattle",
                    requirement: 0,
                },
                {
                    id: "PYTHON",
                    name: "python",
                    requirement: 2500,
                },
                {
                    id: "COBRA",
                    name: "cobra",
                    requirement: 5000,
                },
                {
                    id: "VIPER",
                    name: "viper",
                    requirement: 10000,
                },
            ],
            ducklings: [
                {
                    id: "RATTLE",
                    name: "rattle",
                    requirement: 0,
                },
                {
                    id: "PYTHON",
                    name: "python",
                    requirement: 2500,
                },
                {
                    id: "COBRA",
                    name: "cobra",
                    requirement: 5000,
                },
                {
                    id: "VIPER",
                    name: "viper",
                    requirement: 10000,
                },
            ]
        }
    },
    {
        id: "mar25",
        title: "Blaze Slayer Experience",
        start: new Date("1 March 2025 UTC").getTime(),
        callback: async function(
            uuid: string
        ): Promise<SuperlativeCallbackError | SuperlativeCallbackSuccess> {
            return await getSuperlativeValue(uuid, (value) => formatNumber(value));
        },
        update: async function(uuid: string): Promise<number | {
            success: false;
            status?: number;
            message: string;
            ping?: boolean;
            retry?: number | null;
        }> {
            return await updateSuperlativeValue(uuid, (profile) => {
                return profile?.slayer?.slayer_bosses?.blaze?.xp;
            });
        },
        ranks: {
            ducks: [
                {
                    id: "BEZAL",
                    name: "bezal",
                    requirement: 0,
                },
                {
                    id: "BLAZE",
                    name: "blaze",
                    requirement: 100000,
                },
                {
                    id: "LORD",
                    name: "demon lord",
                    requirement: 400000,
                },
                {
                    id: "KING",
                    name: "gabagool king",
                    requirement: 1000000,
                },
            ],
            ducklings: [
                {
                    id: "BEZAL",
                    name: "bezal",
                    requirement: 0,
                },
                {
                    id: "BLAZE",
                    name: "blaze",
                    requirement: 1500,
                },
                {
                    id: "LORD",
                    name: "demon lord",
                    requirement: 50000,
                },
                {
                    id: "KING",
                    name: "gabagool king",
                    requirement: 250000,
                },
            ]
        }
    },
    {
        id: "apr25",
        title: "Fishing Experience",
        start: new Date("1 April 2025 UTC").getTime(),
        callback: async function(
            uuid: string
        ): Promise<SuperlativeCallbackError | SuperlativeCallbackSuccess> {
            return await getSuperlativeValue(uuid, (value) => formatNumber(value));
        },
        update: async function(uuid: string): Promise<number | {
            success: false;
            status?: number;
            message: string;
            ping?: boolean;
            retry?: number | null;
        }> {
            return await updateSuperlativeValue(uuid, (profile) => {
                return profile?.player_data?.experience?.SKILL_FISHING;
            });
        },
        ranks: {
            ducks: [
                {
                    id: "BASS",
                    name: "bass",
                    requirement: 0,
                },
                {
                    id: "TUNA",
                    name: "tuna",
                    requirement: 38_000_000,
                },
                {
                    id: "SHARK",
                    name: "shark",
                    requirement: 55_000_000,
                },
                {
                    id: "KRAKEN",
                    name: "kraken",
                    requirement: 95_000_000,
                },
            ],
            ducklings: [
                {
                    id: "BASS",
                    name: "bass",
                    requirement: 0,
                },
                {
                    id: "TUNA",
                    name: "tuna",
                    requirement: 8_000_000,
                },
                {
                    id: "SHARK",
                    name: "shark",
                    requirement: 15_000_000,
                },
                {
                    id: "KRAKEN",
                    name: "kraken",
                    requirement: 55_000_000,
                },
            ]
        }
    },
    {
        id: "may25",
        title: "Catacombs Experience",
        start: new Date("1 May 2025 UTC").getTime(),
        callback: async function(
            uuid: string
        ): Promise<SuperlativeCallbackError | SuperlativeCallbackSuccess> {
            return await getSuperlativeValue(uuid, (value) => formatNumber(value));
        },
        update: async function(uuid: string): Promise<number | {
            success: false;
            status?: number;
            message: string;
            ping?: boolean;
            retry?: number | null;
        }> {
            return await updateSuperlativeValue(uuid, (profile) => {
                return profile?.dungeons?.dungeon_types?.catacombs?.experience;
            });
        },
        ranks: {
            ducks: [
                {
                    id: "BONZO",
                    name: "bonzo",
                    requirement: 0,
                },
                {
                    id: "THORN",
                    name: "thorn",
                    requirement: 50_000_000,
                },
                {
                    id: "LIVID",
                    name: "livid",
                    requirement: 170_000_000,
                },
                {
                    id: "NECRON",
                    name: "necron",
                    requirement: 700_000_000,
                },
            ],
            ducklings: [
                {
                    id: "BONZO",
                    name: "bonzo",
                    requirement: 0,
                },
                {
                    id: "THORN",
                    name: "thorn",
                    requirement: 10_000_000,
                },
                {
                    id: "LIVID",
                    name: "livid",
                    requirement: 20_000_000,
                },
                {
                    id: "NECRON",
                    name: "necron",
                    requirement: 80_000_000,
                },
            ]
        }
    }
];
// WIP. Currently not used anywhere.
const Help = {
    pages: [
        {
            id: "general",
            name: "General",
            description: "General information about the bot.",
            data: {
                description: [
                    `Use \`/help [command]\` to get more information about a command.`,
                    `You can also select the command using the box between the arrows below.`
                ].join("\n"),
            }
        },
        {
            id: "away",
            name: "Away",
            description: "Information about the away command.",
            data: {
                description: [
                    `This command is used to let admins know that you will be taking a leave of absence.`,
                ].join("\n"),
                fields: [
                    {
                        name: "`/away apply [reason] [leave] [return]`",
                        value: [
                            `Reason: The reason why you will be away.`,
                            `Leave: The time you will leave as a timestamp taken from [here](<https://r.3v.fi/discord-timestamps/>).`,
                            `Return: The time you will return as a timestamp taken from [here](<https://r.3v.fi/discord-timestamps/>).`,
                            `(When getting the timestamp, use '123456' instead of '<t:123456:r>')`
                        ].join("\n"),
                    }
                ]
            }
        }
    ],
    commands: [
        'away',
        'banlist',
        'checkapi',
        'embed',
        'help',
        // 'hyguessr',
        'immune',
        'ping',
        'readmessage',
        'recruit',
        'superlatives',
        'superlativedetailed',
        'updatecommands',
        'updatedatabase',
        'updateroles',
        'updatesuperlative',
        'weekly'
    ]
}

export const IsleofDucks = {
    serverID: ServerID,
    staticIDs: StaticIDs,
    channels: Channels,
    channelGroups: ChannelGroups,
    ticketTypes: TicketTypes,
    transcriptForum: TranscriptForum,
    roles: Roles,
    superlatives: Superlatives,
    surveys: Surveys,
    // WIP. Currently not used anywhere.
    help: Help
}

export const CloseTicketPermissions = {
    duckapp: new Set([
        IsleofDucks.roles.admin,
        IsleofDucks.roles.mod_duck,
        IsleofDucks.roles.mod_duckling,
        IsleofDucks.roles.service_management,
        IsleofDucks.roles.trainee,
    ]),
    ducklingapp: new Set([
        IsleofDucks.roles.admin,
        IsleofDucks.roles.mod_duck,
        IsleofDucks.roles.mod_duckling,
        IsleofDucks.roles.service_management,
        IsleofDucks.roles.trainee,
    ]),
    support: new Set([
        IsleofDucks.roles.admin,
        IsleofDucks.roles.mod_duck,
        IsleofDucks.roles.mod_duckling,
        IsleofDucks.roles.service_management,
    ]),
    sponsor: new Set([
        IsleofDucks.roles.admin,
        IsleofDucks.roles.mod_duck,
        IsleofDucks.roles.mod_duckling,
        IsleofDucks.roles.service_management,
    ]),
    claim: new Set([
        IsleofDucks.roles.admin,
        IsleofDucks.roles.mod_duck,
        IsleofDucks.roles.mod_duckling,
        IsleofDucks.roles.service_management,
    ]),
}

export interface Superlative {
    id: string;
    title: string;
    start: number;
    callback?: (
        uuid: string
    ) => Promise<SuperlativeCallbackError | SuperlativeCallbackSuccess>;
    update?: (
        uuid: string
    ) => Promise<number | {
        success: false;
        status?: number;
        message: string;
        ping?: boolean;
        retry?: number | null;
    }>;
    ranks?: {
        ducks: {
            id: string;
            name: string;
            requirement: number;
        }[],
        ducklings: {
            id: string;
            name: string;
            requirement: number;
        }[],
    };
}
export function encodeCarrierData(data: {
    f1_4: boolean;
    f5_6: boolean;
    f7: boolean;
    m1: boolean;
    m2: boolean;
    m3: boolean;
    m4: boolean;
    m5: boolean;
    m6: boolean;
    m7: boolean;
    rev: boolean;
    tara: boolean;
    sven: boolean;
    eman: boolean;
    eman4: boolean;
    inferno: boolean;
    inferno4: boolean;
    kuudrabasic: boolean;
    kuudrahot: boolean;
    kuudraburning: boolean;
    kuudrafiery: boolean;
    kuudrainfernal: boolean;
}): string {
    let bitfield = 0;
    if (data.f1_4 === true)              bitfield |= 0x1;
    if (data.f5_6 === true)              bitfield |= 0x2;
    if (data.f7 === true)                bitfield |= 0x4;
    if (data.m1 === true)                bitfield |= 0x8;
    if (data.m2 === true)                bitfield |= 0x10;
    if (data.m3 === true)                bitfield |= 0x20;
    if (data.m4 === true)                bitfield |= 0x40;
    if (data.m5 === true)                bitfield |= 0x80;
    if (data.m6 === true)                bitfield |= 0x100;
    if (data.m7 === true)                bitfield |= 0x200;
    if (data.rev === true)               bitfield |= 0x400;
    if (data.tara === true)              bitfield |= 0x800;
    if (data.sven === true)              bitfield |= 0x1000;
    if (data.eman === true)              bitfield |= 0x2000;
    if (data.eman4 === true)             bitfield |= 0x4000;
    if (data.inferno === true)           bitfield |= 0x8000;
    if (data.inferno4 === true)          bitfield |= 0x10000;
    if (data.kuudrabasic === true)       bitfield |= 0x20000;
    if (data.kuudrahot === true)         bitfield |= 0x40000;
    if (data.kuudraburning === true)     bitfield |= 0x80000;
    if (data.kuudrafiery === true)       bitfield |= 0x100000;
    if (data.kuudrainfernal === true)    bitfield |= 0x200000;
    return bitfield.toString();
}
export function decodeCarrierData(data: string): {
    f1_4: { value: boolean; role: string; };
    f5_6: { value: boolean; role: string; };
    f7: { value: boolean; role: string; };
    m1: { value: boolean; role: string; };
    m2: { value: boolean; role: string; };
    m3: { value: boolean; role: string; };
    m4: { value: boolean; role: string; };
    m5: { value: boolean; role: string; };
    m6: { value: boolean; role: string; };
    m7: { value: boolean; role: string; };
    rev: { value: boolean; role: string; };
    tara: { value: boolean; role: string; };
    sven: { value: boolean; role: string; };
    eman: { value: boolean; role: string; };
    eman4: { value: boolean; role: string; };
    inferno: { value: boolean; role: string; };
    inferno4: { value: boolean; role: string; };
    kuudrabasic: { value: boolean; role: string; };
    kuudrahot: { value: boolean; role: string; };
    kuudraburning: { value: boolean; role: string; };
    kuudrafiery: { value: boolean; role: string; };
    kuudrainfernal: { value: boolean; role: string; };
} {
    const bitfield = Number(data);
    return {
        f1_4: {
            value: (bitfield & 0x1) !== 0,
            role: IsleofDucks.roles.carrier_f1_4
        },
        f5_6: {
            value: (bitfield & 0x2) !== 0,
            role: IsleofDucks.roles.carrier_f5_6
        },
        f7: {
            value: (bitfield & 0x4) !== 0,
            role: IsleofDucks.roles.carrier_f7
        },
        m1: {
            value: (bitfield & 0x8) !== 0,
            role: IsleofDucks.roles.carrier_m1
        },
        m2: {
            value: (bitfield & 0x10) !== 0,
            role: IsleofDucks.roles.carrier_m2
        },
        m3: {
            value: (bitfield & 0x20) !== 0,
            role: IsleofDucks.roles.carrier_m3
        },
        m4: {
            value: (bitfield & 0x40) !== 0,
            role: IsleofDucks.roles.carrier_m4
        },
        m5: {
            value: (bitfield & 0x80) !== 0,
            role: IsleofDucks.roles.carrier_m5
        },
        m6: {
            value: (bitfield & 0x100) !== 0,
            role: IsleofDucks.roles.carrier_m6
        },
        m7: {
            value: (bitfield & 0x200) !== 0,
            role: IsleofDucks.roles.carrier_m7
        },
        rev: {
            value: (bitfield & 0x400) !== 0,
            role: IsleofDucks.roles.carrier_rev
        },
        tara: {
            value: (bitfield & 0x800) !== 0,
            role: IsleofDucks.roles.carrier_tara
        },
        sven: {
            value: (bitfield & 0x1000) !== 0,
            role: IsleofDucks.roles.carrier_sven
        },
        eman: {
            value: (bitfield & 0x2000) !== 0,
            role: IsleofDucks.roles.carrier_eman1_3
        },
        eman4: {
            value: (bitfield & 0x4000) !== 0,
            role: IsleofDucks.roles.carrier_eman4
        },
        inferno: {
            value: (bitfield & 0x8000) !== 0,
            role: IsleofDucks.roles.carrier_inferno1_3
        },
        inferno4: {
            value: (bitfield & 0x10000) !== 0,
            role: IsleofDucks.roles.carrier_inferno4
        },
        kuudrabasic: {
            value: (bitfield & 0x20000) !== 0,
            role: IsleofDucks.roles.carrier_kuudra1_2
        },
        kuudrahot: {
            value: (bitfield & 0x40000) !== 0,
            role: IsleofDucks.roles.carrier_kuudra1_2
        },
        kuudraburning: {
            value: (bitfield & 0x80000) !== 0,
            role: IsleofDucks.roles.carrier_kuudra3_4
        },
        kuudrafiery: {
            value: (bitfield & 0x100000) !== 0,
            role: IsleofDucks.roles.carrier_kuudra3_4
        },
        kuudrainfernal: {
            value: (bitfield & 0x200000) !== 0,
            role: IsleofDucks.roles.carrier_kuudra5
        },
    }
}

export const Emojis = {
    yes: "<:yes:1288141736756908113>",
    no: "<:no:1288141853018951811>",
    up: "<:up:1319369863323451502>",
    down: "<:down:1319369715780423691>",
}


export interface Embed {
    title?: string;
    description?: string;
    fields?: {
        name: string;
        value: string;
        inline?: boolean;
    }[];
    color: number;
    footer?: {
        text: string;
    };
    timestamp?: string;
    image?: {
        url: string;
    };
    thumbnail?: {
        url: string;
    }
}
export async function CheckEmbedExists(embedID: string): Promise<boolean> {
    const { rows } = await sql`SELECT name FROM embeds WHERE name = ${embedID}`;
    return rows.length > 0;
}
export async function GetEmbedData(embedID: string): Promise<{
    success: false;
    message: string;
} | {
    success: true;
    content: string | undefined;
    embeds: string;
    components?: string;
    attachments?: string;
}> {
    const { rows } = await sql`SELECT * FROM embeds WHERE name = ${embedID}`;
    if (rows.length === 0) {
        return {
            success: false,
            message: "Embed not found",
        };
    }
    return {
        success: true,
        content: rows[0].content === null ? undefined : rows[0].content,
        embeds: rows[0].data,
        components: rows[0].components,
        attachments: rows[0].attachments
    }
}
export async function EditEmbedData(embedID: string, content: string | null, embeds: string | null, components?: string, attachments?: string): Promise<void> {
    await sql`UPDATE embeds SET content = ${content}, data = ${embeds}, components = ${components ?? null}, attachments = ${attachments ?? null} WHERE name = ${embedID}`;
}
export async function CreateEmbedData(embedID: string, content: string | null, embeds: string | null, components?: string, attachments?: string): Promise<void> {
    await sql`INSERT INTO embeds (name, content, data, components, attachments) VALUES (${embedID}, ${content}, ${embeds}, ${components ?? null}, ${attachments ?? null})`;
}
export async function DeleteEmbedData(embedID: string): Promise<void> {
    await sql`DELETE FROM embeds WHERE name = ${embedID}`;
}