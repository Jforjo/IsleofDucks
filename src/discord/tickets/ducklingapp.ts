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
            custom_id: "ducklingapp",
            title: "Duckling Application",
            components: [
                {
                    type: ComponentType.Label,
                    label: "Username",
                    component: {
                        type: ComponentType.TextInput,
                        custom_id: "username",
                        placeholder: "Enter your Minecraft username",
                        style: TextInputStyle.Short,
                        min_length: 3,
                        max_length: 16,
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
