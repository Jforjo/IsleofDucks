import { CreateInteractionResponse, ConvertSnowflakeToDate, FollowupMessage, IsleofDucks, SendMessage, formatNumber } from "@/discord/discordUtils";
import { getUsernameOrUUID } from "@/discord/hypixelUtils";
import { getSuperlative, getSuperlativesListLimit, getTotalSuperlatives } from "@/discord/utils";
import { APIChatInputApplicationCommandInteraction, APIChatInputApplicationCommandInteractionData, APIInteractionResponse, APIMessageComponentButtonInteraction, APISectionComponent, ApplicationCommandOptionType, ButtonStyle, ComponentType, InteractionResponseType, InteractionType, MessageFlags, RESTPatchAPIWebhookWithTokenMessageJSONBody, RESTPostAPIChannelMessageJSONBody } from "discord-api-types/v10";
import { NextResponse } from "next/server";
import SuperlativeDefault from "./superlative";

export async function viewSuperlativeAdvWithDate(
    interaction: APIChatInputApplicationCommandInteraction | APIMessageComponentButtonInteraction,
    value: string
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
        data: { flags: MessageFlags.Ephemeral },
    });

    const timestamp = ConvertSnowflakeToDate(interaction.id);

    const date = new Date(value);
    if (date.toString() === "Invalid Date") {
        if (interaction.type === InteractionType.MessageComponent) {
            await FollowupMessage(interaction.token, {
                content: "Invalid date.",
            });
        } else {
            await FollowupMessage(interaction.token, {
                embeds: [
                    {
                        title: "Something went wrong!",
                        description: "Invalid date.",
                        color: IsleofDucks.colours.error,
                        footer: {
                            text: `Response time: ${Date.now() - timestamp.getTime()}ms`,
                        },
                        timestamp: new Date().toISOString()
                    }
                ],
            });
        }
        return NextResponse.json(
            { success: false, error: "Invalid date" },
            { status: 400 }
        );
    }

    if (date.getUTCFullYear() === new Date().getUTCFullYear() && date.getUTCMonth() === new Date().getUTCMonth()) {
        /// check if the type of interaction is APIMessageComponentButtonInteraction
        if (interaction.type === InteractionType.MessageComponent) {
            await FollowupMessage(interaction.token, {
                content: "Run </superlative:1315592767346311168> instead!",
            });
            return NextResponse.json(
                { success: false, error: "Run the /superlative command instead" },
                { status: 403 }
            );
        }
        return await SuperlativeDefault(interaction);
    }

    const superlative = await getSuperlative(value);
    if (superlative == null) {
        if (interaction.type === InteractionType.MessageComponent) {
            await FollowupMessage(interaction.token, {
                content: "Superlative not found.",
            });
        } else {
            await FollowupMessage(interaction.token, {
                embeds: [
                    {
                        title: "Something went wrong!",
                        description: "Superlative not found.",
                        color: IsleofDucks.colours.error,
                        footer: {
                            text: `Response time: ${Date.now() - timestamp.getTime()}ms`,
                        },
                        timestamp: new Date().toISOString()
                    }
                ],
            });
        }
        return NextResponse.json(
            { success: false, error: "Superlative not found" },
            { status: 404 }
        );
    }

    if (superlative.duckstats === null || superlative.ducklingstats === null) {
        await SendMessage(interaction.channel.id, {
            embeds: [
                {
                    title: `Superlative - ${superlative.data.title}`,
                    description: [
                        `This is a future superlative!`,
                        `It will start on ${date.toLocaleDateString("en-US", {
                            month: "long",
                            year: "numeric"
                        })}`,
                        `Which is ${Math.floor((date.getTime() - Date.now()) / 1000)}`
                    ].join('\n'),
                    color: IsleofDucks.colours.main,
                    fields: [
                        {
                            name: "Duck Ranks",
                            value: superlative.duckranks.map((rank) => {
                                return `[${rank.id}] ${rank.name}: ${formatNumber(rank.requirement, superlative.dp)}`;
                            }).join('\n'),
                            inline: true
                        },
                        {
                            name: "Duckling Ranks",
                            value: superlative.ducklingranks.map((rank) => {
                                return `[${rank.id}] ${rank.name}: ${formatNumber(rank.requirement, superlative.dp)}`;
                            }).join('\n'),
                            inline: true
                        }
                    ],
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

    if (superlative.duckstats.length === 0 || superlative.ducklingstats.length === 0) {
        if (interaction.type === InteractionType.MessageComponent) {
            await FollowupMessage(interaction.token, {
                content: "Superlative data not found.",
            });
        } else {
            await FollowupMessage(interaction.token, {
                embeds: [
                    {
                        title: "Something went wrong!",
                        description: "Superlative data not found.",
                        color: IsleofDucks.colours.error,
                        footer: {
                            text: `Response time: ${Date.now() - timestamp.getTime()}ms`,
                        },
                        timestamp: new Date().toISOString()
                    }
                ],
            });
        }
        return NextResponse.json(
            { success: false, error: "Superlative data not found" },
            { status: 404 }
        );
    }

    const [ ducks, ducklings ] = await Promise.all([
        Promise.all(superlative.duckstats.map(async (stat) => {
            const name = await getUsernameOrUUID(stat.uuid);
            return {
                uuid: stat.uuid,
                name: "name" in name ? name.name : stat.uuid,
                value: stat.value,
                formattedValue: formatNumber(stat.value, superlative.dp)
            };
        })),
        Promise.all(superlative.ducklingstats.map(async (stat) => {
            const name = await getUsernameOrUUID(stat.uuid);
            return {
                uuid: stat.uuid,
                name: "name" in name ? name.name : stat.uuid,
                value: stat.value,
                formattedValue: formatNumber(stat.value, superlative.dp)
            };
        }))
    ]);

    const duckResult = ducks.sort((a, b) => b.value - a.value).map((member, index) => ({
        rank: index + 1,
        ...member
    }));
    const ducklingResult = ducklings.sort((a, b) => b.value - a.value).map((member, index) => ({
        rank: index + 1,
        ...member
    }));

    const chunkSize = 21;

    const duckFieldArray = [];
    for (let i = 0; i < duckResult.length; i += chunkSize) {
        duckFieldArray.push(
            {
                name: '\u200b',
                value: duckResult.slice(i, i + chunkSize).map((field) => `\`#${field.rank}\` ${field.name.replaceAll('_', '\\_')}: ${field.formattedValue}`).join('\n'),
                inline: true
            }
        );
    }
    const ducklingFieldArray = [];
    for (let i = 0; i < ducklingResult.length; i += chunkSize) {
        ducklingFieldArray.push(
            {
                name: '\u200b',
                value: ducklingResult.slice(i, i + chunkSize).map((field) => `\`#${field.rank}\` ${field.name.replaceAll('_', '\\_')}: ${field.formattedValue}`).join('\n'),
                inline: true
            }
        );
    }

    await SendMessage(interaction.channel.id, {
        embeds: [
            {
                title: `Superlative - ${superlative.data.title}`,
                description: `For Isle of Ducks on ${date.toLocaleDateString("en-US", {
                    month: "long",
                    year: "numeric"
                })}`,
                color: IsleofDucks.colours.main,
                fields: duckFieldArray,
            }
        ],
    });
    await SendMessage(interaction.channel.id, {
        embeds: [
            {
                color: IsleofDucks.colours.main,
                fields: ducklingFieldArray,
            }
        ],
    });
    await SendMessage(interaction.channel.id, {
        embeds: [
            {
                title: `Ranks - ${superlative.data.title}`,
                color: IsleofDucks.colours.main,
                fields: [
                    {
                        name: "Duck",
                        value: superlative.duckranks.map((rank) => {
                            return `[${rank.id}] ${rank.name}: ${formatNumber(rank.requirement, superlative.dp)}`;
                        }).join('\n'),
                        inline: true
                    },
                    {
                        name: "Duckling",
                        value: superlative.ducklingranks.map((rank) => {
                            return `[${rank.id}] ${rank.name}: ${formatNumber(rank.requirement, superlative.dp)}`;
                        }).join('\n'),
                        inline: true
                    }
                ],
                footer: {
                    text: `Response time: ${Date.now() - timestamp.getTime()}ms`,
                },
                timestamp: new Date().toISOString()
            }
        ]
    });

    await FollowupMessage(interaction.token, {
        content: "Done!"
    });

    return NextResponse.json(
        { success: true },
        { status: 200 }
    );
}
export async function viewSuperlativeAdv(
    interaction: APIChatInputApplicationCommandInteraction | APIMessageComponentButtonInteraction,
    page = 1
): Promise<
    NextResponse<
        {
            success: boolean;
            error?: string;
        } | APIInteractionResponse
    >
> {
    if (interaction.type === InteractionType.MessageComponent) {
        await CreateInteractionResponse(interaction.id, interaction.token, {
            type: InteractionResponseType.DeferredMessageUpdate,
        });
    } else {
        // User sees the "[bot] is thinking..." message
        await CreateInteractionResponse(interaction.id, interaction.token, {
            type: InteractionResponseType.DeferredChannelMessageWithSource,
            data: { flags: MessageFlags.Ephemeral },
        });
    }

    const superlatives = await getSuperlativesListLimit((page - 1) * 5, 5);
    const totalSuperlatives = await getTotalSuperlatives();

    const messageData = {
        flags: MessageFlags.IsComponentsV2,
        components: [
            {
                type: ComponentType.Container,
                accent_color: IsleofDucks.colours.main,
                components: [
                    {
                        type: ComponentType.TextDisplay,
                        content: "## Superlatives",
                    },
                    ...superlatives.map(superlative => {
                        const startDate = new Date(superlative.start);
                        return {
                            type: ComponentType.Section,
                            components: [
                                {
                                    type: ComponentType.TextDisplay,
                                    content: `**${startDate.toLocaleDateString("en-US", {
                                        month: "long",
                                        year: "numeric"
                                    })}**`
                                },
                                {
                                    type: ComponentType.TextDisplay,
                                    content: superlative.data.title
                                }
                            ],
                            accessory: {
                                type: ComponentType.Button,
                                custom_id: `superlativeadv-view-${startDate.getUTCFullYear()}_${(startDate.getUTCMonth() + 1).toString().padStart(2, '0')}_01`,
                                label: "View",
                                style: ButtonStyle.Primary
                            }
                        }
                    }) as APISectionComponent[]
                ]
            },
            {
                type: ComponentType.ActionRow,
                components: [
                    {
                        type: ComponentType.Button,
                        custom_id: `superlativeadv-view-page_${page - 1}`,
                        label: '◀️',
                        style: ButtonStyle.Primary,
                        disabled: page === 1
                    },
                    {
                        custom_id: 'temp',
                        type: ComponentType.Button,
                        label: `Page ${page}/${Math.ceil(totalSuperlatives / 5)}`,
                        style: ButtonStyle.Secondary,
                        disabled: false
                    },
                    {
                        custom_id: `superlativeadv-view-page_${page + 1}`,
                        type: ComponentType.Button,
                        label: '▶️',
                        style: ButtonStyle.Primary,
                        disabled: Math.ceil(totalSuperlatives / 5) < page + 1
                    }
                ]
            }
        ]
    };

    if (interaction.type === InteractionType.MessageComponent) {
        await FollowupMessage(interaction.token, messageData as RESTPatchAPIWebhookWithTokenMessageJSONBody);
    } else {
        await SendMessage(interaction.channel.id, messageData as RESTPostAPIChannelMessageJSONBody);
    }
    
    if (interaction.type === InteractionType.ApplicationCommand) {
        await FollowupMessage(interaction.token, {
            content: "Done!",
        });
    }

    return NextResponse.json(
        { success: true },
        { status: 200 }
    );
}

async function createSuperlativeAdv(
    interaction: APIChatInputApplicationCommandInteraction,
    value: string
): Promise<
    NextResponse<
        {
            success: boolean;
            error?: string;
        } | APIInteractionResponse
    >
> {
    await CreateInteractionResponse(interaction.id, interaction.token, {
        type: InteractionResponseType.ChannelMessageWithSource,
        data: {
            flags: MessageFlags.Ephemeral,
            content: [
                `This feature hasn't been implemented yet!`,
                `Here's the value you inputted: ${value}`
            ].join('\n')
        },
    });

    return NextResponse.json(
        { success: true },
        { status: 200 }
    )
}

async function deleteSuperlativeAdv(
    interaction: APIChatInputApplicationCommandInteraction,
    value: string
): Promise<
    NextResponse<
        {
            success: boolean;
            error?: string;
        } | APIInteractionResponse
    >
> {
    await CreateInteractionResponse(interaction.id, interaction.token, {
        type: InteractionResponseType.ChannelMessageWithSource,
        data: {
            flags: MessageFlags.Ephemeral,
            content: [
                `This feature hasn't been implemented yet!`,
                `Here's the value you inputted: ${value}`
            ].join('\n')
        },
    });

    return NextResponse.json(
        { success: true },
        { status: 200 }
    )
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

    if (!interaction.data) {
        await CreateInteractionResponse(interaction.id, interaction.token, {
            type: InteractionResponseType.ChannelMessageWithSource,
            data: {
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

    if (options.view) {
        if (options.view.date) return await viewSuperlativeAdvWithDate(interaction, options.view.past.date.value);
        return await viewSuperlativeAdv(interaction);
    }
    else if (options.create) return await createSuperlativeAdv(interaction, options.create.date.value);
    else if (options.delete) return await deleteSuperlativeAdv(interaction, options.delete.date.value);

    return NextResponse.json(
        { success: true },
        { status: 200 }
    );
}
export const CommandData = {
    name: "superlativeadv",
    description: "Displays the superlative data for Isle of Ducks",
    options: [
        {
            name: "view",
            description: "View past, current, and future superlatives.",
            type: ApplicationCommandOptionType.Subcommand,
            options: [
                {
                    name: "date",
                    description: "The date of a superlative.",
                    type: ApplicationCommandOptionType.String,
                    autocomplete: true
                }
            ]
        },
        {
            name: "create",
            description: "Create a superlative.",
            type: ApplicationCommandOptionType.Subcommand,
            options: [
                {
                    name: "date",
                    description: "The date of the superlative.",
                    type: ApplicationCommandOptionType.Integer,
                    autocomplete: true,
                    required: true
                }
            ]
        },
        {
            name: "delete",
            description: "Delete a future superlative.",
            type: ApplicationCommandOptionType.Subcommand,
            options: [
                {
                    name: "date",
                    description: "The date of the superlative.",
                    type: ApplicationCommandOptionType.String,
                    autocomplete: true,
                    required: true
                }
            ]
        }
    ]
}