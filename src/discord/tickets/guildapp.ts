import { APIInteractionResponse, APIMessageComponentButtonInteraction, ComponentType, InteractionResponseType, TextInputStyle } from "discord-api-types/v10";
import { CreateInteractionResponse } from "@/discord/discordUtils";
import { NextResponse } from "next/server";
import { getSettingValue } from "../utils";

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
    const duckReq = await getSettingValue("duck_req");
    const ducklingReq = await getSettingValue("duckling_req");

    await CreateInteractionResponse(interaction.id, interaction.token, {
        type: InteractionResponseType.Modal,
        data: {
            custom_id: "guildapp",
            title: "Guild Application",
            components: [
                {
                    type: ComponentType.Label,
                    label: "Guild",
                    component: {
                        type: ComponentType.StringSelect,
                        custom_id: "guild",
                        placeholder: "Select a guild",
                        options: [
                            {
                                label: "Isle of Ducks",
                                description: duckReq ? `The current level requirement for Isle of Ducks is ${parseInt(duckReq) / 100}.` : undefined,
                                value: "duck",
                            },
                            {
                                label: "Isle of Ducklings",
                                description: ducklingReq ? `The current level requirement for Isle of Ducklings is ${parseInt(ducklingReq) / 100}.` : undefined,
                                value: "duckling",
                            },
                        ]
                    }
                },
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
