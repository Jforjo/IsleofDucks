import { CreateInteractionResponse, ConvertSnowflakeToDate, ErrorEmbed, IsleofDucks } from "@/discord/discordUtils";
import { arrayContainsAny } from "@/discord/utils";
import { APIChatInputApplicationCommandInteraction, APIInteractionResponse, InteractionResponseType, APIChatInputApplicationCommandInteractionData, ApplicationCommandOptionType, MessageFlags, ComponentType, ButtonStyle } from "discord-api-types/v10";
import { NextResponse } from "next/server";

async function setupGuessToWin(
    interaction: APIChatInputApplicationCommandInteraction
): Promise<
    NextResponse<
        {
            success: boolean;
            error?: string;
        } | APIInteractionResponse
    >
> {
    const timestamp = ConvertSnowflakeToDate(interaction.id);
    if (!interaction.member) {
        await CreateInteractionResponse(interaction.id, interaction.token, {
            type: InteractionResponseType.ChannelMessageWithSource,
            data: {
                flags: MessageFlags.Ephemeral | MessageFlags.IsComponentsV2,
                components: ErrorEmbed("Could not find who ran the command", timestamp, true),
            }
        });
        return NextResponse.json(
            { success: false, error: "Could not find who ran the command" },
            { status: 400 }
        );
    }
    // const userId = interaction.member.user.id || interaction.user.id;

    if (!arrayContainsAny(RequiredRoles.setup, interaction.member.roles)) {
        await CreateInteractionResponse(interaction.id, interaction.token, {
            type: InteractionResponseType.ChannelMessageWithSource,
            data: {
                flags: MessageFlags.Ephemeral | MessageFlags.IsComponentsV2,
                components: ErrorEmbed("You don't have permission to run this command", timestamp, true),
            }
        });
        return NextResponse.json(
            { success: false, error: "You don't have permission to run this command" },
            { status: 403 }
        );
    }

    await CreateInteractionResponse(interaction.id, interaction.token, {
        type: InteractionResponseType.ChannelMessageWithSource,
        data: {
            flags: MessageFlags.Ephemeral | MessageFlags.IsComponentsV2,
            components: [
                {
                    type: ComponentType.Container,
                    accent_color: IsleofDucks.colours.main,
                    components: [
                        {
                            type: ComponentType.TextDisplay,
                            content: "## GtW Setup",
                        },
                        { type: ComponentType.Separator },
                        {
                            type: ComponentType.Section,
                            components: [
                                {
                                    type: ComponentType.TextDisplay,
                                    content: "Answer:",
                                }
                            ],
                            accessory: {
                                type: ComponentType.Button,
                                label: "Set",
                                style: ButtonStyle.Secondary,
                                // No need for userId as it's ephemeral
                                custom_id: `guesstowin-setup-answer`
                            }
                        },
                        {
                            type: ComponentType.Section,
                            components: [
                                {
                                    type: ComponentType.TextDisplay,
                                    content: "Hints:",
                                }
                            ],
                            accessory: {
                                type: ComponentType.Button,
                                label: "Set",
                                style: ButtonStyle.Secondary,
                                // No need for userId as it's ephemeral
                                custom_id: `guesstowin-setup-hints`
                            }
                        },
                        {
                            type: ComponentType.Section,
                            components: [
                                {
                                    type: ComponentType.TextDisplay,
                                    content: "Prize:",
                                }
                            ],
                            accessory: {
                                type: ComponentType.Button,
                                label: "Set",
                                style: ButtonStyle.Secondary,
                                // No need for userId as it's ephemeral
                                custom_id: `guesstowin-setup-prize`
                            }
                        },
                        { type: ComponentType.Separator },
                        {
                            type: ComponentType.TextDisplay,
                            content: `Response time: ${Date.now() - timestamp.getTime()}ms • <t:${Math.floor(Date.now() / 1000)}:F>`
                        }
                    ]
                }
            ]
        }
    });
    
    return NextResponse.json(
        { success: true },
        { status: 200 }
    );
}

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
    // User sees the "[bot] is thinking..." message
    // await CreateInteractionResponse(interaction.id, interaction.token, {
    //     type: InteractionResponseType.DeferredChannelMessageWithSource,
    //     data: {
    //         flags: MessageFlags.Ephemeral,
    //     },
    // });

    const timestamp = ConvertSnowflakeToDate(interaction.id);

    if (!interaction.data) {
        await CreateInteractionResponse(interaction.id, interaction.token, {
            type: InteractionResponseType.ChannelMessageWithSource,
            data: {
                flags: MessageFlags.Ephemeral,
                embeds: [
                    {
                        title: "Something went wrong!",
                        description: "Missing interaction data",
                        color: 0xB00020,
                        footer: {
                            text: `Response time: ${Date.now() - timestamp.getTime()}ms`,
                        },
                        timestamp: new Date().toISOString()
                    }
                ],
            }
        });
        return NextResponse.json(
            { success: false, error: "Missing interaction data" },
            { status: 400 }
        );
    }
    const interactionData = interaction.data as APIChatInputApplicationCommandInteractionData;
    if (!interactionData.options) {
        await CreateInteractionResponse(interaction.id, interaction.token, {
            type: InteractionResponseType.ChannelMessageWithSource,
            data: {
            flags: MessageFlags.Ephemeral,
                embeds: [
                    {
                        title: "Something went wrong!",
                        description: "Missing interaction data options",
                        color: 0xB00020,
                        footer: {
                            text: `Response time: ${Date.now() - timestamp.getTime()}ms`,
                        },
                        timestamp: new Date().toISOString()
                    }
                ],
            }
        });
        return NextResponse.json(
            { success: false, error: "Missing interaction data options" },
            { status: 400 }
        );
    }
    // I'm not improving this :sob:
    const options = Object.fromEntries(interactionData.options.map(option => {
        if ('value' in option) {
            return [option.name, option.value];
        } else if (option.options) {
            return [option.name, Object.fromEntries(option.options.map(option => {
                if ('value' in option) {
                    return [option.name, option.value];
                } else if (option.options) {
                    return [option.name, Object.fromEntries(option.options.map(option => {
                        return [option.name, option.value]
                }   ))];
                } else {
                    return [option.name, null];
                }
        }   ))];
        } else {
            return [option.name, null];
        }
    }));

    if (options.setup) {
        return await setupGuessToWin(interaction);
    }

    await CreateInteractionResponse(interaction.id, interaction.token, {
        type: InteractionResponseType.ChannelMessageWithSource,
        data: {
            flags: MessageFlags.Ephemeral | MessageFlags.IsComponentsV2,
            components: ErrorEmbed("Unknown command", timestamp, true),
        }
    });
    return NextResponse.json(
        { success: false, error: "Unknown command" },
        { status: 404 }
    );
}
export const CommandData = {
    name: "guesstowin",
    description: "View or manage the Guess to Win games.",
    options: [
        {
            name: "setup",
            description: "Set up the Guess to Win game.",
            type: ApplicationCommandOptionType.Subcommand,
        }
    ]
}
export const RequiredRoles: Record<typeof CommandData["options"][number]["name"], string[]> = {
    setup: [
        IsleofDucks.roles.admin,
    ]
}