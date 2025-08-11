import { APIChatInputApplicationCommandInteraction, APIChatInputApplicationCommandInteractionData, APIInteractionResponse, ApplicationCommandOptionType, ButtonStyle, ComponentType, InteractionResponseType } from "discord-api-types/v10";
import { CreateInteractionResponse, ConvertSnowflakeToDate, FollowupMessage, IsleofDucks } from "@/discord/discordUtils";
import { NextResponse } from "next/server";
import { addBridgeFilter, checkBridgeFilter, checkEmoji, addEmoji, getBridgeFilters, getTotalBridgeFilters, removeBridgeFilter, removeEmoji, getEmojis, getTotalEmojis } from "@/discord/utils";

async function addFilter(
    interaction: APIChatInputApplicationCommandInteraction,
    replace: string,
    withText: string
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
        await FollowupMessage(interaction.token, {
            embeds: [
                {
                    title: "Something went wrong!",
                    description: "Could not find who ran the command",
                    color: IsleofDucks.colours.error,
                    footer: {
                        text: `Response time: ${Date.now() - timestamp.getTime()}ms`,
                    },
                    timestamp: new Date().toISOString()
                }
            ],
        });
        return NextResponse.json(
            { success: false, error: "Could not find who ran the command" },
            { status: 400 }
        );
    }

    if (!interaction.member.roles.includes(IsleofDucks.roles.admin)) {
        await FollowupMessage(interaction.token, {
            embeds: [
                {
                    title: "Something went wrong!",
                    description: "You don't have permission to use this command",
                    color: IsleofDucks.colours.error,
                    footer: {
                        text: `Response time: ${Date.now() - timestamp.getTime()}ms`,
                    },
                    timestamp: new Date().toISOString()
                }
            ]
        })
        return NextResponse.json(
            { success: false, error: "You don't have permission to use this command" },
            { status: 403 }
        );
    }

    const filterExists = await checkBridgeFilter(replace);
    if (filterExists) {
        await FollowupMessage(interaction.token, {
            embeds: [
                {
                    title: "Something went wrong!",
                    description: "Filter already exists",
                    color: IsleofDucks.colours.error,
                    footer: {
                        text: `Response time: ${Date.now() - timestamp.getTime()}ms`,
                    },
                    timestamp: new Date().toISOString()
                }
            ],
        });
        return NextResponse.json(
            { success: false, error: "Filter already exists" },
            { status: 400 }
        );
    }

    await addBridgeFilter(replace, withText);

    await FollowupMessage(interaction.token, {
        embeds: [
            {
                title: "Filter added",
                description: `Filter added: ${replace} -> ${withText}`,
                color: IsleofDucks.colours.main,
                footer: {
                    text: `Response time: ${Date.now() - timestamp.getTime()}ms`,
                },
                timestamp: new Date().toISOString()
            }
        ],
    });

    return NextResponse.json(
        { success: true },
        { status: 200 }
    );
}
async function removeFilter(
    interaction: APIChatInputApplicationCommandInteraction,
    replace: string
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
        await FollowupMessage(interaction.token, {
            embeds: [
                {
                    title: "Something went wrong!",
                    description: "Could not find who ran the command",
                    color: IsleofDucks.colours.error,
                    footer: {
                        text: `Response time: ${Date.now() - timestamp.getTime()}ms`,
                    },
                    timestamp: new Date().toISOString()
                }
            ],
        });
        return NextResponse.json(
            { success: false, error: "Could not find who ran the command" },
            { status: 400 }
        );
    }

    if (!interaction.member.roles.includes(IsleofDucks.roles.admin)) {
        await FollowupMessage(interaction.token, {
            embeds: [
                {
                    title: "Something went wrong!",
                    description: "You don't have permission to use this command",
                    color: IsleofDucks.colours.error,
                    footer: {
                        text: `Response time: ${Date.now() - timestamp.getTime()}ms`,
                    },
                    timestamp: new Date().toISOString()
                }
            ]
        })
        return NextResponse.json(
            { success: false, error: "You don't have permission to use this command" },
            { status: 403 }
        );
    }

    const filterExists = await checkBridgeFilter(replace);
    if (!filterExists) {
        await FollowupMessage(interaction.token, {
            embeds: [
                {
                    title: "Something went wrong!",
                    description: "Filter doesn't exists",
                    color: IsleofDucks.colours.error,
                    footer: {
                        text: `Response time: ${Date.now() - timestamp.getTime()}ms`,
                    },
                    timestamp: new Date().toISOString()
                }
            ],
        });
        return NextResponse.json(
            { success: false, error: "Filter doesn't exists" },
            { status: 400 }
        );
    }

    await removeBridgeFilter(replace);

    await FollowupMessage(interaction.token, {
        embeds: [
            {
                title: "Filter removed",
                description: `Filter removed: ${replace}`,
                color: IsleofDucks.colours.main,
                footer: {
                    text: `Response time: ${Date.now() - timestamp.getTime()}ms`,
                },
                timestamp: new Date().toISOString()
            }
        ],
    });

    return NextResponse.json(
        { success: true },
        { status: 200 }
    );
}
async function viewFilters(
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
        await FollowupMessage(interaction.token, {
            embeds: [
                {
                    title: "Something went wrong!",
                    description: "Could not find who ran the command",
                    color: IsleofDucks.colours.error,
                    footer: {
                        text: `Response time: ${Date.now() - timestamp.getTime()}ms`,
                    },
                    timestamp: new Date().toISOString()
                }
            ],
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
        await FollowupMessage(interaction.token, {
            embeds: [
                {
                    title: "Something went wrong!",
                    description: "You don't have permission to use this command",
                    color: IsleofDucks.colours.error,
                    footer: {
                        text: `Response time: ${Date.now() - timestamp.getTime()}ms`,
                    },
                    timestamp: new Date().toISOString()
                }
            ]
        })
        return NextResponse.json(
            { success: false, error: "You don't have permission to use this command" },
            { status: 403 }
        );
    }

    const filters = await getBridgeFilters(0, 25);
    const filtersCount = await getTotalBridgeFilters();
    if (!filters.length || !filtersCount) {
        await FollowupMessage(interaction.token, {
            embeds: [
                {
                    title: "Something went wrong!",
                    description: "Could not get filters",
                    color: IsleofDucks.colours.error,
                    footer: {
                        text: `Response time: ${Date.now() - timestamp.getTime()}ms`,
                    },
                    timestamp: new Date().toISOString()
                }
            ]
        });
        return NextResponse.json(
            { success: false, error: "Could not get filters" },
            { status: 400 }
        );
    }
    if (filters.length === 0 || filtersCount === 0) {
        await FollowupMessage(interaction.token, {
            embeds: [
                {
                    title: "Something went wrong!",
                    description: "No filters found",
                    color: IsleofDucks.colours.error,
                    footer: {
                        text: `Response time: ${Date.now() - timestamp.getTime()}ms`,
                    },
                    timestamp: new Date().toISOString()
                }
            ]
        });
        return NextResponse.json(
            { success: false, error: "No filters found" },
            { status: 400 }
        );
    }

    await FollowupMessage(interaction.token, {
        embeds: [
            {
                title: "Filters",
                color: IsleofDucks.colours.main,
                description: filters.map(filter => `"${filter.replacetext}" -> "${filter.withtext}"`).join("\n"),
                footer: {
                    text: `Response time: ${Date.now() - timestamp.getTime()}ms`
                },
                timestamp: new Date().toISOString()
            }
        ],
        components: [
            {
                type: ComponentType.ActionRow,
                components: [
                    {
                        custom_id: 'bridgefilter-page_0',
                        type: ComponentType.Button,
                        label: '◀️',
                        style: ButtonStyle.Primary,
                        disabled: true
                    },
                    {
                        custom_id: 'bridgefilter-page_2',
                        type: ComponentType.Button,
                        label: '▶️',
                        style: ButtonStyle.Primary,
                        disabled: Math.ceil(filtersCount / 25) < 2
                    }
                ]
            }
        ]
    });

    return NextResponse.json(
        { success: true },
        { status: 200 }
    );
}

async function addChatEmoji(
    interaction: APIChatInputApplicationCommandInteraction,
    replace: string,
    withText: string
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
        await FollowupMessage(interaction.token, {
            embeds: [
                {
                    title: "Something went wrong!",
                    description: "Could not find who ran the command",
                    color: IsleofDucks.colours.error,
                    footer: {
                        text: `Response time: ${Date.now() - timestamp.getTime()}ms`,
                    },
                    timestamp: new Date().toISOString()
                }
            ],
        });
        return NextResponse.json(
            { success: false, error: "Could not find who ran the command" },
            { status: 400 }
        );
    }

    if (!interaction.member.roles.includes(IsleofDucks.roles.admin)) {
        await FollowupMessage(interaction.token, {
            embeds: [
                {
                    title: "Something went wrong!",
                    description: "You don't have permission to use this command",
                    color: IsleofDucks.colours.error,
                    footer: {
                        text: `Response time: ${Date.now() - timestamp.getTime()}ms`,
                    },
                    timestamp: new Date().toISOString()
                }
            ]
        })
        return NextResponse.json(
            { success: false, error: "You don't have permission to use this command" },
            { status: 403 }
        );
    }

    replace = replace.toLowerCase().replaceAll(":", "");

    if (/[^a-zA-Z]/.test(replace)) {
        await FollowupMessage(interaction.token, {
            embeds: [
                {
                    title: "Something went wrong!",
                    description: "Invalid emoji name",
                    color: IsleofDucks.colours.error,
                    footer: {
                        text: `Response time: ${Date.now() - timestamp.getTime()}ms`,
                    },
                    timestamp: new Date().toISOString()
                }
            ],
        });
        return NextResponse.json(
            { success: false, error: "Invalid emoji name" },
            { status: 400 }
        );
    }

    const emojiExists = await checkEmoji(replace);
    if (emojiExists) {
        await FollowupMessage(interaction.token, {
            embeds: [
                {
                    title: "Something went wrong!",
                    description: "Emoji already exists",
                    color: IsleofDucks.colours.error,
                    footer: {
                        text: `Response time: ${Date.now() - timestamp.getTime()}ms`,
                    },
                    timestamp: new Date().toISOString()
                }
            ],
        });
        return NextResponse.json(
            { success: false, error: "Emoji already exists" },
            { status: 400 }
        );
    }

    await addEmoji(replace, withText);

    await FollowupMessage(interaction.token, {
        embeds: [
            {
                title: "Emoji added",
                description: `Emoji added: \`:${replace}:\` -> ${withText}`,
                color: IsleofDucks.colours.main,
                footer: {
                    text: `Response time: ${Date.now() - timestamp.getTime()}ms`,
                },
                timestamp: new Date().toISOString()
            }
        ],
    });

    return NextResponse.json(
        { success: true },
        { status: 200 }
    );
}
async function removeChatEmoji(
    interaction: APIChatInputApplicationCommandInteraction,
    replace: string
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
        await FollowupMessage(interaction.token, {
            embeds: [
                {
                    title: "Something went wrong!",
                    description: "Could not find who ran the command",
                    color: IsleofDucks.colours.error,
                    footer: {
                        text: `Response time: ${Date.now() - timestamp.getTime()}ms`,
                    },
                    timestamp: new Date().toISOString()
                }
            ],
        });
        return NextResponse.json(
            { success: false, error: "Could not find who ran the command" },
            { status: 400 }
        );
    }

    if (!interaction.member.roles.includes(IsleofDucks.roles.admin)) {
        await FollowupMessage(interaction.token, {
            embeds: [
                {
                    title: "Something went wrong!",
                    description: "You don't have permission to use this command",
                    color: IsleofDucks.colours.error,
                    footer: {
                        text: `Response time: ${Date.now() - timestamp.getTime()}ms`,
                    },
                    timestamp: new Date().toISOString()
                }
            ]
        })
        return NextResponse.json(
            { success: false, error: "You don't have permission to use this command" },
            { status: 403 }
        );
    }

    replace = replace.toLowerCase().replaceAll(":", "");

    const emojiExists = await checkEmoji(replace);
    if (!emojiExists) {
        await FollowupMessage(interaction.token, {
            embeds: [
                {
                    title: "Something went wrong!",
                    description: "Emoji doesn't exists",
                    color: IsleofDucks.colours.error,
                    footer: {
                        text: `Response time: ${Date.now() - timestamp.getTime()}ms`,
                    },
                    timestamp: new Date().toISOString()
                }
            ],
        });
        return NextResponse.json(
            { success: false, error: "Emoji doesn't exists" },
            { status: 400 }
        );
    }

    await removeEmoji(replace);

    await FollowupMessage(interaction.token, {
        embeds: [
            {
                title: "Emoji removed",
                description: `Emoji removed: \`:${replace}:\``,
                color: IsleofDucks.colours.main,
                footer: {
                    text: `Response time: ${Date.now() - timestamp.getTime()}ms`,
                },
                timestamp: new Date().toISOString()
            }
        ],
    });

    return NextResponse.json(
        { success: true },
        { status: 200 }
    );
}
async function viewChatEmojis(
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
        await FollowupMessage(interaction.token, {
            embeds: [
                {
                    title: "Something went wrong!",
                    description: "Could not find who ran the command",
                    color: IsleofDucks.colours.error,
                    footer: {
                        text: `Response time: ${Date.now() - timestamp.getTime()}ms`,
                    },
                    timestamp: new Date().toISOString()
                }
            ],
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
        await FollowupMessage(interaction.token, {
            embeds: [
                {
                    title: "Something went wrong!",
                    description: "You don't have permission to use this command",
                    color: IsleofDucks.colours.error,
                    footer: {
                        text: `Response time: ${Date.now() - timestamp.getTime()}ms`,
                    },
                    timestamp: new Date().toISOString()
                }
            ]
        })
        return NextResponse.json(
            { success: false, error: "You don't have permission to use this command" },
            { status: 403 }
        );
    }

    const emojis = await getEmojis(0, 25);
    const emojisCount = await getTotalEmojis();
    if (!emojis.length || !emojisCount) {
        await FollowupMessage(interaction.token, {
            embeds: [
                {
                    title: "Something went wrong!",
                    description: "Could not get emojis",
                    color: IsleofDucks.colours.error,
                    footer: {
                        text: `Response time: ${Date.now() - timestamp.getTime()}ms`,
                    },
                    timestamp: new Date().toISOString()
                }
            ]
        });
        return NextResponse.json(
            { success: false, error: "Could not get emojis" },
            { status: 400 }
        );
    }
    if (emojis.length === 0 || emojisCount === 0) {
        await FollowupMessage(interaction.token, {
            embeds: [
                {
                    title: "Something went wrong!",
                    description: "No emojis found",
                    color: IsleofDucks.colours.error,
                    footer: {
                        text: `Response time: ${Date.now() - timestamp.getTime()}ms`,
                    },
                    timestamp: new Date().toISOString()
                }
            ]
        });
        return NextResponse.json(
            { success: false, error: "No emojis found" },
            { status: 400 }
        );
    }

    await FollowupMessage(interaction.token, {
        embeds: [
            {
                title: "Emojis",
                color: IsleofDucks.colours.main,
                description: emojis.map(emoji => `":${emoji.replacetext}:" -> "${emoji.withtext}"`).join("\n"),
                footer: {
                    text: `Response time: ${Date.now() - timestamp.getTime()}ms`
                },
                timestamp: new Date().toISOString()
            }
        ],
        components: [
            {
                type: ComponentType.ActionRow,
                components: [
                    {
                        custom_id: 'chatemoji-page_0',
                        type: ComponentType.Button,
                        label: '◀️',
                        style: ButtonStyle.Primary,
                        disabled: true
                    },
                    {
                        custom_id: 'chatemoji-page_2',
                        type: ComponentType.Button,
                        label: '▶️',
                        style: ButtonStyle.Primary,
                        disabled: Math.ceil(emojisCount / 25) < 2
                    }
                ]
            }
        ]
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
    const timestamp = ConvertSnowflakeToDate(interaction.id);

    await CreateInteractionResponse(interaction.id, interaction.token, {
        type: InteractionResponseType.DeferredChannelMessageWithSource
    });

    if (!interaction.data) {
        await FollowupMessage(interaction.token, {
            embeds: [
                {
                    title: "Something went wrong!",
                    description: "Missing interaction data",
                    color: IsleofDucks.colours.error,
                    footer: {
                        text: `Response time: ${Date.now() - timestamp.getTime()}ms`,
                    },
                    timestamp: new Date().toISOString()
                }
            ],
        });
        return NextResponse.json(
            { success: false, error: "Missing interaction data" },
            { status: 400 }
        );
    }
    const interactionData = interaction.data as APIChatInputApplicationCommandInteractionData;
    if (!interactionData.options) {
        await FollowupMessage(interaction.token, {
            embeds: [
                {
                    title: "Something went wrong!",
                    description: "Missing interaction data options",
                    color: IsleofDucks.colours.error,
                    footer: {
                        text: `Response time: ${Date.now() - timestamp.getTime()}ms`,
                    },
                    timestamp: new Date().toISOString()
                }
            ],
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
                        return [option.name, option.value];
                    }))];
                } else {
                    return [option.name, null];
                }
            }))];
        } else {
            return [option.name, null];
        }
    }));

    if (options.filter) {
        if (options.filter.add) return await addFilter(interaction, options.filter.add.replace, options.filter.add.with);
        if (options.filter.remove) return await removeFilter(interaction, options.filter.remove.replace);
        if (options.filter.view) return await viewFilters(interaction);
    } else if (options.emoji) {
        if (options.emoji.add) return await addChatEmoji(interaction, options.emoji.add.replace, options.emoji.add.with);
        if (options.emoji.remove) return await removeChatEmoji(interaction, options.emoji.remove.replace);
        if (options.emoji.view) return await viewChatEmojis(interaction);
    }
    
    await FollowupMessage(interaction.token, {
        embeds: [
            {
                title: "Something went wrong!",
                description: "Unknown command",
                color: IsleofDucks.colours.error,
                footer: {
                    text: `Response time: ${Date.now() - timestamp.getTime()}ms`,
                },
                timestamp: new Date().toISOString()
            }
        ],
    });
    return NextResponse.json(
        { success: false, error: "Unknown command" },
        { status: 404 }
    );
}
export const CommandData = {
    name: "bridge",
    description: "Various bridge commands.",
    options: [
        {
            name: "filter",
            description: "Add or remove chat filters to the bridge.",
            type: ApplicationCommandOptionType.SubcommandGroup,
            options: [
                {
                    name: "add",
                    description: "Add a chat filter to the bridge.",
                    type: ApplicationCommandOptionType.Subcommand,
                    options: [
                        {
                            name: "replace",
                            description: "The text to replace.",
                            type: ApplicationCommandOptionType.String,
                            required: true
                        },
                        {
                            name: "with",
                            description: "The text to replace the replaced text with.",
                            type: ApplicationCommandOptionType.String,
                            required: true
                        }
                    ]
                },
                {
                    name: "remove",
                    description: "Remove a chat filter from the bridge.",
                    type: ApplicationCommandOptionType.Subcommand,
                    options: [
                        {
                            name: "replace",
                            description: "The filter to remove.",
                            type: ApplicationCommandOptionType.String,
                            required: true
                        }
                    ]
                },
                {
                    name: "view",
                    description: "View all chat filters on the bridge.",
                    type: ApplicationCommandOptionType.Subcommand
                }
            ]
        },
        {
            name: "emoji",
            description: "Add or remove emojis to the bridge.",
            type: ApplicationCommandOptionType.SubcommandGroup,
            options: [
                {
                    name: "add",
                    description: "Add an emoji to the bridge.",
                    type: ApplicationCommandOptionType.Subcommand,
                    options: [
                        {
                            name: "replace",
                            description: "The text to replace.",
                            type: ApplicationCommandOptionType.String,
                            required: true
                        },
                        {
                            name: "with",
                            description: "The text to replace the replaced text with.",
                            type: ApplicationCommandOptionType.String,
                            required: true
                        }
                    ]
                },
                {
                    name: "remove",
                    description: "Remove an emoji from the bridge.",
                    type: ApplicationCommandOptionType.Subcommand,
                    options: [
                        {
                            name: "replace",
                            description: "The emoji to remove.",
                            type: ApplicationCommandOptionType.String,
                            required: true
                        }
                    ]
                },
                {
                    name: "view",
                    description: "View all emojis on the bridge.",
                    type: ApplicationCommandOptionType.Subcommand
                }
            ]
        }
    ]
}