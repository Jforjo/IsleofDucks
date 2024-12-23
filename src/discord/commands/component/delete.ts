import { CreateInteractionResponse, DeleteChannel, FollowupMessage, IsleofDucks } from "@/discord/discordUtils";
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
    // ACK response and update the original message
    await CreateInteractionResponse(interaction.id, interaction.token, {
        type: InteractionResponseType.DeferredMessageUpdate,
    });

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

    if (!interaction.member.roles.includes(IsleofDucks.roles.admin)) {
        await FollowupMessage(interaction.token, {
            content: "You do not have permission to close this ticket!"
        });
        return NextResponse.json(
            { success: false, error: "You do not have permission to close this ticket" },
            { status: 403 }
        )
    }

    await DeleteChannel(interaction.channel.id);

    return NextResponse.json(
        { success: true },
        { status: 200 }
    );
}
