import { APIChatInputApplicationCommandInteraction, APIGuildMember, APIInteractionResponse, ApplicationCommandType, InteractionResponseType, Snowflake } from "discord-api-types/v10";
import { CreateInteractionResponse, FollowupMessage, IsleofDucks, GetAllGuildMembers, ConvertSnowflakeToDate, RemoveGuildMemberRole, AddGuildMemberRole } from "@/discord/discordUtils";
import { NextResponse } from "next/server";
import { getUsernameOrUUID } from "@/discord/hypixelUtils";
import { checkPlayer } from "./recruit";

export async function UpdateLevelRoles(
    guildID: Snowflake,
    member: APIGuildMember
): Promise<
    false | {
        rolesAdded: number;
        rolesRemoved: number;
        usersHadRolesAdded: number;
        usersHadRolesRemoved: number;
    }
> {
    let rolesAdded = 0;
    let rolesRemoved = 0;

    // If they don't contain either of the guild roles then remove all level roles
    if (
        !member.roles.includes(IsleofDucks.roles.duck_guild_member) &&
        !member.roles.includes(IsleofDucks.roles.duckling_guild_member)
    ) {
        for (const role of IsleofDucks.roles.levels) {
            if (member.roles.includes(role.id)) {
                await RemoveGuildMemberRole(guildID, member.user.id, role.id);
                rolesRemoved++;
            }
        }
        return {
            rolesAdded: rolesAdded,
            rolesRemoved: rolesRemoved,
            usersHadRolesAdded: rolesAdded === 0 ? 0 : 1,
            usersHadRolesRemoved: rolesRemoved === 0 ? 0 : 1
        }
    }

    if (!member.nick) return false;
    const uuidResponse = await getUsernameOrUUID(member.nick.replaceAll('✧', '').split(' ')[0]);
    if (!uuidResponse.success) return false;

    const playerResponse = await checkPlayer(uuidResponse.uuid);
    if (!playerResponse.success) return false;

    let expectedRole: Snowflake = "";
    let currentRoles: Snowflake[] = [];

    for (const role of IsleofDucks.roles.levels.sort((a, b) => a.requirement - b.requirement)) {
        if (member.roles.includes(role.id)) currentRoles.push(role.id);
        if (playerResponse.experience >= role.requirement) expectedRole = role.id;
    }

    // Remove roles they shouldn't have
    if (currentRoles.length > 1) {
        for (const role of currentRoles) {
            if (role !== expectedRole) {
                await RemoveGuildMemberRole(guildID, member.user.id, role);
                rolesRemoved++;
                currentRoles = currentRoles.filter(r => r !== role);
            }
        }
    }

    // Add the role that they should have
    if (currentRoles.length < 1) {
        await AddGuildMemberRole(guildID, member.user.id, expectedRole);
        rolesAdded++;
    }

    if (rolesAdded === 0 && rolesRemoved === 0) return false;
    return {
        rolesAdded: rolesAdded,
        rolesRemoved: rolesRemoved,
        usersHadRolesAdded: rolesAdded === 0 ? 0 : 1,
        usersHadRolesRemoved: rolesRemoved === 0 ? 0 : 1
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

    const promises: Promise<
        false | {
            rolesAdded: number;
            rolesRemoved: number;
            usersHadRolesAdded: number;
            usersHadRolesRemoved: number;
        }
    >[] = [];

    // Should probably change this to use a generator function
    const members = await GetAllGuildMembers(guildID);
    for (const member of members) {
        let userRoleAdded = false;
        let userRoleRemoved = false;

        promises.push(UpdateLevelRoles(guildID, member));

        // if (member.roles.includes(IsleofDucks.roles.duck_guild_member) || member.roles.includes(IsleofDucks.roles.duckling_guild_member)) {
        //     if (!member.roles.includes(tempRole)) {
        //         // await AddGuildMemberRole(guildID, member.user.id, tempRole);
        //         rolesAdded++;
        //         userRoleAdded = true;
        //     }
        // } else {
        //     if (member.roles.includes(tempRole)) {
        //         // await RemoveGuildMemberRole(guildID, member.user.id, tempRole);
        //         rolesRemoved++;
        //         userRoleRemoved = true;
        //     }
        // }

        if (userRoleAdded) usersHadRolesAdded++;
        if (userRoleRemoved) usersHadRolesRemoved++;
    }

    const result = await Promise.all(promises);
    for (const res of result) {
        if (res) {
            rolesAdded += res.rolesAdded;
            rolesRemoved += res.rolesRemoved;
            usersHadRolesAdded += res.usersHadRolesAdded;
            usersHadRolesRemoved += res.usersHadRolesRemoved;
        }
    }

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

    const {
        rolesAdded,
        rolesRemoved,
        usersHadRolesAdded,
        usersHadRolesRemoved 
    } = await UpdateRoles(interaction.guild.id);

    await FollowupMessage(interaction.token, {
        content: null,
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