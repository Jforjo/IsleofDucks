import { APIChatInputApplicationCommandInteraction, APIChatInputApplicationCommandInteractionData, APIInteractionResponse, ApplicationCommandOptionType, ButtonStyle, ComponentType, InteractionResponseType, MessageFlags } from "discord-api-types/v10";
import { CreateInteractionResponse, ConvertSnowflakeToDate, FollowupMessage, IsleofDucks, ErrorEmbed, SendMessage } from "@/discord/discordUtils";
import { getUserStrike, getTotalStrikesCount, getAllStrikesLimited, removeStrike } from "@/discord/utils";
import { NextResponse } from "next/server";

async function removeStrikes(
    interaction: APIChatInputApplicationCommandInteraction,
    discordId: string
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
            flags: MessageFlags.IsComponentsV2,
            components: ErrorEmbed("Could not find who ran the command", timestamp, true)
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
            flags: MessageFlags.IsComponentsV2,
            components: ErrorEmbed("You don't have permission to use this command", timestamp, true)
        });
        return NextResponse.json(
            { success: false, error: "You don't have permission to use this command" },
            { status: 403 }
        );
    }

    const strike = await removeStrike(discordId);
    if (strike === null) {
        await FollowupMessage(interaction.token, {
            flags: MessageFlags.IsComponentsV2,
            components: ErrorEmbed("This player is not on my strike list", timestamp, true)
        });
        return NextResponse.json(
            { success: false, error: "This player is not on my strike list" },
            { status: 400 }
        );
    }

    await SendMessage(IsleofDucks.channels.strikelog, {
        flags: MessageFlags.IsComponentsV2,
        components: [
            {
                type: ComponentType.Container,
                accent_color: IsleofDucks.colours.main,
                components: [
                    {
                        type: ComponentType.TextDisplay,
                        content: `User removed from my strike list!`,
                    },
                    { type: ComponentType.Separator },
                    {
                        type: ComponentType.TextDisplay,
                        content: [
                            `**Discord**: <@${discordId}> - ${discordId}`,
                            `**Strikes**: ${strike} strike${strike !== 1 ? 's' : ''}`,
                            `**Removed by**: <@${interaction.member.user.id}> - ${interaction.member.nick ?? interaction.member.user.username}`
                        ].join("\n"),
                    },
                    { type: ComponentType.Separator },
                    {
                        type: ComponentType.TextDisplay,
                        content: `-# Response time: ${Date.now() - timestamp.getTime()}ms • <t:${Math.floor(Date.now() / 1000)}:F>`
                    }
                ]
            }
        ]
    });

    await FollowupMessage(interaction.token, {
        content: null,
        embeds: [
            {
                title: `<@${discordId}> - ${discordId} was removed from my strike list!`,
                color: 0xFB9B00,
                footer: {
                    text: `Response time: ${Date.now() - timestamp.getTime()}ms`,
                },
                timestamp: new Date().toISOString()
            }
        ]
    });

    return NextResponse.json(
        { success: true },
        { status: 200 }
    );
}

async function viewStrikes(
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

    const strikes = await getAllStrikesLimited(0, 25);
    const strikesCount = await getTotalStrikesCount();
    if (!strikes) {
        await FollowupMessage(interaction.token, {
            content: null,
            embeds: [
                {
                    title: "Something went wrong!",
                    description: "Could not get strikes",
                    color: 0xB00020,
                    footer: {
                        text: `Response time: ${Date.now() - timestamp.getTime()}ms`,
                    },
                    timestamp: new Date().toISOString()
                }
            ],
        });
        return NextResponse.json(
            { success: false, error: "Could not get strikes" },
            { status: 400 }
        )
    }

    if (strikes.length === 0 || strikesCount === 0) {
        await FollowupMessage(interaction.token, {
            content: null,
            embeds: [
                {
                    title: "There are no strikes!",
                    color: 0xFB9B00,
                    footer: {
                        text: `Response time: ${Date.now() - timestamp.getTime()}ms`,
                    },
                    timestamp: new Date().toISOString()
                }
            ],
        });
        return NextResponse.json(
            { success: false, error: "There are no strikes" },
            { status: 400 }
        )
    }

    // const fieldArray = [];
    // for (const [key, value] of Object.entries(bannedPlayers.players.reduce<Record<string, { uuid: string, name?: string, discord: string | null, reason: string }[]>>((accumlator: Record<string, { uuid: string, name?: string, discord: string | null, reason: string }[]>, current: { uuid: string, name?: string, discord: string | null, reason: string }) => {
    //     (accumlator[current.reason] = accumlator[current.reason] || []).push(current);
    //     return accumlator;
    // }, {}))) {
    //     fieldArray.push({
    //         name: key,
    //         value: value.map(player => player.name ?? player.uuid).join('\n').replaceAll('_', '\\_'),
    //         inline: true
    //     });
    // }

    await FollowupMessage(interaction.token, {
        content: undefined,
        embeds: [
            {
                title: "Strikes",
                color: 0xFB9B00,
                description: strikes.map(user => {
                    return `<@${user.discordid}> - ${user.discordid}: ${user.strikes} strike${user.strikes !== 1 ? 's' : ''}`;
                }).join('\n'),
                footer: {
                    text: `Response time: ${Date.now() - timestamp.getTime()}ms`,
                },
                timestamp: new Date().toISOString()
            }
        ],
        components: [
            {
                type: ComponentType.ActionRow,
                components: [
                    {
                        custom_id: 'strikelist-page_0',
                        type: ComponentType.Button,
                        label: '◀️',
                        style: ButtonStyle.Primary,
                        disabled: true
                    },
                    {
                        custom_id: 'strikelist-search',
                        type: ComponentType.Button,
                        label: `Page 1/${Math.ceil(strikesCount / 25)}`,
                        style: ButtonStyle.Secondary,
                        disabled: false
                    },
                    {
                        custom_id: 'strikelist-page_2',
                        type: ComponentType.Button,
                        label: '▶️',
                        style: ButtonStyle.Primary,
                        disabled: Math.ceil(strikesCount / 25) < 2
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

async function checkStrike(
    interaction: APIChatInputApplicationCommandInteraction,
    discordid: string
): Promise<
    NextResponse<
        {
            success: boolean;
            error?: string;
        } | APIInteractionResponse
    >
> {
    const timestamp = ConvertSnowflakeToDate(interaction.id);

    const strike = await getUserStrike(discordid);

    await FollowupMessage(interaction.token, {
        embeds: [
            {
                title: "Strikes",
                color: IsleofDucks.colours.main,
                description: strike ? [
                    `**Discord**: <@${discordid}> - ${discordid}`,
                    `**Strikes**: ${strike.strikes}`
                ].join('\n') : "This player has no strikes.",
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
            content: null,
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
        });
        return NextResponse.json(
            { success: false, error: "Missing interaction data" },
            { status: 400 }
        );
    }
    const interactionData = interaction.data as APIChatInputApplicationCommandInteractionData;
    if (!interactionData.options) {
        await FollowupMessage(interaction.token, {
            content: null,
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

    if (options.remove) {
        return await removeStrikes(interaction, options.remove.discord);
    } else if (options.view) {
        return await viewStrikes(interaction);
    } else if (options.check) {
        return await checkStrike(interaction, options.check.discord);
    }

    await FollowupMessage(interaction.token, {
        content: undefined,
        embeds: [
            {
                title: "Something went wrong!",
                description: "Unknown command",
                color: 0xFB9B00,
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
    name: "strikelist",
    description: "List or edit strikes for users.",
    options: [
        {
            name: "remove",
            description: "Remove a strike from a user.",
            type: ApplicationCommandOptionType.Subcommand,
            options: [
                {
                    name: "discord",
                    description: "The Discord ID of the user.",
                    type: ApplicationCommandOptionType.String,
                    required: true
                }
            ]
        },
        {
            name: "view",
            description: "View the strike list.",
            type: ApplicationCommandOptionType.Subcommand
        },
        {
            name: "check",
            description: "Check if a user has a strike.",
            type: ApplicationCommandOptionType.Subcommand,
            options: [
                {
                    name: "discord",
                    description: "The Discord ID of the user.",
                    type: ApplicationCommandOptionType.String,
                    required: true
                }
            ]
        }
    ]
} as const;
export const RequiredRoles: Record<typeof CommandData["options"][number]["name"], string[]> = {
    view: [
        IsleofDucks.roles.verified
    ],
    remove: [
        IsleofDucks.roles.mod_duck,
        IsleofDucks.roles.mod_duckling,
        IsleofDucks.roles.admin
    ],
    check: [
        IsleofDucks.roles.verified
    ],
}