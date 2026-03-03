import { APIChatInputApplicationCommandInteraction, APIChatInputApplicationCommandInteractionData, APIComponentInContainer, APIInteractionResponse, ApplicationCommandOptionType, ButtonStyle, ComponentType, InteractionResponseType, MessageFlags } from "discord-api-types/v10";
import { CreateInteractionResponse, ConvertSnowflakeToDate, FollowupMessage, IsleofDucks } from "@/discord/discordUtils";
import { getSettings } from "@/discord/utils";
import { NextResponse } from "next/server";

async function viewSettings(
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

    const settings = await getSettings();
    if (!settings) {
        await FollowupMessage(interaction.token, {
            flags: MessageFlags.IsComponentsV2,
            components: [
                {
                    type: ComponentType.Container,
                    accent_color: IsleofDucks.colours.error,
                    components: [
                        {
                            type: ComponentType.TextDisplay,
                            content: "## Something went wrong!",
                        },
                        { type: ComponentType.Separator },
                        {
                            type: ComponentType.TextDisplay,
                            content: "Could not get settings!"
                        },
                        { type: ComponentType.Separator },
                        {
                            type: ComponentType.TextDisplay,
                            content: `Response time: ${Date.now() - timestamp.getTime()}ms • <t:${Math.floor(Date.now() / 1000)}:F>`
                        }
                    ]
                }
            ]
        });
        return NextResponse.json(
            { success: false, error: "Could not get settings" },
            { status: 400 }
        )
    }

    const components: APIComponentInContainer[] = [];

    components.push({
        type: ComponentType.TextDisplay,
        content: "## Settings",
    },
    { type: ComponentType.Separator });
    if (settings.length === 0) {
        components.push({
            type: ComponentType.TextDisplay,
            content: "No settings found!"
        });
    } else {
        settings.forEach(setting => {
            components.push({
                type: ComponentType.Section,
                components: [
                    {
                        type: ComponentType.TextDisplay,
                        content: `**${setting.key}**: ${setting.value}`
                    }
                ],
                accessory: {
                    type: ComponentType.Button,
                    label: "Edit",
                    style: ButtonStyle.Secondary,
                    custom_id: `settings-edit-${setting.key}`
                }
            });
        });
    }
    components.push(
        { type: ComponentType.Separator },
        {
            type: ComponentType.TextDisplay,
            content: `Response time: ${Date.now() - timestamp.getTime()}ms • <t:${Math.floor(Date.now() / 1000)}:F>`
        }
    );

    await FollowupMessage(interaction.token, {
        flags: MessageFlags.IsComponentsV2,
        components: [
            {
                type: ComponentType.Container,
                accent_color: IsleofDucks.colours.main,
                components: components
            }
        ]
    });

    return NextResponse.json(
        { success: true },
        { status: 200 }
    );
}

// async function editSetting(
//     interaction: APIChatInputApplicationCommandInteraction,
//     key: string,
//     value: string
// ): Promise<
//     NextResponse<
//         {
//             success: boolean;
//             error?: string;
//         } | APIInteractionResponse
//     >
// > {
//     const timestamp = ConvertSnowflakeToDate(interaction.id);
// }

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
    await CreateInteractionResponse(interaction.id, interaction.token, {
        type: InteractionResponseType.DeferredChannelMessageWithSource,
    });

    const timestamp = ConvertSnowflakeToDate(interaction.id);

    if (!interaction.data) {
        await FollowupMessage(interaction.token, {
            flags: MessageFlags.IsComponentsV2,
            components: [
                {
                    type: ComponentType.Container,
                    accent_color: IsleofDucks.colours.error,
                    components: [
                        {
                            type: ComponentType.TextDisplay,
                            content: "## Something went wrong!",
                        },
                        { type: ComponentType.Separator },
                        {
                            type: ComponentType.TextDisplay,
                            content: "Missing interaction data!"
                        },
                        { type: ComponentType.Separator },
                        {
                            type: ComponentType.TextDisplay,
                            content: `Response time: ${Date.now() - timestamp.getTime()}ms • <t:${Math.floor(Date.now() / 1000)}:F>`
                        }
                    ]
                }
            ]
        });
        return NextResponse.json(
            { success: false, error: "Missing interaction data" },
            { status: 400 }
        );
    }
    const interactionData = interaction.data as APIChatInputApplicationCommandInteractionData;
    if (!interactionData.options) {
        await FollowupMessage(interaction.token, {
            flags: MessageFlags.IsComponentsV2,
            components: [
                {
                    type: ComponentType.Container,
                    accent_color: IsleofDucks.colours.error,
                    components: [
                        {
                            type: ComponentType.TextDisplay,
                            content: "## Something went wrong!",
                        },
                        { type: ComponentType.Separator },
                        {
                            type: ComponentType.TextDisplay,
                            content: "Missing interaction data options!"
                        },
                        { type: ComponentType.Separator },
                        {
                            type: ComponentType.TextDisplay,
                            content: `Response time: ${Date.now() - timestamp.getTime()}ms • <t:${Math.floor(Date.now() / 1000)}:F>`
                        }
                    ]
                }
            ]
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

    if (options.view) {
        return await viewSettings(interaction);
    }
    // else if (options.edit) {
    //     return await editSetting(interaction, options.edit.key, options.edit.value);
    // }

    await FollowupMessage(interaction.token, {
        flags: MessageFlags.IsComponentsV2,
        components: [
            {
                type: ComponentType.Container,
                accent_color: IsleofDucks.colours.error,
                components: [
                    {
                        type: ComponentType.TextDisplay,
                        content: "## Something went wrong!",
                    },
                    { type: ComponentType.Separator },
                    {
                        type: ComponentType.TextDisplay,
                        content: "Unknown command!"
                    },
                    { type: ComponentType.Separator },
                    {
                        type: ComponentType.TextDisplay,
                        content: `Response time: ${Date.now() - timestamp.getTime()}ms • <t:${Math.floor(Date.now() / 1000)}:F>`
                    }
                ]
            }
        ]
    });
    return NextResponse.json(
        { success: false, error: "Unknown command" },
        { status: 404 }
    );
}
export const CommandData = {
    name: "settings",
    // description: "List or edit the settings.",
    description: "List the settings.",
    options: [
        // {
        //     name: "edit",
        //     description: "Edit a setting's value.",
        //     type: ApplicationCommandOptionType.Subcommand,
        //     options: [
        //         {
        //             name: "key",
        //             description: "The key of the setting.",
        //             type: ApplicationCommandOptionType.String,
        //             required: true,
        //         },
        //         {
        //             name: "value",
        //             description: "The new value of the setting.",
        //             type: ApplicationCommandOptionType.String,
        //             required: true,
        //         }
        //     ]
        // },
        {
            name: "view",
            description: "View the settings.",
            type: ApplicationCommandOptionType.Subcommand
        }
    ]
}