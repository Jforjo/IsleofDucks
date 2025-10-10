import { APIInteractionResponse, APIMessageComponentInteraction, ComponentType, InteractionResponseType, MessageFlags, TextInputStyle } from "discord-api-types/v10";
import { CarrierAppChoices, CreateInteractionResponse, jsonToBitfield } from "@/discord/discordUtils";
import { NextResponse } from "next/server";

export default async function(
    interaction: APIMessageComponentInteraction
): Promise<
    NextResponse<
        {
            success: boolean;
            error?: string;
        } | APIInteractionResponse
    >
> {
    if (interaction.data.component_type !== ComponentType.StringSelect) {
        await CreateInteractionResponse(interaction.id, interaction.token, {
            type: InteractionResponseType.ChannelMessageWithSource,
            data: {
                flags: MessageFlags.Ephemeral,
                content: "The component you interacted with is not a select menu."
            },
        });
        return NextResponse.json(
            { success: false, error: `Invalid Component Type. Expected ${ComponentType.StringSelect}, got ${interaction.data.component_type}.`, },
            { status: 400 }
        );
    }
    await CreateInteractionResponse(interaction.id, interaction.token, {
        type: InteractionResponseType.Modal,
        data: {
            custom_id: `carry-${jsonToBitfield({
                f4: interaction.data.values.includes("f4"),
                f6: interaction.data.values.includes("f6"),
                f7: interaction.data.values.includes("f7"),
                m3: interaction.data.values.includes("m3"),
                m6: interaction.data.values.includes("m6"),
                m7: interaction.data.values.includes("m7"),
                revenant: interaction.data.values.includes("revenant"),
                tarantula: interaction.data.values.includes("tarantula"),
                sven: interaction.data.values.includes("sven"),
                voidgloom: interaction.data.values.includes("voidgloom"),
                inferno: interaction.data.values.includes("inferno"),
                kuudra2: interaction.data.values.includes("kuudra2"),
                kuudra5: interaction.data.values.includes("kuudra5"),
            }, CarrierAppChoices)}`,
            title: "Carry Request",
            components: [
                {
                    type: ComponentType.ActionRow,
                    components: [
                        {
                            type: ComponentType.TextInput,
                            custom_id: "username",
                            label: "Enter your username",
                            style: TextInputStyle.Short,
                            min_length: 3,
                            max_length: 16,
                            required: true,
                        },
                    ],
                },
                {
                    type: ComponentType.ActionRow,
                    components: [
                        {
                            type: ComponentType.TextInput,
                            custom_id: "timezone",
                            label: "Enter timezone (e.g. UTC+0, UTC-5)",
                            style: TextInputStyle.Short,
                            min_length: 3,
                            max_length: 8,
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
