import { APIInteractionResponse, APILabelComponent, APIMessageComponentInteraction, ComponentType, InteractionResponseType, MessageFlags, TextInputStyle } from "discord-api-types/v10";
import { CarrierAppChoices, CreateInteractionResponse, jsonToBitfield } from "@/discord/discordUtils";
import { NextResponse } from "next/server";
import { arrayChunks } from "../utils";

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
            custom_id: `carrierapp-${jsonToBitfield({
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
            title: "Carrier Application",
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
                ...arrayChunks(interaction.data.values, 10).map((chunk, index) => ({
                    type: ComponentType.Label,
                    label: "Proof",
                    description: "Make sure your proof are fullscreen screenshots that clearly show you meet the carry requirements.",
                    component: {
                        type: ComponentType.FileUpload,
                        custom_id: `proof${index + 1}`,
                        min_values: chunk.length,
                        max_values: chunk.length,
                        required: true
                    }
                }) as APILabelComponent)
            ],
        }
    });

    return NextResponse.json(
        { success: true },
        { status: 200 }
    );
}
