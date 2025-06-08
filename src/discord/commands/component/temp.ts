import { APIChatInputApplicationCommandInteraction, APIInteractionResponse, InteractionResponseType, MessageFlags } from "discord-api-types/v10";
import { CreateInteractionResponse } from "../../discordUtils";
import { NextResponse } from "next/server";

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
    await CreateInteractionResponse(interaction.id, interaction.token, {
        type: InteractionResponseType.ChannelMessageWithSource,
        data: {
            flags: MessageFlags.Ephemeral,
            content: "o/"
        }
    });

    return NextResponse.json(
        { success: true },
        { status: 200 }
    );
}