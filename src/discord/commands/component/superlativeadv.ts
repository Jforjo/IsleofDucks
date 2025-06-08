import { APIInteractionResponse, APIMessageComponentButtonInteraction } from "discord-api-types/v10";
import { NextResponse } from "next/server";
import { viewSuperlativeAdv, viewSuperlativeAdvWithDate } from "../application/superlativeadv";

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
    // await CreateInteractionResponse(interaction.id, interaction.token, {
    //     type: InteractionResponseType.DeferredChannelMessageWithSource,
    //     data: { flags: MessageFlags.Ephemeral }
    // });

    const customIds = interaction.data.custom_id.split("-");

    if (customIds[1] === "view") {
        if (/^page_[0-9]+$/gm.test(customIds[2])) {
            const page = parseInt(customIds[2].split("_")[1]);
            return await viewSuperlativeAdv(interaction, page);
        } else if (/^[0-9]{2}_[0-9]{2}_01$/gm.test(customIds[2])) {
            const date = customIds[2].replaceAll("_", "-");
            return await viewSuperlativeAdvWithDate(interaction, date);
        }
    }

    return NextResponse.json(
        { success: true },
        { status: 200 }
    );
}