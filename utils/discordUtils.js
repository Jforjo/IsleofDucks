import { getProfiles } from "./hypixelUtils.js";

export const DISCORD_EPOCH = 1420070400000

// Converts a snowflake ID string into a JS Date object using the provided epoch (in ms), or Discord's epoch if not provided
export function ConvertSnowflakeToDate(snowflake, epoch = DISCORD_EPOCH) {
	// Convert snowflake to BigInt to extract timestamp bits
	// https://discord.com/developers/docs/reference#snowflakes
	const milliseconds = BigInt(snowflake) >> 22n
	return new Date(Number(milliseconds) + epoch)
}

export async function DiscordRequest(endpoint, options) {
    // GET requests cannot have a body
    if (options.method === 'GET') {
        endpoint += `?${new URLSearchParams(options.body).toString()}`;
        delete options.body;
    }
    // Stringify payloads
    if (options.body) options.body = JSON.stringify(options.body);
    // append endpoint to root API URL
    const url = 'https://discord.com/api/v10/' + endpoint;
    // Use node-fetch to make requests
    const res = await fetch(url, {
        headers: {
            Authorization: `Bot ${process.env.DISCORD_TOKEN}`,
            'Content-Type': 'application/json; charset=UTF-8',
        },
        ...options
    });
    // throw API errors
    if (!res.ok) {
        const data = await res.json();
        console.log(res.status);
        throw new Error(JSON.stringify(data));
    }
    // return original response
    return res;
}
export async function InstallGlobalCommands(commands) {
    // API endpoint to overwrite global commands
    const endpoint = `applications/${process.env.DISCORD_CLIENT_ID}/commands`;
  
    try {
        const res = await DiscordRequest(endpoint, { method: 'PUT', body: commands });
        return res.json();
    } catch (err) {
        console.error(err);
    }
}
export async function EditGlobalCommands(commands) {
    // API endpoint to overwrite global commands
    for (let i = 0; i < commands.length; i++) {
        const endpoint = `applications/${process.env.DISCORD_CLIENT_ID}/commands/${commands[i].id}`;
      
        try {
            await DiscordRequest(endpoint, { method: 'PATCH' });
        } catch (err) {
            console.error(err);
        }
    }
}
export async function DeleteGlobalCommands(commands) {
    // API endpoint to overwrite global commands
    for (let i = 0; i < commands.length; i++) {
        const endpoint = `applications/${process.env.DISCORD_CLIENT_ID}/commands/${commands[i].id}`;
      
        try {
            await DiscordRequest(endpoint, { method: 'DELETE' });
        } catch (err) {
            console.error(err);
        }
    }
}

export async function InstallGuildCommands(guildId, commands) {
    // API endpoint to overwrite guild commands
    const endpoint = `applications/${process.env.DISCORD_CLIENT_ID}/guilds/${guildId}/commands`;
  
    try {
        const res = await DiscordRequest(endpoint, { method: 'PUT', body: commands });
        return res.json();
    } catch (err) {
        console.error(err);
    }
}
export async function EditGuildCommands(guildId, commands) {
    // API endpoint to overwrite guild commands
    for (let i = 0; i < commands.length; i++) {
        const endpoint = `applications/${process.env.DISCORD_CLIENT_ID}/guilds/${guildId}/commands/${commands[i].id}`;
      
        try {
            await DiscordRequest(endpoint, { method: 'PATCH' });
        } catch (err) {
            console.error(err);
        }
    }
}
export async function DeleteGuildCommands(guildId, commands) {
    // API endpoint to overwrite guild commands
    for (let i = 0; i < commands.length; i++) {
        const endpoint = `applications/${process.env.DISCORD_CLIENT_ID}/guilds/${guildId}/commands/${commands[i].id}`;
      
        try {
            await DiscordRequest(endpoint, { method: 'DELETE' });
        } catch (err) {
            console.error(err);
        }
    }
}

export async function CreateChannel(guildId, options) {
    // https://discord.com/developers/docs/resources/guild#create-guild-channel
    const endpoint = `guilds/${guildId}/channels`;
    const body = options;
    try {
        const res = await DiscordRequest(endpoint, { method: 'POST', body: body });
        return res.json();
    } catch (err) {
        console.error(err);
    }
}
export async function EditChannel(channelId, options) {
    // https://discord.com/developers/docs/resources/guild#create-guild-channel
    const endpoint = `channels/${channelId}`;
    const body = options;
    try {
        const res = await DiscordRequest(endpoint, { method: 'PATCH', body: body });
        return res.json();
    } catch (err) {
        console.error(err);
    }
}
export async function SendMessage(channelId, data) {
    // https://discord.com/developers/docs/resources/message#create-message
    const endpoint = `channels/${channelId}/messages`;
    const body = data;
    try {
        const res = await DiscordRequest(endpoint, { method: 'POST', body: body });
        return res.json();
    } catch (err) {
        console.error(err);
    }
}
export async function CreateInteractionResponse(id, token, data) {
    // https://discord.com/developers/docs/resources/message#create-message
    const endpoint = `interactions/${id}/${token}/callback`;
    const body = data;
    try {
        return await DiscordRequest(endpoint, { method: 'POST', body: body });
    } catch (err) {
        console.error(err);
    }
}
export async function FollowupMessage(token, data) {
    // https://discord.com/developers/docs/resources/message#create-message
    const endpoint = `webhooks/${process.env.DISCORD_CLIENT_ID}/${token}/messages/@original`;
    const body = data;
    try {
        const res = await DiscordRequest(endpoint, { method: 'PATCH', body: body });
        return res.json();
    } catch (err) {
        console.error(err);
    }
}

export async function AddGuildMemberRole(guildId, memberId, roleId, options) {
    // https://discord.com/developers/docs/resources/guild#add-guild-member-role
    const endpoint = `guilds/${guildId}/members/${memberId}/roles/${roleId}`;
    const body = options;
    try {
        const res = await DiscordRequest(endpoint, { method: 'PUT', body: body });
        return res.json();
    } catch (err) {
        console.error(err);
    }
}
export async function RemoveGuildMemberRole(guildId, memberId, roleId, options) {
    // https://discord.com/developers/docs/resources/guild#remove-guild-member-role
    const endpoint = `guilds/${guildId}/members/${memberId}/roles/${roleId}`;
    const body = options;
    try {
        const res = await DiscordRequest(endpoint, { method: 'DELETE', body: body });
        return res.json();
    } catch (err) {
        console.error(err);
    }
}

export async function ListGuildMembers(guildId, options) {
    // https://discord.com/developers/docs/resources/guild#list-guild-members
    const endpoint = `guilds/${guildId}/members`;
    const body = options;
    try {
        const res = await DiscordRequest(endpoint, { method: 'GET', body: body });
        return res.json();
    } catch (err) {
        console.error(err);
    }
}

export async function GetAllGuildMembers(guildId) {
    const members = [];
    while (true) {
        const options = members[members.length - 1]?.user.id ? {
            limit: 1000,
            after: members[members.length - 1]?.user.id
        } : {
            limit: 1000
        };
        const res = await ListGuildMembers(guildId, options);
        console.log(res);
        members.push(...res.members);
        if (res.members.length < 1000) break;
    }
    return members;
}

export function ToPermissions(permissions) {
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
    return perms;
}

export function formatNumber(num) {
    if (num >= 1_000_000_000_000) return (num / 1_000_000_000_000).toFixed(2) + 'T';
    if (num >= 1_000_000_000) return (num / 1_000_000_000).toFixed(2) + 'B';
    if (num >= 1_000_000) return (num / 1_000_000).toFixed(2) + 'M';
    if (num >= 1_000) return (num / 1_000).toFixed(2) + 'K';
    return num;
}

export const IsleofDucks = {
    staticIDs: {
        Jforjo: "791380888197660722",
        Ducksicle: "474770139363934219"
    },
    channels: {
        support: "910160132233658408",
        carrierapps: "1004135601534152755",
    },
    channelGroups: {
        tickets: "988883238292451378",
        carrytickets: "1004180629551845466"
    },
    roles: {
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
    superlative: [
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
            callback: async function(uuid) {
                const profiles = await getProfiles(uuid);
                if (profiles.success === false) return profiles;
                let value = 0;
                profiles.forEach((profile) => {
                    let temp = profile.members[uuid]?.slayer?.slayer_bosses?.enderman?.xp;
                    if (temp && temp > 0) {
                        if (value < temp) value = temp;
                    }
                });
                return {
                    success: true,
                    value: value,
                    formattedValue: formatNumber(value)
                };
            }
        },
        {
            id: "dec24",
            title: "SkyBlock Level",
            start: new Date("1 December 2024").getTime(),
            callback: async function(uuid) {
                const profiles = await getProfiles(uuid);
                if (profiles.success === false) return profiles;
                let value = 0;
                profiles.forEach((profile) => {
                    let temp = profile.members[uuid]?.leveling?.experience;
                    if (temp && temp > 0) {
                        if (value < temp) value = temp;
                    }
                });
                return {
                    success: true,
                    value: value,
                    formattedValue: value / 100
                };
            }
        }
    ]
}
export function encodeCarrierData(data) {
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
    return bitfield;
}
export function decodeCarrierData(bitfield) {
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