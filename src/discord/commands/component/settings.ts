import { CreateInteractionResponse, IsleofDucks } from "@/discord/discordUtils";
import { APIMessageComponentButtonInteraction, APIInteractionResponse, InteractionResponseType, MessageFlags, ComponentType, TextInputStyle } from "discord-api-types/v10";
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
    if (!interaction.member) {
        await CreateInteractionResponse(interaction.id, interaction.token, {
            type: InteractionResponseType.ChannelMessageWithSource,
            data: {
                flags: MessageFlags.Ephemeral,
                content: "Could not find who ran the command!"
            }
        });
        return NextResponse.json(
            { success: false, error: "Could not find who ran the command" },
            { status: 400 }
        )
    }
    if (!interaction.member.roles.includes(IsleofDucks.roles.admin)) {
        await CreateInteractionResponse(interaction.id, interaction.token, {
            type: InteractionResponseType.ChannelMessageWithSource,
            data: {
                flags: MessageFlags.Ephemeral,
                content: "You do not have permission to run this command!"
            }
        });
        return NextResponse.json(
            { success: false, error: "You do not have permission to run this command" },
            { status: 403 }
        )
    }

    // const action = interaction.data.custom_id.split("-")[1];
    const key = interaction.data.custom_id.split("-")[2];

    await CreateInteractionResponse(interaction.id, interaction.token, {
        type: InteractionResponseType.Modal,
        data: {
            custom_id: interaction.data.custom_id,
            title: "Edit setting",
            components: [
                {
                    type: ComponentType.TextDisplay,
                    content: `Enter the new value for the \`${key}\` setting below:`
                },
                {
                    type: ComponentType.Label,
                    label: "Value",
                    component: {
                        type: ComponentType.TextInput,
                        custom_id: "value",
                        placeholder: `Enter the setting value`,
                        style: TextInputStyle.Short,
                        required: true
                    }
                }
            ]
        }
    });

    return NextResponse.json(
        { success: true },
        { status: 200 }
    );
}