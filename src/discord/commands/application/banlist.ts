import { APIChatInputApplicationCommandInteraction, APIChatInputApplicationCommandInteractionData, APIInteractionResponse, ApplicationCommandOptionType, ButtonStyle, ComponentType, InteractionResponseType, Snowflake } from "discord-api-types/v10";
import { CreateInteractionResponse, ConvertSnowflakeToDate, FollowupMessage, IsleofDucks, BanGuildMember, SendMessage, RemoveBanGuildMember } from "@/discord/discordUtils";
import { getBannedPlayers, isBannedPlayer, addBannedPlayer, removeBannedPlayer, getBannedPlayersCount, getBannedPlayer, searchBannedPlayers, updateBannedPlayerDiscord } from "@/discord/utils";
import { getUsernameOrUUID } from "@/discord/hypixelUtils";
import { NextResponse } from "next/server";

async function addBanned(
    interaction: APIChatInputApplicationCommandInteraction,
    name: string,
    discord: string | null,
    reason: string
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
            content: "Could not find who ran the command!"
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
            content: "You don't have permission to use this command!"
        });
        return NextResponse.json(
            { success: false, error: "You don't have permission to use this command" },
            { status: 403 }
        );
    }

    const uuidResponse = await getUsernameOrUUID(name);
    if (!uuidResponse.success) {
        await FollowupMessage(interaction.token, {
            content: undefined,
            embeds: [
                {
                    title: "Something went wrong!",
                    description: uuidResponse.message,
                    color: 0xB00020,
                    footer: {
                        text: `Response time: ${Date.now() - timestamp.getTime()}ms`,
                    },
                    timestamp: new Date().toISOString()
                }
            ]
        });
        return NextResponse.json(
            { success: false, error: uuidResponse.message },
            { status: 404 }
        );
    }
    const uuid = uuidResponse.uuid;

    const banned = await isBannedPlayer(uuid);
    if (banned) {
        await FollowupMessage(interaction.token, {
            content: undefined,
            embeds: [
                {
                    title: `\`${uuidResponse.name}\` is already on my ban list!`,
                    color: 0xFB9B00,
                    footer: {
                        text: `Response time: ${Date.now() - timestamp.getTime()}ms`,
                    },
                    timestamp: new Date().toISOString()
                }
            ]
        });
        return NextResponse.json(
            { success: false, error: "This player is already on my ban list" },
            { status: 400 }
        );
    }

    await addBannedPlayer(uuid, discord ?? null, reason);

    if (discord) await BanGuildMember(IsleofDucks.serverID, discord, reason);

    await SendMessage(IsleofDucks.channels.duckoc, {
        content: `kick ${uuidResponse.name} ${reason}`
    });
    await SendMessage(IsleofDucks.channels.ducklingoc, {
        content: `kick ${uuidResponse.name} ${reason}`
    });

    await FollowupMessage(interaction.token, {
        content: null,
        embeds: [
            {
                title: `\`${uuidResponse.name}\` was added to my ban list!`,
                description: `Reason: ${reason}`,
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

async function removeBanned(
    interaction: APIChatInputApplicationCommandInteraction,
    name: string
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
            content: "Could not find who ran the command!"
        });
        return NextResponse.json(
            { success: false, error: "Could not find who ran the command" },
            { status: 400 }
        );
    }
    if (!interaction.member.roles.includes(IsleofDucks.roles.admin)) {
        await FollowupMessage(interaction.token, {
            content: "You don't have permission to use this command!"
        });
        return NextResponse.json(
            { success: false, error: "You don't have permission to use this command" },
            { status: 403 }
        );
    }

    const uuidResponse = await getUsernameOrUUID(name);
    if (!uuidResponse.success) {
        await FollowupMessage(interaction.token, {
            content: undefined,
            embeds: [
                {
                    title: "Something went wrong!",
                    description: uuidResponse.message,
                    color: 0xB00020,
                    footer: {
                        text: `Response time: ${Date.now() - timestamp.getTime()}ms`,
                    },
                    timestamp: new Date().toISOString()
                }
            ]
        });
        return NextResponse.json(
            { success: false, error: uuidResponse.message },
            { status: 404 }
        );
    }
    const uuid = uuidResponse.uuid;

    const banned = await getBannedPlayer(uuid);
    if (!banned) {
        await FollowupMessage(interaction.token, {
            content: null,
            embeds: [
                {
                    title: `\`${uuidResponse.name}\` is not on my ban list!`,
                    color: 0xFB9B00,
                    footer: {
                        text: `Response time: ${Date.now() - timestamp.getTime()}ms`,
                    },
                    timestamp: new Date().toISOString()
                }
            ]
        });
        return NextResponse.json(
            { success: false, error: "This player is not on my ban list" },
            { status: 400 }
        );
    }

    await removeBannedPlayer(uuid);

    if (banned.discords) {
        for (const discord of banned.discords) {
            await RemoveBanGuildMember(IsleofDucks.serverID, discord, `Removed from banlist by ${interaction.member.user.username}`);
        }
    }

    await FollowupMessage(interaction.token, {
        content: null,
        embeds: [
            {
                title: `\`${uuidResponse.name}\` was removed from my ban list!`,
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

async function viewBanned(
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

    const bannedPlayers = await getBannedPlayers(0, 25);
    const bannedCount = await getBannedPlayersCount();
    if (!bannedPlayers.success) {
        await FollowupMessage(interaction.token, {
            content: null,
            embeds: [
                {
                    title: "Something went wrong!",
                    description: "Could not get banned players",
                    color: 0xB00020,
                    footer: {
                        text: `Response time: ${Date.now() - timestamp.getTime()}ms`,
                    },
                    timestamp: new Date().toISOString()
                }
            ],
        });
        return NextResponse.json(
            { success: false, error: "Could not get banned players" },
            { status: 400 }
        )
    }

    if (bannedPlayers.players.length === 0 || bannedCount === 0) {
        await FollowupMessage(interaction.token, {
            content: null,
            embeds: [
                {
                    title: "There are no banned players!",
                    color: 0xFB9B00,
                    footer: {
                        text: `Response time: ${Date.now() - timestamp.getTime()}ms`,
                    },
                    timestamp: new Date().toISOString()
                }
            ],
        });
        return NextResponse.json(
            { success: false, error: "There are no banned players" },
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
                title: "Banned Players",
                color: 0xFB9B00,
                description: bannedPlayers.players.map(player => {
                    return `**${player.name?.replaceAll('_', '\\_') ?? player.uuid}** (${player.reason})`;
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
                        custom_id: 'banlist-page_0',
                        type: ComponentType.Button,
                        label: '◀️',
                        style: ButtonStyle.Primary,
                        disabled: true
                    },
                    {
                        custom_id: 'banlist-search',
                        type: ComponentType.Button,
                        label: `Page 1/${Math.ceil(bannedCount / 25)}`,
                        style: ButtonStyle.Secondary,
                        disabled: false
                    },
                    {
                        custom_id: 'banlist-page_2',
                        type: ComponentType.Button,
                        label: '▶️',
                        style: ButtonStyle.Primary,
                        disabled: Math.ceil(bannedCount / 25) < 2
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

async function checkBanned(
    interaction: APIChatInputApplicationCommandInteraction,
    name: string
): Promise<
    NextResponse<
        {
            success: boolean;
            error?: string;
        } | APIInteractionResponse
    >
> {
    const timestamp = ConvertSnowflakeToDate(interaction.id);

    const uuid = await getUsernameOrUUID(name);
    if (!uuid.success) {
        await FollowupMessage(interaction.token, {
            embeds: [
                {
                    title: "Something went wrong!",
                    description: uuid.message,
                    color: 0xB00020,
                    footer: {
                        text: `Response time: ${Date.now() - timestamp.getTime()}ms`,
                    },
                    timestamp: new Date().toISOString()
                }
            ]
        });
        return NextResponse.json(
            { success: false, error: uuid.message },
            { status: 400 }
        )
    }

    const banned = await getBannedPlayer(uuid.uuid);

    await FollowupMessage(interaction.token, {
        embeds: [
            {
                title: uuid.name.replaceAll('_', '\\_'),
                color: 0xFB9B00,
                description: banned ? [
                    `**UUID**: ${uuid.uuid}`,
                    `**Reason**: ${banned.reason}`
                ].join('\n') : "This player is not on my ban list!",
                fields: banned && banned.discords ? [
                    {
                        name: "Discord IDs",
                        value: typeof banned.discords === 'string' ? banned.discords[0] : banned.discords.join('\n')
                    }
                ] : undefined,
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

async function searchBanned(
    interaction: APIChatInputApplicationCommandInteraction,
    query: string
): Promise<
    NextResponse<
        {
            success: boolean;
            error?: string;
        } | APIInteractionResponse
    >
> {
    const timestamp = ConvertSnowflakeToDate(interaction.id);

    if (query.length < 3) {
        await FollowupMessage(interaction.token, {
            embeds: [
                {
                    title: "Something went wrong!",
                    description: "The search query must be at least 3 characters long",
                    color: 0xB00020,
                    footer: {
                        text: `Response time: ${Date.now() - timestamp.getTime()}ms`,
                    },
                    timestamp: new Date().toISOString()
                }
            ]
        });
        return NextResponse.json(
            { success: false, error: "The search query must be at least 3 characters long" },
            { status: 400 }
        )
    }

    const bannedPlayers = await searchBannedPlayers(query, 0, 25);
    if (!bannedPlayers.success) {
        await FollowupMessage(interaction.token, {
            embeds: [
                {
                    title: "Something went wrong!",
                    description: "Failed to search for banned players",
                    color: 0xB00020,
                    footer: {
                        text: `Response time: ${Date.now() - timestamp.getTime()}ms`,
                    },
                    timestamp: new Date().toISOString()
                }
            ]
        });
        return NextResponse.json(
            { success: false, error: "Failed to search for banned players" },
            { status: 400 }
        )
    }

    if (bannedPlayers.players.length === 0 || bannedPlayers.count === 0) {
        await FollowupMessage(interaction.token, {
            content: null,
            embeds: [
                {
                    title: "There are no banned players!",
                    color: 0xFB9B00,
                    footer: {
                        text: `Response time: ${Date.now() - timestamp.getTime()}ms`,
                    },
                    timestamp: new Date().toISOString()
                }
            ],
        });
        return NextResponse.json(
            { success: false, error: "There are no banned players" },
            { status: 400 }
        )
    }

    await FollowupMessage(interaction.token, {
        embeds: [
            {
                title: "Banned Players",
                color: 0xFB9B00,
                description: bannedPlayers.players.map(player => {
                    return `**${player.name?.replaceAll('_', '\\_') ?? player.uuid}** (${player.reason})`;
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
                        custom_id: `banlist-page_0-${query}`,
                        type: ComponentType.Button,
                        label: '◀️',
                        style: ButtonStyle.Primary,
                        disabled: true
                    },
                    {
                        custom_id: `banlist-search`,
                        type: ComponentType.Button,
                        label: `Page 1/${Math.ceil(bannedPlayers.count / 25)}`,
                        style: ButtonStyle.Secondary,
                        disabled: false
                    },
                    {
                        custom_id: `banlist-page_2-${query}`,
                        type: ComponentType.Button,
                        label: '▶️',
                        style: ButtonStyle.Primary,
                        disabled: Math.ceil(bannedPlayers.count / 25) < 2
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

async function addBannedDiscord(
    interaction: APIChatInputApplicationCommandInteraction,
    name: string,
    discordID: Snowflake
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
            content: "Could not find who ran the command!"
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
            content: "You don't have permission to use this command!"
        });
        return NextResponse.json(
            { success: false, error: "You don't have permission to use this command" },
            { status: 403 }
        );
    }

    const uuidResponse = await getUsernameOrUUID(name);
    if (!uuidResponse.success) {
        await FollowupMessage(interaction.token, {
            content: undefined,
            embeds: [
                {
                    title: "Something went wrong!",
                    description: uuidResponse.message,
                    color: 0xB00020,
                    footer: {
                        text: `Response time: ${Date.now() - timestamp.getTime()}ms`,
                    },
                    timestamp: new Date().toISOString()
                }
            ]
        });
        return NextResponse.json(
            { success: false, error: uuidResponse.message },
            { status: 404 }
        );
    }
    const uuid = uuidResponse.uuid;

    const banned = await getBannedPlayer(uuid);
    if (!banned) {
        await FollowupMessage(interaction.token, {
            content: undefined,
            embeds: [
                {
                    title: `\`${uuidResponse.name}\` is not on my ban list!`,
                    color: 0xFB9B00,
                    footer: {
                        text: `Response time: ${Date.now() - timestamp.getTime()}ms`,
                    },
                    timestamp: new Date().toISOString()
                }
            ]
        });
        return NextResponse.json(
            { success: false, error: "This player is not on my ban list" },
            { status: 400 }
        );
    }

    await updateBannedPlayerDiscord(uuid, discordID);

    await BanGuildMember(IsleofDucks.serverID, discordID, banned.reason);

    await FollowupMessage(interaction.token, {
        content: null,
        embeds: [
            {
                title: `\`${uuidResponse.name}\` was assigned another Discord ID in my ban list!`,
                description: [
                    `User: <@${discordID}>`,
                    `Discord ID: ${discordID}`
                ].join('\n'),
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

    if (options.add) {
        return await addBanned(interaction, options.add.name, options.add.discord, options.add.reason);
    } else if (options.remove) {
        return await removeBanned(interaction, options.remove.name);
    } else if (options.view) {
        return await viewBanned(interaction);
    } else if (options.check) {
        return await checkBanned(interaction, options.check.name);
    } else if (options.search) {
        return await searchBanned(interaction, options.search.query);
    } else if (options.adddiscord) {
        return await addBannedDiscord(interaction, options.adddiscord.name, options.adddiscord.discord);
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
    name: "banlist",
    description: "List or edit banned players.",
    options: [
        {
            name: "add",
            description: "Add a player to the ban list.",
            type: ApplicationCommandOptionType.Subcommand,
            options: [
                {
                    name: "name",
                    description: "The name of the player.",
                    type: ApplicationCommandOptionType.String,
                    required: true
                },
                {
                    name: "reason",
                    description: "The reason why the player is banned.",
                    type: ApplicationCommandOptionType.String,
                    required: true,
                },
                {
                    name: "discord",
                    description: "The Discord ID of the player.",
                    type: ApplicationCommandOptionType.String,
                    required: false
                }
            ]
        },
        {
            name: "remove",
            description: "Remove a player from the ban list.",
            type: ApplicationCommandOptionType.Subcommand,
            options: [
                {
                    name: "name",
                    description: "The name of the player.",
                    type: ApplicationCommandOptionType.String,
                    required: true
                }
            ]
        },
        {
            name: "view",
            description: "View the ban list.",
            type: ApplicationCommandOptionType.Subcommand
        },
        {
            name: "check",
            description: "Check if a player is banned.",
            type: ApplicationCommandOptionType.Subcommand,
            options: [
                {
                    name: "name",
                    description: "The name of the player.",
                    type: ApplicationCommandOptionType.String,
                    required: true
                }
            ]
        },
        {
            name: "search",
            description: "Search the ban list.",
            type: ApplicationCommandOptionType.Subcommand,
            options: [
                {
                    name: "query",
                    description: "The search query.",
                    type: ApplicationCommandOptionType.String,
                    required: true
                }
            ]
        },
        {
            name: "adddiscord",
            description: "Add a Discord ID to a player.",
            type: ApplicationCommandOptionType.Subcommand,
            options: [
                {
                    name: "name",
                    description: "The name of the player.",
                    type: ApplicationCommandOptionType.String,
                    required: true
                },
                {
                    name: "discord",
                    description: "The Discord ID of the player.",
                    type: ApplicationCommandOptionType.String,
                    required: true
                }
            ]
        }
    ]
}