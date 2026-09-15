import { APIChatInputApplicationCommandInteraction, APIChatInputApplicationCommandInteractionData, APIInteractionResponse, ApplicationCommandOptionType, ApplicationCommandType, ComponentType, InteractionResponseType, MessageFlags, TextInputStyle } from "discord-api-types/v10";
import { CreateInteractionResponse, ErrorEmbed, IsleofDucks } from "@/discord/discordUtils";
import { NextResponse } from "next/server";
import { arrayContainsAny } from "@/discord/utils";

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
                flags: MessageFlags.Ephemeral | MessageFlags.IsComponentsV2,
                components: ErrorEmbed("Could not find who ran the command", undefined, true)
            }
        });
        return NextResponse.json(
            { success: false, error: "Could not find who ran the command" },
            { status: 400 }
        );
    }
    if (!arrayContainsAny(interaction.member.roles, RequiredRoles)) {
        await CreateInteractionResponse(interaction.id, interaction.token, {
            type: InteractionResponseType.ChannelMessageWithSource,
            data: {
                flags: MessageFlags.Ephemeral | MessageFlags.IsComponentsV2,
                components: ErrorEmbed("You don't have permission to use this command!", undefined, true)
            }
        });
        return NextResponse.json(
            { success: false, error: "You don't have permission to use this command" },
            { status: 403 }
        );
    }

    if (!interaction.data) {
        await CreateInteractionResponse(interaction.id, interaction.token, {
            type: InteractionResponseType.ChannelMessageWithSource,
            data: {
                flags: MessageFlags.Ephemeral | MessageFlags.IsComponentsV2,
                components: ErrorEmbed("Missing interaction data", undefined, true)
            }
        });
        return NextResponse.json(
            { success: false, error: 'Missing interaction data' },
            { status: 400 }
        );
    }

    const interactionData = interaction.data as APIChatInputApplicationCommandInteractionData;
    if (!interactionData.options || interactionData.options.length !== 1 || interactionData.options[0].type !== ApplicationCommandOptionType.String) {
        await CreateInteractionResponse(interaction.id, interaction.token, {
            type: InteractionResponseType.ChannelMessageWithSource,
            data: {
                flags: MessageFlags.Ephemeral | MessageFlags.IsComponentsV2,
                components: ErrorEmbed("Missing interaction data options", undefined, true)
            }
        });
        return NextResponse.json(
            { success: false, error: 'Missing interaction data options' },
            { status: 400 }
        );
    }

    if (!interactionData.options[0] || !IsleofDucks.banlistTypes.includes(interactionData.options[0].value as typeof IsleofDucks.banlistTypes[number])) {
        await CreateInteractionResponse(interaction.id, interaction.token, {
            type: InteractionResponseType.ChannelMessageWithSource,
            data: {
                flags: MessageFlags.Ephemeral | MessageFlags.IsComponentsV2,
                components: ErrorEmbed("Invalid banlist type", undefined, true)
            }
        });
        return NextResponse.json(
            { success: false, error: 'Invalid banlist type' },
            { status: 400 }
        );
    }
    
    await CreateInteractionResponse(interaction.id, interaction.token, {
        type: InteractionResponseType.Modal,
        data: {
            custom_id: `ban-modal-${interactionData.options[0].value}`,
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
        { success: true },
        { status: 200 }
    );
}
export const CommandData = {
    name: "ban",
    description: "Ban someone.",
    options: [
        {
            name: "type",
            description: "The type of ban",
            type: ApplicationCommandOptionType.String,
            required: true,
            choices: IsleofDucks.banlistTypes.map(type => ({ name: type, value: type }))
        }
    ],
    type: ApplicationCommandType.ChatInput,
}
export const RequiredRoles: string[] = [
    IsleofDucks.roles.admin,
    IsleofDucks.roles.mod_duck,
    IsleofDucks.roles.mod_duckling
];