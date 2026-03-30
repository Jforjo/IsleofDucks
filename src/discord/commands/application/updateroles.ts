import { APIChatInputApplicationCommandInteraction, APIChatInputApplicationCommandInteractionData, APIInteractionResponse, ApplicationCommandOptionType, ApplicationCommandType, ComponentType, InteractionResponseType, MessageFlags, MessageType, Snowflake } from "discord-api-types/v10";
import { CreateInteractionResponse, FollowupMessage, IsleofDucks, GetAllGuildMembers, ConvertSnowflakeToDate, RemoveGuildMemberRole, AddGuildMemberRole, GetAllChannelMessages } from "@/discord/discordUtils";
import { NextResponse } from "next/server";
import { getGuildData } from "@/discord/hypixelUtils";
import { getUserDataFromDiscordID, getUserDataFromUUID } from "@/discord/utils";

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

export async function UpdateGuildRoles(guildID: Snowflake): Promise<{
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
            await AddGuildMemberRole(guildID, discordID, IsleofDucks.roles.guild_member);
            rolesAdded++;
            if (discordMember.roles.includes(IsleofDucks.roles.duck_guild_member)) continue;
            await AddGuildMemberRole(guildID, discordID, IsleofDucks.roles.duck_guild_member);
            rolesAdded++;
            usersHadRolesAdded.push(discordID);
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
            await AddGuildMemberRole(guildID, discordID, IsleofDucks.roles.guild_member);
            rolesAdded++;
            if (discordMember.roles.includes(IsleofDucks.roles.duckling_guild_member)) continue;
            await AddGuildMemberRole(guildID, discordID, IsleofDucks.roles.duckling_guild_member);
            rolesAdded++;
            usersHadRolesAdded.push(discordID);
        }
        const nonGuildMembers = members.filter(m => !guildMembers.includes(m.user.id));
        for (const member of nonGuildMembers) {
            if (member.roles.includes(IsleofDucks.roles.duck_guild_member)) {
                await RemoveGuildMemberRole(guildID, member.user.id, IsleofDucks.roles.duck_guild_member);
                rolesRemoved++;
                await RemoveGuildMemberRole(guildID, member.user.id, IsleofDucks.roles.guild_member);
                rolesRemoved++;
                usersHadRolesRemoved.push(member.user.id);
            }
            if (member.roles.includes(IsleofDucks.roles.duckling_guild_member)) {
                await RemoveGuildMemberRole(guildID, member.user.id, IsleofDucks.roles.duckling_guild_member);
                rolesRemoved++;
                await RemoveGuildMemberRole(guildID, member.user.id, IsleofDucks.roles.guild_member);
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
    }
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

    let rolesAdded: number,
        rolesRemoved: number,
        usersHadRolesAdded: Snowflake[],
        usersHadRolesRemoved: Snowflake[]
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
        ({ rolesAdded, rolesRemoved, usersHadRolesAdded, usersHadRolesRemoved } = await UpdateGuildRoles(interaction.guild.id));
    } else if (options.levels) {
        ({ rolesAdded, rolesRemoved, usersHadRolesAdded, usersHadRolesRemoved } = await UpdateLevelRoles(interaction.guild.id));
    } else if (options.booster) {
        ({ rolesAdded, rolesRemoved, usersHadRolesAdded, usersHadRolesRemoved } = await UpdateBoosterRoles(interaction.guild.id));
    } else if (options.groups) {
        ({ rolesAdded, rolesRemoved, usersHadRolesAdded, usersHadRolesRemoved } = await UpdateGroupRoles(interaction.guild.id));
    } else if (options.all) {
        ({ rolesAdded, rolesRemoved, usersHadRolesAdded, usersHadRolesRemoved } = await UpdateRoles(interaction.guild.id));
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
            type: ApplicationCommandOptionType.Subcommand
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