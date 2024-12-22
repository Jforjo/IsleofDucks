import { sql } from "@vercel/postgres";
import { Permissions, Snowflake } from "discord-api-types/globals"
import { APIBaseComponent, APIGuildMember, ComponentType, RESTGetAPIGuildMemberResult, RESTGetAPIGuildMembersQuery, RESTGetAPIGuildMembersResult, RESTPatchAPIChannelJSONBody, RESTPatchAPIChannelResult, RESTPatchAPIWebhookWithTokenMessageJSONBody, RESTPatchAPIWebhookWithTokenMessageResult, RESTPostAPIChannelMessageJSONBody, RESTPostAPIChannelMessageResult, RESTPostAPIGuildChannelJSONBody, RESTPostAPIGuildChannelResult, RESTPostAPIInteractionCallbackJSONBody, RESTPostAPIInteractionCallbackWithResponseResult, RESTPutAPIApplicationCommandsJSONBody, RESTPutAPIApplicationCommandsResult, RESTPutAPIApplicationGuildCommandsJSONBody, RESTPutAPIApplicationGuildCommandsResult, RouteBases, Routes } from "discord-api-types/v10";
import { getProfiles } from "./hypixelUtils";

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

export const DISCORD_EPOCH = 1420070400000

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

    const formData = new FormData();
    formData.append('payload_json', JSON.stringify(commands));

    const res = await fetch(url, {
        headers: {
            Authorization: `Bot ${process.env.DISCORD_TOKEN}`,
        },
        method: 'PUT',
        body: formData,
    });

    let data;
    try {
        data = await res.json() as RESTPutAPIApplicationCommandsResult;
    } catch (err) {
        console.error(err);
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

    const formData = new FormData();
    formData.append('payload_json', JSON.stringify(commands));

    const res = await fetch(url, {
        headers: {
            Authorization: `Bot ${process.env.DISCORD_TOKEN}`,
        },
        method: 'PUT',
        body: formData,
    });

    let data;
    try {
        data = await res.json() as RESTPutAPIApplicationGuildCommandsResult;
    } catch (err) {
        console.error(err);
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

    const formData = new FormData();
    formData.append('payload_json', JSON.stringify(options));

    const res = await fetch(url, {
        headers: {
            Authorization: `Bot ${process.env.DISCORD_TOKEN}`,
        },
        method: 'POST',
        body: formData,
    });

    let data;
    try {
        data = await res.json() as RESTPostAPIGuildChannelResult;
    } catch (err) {
        console.error(err);
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

    const formData = new FormData();
    formData.append('payload_json', JSON.stringify(options));

    const res = await fetch(url, {
        headers: {
            Authorization: `Bot ${process.env.DISCORD_TOKEN}`,
        },
        method: 'PATCH',
        body: formData,
    });

    let data;
    try {
        data = await res.json() as RESTPatchAPIChannelResult;
    } catch (err) {
        console.error(err);
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
        console.error("res", res);
    }
    
    if (!res.ok) {
        if (res.status === 429) {
            const retryAfter = res.headers.get('retry-after');
            if (retryAfter && !isNaN(Number(retryAfter))) {
                await new Promise(res => setTimeout(res, Number(retryAfter) * 1000));
                return await FollowupMessage(token, messageData);
            }
        }
        console.error(data);
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

    return res.ok;
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

    return res.ok;
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
    return num.toFixed(decimals);
}

export const IsleofDucks = {
    serverID: "823061629812867113",
    staticIDs: {
        Jforjo: "791380888197660722",
        Ducksicle: "474770139363934219"
    },
    channels: {
        staffgeneral: "823077540654612492",
        support: "910160132233658408",
        carrierapps: "1004135601534152755",
    },
    channelGroups: {
        tickets: "988883238292451378",
        carrytickets: "1004180629551845466"
    },
    roles: {
        owner: "823071305795633163",
        admin: "824393734921650247",
        mod_duck: "886312078611206144",
        mod_duckling: "997610270262296717",
        service_management: "1021284854626779136",
        staff: "1004180925606805614",
        trainee: "992638050377142392",
        verified: "1287098228067664004",
        duck_guild_member: "933258162931400764",
        duckling_guild_member: "998380474407846000",
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
    },
    superlatives: [
        {
            id: "oct24",
            title: "",
            start: new Date("1 October 2024").getTime(),
            callback: undefined
        },
        {
            id: "nov24",
            title: "Enderman Slayer Experience",
            start: new Date("1 November 2024").getTime(),
            callback: async function(
                uuid: string
            ): Promise<
                {
                    success: false;
                    message: string;
                    ping?: boolean;
                } | {
                    success: true;
                    value: number;
                    formattedValue: string;
                    current: number;
                }
            > {
                let value = 0;
                let user = null;
                const timestamp = Date.now();
                let updateDB = false;
                let currentXP = 0;

                const { rows } = await sql`SELECT * FROM users WHERE uuid=${uuid}`;
                if (rows.length > 0) user = rows[0];
                if (user != null && user.lastupdated > timestamp - 1000 * 60 * 5) {
                    if (user?.oldxp != null) {
                        value = user.cataxp - user.oldxp;
                        currentXP = user.cataxp;
                    } else {
                        value = user.cataxp;
                        currentXP = user.cataxp;
                    }
                } else {
                    const profiles = await getProfiles(uuid);
                    if (profiles.success === false) return profiles;
                    profiles.profiles.forEach((profile) => {
                        const temp = profile.members[uuid]?.slayer?.slayer_bosses?.enderman?.xp;
                        if (temp && temp > 0) {
                            if (value < temp) value = temp;
                        }
                    });
                    updateDB = true;
                    currentXP = value;
                }

                if (updateDB) {
                    if (user == null) {
                        await sql`INSERT INTO users(uuid, cataxp, oldxp, lastupdated) VALUES (${uuid}, ${value}, ${value}, ${timestamp})`;
                        value = 0;
                    } else {
                        if (user?.oldxp == null) {
                            await sql`UPDATE users SET (cataxp, oldxp, lastupdated) = (${value}, ${value}, ${timestamp}) WHERE uuid = ${uuid}`;
                            value = 0;
                        } else {
                            await sql`UPDATE users SET (cataxp, lastupdated) = (${value}, ${timestamp}) WHERE uuid = ${uuid}`;
                            value -= user.oldxp;
                        }
                    }
                }

                return {
                    success: true,
                    value: value,
                    formattedValue: formatNumber(value),
                    current: currentXP
                };
            },
        },
        {
            id: "dec24",
            title: "SkyBlock Level",
            start: new Date("1 December 2024").getTime(),
            callback: async function(
                uuid: string
            ): Promise<
                {
                    success: false;
                    message: string;
                    ping?: boolean;
                } | {
                    success: true;
                    value: number;
                    formattedValue: string;
                    current: number;
                }
            > {
                let value = 0;
                let user = null;
                const timestamp = Date.now();
                let updateDB = false;
                let currentXP = 0;

                const { rows } = await sql`SELECT * FROM users WHERE uuid=${uuid}`;
                if (rows.length > 0) user = rows[0];
                if (user != null && user.lastupdated > timestamp - 1000 * 60 * 5) {
                    if (user?.oldxp != null) {
                        value = user.cataxp - user.oldxp;
                        currentXP = user.cataxp;
                    } else {
                        value = user.cataxp;
                        currentXP = user.cataxp;
                    }
                } else {
                    const profiles = await getProfiles(uuid);
                    if (profiles.success === false) return profiles;
                    profiles.profiles.forEach((profile) => {
                        const temp = profile.members[uuid]?.leveling?.experience;
                        if (temp && temp > 0) {
                            if (value < temp) value = temp;
                        }
                    });
                    updateDB = true;
                    currentXP = value;
                }

                if (updateDB) {
                    if (user == null) {
                        await sql`INSERT INTO users(uuid, cataxp, oldxp, lastupdated) VALUES (${uuid}, ${value}, ${value}, ${timestamp})`;
                        value = 0;
                    } else {
                        if (user?.oldxp == null) {
                            await sql`UPDATE users SET (cataxp, oldxp, lastupdated) = (${value}, ${value}, ${timestamp}) WHERE uuid = ${uuid}`;
                            value = 0;
                        } else {
                            await sql`UPDATE users SET (cataxp, lastupdated) = (${value}, ${timestamp}) WHERE uuid = ${uuid}`;
                            value -= user.oldxp;
                        }
                    }
                }

                return {
                    success: true,
                    value: value,
                    formattedValue: formatNumber(value / 100),
                    current: currentXP
                };
            },
            ranks: {
                ducks: [
                    {
                        id: "GRINCH",
                        requirement: 0,
                    },
                    {
                        id: "ELF",
                        requirement: 32000,
                    },
                    {
                        id: "FROSTY",
                        requirement: 36000,
                    },
                    {
                        id: "SANTA",
                        requirement: 40000,
                    },
                ],
                ducklings: [
                    {
                        id: "GRINCH",
                        requirement: 0,
                    },
                    {
                        id: "ELF",
                        requirement: 22000,
                    },
                    {
                        id: "FROSTY",
                        requirement: 26000,
                    },
                    {
                        id: "SANTA",
                        requirement: 30000,
                    },
                ]
            }
        },
        {
            id: "jan25",
            title: "",
            start: new Date("1 January 2025").getTime(),
            callback: undefined
        },
    ]
}
export interface Superlative {
    id: string;
    title: string;
    start: number;
    callback?: (
        uuid: string
    ) => Promise<
        {
            success: false;
            message: string;
            ping?: boolean;
        } | {
            success: true;
            value: number;
            formattedValue: string;
            current: number;
        }
    >;
    ranks?: {
        ducks: {
            id: string;
            requirement: number;
        }[],
        ducklings: {
            id: string;
            requirement: number;
        }[],
    }
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
    embeds: Embed[];
    components?: APIBaseComponent<ComponentType>[];
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
        components: rows[0].components
    }
}
export async function EditEmbedData(embedID: string, content: string | null, embeds: Embed[], components?: APIBaseComponent<ComponentType>[]): Promise<void> {
    await sql`UPDATE embeds SET content = ${content}, data = ${JSON.stringify(embeds)}, components = ${JSON.stringify(components)} WHERE name = ${embedID}`;
}
export async function CreateEmbedData(embedID: string, content: string | null, embeds: Embed[], components?: APIBaseComponent<ComponentType>[]): Promise<void> {
    await sql`INSERT INTO embeds (name, content, data, components) VALUES (${embedID}, ${content}, ${JSON.stringify(embeds)}, ${JSON.stringify(components)})`;
}
export async function DeleteEmbedData(embedID: string): Promise<void> {
    await sql`DELETE FROM embeds WHERE name = ${embedID}`;
}