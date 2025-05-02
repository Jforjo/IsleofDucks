import { AddGuildMemberRole, CreateInteractionResponse, FollowupMessage, GetGuildMember, IsleofDucks, RemoveGuildMemberRole } from "@/discord/discordUtils";
import { APIInteractionResponse, APIMessageComponentButtonInteraction, InteractionResponseType } from "discord-api-types/v10";
import { NextResponse } from "next/server";


export default async function(
    interaction: APIMessageComponentButtonInteraction
): Promise<
    NextResponse<
        {
            success: boolean;
            error?: string;
        } | APIInteractionResponse
    >
> {
    // ACK response
    await CreateInteractionResponse(interaction.id, interaction.token, {
        type: InteractionResponseType.DeferredChannelMessageWithSource,
        data: {
            flags: 1 << 6
        }
    });
    
    if (!interaction.member) {
        await FollowupMessage(interaction.token, {
            content: "Could not find who ran the command!",
        });
        return NextResponse.json(
            { success: false, error: "Could not find who ran the command" },
            { status: 400 }
        );
    }
    if (!interaction.guild) {
        await FollowupMessage(interaction.token, {
            content: "This command can only be used in a server!"
        });
        return NextResponse.json(
            { success: false, error: "This command can only be used in a server" },
            { status: 400 }
        );
    }

    const user = await GetGuildMember(interaction.guild.id, interaction.member.user.id);
    if (!user) {
        await FollowupMessage(interaction.token, {
            content: "Failed to fetch user!",
        });
        return NextResponse.json(
            { success: false, error: "Failed to fetch user data" },
            { status: 400 }
        );
    }

    const roleType = interaction.data.custom_id.split("-")[1];
    const roleId = interaction.data.custom_id.split("-")[2];
    if (!roleId) {
        await FollowupMessage(interaction.token, {
            content: "Failed to fetch role!",
        });
        return NextResponse.json(
            { success: false, error: "Failed to fetch role data" },
            { status: 400 }
        );
    }
    if (!Object.keys(IsleofDucks.roles.reaction).includes(roleType)) {
        await FollowupMessage(interaction.token, {
            content: "Failed to fetch role!",
        });
        return NextResponse.json(
            { success: false, error: "Failed to fetch role data" },
            { status: 400 }
        );
    }
    const role = IsleofDucks.roles.reaction[roleType as keyof typeof IsleofDucks.roles.reaction].find(role => role.id === roleId);
    if (!role) {
        await FollowupMessage(interaction.token, {
            content: "Failed to fetch role!",
        });
        return NextResponse.json(
            { success: false, error: "Failed to fetch role data" },
            { status: 400 }
        );
    }

    if (user.roles.includes(role.id)) {
        await RemoveGuildMemberRole(interaction.guild.id, interaction.member.user.id, role.id);
        await FollowupMessage(interaction.token, {
            content: `You no longer have the <@&${role.id}> role!`,
        });
    } else {
        await AddGuildMemberRole(interaction.guild.id, interaction.member.user.id, role.id);
        await FollowupMessage(interaction.token, {
            content: `You now have the <@&${role.id}> role!`,
        })
    }

    
    return NextResponse.json(
        { success: true },
        { status: 200 }
    );
}