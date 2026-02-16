import { APIChatInputApplicationCommandInteraction, APIInteractionResponse, ApplicationCommandType, ComponentType, InteractionResponseType, MessageFlags, TextInputStyle } from "discord-api-types/v10";
import { CreateInteractionResponse, IsleofDucks } from "@/discord/discordUtils";
import { NextResponse } from "next/server";

export default async function(
    interaction: APIChatInputApplicationCommandInteraction
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
        );
    }
    if (!(
        interaction.member.roles.includes(IsleofDucks.roles.admin) ||
        interaction.member.roles.includes(IsleofDucks.roles.mod_duck) ||
        interaction.member.roles.includes(IsleofDucks.roles.mod_duckling)
    )) {
        await CreateInteractionResponse(interaction.id, interaction.token, {
            type: InteractionResponseType.ChannelMessageWithSource,
            data: {
                flags: MessageFlags.Ephemeral,
                content: "You don't have permission to use this command!"
            }
        });
        return NextResponse.json(
            { success: false, error: "You don't have permission to use this command" },
            { status: 403 }
        );
    }
    
    await CreateInteractionResponse(interaction.id, interaction.token, {
        type: InteractionResponseType.Modal,
        data: {
            custom_id: `ban-modal`,
            title: "Ban a player",
            components: [
                {
                    type: ComponentType.Label,
                    label: "Username",
                    component: {
                        type: ComponentType.TextInput,
                        custom_id: "username",
                        placeholder: "Enter the username of the player to ban",
                        style: TextInputStyle.Short,
                        min_length: 3,
                        max_length: 16,
                        required: true,
                    },
                },
                {
                    type: ComponentType.Label,
                    label: "Discord User (optional)",
                    component: {
                        type: ComponentType.UserSelect,
                        custom_id: "discordid",
                        placeholder: "Select the Discord user to ban (optional)",
                        min_values: 0,
                        max_values: 1,
                        required: false,
                    },
                },
                {
                    type: ComponentType.Label,
                    label: "Reason",
                    component: {
                        type: ComponentType.TextInput,
                        custom_id: "reason",
                        placeholder: "Enter the reason for the ban",
                        style: TextInputStyle.Paragraph,
                        required: true,
                    },
                },
                {
                    type: ComponentType.Label,
                    label: "Proof (optional)",
                    component: {
                        type: ComponentType.FileUpload,
                        custom_id: "proof",
                        min_values: 0,
                        max_values: 10,
                        required: false,
                    },
                }
            ]
        }
    });
    return NextResponse.json(
        { success: false, error: "Unknown command" },
        { status: 404 }
    );
}
export const CommandData = {
    name: "ban",
    description: "Ban someone.",
    type: ApplicationCommandType.ChatInput,
}