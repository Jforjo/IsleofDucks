import { APIInteractionResponse, APIMessageComponentButtonInteraction, ComponentType, InteractionResponseType, TextInputStyle } from "discord-api-types/v10";
import { CreateInteractionResponse } from "@/discord/discordUtils";
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
    await CreateInteractionResponse(interaction.id, interaction.token, {
        type: InteractionResponseType.Modal,
        data: {
            custom_id: "support",
            title: "Support",
            components: [
                {
                    type: ComponentType.Label,
                    label: "Reason",
                    component: {
                        type: ComponentType.TextInput,
                        custom_id: "reason",
                        placeholder: "Please state the purpose of your ticket",
                        style: TextInputStyle.Paragraph,
                        required: true,
                    },
                },
            ],
        }
    });

    return NextResponse.json(
        { success: true },
        { status: 200 }
    );
}
