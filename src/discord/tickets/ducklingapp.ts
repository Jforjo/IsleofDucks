import { APIInteractionResponse, APIMessageComponentButtonInteraction, ComponentType, InteractionResponseType } from "discord-api-types/v10";
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
            custom_id: "ducklingapp",
            title: "Duckling Application",
            components: [
                {
                    type: ComponentType.ActionRow,
                    components: [
                        {
                            type: ComponentType.TextInput,
                            custom_id: "username",
                            label: "Enter your username",
                            style: 1,
                            min_length: 3,
                            max_length: 16,
                            required: true,
                        },
                    ],
                },
            ],
        }
    });

    return NextResponse.json(
        { success: true },
        { status: 200 }
    );
}
