import { APIChatInputApplicationCommandInteraction, APIChatInputApplicationCommandInteractionData, APIInteractionResponse, ApplicationCommandOptionType, ApplicationCommandType, ComponentType, InteractionResponseType, MessageFlags, MessageType, Snowflake } from "discord-api-types/v10";
import { CreateInteractionResponse, FollowupMessage, IsleofDucks, GetAllGuildMembers, ConvertSnowflakeToDate, RemoveGuildMemberRole, AddGuildMemberRole, GetAllChannelMessages } from "@/discord/discordUtils";
import { NextResponse } from "next/server";
import { getGuildData, getHypixelPlayer } from "@/discord/hypixelUtils";
import { checkLinked, getUserDataFromDiscordID, getUserDataFromUUID, linkDiscordToMinecraft, updateDiscordUser, updateMinecraftUser } from "@/discord/utils";

export async function UpdateUserLevelRoles(guildID: Snowflake, userID: Snowflake): Promise<{
    rolesAdded: number;
    rolesRemoved: number;
    usersHadRolesAdded: Snowflake[];
    usersHadRolesRemoved: Snowflake[];
}> {
    let rolesAdded = 0;
    let rolesRemoved = 0;
    const usersHadRolesAdded: Snowflake[] = [];
    const usersHadRolesRemoved: Snowflake[] = [];

    const player = await getUserDataFromDiscordID(userID);
    if (!player || !player.success || !player.data.minecraft) return {
        rolesAdded,
        rolesRemoved,
        usersHadRolesAdded,
        usersHadRolesRemoved
    };

    for (const role of IsleofDucks.roles.levels.sort((a, b) => a.requirement - b.requirement)) {
        if (player.data.minecraft.exp >= role.requirement) {
            await AddGuildMemberRole(guildID, userID, role.id);
            rolesAdded++;
            usersHadRolesAdded.push(role.id);
        } else {
            await RemoveGuildMemberRole(guildID, userID, role.id);
            rolesRemoved++;
            usersHadRolesRemoved.push(role.id);
        }
    }
        
    return {
        rolesAdded,
        rolesRemoved,
        usersHadRolesAdded,
        usersHadRolesRemoved
    }
}
export async function UpdateUserGuildRoles(guildID: Snowflake, userID: Snowflake): Promise<{
    rolesAdded: number;
    rolesRemoved: number;
    usersHadRolesAdded: Snowflake[];
    usersHadRolesRemoved: Snowflake[];
}> {
    let rolesAdded = 0;
    let rolesRemoved = 0;
    const usersHadRolesAdded: Snowflake[] = [];    
    const usersHadRolesRemoved: Snowflake[] = [];

    const player = await getUserDataFromDiscordID(userID);
    if (!player || !player.success || !player.data.minecraft) return {
        rolesAdded,
        rolesRemoved,
        usersHadRolesAdded,
        usersHadRolesRemoved
    };

    const duckMembers = await getGuildData("Isle of Ducks");
    const ducklingMembers = await getGuildData("Isle of Ducklings");
    let isInGuild = false;

    if (duckMembers.success) {
        for (const member of duckMembers.guild.members) {
            if (member.uuid === player.data.minecraft.uuid) {
                await AddGuildMemberRole(guildID, userID, IsleofDucks.roles.duck_guild_member);
                await AddGuildMemberRole(guildID, userID, IsleofDucks.roles.guild_member);
                rolesAdded+= 2;
                usersHadRolesAdded.push(IsleofDucks.roles.duck_guild_member);
                usersHadRolesAdded.push(IsleofDucks.roles.guild_member);
                isInGuild = true;
            }
        }
    }

    if (ducklingMembers.success) {
        for (const member of ducklingMembers.guild.members) {
            if (member.uuid === player.data.minecraft.uuid) {
                await AddGuildMemberRole(guildID, userID, IsleofDucks.roles.duckling_guild_member);
                await AddGuildMemberRole(guildID, userID, IsleofDucks.roles.guild_member);
                rolesAdded+= 2;
                usersHadRolesAdded.push(IsleofDucks.roles.duckling_guild_member);
                usersHadRolesAdded.push(IsleofDucks.roles.guild_member);
                isInGuild = true;
            }
        }
    }

    if (!isInGuild) {
        const removed1 = await RemoveGuildMemberRole(guildID, userID, IsleofDucks.roles.duck_guild_member);
        const removed2 = await RemoveGuildMemberRole(guildID, userID, IsleofDucks.roles.duckling_guild_member);
        const removed3 = await RemoveGuildMemberRole(guildID, userID, IsleofDucks.roles.guild_member);
        rolesRemoved += (Number(removed1) + Number(removed2)) + Number(removed3);
        removed1 && usersHadRolesRemoved.push(IsleofDucks.roles.duck_guild_member);
        removed2 && usersHadRolesRemoved.push(IsleofDucks.roles.duckling_guild_member);
        removed3 && usersHadRolesRemoved.push(IsleofDucks.roles.guild_member);
    }

    return {
        rolesAdded,
        rolesRemoved,
        usersHadRolesAdded,
        usersHadRolesRemoved
    }
}
export async function UpdateUserBoosterRoles(guildID: Snowflake, userID: Snowflake): Promise<{
    rolesAdded: number;
    rolesRemoved: number;
    usersHadRolesAdded: Snowflake[];
    usersHadRolesRemoved: Snowflake[];
}> {
    let rolesAdded = 0;
    let rolesRemoved = 0;
    const usersHadRolesAdded: Snowflake[] = [];
    const usersHadRolesRemoved: Snowflake[] = [];

    const player = await getUserDataFromDiscordID(userID);
    if (!player || !player.success || !player.data.minecraft) return {
        rolesAdded,
        rolesRemoved,
        usersHadRolesAdded,
        usersHadRolesRemoved
    };

    const boosterMessages = (await GetAllChannelMessages(IsleofDucks.channels.nitroboosts)).filter(msg => msg.type === MessageType.GuildBoost && msg.author.id === userID);
    if (boosterMessages.length >= 4) {
        await AddGuildMemberRole(guildID, userID, IsleofDucks.roles.booster2x);
        rolesAdded++;
        usersHadRolesAdded.push(IsleofDucks.roles.booster2x);
    } else {
        await RemoveGuildMemberRole(guildID, userID, IsleofDucks.roles.booster2x);
        rolesRemoved++;
        usersHadRolesRemoved.push(IsleofDucks.roles.booster2x);
    }

    return {
        rolesAdded,
        rolesRemoved,
        usersHadRolesAdded,
        usersHadRolesRemoved
    }
}
export async function UpdateUserGroupRoles(guildID: Snowflake, userID: Snowflake): Promise<{
    rolesAdded: number;
    rolesRemoved: number;
    usersHadRolesAdded: Snowflake[];
    usersHadRolesRemoved: Snowflake[];
}> {
    let rolesAdded = 0;
    let rolesRemoved = 0;
    const usersHadRolesAdded: Snowflake[] = [];
    const usersHadRolesRemoved: Snowflake[] = [];

    const player = await getUserDataFromDiscordID(userID);
    if (!player || !player.success || !player.data.minecraft) return {
        rolesAdded,
        rolesRemoved,
        usersHadRolesAdded,
        usersHadRolesRemoved
    };

    const members = await GetAllGuildMembers(guildID);
    const member = members.find(m => m.user.id === userID);
    if (!member) return {
        rolesAdded,
        rolesRemoved,
        usersHadRolesAdded,
        usersHadRolesRemoved
    }
    
    for (const group of IsleofDucks.roleGroups) {
        let hasRoleInGroup = false;
        for (const roleID of group.roles) {
            if (member.roles.includes(roleID)) {
                hasRoleInGroup = true;
                break;
            }
        }
        if (!hasRoleInGroup) {
            if (member.roles.includes(group.id)) {
                await RemoveGuildMemberRole(guildID, member.user.id, group.id);
                rolesRemoved++;
                usersHadRolesRemoved.push(member.user.id);
            }
        } else {
            if (!member.roles.includes(group.id)) {
                await AddGuildMemberRole(guildID, member.user.id, group.id);
                rolesAdded++;
                usersHadRolesAdded.push(member.user.id);
            }
        }
    }

    return {
        rolesAdded,
        rolesRemoved,
        usersHadRolesAdded,
        usersHadRolesRemoved
    }
}

export async function UpdateLevelRoles(guildID: Snowflake): Promise<{
    rolesAdded: number;
    rolesRemoved: number;
    usersHadRolesAdded: Snowflake[];
    usersHadRolesRemoved: Snowflake[];
}> {
    let rolesAdded = 0;
    let rolesRemoved = 0;
    const usersHadRolesAdded: Snowflake[] = [];
    const usersHadRolesRemoved: Snowflake[] = [];

    const members = await GetAllGuildMembers(guildID);
    for (const member of members) {
        if (
            !member.roles.includes(IsleofDucks.roles.duck_guild_member) &&
            !member.roles.includes(IsleofDucks.roles.duckling_guild_member)
        ) {
            for (const role of IsleofDucks.roles.levels) {
                if (member.roles.includes(role.id)) {
                    await RemoveGuildMemberRole(guildID, member.user.id, role.id);
                    rolesRemoved++;
                    usersHadRolesRemoved.push(role.id);
                }
            }
            return {
                rolesAdded,
                rolesRemoved,
                usersHadRolesAdded,
                usersHadRolesRemoved
            }
        }

        const player = await getUserDataFromDiscordID(member.user.id);
        if (!player || !player.success || !player.data.minecraft) return {
            rolesAdded,
            rolesRemoved,
            usersHadRolesAdded,
            usersHadRolesRemoved
        };

        let expectedRole: Snowflake = "";
        let currentRoles: Snowflake[] = [];

        for (const role of IsleofDucks.roles.levels.sort((a, b) => a.requirement - b.requirement)) {
            if (member.roles.includes(role.id)) currentRoles.push(role.id);
            if (player.data.minecraft.exp >= role.requirement) expectedRole = role.id;
        }
        
        // Remove roles they shouldn't have
        if (currentRoles.length >= 1) {
            const newRoles: Snowflake[] = []
            for (const role of currentRoles) {
                if (role !== expectedRole) {
                    await RemoveGuildMemberRole(guildID, member.user.id, role);
                    rolesRemoved++;
                    usersHadRolesRemoved.push(role);
                } else {
                    newRoles.push(role);
                }
            }
            currentRoles = newRoles;
        }

        // Add the role that they should have
        if (currentRoles.length < 1) {
            await AddGuildMemberRole(guildID, member.user.id, expectedRole);
            rolesAdded++;
            usersHadRolesAdded.push(expectedRole);
        }
    }

    // let player: DiscordRole;

    // Prioritise Discord ID
    // const playerResponseFromDiscordID = await getDiscordRoleFromDiscordID(member.user.id);
    // if (!playerResponseFromDiscordID) {
    //     const playerResponseFromDiscordName = await getDiscordRoleFromDiscordName(member.user.username);
    //     if (!playerResponseFromDiscordName) {
    //         if (!member.nick) return false;
    //         const uuidResponse = await getUsernameOrUUID(member.nick.replaceAll('✧', '').split(' ')[0]);
    //         if (!uuidResponse.success) return false;

    //         const playerResponse = await getDiscordRole(uuidResponse.uuid);
    //         if (!playerResponse) {
    //             // Someone could nick to someone elses name ig
    //             // await addDiscordRole(uuidResponse.uuid, member.user.username, null);
    //             return false;
    //         }

    //         player = playerResponse;
    //     } else {
    //         player = playerResponseFromDiscordName;
    //         // Add Discord ID to DB
    //         await updateDiscordRoleName(player.uuid, member.user.username, member.user.id);
    //     }
    // } else {
    //     player = playerResponseFromDiscordID;
    // }

    // if (!player) return false;
    // if (!player.exp) return false;


    return {
        rolesAdded,
        rolesRemoved,
        usersHadRolesAdded,
        usersHadRolesRemoved
    }
}

export async function UpdateCombinedGuildRoles(guildID: Snowflake): Promise<{
    rolesAdded: number;
    rolesRemoved: number;
    usersHadRolesAdded: Snowflake[];
    usersHadRolesRemoved: Snowflake[];
}> {
    const members = await GetAllGuildMembers(guildID);

    let rolesAdded = 0;
    let rolesRemoved = 0;
    const usersHadRolesAdded: Snowflake[] = [];
    const usersHadRolesRemoved: Snowflake[] = [];

    for (const member of members) {
        if (!member.roles.includes(IsleofDucks.roles.duck_guild_member) && !member.roles.includes(IsleofDucks.roles.duckling_guild_member)) {
            if (member.roles.includes(IsleofDucks.roles.guild_member)) {
                await RemoveGuildMemberRole(guildID, member.user.id, IsleofDucks.roles.guild_member);
                rolesRemoved++;
                usersHadRolesRemoved.push(member.user.id);
            }
        } else {
            if (!member.roles.includes(IsleofDucks.roles.guild_member)) {
                await AddGuildMemberRole(guildID, member.user.id, IsleofDucks.roles.guild_member);
                rolesAdded++;
                usersHadRolesAdded.push(member.user.id);
            }
        }
    }

    return {
        rolesAdded,
        rolesRemoved,
        usersHadRolesAdded,
        usersHadRolesRemoved
    }
}
export async function UpdateDuckGuildRoles(guildID: Snowflake): Promise<{
    rolesAdded: number;
    rolesRemoved: number;
    usersHadRolesAdded: Snowflake[];
    usersHadRolesRemoved: Snowflake[];
}> {
    const members = await GetAllGuildMembers(guildID);
    const duckMembers = await getGuildData("Isle of Ducks");

    let rolesAdded = 0;
    let rolesRemoved = 0;
    const usersHadRolesAdded: Snowflake[] = [];
    const usersHadRolesRemoved: Snowflake[] = [];

    if (duckMembers.success) {
        for (const member of duckMembers.guild.members) {
            const res = await getUserDataFromUUID(member.uuid);
            if (!res.success) continue;
            if (!res.data.discord) continue;
            const discordID = res.data.discord.discordid;
            if (!discordID) continue;
            const discordMember = members.find(m => m.user.id === discordID);
            if (!discordMember) continue;
            if (discordMember.roles.includes(IsleofDucks.roles.duck_guild_member)) continue;
            await AddGuildMemberRole(guildID, discordID, IsleofDucks.roles.duck_guild_member);
            rolesAdded++;
            usersHadRolesAdded.push(discordID);
        }
    }

    return {
        rolesAdded,
        rolesRemoved,
        usersHadRolesAdded,
        usersHadRolesRemoved
    }
}
export async function UpdateDucklingGuildRoles(guildID: Snowflake): Promise<{
    rolesAdded: number;
    rolesRemoved: number;
    usersHadRolesAdded: Snowflake[];
    usersHadRolesRemoved: Snowflake[];
}> {
    const members = await GetAllGuildMembers(guildID);
    const ducklingMembers = await getGuildData("Isle of Ducklings");

    let rolesAdded = 0;
    let rolesRemoved = 0;
    const usersHadRolesAdded: Snowflake[] = [];
    const usersHadRolesRemoved: Snowflake[] = [];

    if (ducklingMembers.success) {
        for (const member of ducklingMembers.guild.members) {
            const res = await getUserDataFromUUID(member.uuid);
            if (!res.success) continue;
            if (!res.data.discord) continue;
            const discordID = res.data.discord.discordid;
            if (!discordID) continue;
            const discordMember = members.find(m => m.user.id === discordID);
            if (!discordMember) continue;
            if (discordMember.roles.includes(IsleofDucks.roles.duckling_guild_member)) continue;
            await AddGuildMemberRole(guildID, discordID, IsleofDucks.roles.duckling_guild_member);
            rolesAdded++;
            usersHadRolesAdded.push(discordID);
        }
    }

    return {
        rolesAdded,
        rolesRemoved,
        usersHadRolesAdded,
        usersHadRolesRemoved
    }
}
export async function UpdateGuildRoles(guildID: Snowflake): Promise<{
    rolesAdded: number;
    rolesRemoved: number;
    usersHadRolesAdded: Snowflake[];
    usersHadRolesRemoved: Snowflake[];
}> {
    let rolesAdded = 0;
    let rolesRemoved = 0;
    const usersHadRolesAdded: Snowflake[] = [];
    const usersHadRolesRemoved: Snowflake[] = [];

    const combinedGuildRoles = await UpdateCombinedGuildRoles(guildID);
    const duckGuildRoles = await UpdateDuckGuildRoles(guildID);
    const ducklingGuildRoles = await UpdateDucklingGuildRoles(guildID);

    rolesAdded += combinedGuildRoles.rolesAdded + duckGuildRoles.rolesAdded + ducklingGuildRoles.rolesAdded;
    rolesRemoved += combinedGuildRoles.rolesRemoved + duckGuildRoles.rolesRemoved + ducklingGuildRoles.rolesRemoved;
    usersHadRolesAdded.push(...combinedGuildRoles.usersHadRolesAdded, ...duckGuildRoles.usersHadRolesAdded, ...ducklingGuildRoles.usersHadRolesAdded);
    usersHadRolesRemoved.push(...combinedGuildRoles.usersHadRolesRemoved, ...duckGuildRoles.usersHadRolesRemoved, ...ducklingGuildRoles.usersHadRolesRemoved);

    return {
        rolesAdded,
        rolesRemoved,
        usersHadRolesAdded,
        usersHadRolesRemoved
    }
}

export async function UpdateBoosterRoles(guildID: Snowflake): Promise<{
    rolesAdded: number;
    rolesRemoved: number;
    usersHadRolesAdded: Snowflake[];
    usersHadRolesRemoved: Snowflake[];
}> {
    const members = await GetAllGuildMembers(guildID);

    let rolesAdded = 0;
    let rolesRemoved = 0;
    const usersHadRolesAdded: Snowflake[] = [];
    const usersHadRolesRemoved: Snowflake[] = [];

    const boosterMessages = (await GetAllChannelMessages(IsleofDucks.channels.nitroboosts)).filter(msg => msg.type === MessageType.GuildBoost);

    for (const member of members) {
        if (member.premium_since) {
            // Offset by 1 minute just in case
            const messagesToCheck = boosterMessages.filter(msg => new Date(msg.timestamp).getTime() > new Date(member.premium_since ?? '0').getTime() - 1000 * 60);
            const boosts = messagesToCheck.filter(msg => msg.author.id === member.user.id);
            // 2 = 1 and 4 = 2
            // It's counting them twice for some reason
            if (boosts.length >= 4 && !member.roles.includes(IsleofDucks.roles.booster2x)) {
                await AddGuildMemberRole(guildID, member.user.id, IsleofDucks.roles.booster2x);
                rolesAdded++;
                usersHadRolesAdded.push(member.user.id);
            } else if (boosts.length < 4 && member.roles.includes(IsleofDucks.roles.booster2x)) {
                await RemoveGuildMemberRole(guildID, member.user.id, IsleofDucks.roles.booster2x);
                rolesRemoved++;
                usersHadRolesRemoved.push(member.user.id);
            }
        } else {
            if (member.roles.includes(IsleofDucks.roles.booster2x)) {
                await RemoveGuildMemberRole(guildID, member.user.id, IsleofDucks.roles.booster2x);
                rolesRemoved++;
                usersHadRolesRemoved.push(member.user.id);
            }
        }
    }

    return {
        rolesAdded,
        rolesRemoved,
        usersHadRolesAdded,
        usersHadRolesRemoved
    };
}

export async function UpdateGroupRoles(guildID: Snowflake): Promise<{
    rolesAdded: number;
    rolesRemoved: number;
    usersHadRolesAdded: Snowflake[];
    usersHadRolesRemoved: Snowflake[];
}> {
    let rolesAdded = 0;
    let rolesRemoved = 0;
    const usersHadRolesAdded: Snowflake[] = [];
    const usersHadRolesRemoved: Snowflake[] = [];

    const members = await GetAllGuildMembers(guildID);
    for (const member of members) {
        for (const group of IsleofDucks.roleGroups) {
            let hasRoleInGroup = false;
            for (const roleID of group.roles) {
                if (member.roles.includes(roleID)) {
                    hasRoleInGroup = true;
                    break;
                }
            }
            if (!hasRoleInGroup) {
                if (member.roles.includes(group.id)) {
                    await RemoveGuildMemberRole(guildID, member.user.id, group.id);
                    rolesRemoved++;
                    usersHadRolesRemoved.push(member.user.id);
                }
            } else {
                if (!member.roles.includes(group.id)) {
                    await AddGuildMemberRole(guildID, member.user.id, group.id);
                    rolesAdded++;
                    usersHadRolesAdded.push(member.user.id);
                }
            }
        }
    }

    return {
        rolesAdded,
        rolesRemoved,
        usersHadRolesAdded,
        usersHadRolesRemoved
    };
}

export async function UpdateRoles(guildID: Snowflake): Promise<
    {
        rolesAdded: number;
        rolesRemoved: number;
        usersHadRolesAdded: Snowflake[];
        usersHadRolesRemoved: Snowflake[];
    }
> {
    let rolesAdded = 0;
    let rolesRemoved = 0;
    const usersHadRolesAdded: Snowflake[] = [];
    const usersHadRolesRemoved: Snowflake[] = [];

    const guildRoles = await UpdateGuildRoles(guildID);
    const levelRoles = await UpdateLevelRoles(guildID);
    const boosterRoles = await UpdateBoosterRoles(guildID);
    const groupRoles = await UpdateGroupRoles(guildID);

    rolesAdded += guildRoles.rolesAdded + levelRoles.rolesAdded + boosterRoles.rolesAdded + groupRoles.rolesAdded;
    rolesRemoved += guildRoles.rolesRemoved + levelRoles.rolesRemoved + boosterRoles.rolesRemoved + groupRoles.rolesRemoved;
    usersHadRolesAdded.push(...guildRoles.usersHadRolesAdded, ...levelRoles.usersHadRolesAdded, ...boosterRoles.usersHadRolesAdded, ...groupRoles.usersHadRolesAdded);
    usersHadRolesRemoved.push(...guildRoles.usersHadRolesRemoved, ...levelRoles.usersHadRolesRemoved, ...boosterRoles.usersHadRolesRemoved, ...groupRoles.usersHadRolesRemoved);

    return {
        rolesAdded,
        rolesRemoved,
        usersHadRolesAdded: usersHadRolesAdded,
        usersHadRolesRemoved: usersHadRolesRemoved.filter((value, index) => usersHadRolesRemoved.indexOf(value) === index)
    };
}

export async function UpdateDiscordData(userId: Snowflake, uuid: string): Promise<boolean> {
    const exists = await checkLinked(userId, uuid);
    if (!exists) return false;

    const discUsers = await GetAllGuildMembers(IsleofDucks.serverID);
    
    const hypixel = await getHypixelPlayer(uuid);
    if (!hypixel.success) return false;

    const player = hypixel.player;
    if (!player.socialMedia || !player.socialMedia.links || !player.socialMedia.links.DISCORD) return false;

    const discord = player.socialMedia.links.DISCORD;
    const discordUser = discUsers.find(u => u.user.username === discord);
    if (!discordUser) return false;
    
    try {
        await linkDiscordToMinecraft(discordUser.user.id, uuid);
    } catch (e) {
        if (e instanceof Error) {
            if (e.message === "Discord user not found") {
                await updateDiscordUser(discordUser.user.id);
            } else if (e.message === "Minecraft user not found") {
                await updateMinecraftUser(uuid);
            } else console.error(e);
        } else console.error(e);
    }

    return true;
}

export default async function(
    interaction: APIChatInputApplicationCommandInteraction
): Promise<
    NextResponse<
        {
            success: boolean;
            error?: string;
        } | APIInteractionResponse
    >
> {
    // User sees the "[bot] is thinking..." message
    await CreateInteractionResponse(interaction.id, interaction.token, {
        type: InteractionResponseType.DeferredChannelMessageWithSource,
    });
    
    const timestamp = ConvertSnowflakeToDate(interaction.id);

    if (!interaction.guild) {
        await FollowupMessage(interaction.token, {
            content: "This command can only be used in a server!"
        });
        return NextResponse.json(
            { success: false, error: "This command can only be used in a server" },
            { status: 400 }
        );
    }
    // If guild exists then so should member, but imma still check it
    if (!interaction.member) {
        await FollowupMessage(interaction.token, {
            content: "Could not find who ran the command!"
        });
        return NextResponse.json(
            { success: false, error: "Could not find who ran the command" },
            { status: 400 }
        );
    }
    let perm = false;
    for (const role of interaction.member.roles) {
        if (role === IsleofDucks.roles.admin) perm = true;
        else if (role === IsleofDucks.roles.mod_duck) perm = true;
        else if (role === IsleofDucks.roles.mod_duckling) perm = true;
        else if (role === IsleofDucks.roles.service_management) perm = true;
        if (perm) break;
    }
    if (!perm) {
        await FollowupMessage(interaction.token, {
            content: "You don't have permission to use this command!"
        });
        return NextResponse.json(
            { success: false, error: "You don't have permission to use this command" },
            { status: 403 }
        );
    }

    await FollowupMessage(interaction.token, {
        embeds: [
            {
                title: "Updating roles...",
                description: [
                    "This may take a while depending on how many users need their roles updated.",
                    `If this embed doesn't change <t:${Math.floor(timestamp.getTime() / 1000) + 60}:R> then run the command again.`,
                ].join("\n"),
                color: 0xFB9B00,
                timestamp: new Date().toISOString()
            }
        ],
    });

    let rolesAdded: number = 0,
        rolesRemoved: number = 0,
        usersHadRolesAdded: Snowflake[] = [],
        usersHadRolesRemoved: Snowflake[] = []
    ;

    const interactionData = interaction.data as APIChatInputApplicationCommandInteractionData;
    if (!interactionData.options) {
        await FollowupMessage(interaction.token, {
            flags: MessageFlags.IsComponentsV2,
            components: [
                {
                    type: ComponentType.Container,
                    accent_color: IsleofDucks.colours.error,
                    components: [
                        {
                            type: ComponentType.TextDisplay,
                            content: "## Something went wrong!",
                        },
                        { type: ComponentType.Separator },
                        {
                            type: ComponentType.TextDisplay,
                            content: "Missing interaction data options!"
                        },
                        { type: ComponentType.Separator },
                        {
                            type: ComponentType.TextDisplay,
                            content: `Response time: ${Date.now() - timestamp.getTime()}ms • <t:${Math.floor(Date.now() / 1000)}:F>`
                        }
                    ]
                }
            ]
        }, null, true);
        return NextResponse.json(
            { success: false, error: "Missing interaction data options" },
            { status: 400 }
        );
    }
    // I'm not improving this :sob:
    const options = Object.fromEntries(interactionData.options.map(option => {
        if ('value' in option) {
            return [option.name, option.value];
        } else if (option.options) {
            return [option.name, Object.fromEntries(option.options.map(option => {
                if ('value' in option) {
                    return [option.name, option.value];
                } else if (option.options) {
                    return [option.name, Object.fromEntries(option.options.map(option => {
                        return [option.name, option.value]
                }   ))];
                } else {
                    return [option.name, null];
                }
        }   ))];
        } else {
            return [option.name, null];
        }
    }));

    if (options.guild) {
        if (options.guild.combined_guild_role) {
            ({ rolesAdded, rolesRemoved, usersHadRolesAdded, usersHadRolesRemoved } = await UpdateCombinedGuildRoles(interaction.guild.id));
        } else if (options.guild.duck_guild_role) {
            ({ rolesAdded, rolesRemoved, usersHadRolesAdded, usersHadRolesRemoved } = await UpdateDuckGuildRoles(interaction.guild.id));
        } else if (options.guild.duckling_guild_role) {
            ({ rolesAdded, rolesRemoved, usersHadRolesAdded, usersHadRolesRemoved } = await UpdateDucklingGuildRoles(interaction.guild.id));
        } else if (options.guild.all) {
            ({ rolesAdded, rolesRemoved, usersHadRolesAdded, usersHadRolesRemoved } = await UpdateGuildRoles(interaction.guild.id));
        }
    } else if (options.levels) {
        ({ rolesAdded, rolesRemoved, usersHadRolesAdded, usersHadRolesRemoved } = await UpdateLevelRoles(interaction.guild.id));
    } else if (options.booster) {
        ({ rolesAdded, rolesRemoved, usersHadRolesAdded, usersHadRolesRemoved } = await UpdateBoosterRoles(interaction.guild.id));
    } else if (options.groups) {
        ({ rolesAdded, rolesRemoved, usersHadRolesAdded, usersHadRolesRemoved } = await UpdateGroupRoles(interaction.guild.id));
    } else if (options.all) {
        ({ rolesAdded, rolesRemoved, usersHadRolesAdded, usersHadRolesRemoved } = await UpdateRoles(interaction.guild.id));
    } else if (options.user) {
        if (options.user.level) {
            ({ rolesAdded, rolesRemoved, usersHadRolesAdded, usersHadRolesRemoved } = await UpdateUserLevelRoles(interaction.guild.id, options.user.level.user));
        } else if (options.user.guild) {
            ({ rolesAdded, rolesRemoved, usersHadRolesAdded, usersHadRolesRemoved } = await UpdateUserGuildRoles(interaction.guild.id, options.user.guild.user));
        } else if (options.user.booster) {
            ({ rolesAdded, rolesRemoved, usersHadRolesAdded, usersHadRolesRemoved } = await UpdateUserBoosterRoles(interaction.guild.id, options.user.booster.user));
        } else if (options.user.groups) {
            ({ rolesAdded, rolesRemoved, usersHadRolesAdded, usersHadRolesRemoved } = await UpdateUserGroupRoles(interaction.guild.id, options.user.groups.user));
        } else if (options.user.discord) {
            const success = await UpdateDiscordData(options.user.discord.user, options.user.discord.uuid);
            if (!success) {
                await FollowupMessage(interaction.token, {
                    content: `Failed to update discord data for the <@${options.user.discord.user}> with UUID ${options.user.discord.uuid}!`
                });
                return NextResponse.json(
                    { success: false, error: `Failed to update discord data for the ${options.user.discord.user} with UUID ${options.user.discord.uuid}` },
                    { status: 400 }
                );
            }
            await FollowupMessage(interaction.token, {
                content: `Updated discord data for the <@${options.user.discord.user}> with UUID ${options.user.discord.uuid}!`
            });
            return NextResponse.json(
                { success: true },
                { status: 200 }
            );
        }
    } else {
        await FollowupMessage(interaction.token, {
            content: "No valid subcommand provided!"
        });
        return NextResponse.json(
            { success: false, error: "No valid subcommand provided" },
            { status: 400 }
        );
    }

    await FollowupMessage(interaction.token, {
        embeds: [
            {
                title: "Done!",
                description: [
                    `Added ${rolesAdded} roles to ${usersHadRolesAdded.filter((value, index) => usersHadRolesAdded.indexOf(value) === index).length} users.`,
                    `Removed ${rolesRemoved} roles from ${usersHadRolesRemoved.filter((value, index) => usersHadRolesRemoved.indexOf(value) === index).length} users.`,
                ].join("\n"),
                color: 0xFB9B00,
                footer: {
                    text: `Response time: ${Date.now() - timestamp.getTime()}ms`,
                },
                timestamp: new Date().toISOString()
            }
        ],
    });

    return NextResponse.json(
        { success: true },
        { status: 200 }
    );
}
export const CommandData = {
    name: "updateroles",
    description: "Updates roles for all users.",
    type: ApplicationCommandType.ChatInput,
    options: [
        {
            name: "guild",
            description: "Update guild roles.",
            type: ApplicationCommandOptionType.SubcommandGroup,
            options: [
                {
                    name: "combined_guild_role",
                    description: "Update combined guild roles.",
                    type: ApplicationCommandOptionType.Subcommand
                },
                {
                    name: "duck_guild_role",
                    description: "Update duck guild roles.",
                    type: ApplicationCommandOptionType.Subcommand
                },
                {
                    name: "duckling_guild_role",
                    description: "Update duckling guild roles.",
                    type: ApplicationCommandOptionType.Subcommand
                },
                {
                    name: "all",
                    description: "Update all guild roles.",
                    type: ApplicationCommandOptionType.Subcommand
                }
            ]
        },
        {
            name: "levels",
            description: "Update level roles.",
            type: ApplicationCommandOptionType.Subcommand
        },
        {
            name: "booster",
            description: "Update booster roles.",
            type: ApplicationCommandOptionType.Subcommand
        },
        {
            name: "groups",
            description: "Update group roles.",
            type: ApplicationCommandOptionType.Subcommand
        },
        {
            name: "all",
            description: "Update all roles. This may take a while.",
            type: ApplicationCommandOptionType.Subcommand
        },
        {
            name: "user",
            description: "Update roles for a specific user.",
            type: ApplicationCommandOptionType.SubcommandGroup,
            options: [
                {
                    name: "level",
                    description: "Update level roles for the user.",
                    type: ApplicationCommandOptionType.Subcommand,
                    options: [
                        {
                            name: "user",
                            description: "The user.",
                            type: ApplicationCommandOptionType.User,
                            required: true
                        }
                    ]
                },
                {
                    name: "guild",
                    description: "Update guild roles for the user.",
                    type: ApplicationCommandOptionType.Subcommand,
                    options: [
                        {
                            name: "user",
                            description: "The user.",
                            type: ApplicationCommandOptionType.User,
                            required: true
                        }
                    ]
                },
                {
                    name: "booster",
                    description: "Update booster roles for the user.",
                    type: ApplicationCommandOptionType.Subcommand,
                    options: [
                        {
                            name: "user",
                            description: "The user.",
                            type: ApplicationCommandOptionType.User,
                            required: true
                        }
                    ]
                },
                {
                    name: "groups",
                    description: "Update group roles for the user.",
                    type: ApplicationCommandOptionType.Subcommand,
                    options: [
                        {
                            name: "user",
                            description: "The user.",
                            type: ApplicationCommandOptionType.User,
                            required: true
                        }
                    ]
                },
                {
                    name: "discord",
                    description: "Update discord data for the user.",
                    type: ApplicationCommandOptionType.Subcommand,
                    options: [
                        {
                            name: "user",
                            description: "The user.",
                            type: ApplicationCommandOptionType.User,
                            required: true
                        },
                        {
                            name: "uuid",
                            description: "The user's Minecraft UUID.",
                            type: ApplicationCommandOptionType.String,
                            required: true
                        }
                    ]
                }
            ]
        }
    ]
}
export const RequiredRoles: Record<typeof CommandData["options"][number]["name"], string[]> = {
    guild: [
        IsleofDucks.roles.service_management,
        IsleofDucks.roles.mod_duck,
        IsleofDucks.roles.mod_duckling,
        IsleofDucks.roles.admin
    ],
    levels: [
        IsleofDucks.roles.service_management,
        IsleofDucks.roles.mod_duck,
        IsleofDucks.roles.mod_duckling,
        IsleofDucks.roles.admin
    ],
    booster: [
        IsleofDucks.roles.service_management,
        IsleofDucks.roles.mod_duck,
        IsleofDucks.roles.mod_duckling,
        IsleofDucks.roles.admin
    ],
    groups: [
        IsleofDucks.roles.service_management,
        IsleofDucks.roles.mod_duck,
        IsleofDucks.roles.mod_duckling,
        IsleofDucks.roles.admin
    ],
    all: [
        IsleofDucks.roles.service_management,
        IsleofDucks.roles.mod_duck,
        IsleofDucks.roles.mod_duckling,
        IsleofDucks.roles.admin
    ]
}