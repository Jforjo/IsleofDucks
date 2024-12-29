import { APIChatInputApplicationCommandInteraction, APIInteractionResponse, ApplicationCommandType, InteractionResponseType } from "discord-api-types/v10";
import { CreateInteractionResponse, FollowupMessage, IsleofDucks, GetAllGuildMembers, AddGuildMemberRole, RemoveGuildMemberRole, ConvertSnowflakeToDate } from "@/discord/discordUtils";
import { NextResponse } from "next/server";

const tempRole = "1311851831361671168";

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

    let usersHadRolesAdded = 0;
    let usersHadRolesRemoved = 0;
    let rolesAdded = 0;
    let rolesRemoved = 0;

    // Should probably change this to use a generator function
    const members = await GetAllGuildMembers(interaction.guild.id);
    // Not a Promise.all since the functions inside can get rate limited
    for (const member of members) {
        let userRoleAdded = false;
        let userRoleRemoved = false;
        if (member.roles.includes(IsleofDucks.roles.duck_guild_member) || member.roles.includes(IsleofDucks.roles.duckling_guild_member)) {
            if (!member.roles.includes(tempRole)) {
                // await AddGuildMemberRole(interaction.guild.id, member.user.id, tempRole);
                rolesAdded++;
                userRoleAdded = true;
            }
        } else {
            if (member.roles.includes(tempRole)) {
                // await RemoveGuildMemberRole(interaction.guild.id, member.user.id, tempRole);
                rolesRemoved++;
                userRoleRemoved = true;
            }
        }

        if (userRoleAdded) usersHadRolesAdded++;
        if (userRoleRemoved) usersHadRolesRemoved++;
    }


    await FollowupMessage(interaction.token, {
        content: null,
        embeds: [
            {
                title: "Done!",
                description: `Added ${rolesAdded} roles to ${usersHadRolesAdded} users.\nRemoved ${rolesRemoved} roles from ${usersHadRolesRemoved} users.`,
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