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
            custom_id: "sponsor",
            title: "Sponsor Giveaway",
            components: [
                {
                    type: ComponentType.Label,
                    label: "Item to Give Away",
                    component: {
                        type: ComponentType.TextInput,
                        custom_id: "item",
                        placeholder: "What would you like to give away?",
                        style: TextInputStyle.Short,
                        required: true,
                    },
                },
                {
                    type: ComponentType.Label,
                    label: "Number of Winners",
                    component: {
                        type: ComponentType.TextInput,
                        custom_id: "winners",
                        placeholder: "How many winners are there?",
                        style: TextInputStyle.Short,
                        required: true,
                    },
                },
                {
                    type: ComponentType.Label,
                    label: "Giveaway Type",
                    component: {
                        type: ComponentType.StringSelect,
                        custom_id: "type",
                        placeholder: "What type of giveaway?",
                        options: [
                            {
                                label: "Everyone",
                                description: "Everyone can enter",
                                value: "everyone",
                            },
                            {
                                label: "Guild Only",
                                description: "Only guild members can enter. This is BOTH Isle of Ducks and Isle of Ducklings.",
                                value: "guild",
                            }
                        ],
                        required: true,
                    },
                },
                {
                    type: ComponentType.Label,
                    label: "Duration",
                    description: "e.g. 1d, 3d, 1w",
                    component: {
                        type: ComponentType.TextInput,
                        custom_id: "time",
                        placeholder: "Roughly how long should the giveaway last?",
                        style: TextInputStyle.Short,
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
