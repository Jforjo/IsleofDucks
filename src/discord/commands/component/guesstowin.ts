import { CreateInteractionResponse } from "@/discord/discordUtils";
import { APIInteractionResponse, APIMessageComponentButtonInteraction, ButtonStyle, ComponentType, InteractionResponseType, MessageFlags, TextInputStyle } from "discord-api-types/v10";
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
    // await CreateInteractionResponse(interaction.id, interaction.token, {
    //     type: InteractionResponseType.DeferredChannelMessageWithSource,
    //     data: { flags: MessageFlags.Ephemeral }
    // });

    const customIds = interaction.data.custom_id.split("-");

    if (customIds[1] === "setup") {
        if (customIds[2] === "answwer") await CreateInteractionResponse(interaction.id, interaction.token, {
            type: InteractionResponseType.Modal,
            data: {
                custom_id: `guesstowin-setup-answer`,
                title: "GtW Setup - Answer",
                components: [
                    {
                        type: ComponentType.ActionRow,
                        components: [
                            {
                                type: ComponentType.TextInput,
                                custom_id: "answer",
                                label: "Answer",
                                style: TextInputStyle.Short,
                                required: true,
                            }
                        ]
                    }
                ]
            }
        });
        else if (customIds[2] === "hints") await CreateInteractionResponse(interaction.id, interaction.token, {
            type: InteractionResponseType.Modal,
            data: {
                custom_id: `guesstowin-setup-hints`,
                title: "GtW Setup - Hint",
                components: [
                    {
                        type: ComponentType.ActionRow,
                        components: [
                            {
                                type: ComponentType.TextInput,
                                custom_id: "at",
                                label: "At number of guesses",
                                style: TextInputStyle.Short,
                                required: true,
                            }
                        ]
                    },
                    {
                        type: ComponentType.ActionRow,
                        components: [
                            {
                                type: ComponentType.TextInput,
                                custom_id: "hint",
                                label: "Hint",
                                style: TextInputStyle.Short,
                                required: true,
                            }
                        ]
                    }
                ]
            }
        });
        else if (customIds[2] === "prize") await CreateInteractionResponse(interaction.id, interaction.token, {
            type: InteractionResponseType.Modal,
            data: {
                custom_id: `guesstowin-setup-prize`,
                title: "GtW Setup - Prize",
                components: [
                    {
                        type: ComponentType.ActionRow,
                        components: [
                            {
                                type: ComponentType.TextInput,
                                custom_id: "prize",
                                label: "Prize",
                                style: TextInputStyle.Short,
                                required: true,
                            }
                        ]
                    }
                ]
            }
        });
    }

    return NextResponse.json(
        { success: true },
        { status: 200 }
    );
}