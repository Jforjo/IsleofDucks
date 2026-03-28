import { APIChatInputApplicationCommandInteraction, APIGuildMember, APIInteractionResponse, ApplicationCommandType, InteractionResponseType, MessageType, Snowflake } from "discord-api-types/v10";
import { CreateInteractionResponse, FollowupMessage, IsleofDucks, GetAllGuildMembers, ConvertSnowflakeToDate, RemoveGuildMemberRole, AddGuildMemberRole, GetAllChannelMessages } from "@/discord/discordUtils";
import { NextResponse } from "next/server";
import { getGuildData, getUsernameOrUUID } from "@/discord/hypixelUtils";
import { DiscordRole, getDiscordRole, getDiscordRoleFromDiscordID, getDiscordRoleFromDiscordName, getUserDataFromUUID, updateDiscordRoleName } from "@/discord/utils";

export async function UpdateLevelRoles(
    guildID: Snowflake,
    member: APIGuildMember
): Promise<
    false | {
        rolesAdded: number;
        rolesRemoved: number;
        usersHadRoleAdded: string[];
        usersHadRoleRemoved: string[];
    }
> {
    let rolesAdded = 0;
    let rolesRemoved = 0;
    const usersHadRoleAdded: string[] = [];
    const usersHadRoleRemoved: string[] = [];

    // If they don't contain either of the guild roles then remove all level roles
    if (
        !member.roles.includes(IsleofDucks.roles.duck_guild_member) &&
        !member.roles.includes(IsleofDucks.roles.duckling_guild_member)
    ) {
        for (const role of IsleofDucks.roles.levels) {
            if (member.roles.includes(role.id)) {
                await RemoveGuildMemberRole(guildID, member.user.id, role.id);
                rolesRemoved++;
                usersHadRoleRemoved.push(role.id);
            }
        }
        return {
            rolesAdded: rolesAdded,
            rolesRemoved: rolesRemoved,
            usersHadRoleAdded: usersHadRoleAdded,
            usersHadRoleRemoved: usersHadRoleRemoved
        }
    }

    let player: DiscordRole;

    // Prioritise Discord ID
    const playerResponseFromDiscordID = await getDiscordRoleFromDiscordID(member.user.id);
    if (!playerResponseFromDiscordID) {
        const playerResponseFromDiscordName = await getDiscordRoleFromDiscordName(member.user.username);
        if (!playerResponseFromDiscordName) {
            if (!member.nick) return false;
            const uuidResponse = await getUsernameOrUUID(member.nick.replaceAll('✧', '').split(' ')[0]);
            if (!uuidResponse.success) return false;

            const playerResponse = await getDiscordRole(uuidResponse.uuid);
            if (!playerResponse) {
                // Someone could nick to someone elses name ig
                // await addDiscordRole(uuidResponse.uuid, member.user.username, null);
                return false;
            }

            player = playerResponse;
        } else {
            player = playerResponseFromDiscordName;
            // Add Discord ID to DB
            await updateDiscordRoleName(player.uuid, member.user.username, member.user.id);
        }
    } else {
        player = playerResponseFromDiscordID;
    }

    if (!player) return false;
    if (!player.exp) return false;

    let expectedRole: Snowflake = "";
    let currentRoles: Snowflake[] = [];

    for (const role of IsleofDucks.roles.levels.sort((a, b) => a.requirement - b.requirement)) {
        if (member.roles.includes(role.id)) currentRoles.push(role.id);
        if (player.exp >= role.requirement) expectedRole = role.id;
    }

    // Remove roles they shouldn't have
    if (currentRoles.length >= 1) {
        const newRoles: Snowflake[] = []
        for (const role of currentRoles) {
            if (role !== expectedRole) {
                await RemoveGuildMemberRole(guildID, member.user.id, role);
                rolesRemoved++;
                if (!usersHadRoleRemoved.includes(role))
                    usersHadRoleRemoved.push(role);
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
        if (!usersHadRoleAdded.includes(expectedRole))
            usersHadRoleAdded.push(expectedRole);
    }

    if (rolesAdded === 0 && rolesRemoved === 0) return false;
    return {
        rolesAdded: rolesAdded,
        rolesRemoved: rolesRemoved,
        usersHadRoleAdded: usersHadRoleAdded,
        usersHadRoleRemoved: usersHadRoleRemoved
    }
}

export async function UpdateRoles(
    guildID: Snowflake
): Promise<
    {
        rolesAdded: number;
        rolesRemoved: number;
        usersHadRolesAdded: number;
        usersHadRolesRemoved: number;
    }
> {
    let usersHadRolesAdded = 0;
    let usersHadRolesRemoved = 0;
    let rolesAdded = 0;
    let rolesRemoved = 0;

    // const promises: Promise<
    //     false | {
    //         rolesAdded: number;
    //         rolesRemoved: number;
    //         usersHadRolesAdded: number;
    //         usersHadRolesRemoved: number;
    //     }
    // >[] = [];
    const boosterMessages = (await GetAllChannelMessages(IsleofDucks.channels.nitroboosts)).filter(msg => msg.type === MessageType.GuildBoost);
    // Should probably change this to use a generator function
    const members = await GetAllGuildMembers(guildID);
    for (const member of members) {
        let userHadRoleRemoved = false;
        let userHadRoleAdded = false;
        // promises.push(UpdateLevelRoles(guildID, member));
        const LevelResult = await UpdateLevelRoles(guildID, member);
        if (LevelResult) {
            rolesAdded += LevelResult.rolesAdded;
            rolesRemoved += LevelResult.rolesRemoved;
            if (LevelResult.usersHadRoleAdded.includes(member.user.id)) userHadRoleAdded = true;
            if (LevelResult.usersHadRoleRemoved.includes(member.user.id)) userHadRoleRemoved = true;
        }

        if (member.premium_since) {
            // Offset by 1 minute just in case
            const messagesToCheck = boosterMessages.filter(msg => new Date(msg.timestamp).getTime() > new Date(member.premium_since ?? '0').getTime() - 1000 * 60);
            const boosts = messagesToCheck.filter(msg => msg.author.id === member.user.id);
            // 2 = 1 and 4 = 2
            // It's counting them twice for some reason
            if (boosts.length >= 4 && !member.roles.includes(IsleofDucks.roles.booster2x)) {
                await AddGuildMemberRole(guildID, member.user.id, IsleofDucks.roles.booster2x);
                rolesAdded++;
                userHadRoleAdded = true;
            } else if (boosts.length < 4 && member.roles.includes(IsleofDucks.roles.booster2x)) {
                await RemoveGuildMemberRole(guildID, member.user.id, IsleofDucks.roles.booster2x);
                rolesRemoved++;
                userHadRoleRemoved = true;
            }
        } else {
            if (member.roles.includes(IsleofDucks.roles.booster2x)) {
                await RemoveGuildMemberRole(guildID, member.user.id, IsleofDucks.roles.booster2x);
                rolesRemoved++;
                userHadRoleRemoved = true;
            }
        }

        if (member.roles.includes(IsleofDucks.roles.duck_guild_member) || member.roles.includes(IsleofDucks.roles.duckling_guild_member)) {
            if (!member.roles.includes(IsleofDucks.roles.guild_member)) {
                await AddGuildMemberRole(guildID, member.user.id, IsleofDucks.roles.guild_member);
                rolesAdded++;
                userHadRoleAdded = true;
            }
        } else {
            if (member.roles.includes(IsleofDucks.roles.guild_member)) {
                await RemoveGuildMemberRole(guildID, member.user.id, IsleofDucks.roles.guild_member);
                rolesRemoved++;
                userHadRoleRemoved = true;
            }
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
                    userHadRoleRemoved = true;
                }
            } else {
                if (!member.roles.includes(group.id)) {
                    await AddGuildMemberRole(guildID, member.user.id, group.id);
                    rolesAdded++;
                    userHadRoleAdded = true;
                }
            }
        }

        if (userHadRoleAdded) usersHadRolesAdded++;
        if (userHadRoleRemoved) usersHadRolesRemoved++;
    }
    const duckMembers = await getGuildData("Isle of Ducks");
    const ducklingMembers = await getGuildData("Isle of Ducklings");
    const guildMembers: string[] = [];
    if (duckMembers.success && ducklingMembers.success) {
        for (const member of duckMembers.guild.members) {
            const res = await getUserDataFromUUID(member.uuid);
            if (!res.success) continue;
            if (!res.data.discord) continue;
            const discordID = res.data.discord.id;
            if (!discordID) continue;
            const discordMember = members.find(m => m.user.id === discordID);
            if (!discordMember) continue;
            guildMembers.push(discordID);
            if (discordMember.roles.includes(IsleofDucks.roles.duck_guild_member)) continue;
            await AddGuildMemberRole(guildID, discordID, IsleofDucks.roles.duck_guild_member);
            rolesAdded++;
        }
        for (const member of ducklingMembers.guild.members) {
            const res = await getUserDataFromUUID(member.uuid);
            if (!res.success) continue;
            if (!res.data.discord) continue;
            const discordID = res.data.discord.id;
            if (!discordID) continue;
            const discordMember = members.find(m => m.user.id === discordID);
            if (!discordMember) continue;
            guildMembers.push(discordID);
            if (discordMember.roles.includes(IsleofDucks.roles.duckling_guild_member)) continue;
            await AddGuildMemberRole(guildID, discordID, IsleofDucks.roles.duckling_guild_member);
            rolesAdded++;
        }
        const nonGuildMembers = members.filter(m => !guildMembers.includes(m.user.id));
        for (const member of nonGuildMembers) {
            if (member.roles.includes(IsleofDucks.roles.duck_guild_member)) {
                await RemoveGuildMemberRole(guildID, member.user.id, IsleofDucks.roles.duck_guild_member);
                rolesRemoved++;
            }
            if (member.roles.includes(IsleofDucks.roles.duckling_guild_member)) {
                await RemoveGuildMemberRole(guildID, member.user.id, IsleofDucks.roles.duckling_guild_member);
                rolesRemoved++;
            }
        }
    }

    // const result = await Promise.all(promises);
    // for (const res of result) {
    //     if (res) {
    //         rolesAdded += res.rolesAdded;
    //         rolesRemoved += res.rolesRemoved;
    //         usersHadRolesAdded += res.usersHadRolesAdded;
    //         usersHadRolesRemoved += res.usersHadRolesRemoved;
    //     }
    // }

    return {
        rolesAdded: rolesAdded,
        rolesRemoved: rolesRemoved,
        usersHadRolesAdded: usersHadRolesAdded,
        usersHadRolesRemoved: usersHadRolesRemoved
    }
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

    const {
        rolesAdded,
        rolesRemoved,
        usersHadRolesAdded,
        usersHadRolesRemoved 
    } = await UpdateRoles(interaction.guild.id);

    await FollowupMessage(interaction.token, {
        embeds: [
            {
                title: "Done!",
                description: [
                    `Added ${rolesAdded} roles to ${usersHadRolesAdded} users.`,
                    `Removed ${rolesRemoved} roles from ${usersHadRolesRemoved} users.`,
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
    type: ApplicationCommandType.ChatInput
}