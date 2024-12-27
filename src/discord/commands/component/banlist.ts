import { ConvertSnowflakeToDate, CreateInteractionResponse, FollowupMessage } from "@/discord/discordUtils";
import { getBannedPlayers, getBannedPlayersCount, searchBannedPlayers } from "@/discord/utils";
import { APIInteractionResponse, APIMessageComponentButtonInteraction, ButtonStyle, ComponentType, InteractionResponseType } from "discord-api-types/v10";
import { NextResponse } from "next/server";

async function viewBanned(
    interaction: APIMessageComponentButtonInteraction
): Promise<
    NextResponse<
        {
            success: boolean;
            error?: string;
        } | APIInteractionResponse
    >
> {
    const timestamp = ConvertSnowflakeToDate(interaction.id);
    
    const page = interaction.data.custom_id.split("-")[1].split('_')[1];
    const bannedPlayers = await getBannedPlayers(( parseInt(page) - 1 ) * 25, 25);
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
                        custom_id: `banlist-page_${parseInt(page) - 1}`,
                        type: ComponentType.Button,
                        label: '◀️',
                        style: ButtonStyle.Primary,
                        disabled: page == '1'
                    },
                    {
                        custom_id: `banlist-search`,
                        type: ComponentType.Button,
                        label: `Page ${page}/${Math.ceil(bannedCount / 25)}`,
                        style: ButtonStyle.Secondary,
                        disabled: false
                    },
                    {
                        custom_id: `banlist-page_${parseInt(page) + 1}`,
                        type: ComponentType.Button,
                        label: '▶️',
                        style: ButtonStyle.Primary,
                        disabled: Math.ceil(bannedCount / 25) < parseInt(page) + 1
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

async function searchBanned(
    interaction: APIMessageComponentButtonInteraction
): Promise<
    NextResponse<
        {
            success: boolean;
            error?: string;
        } | APIInteractionResponse
    >
> {
    const timestamp = ConvertSnowflakeToDate(interaction.id);
    const query = interaction.data.custom_id.split("-")[2];

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

    const page = interaction.data.custom_id.split("-")[1].split('_')[1];
    const bannedPlayers = await searchBannedPlayers(query, ( parseInt(page) - 1 ) * 25, 25);
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
                        custom_id: `banlist-page_${parseInt(page) - 1}-${query}`,
                        type: ComponentType.Button,
                        label: '◀️',
                        style: ButtonStyle.Primary,
                        disabled: page == '1'
                    },
                    {
                        custom_id: `banlist-search`,
                        type: ComponentType.Button,
                        label: `Page ${page}/${Math.ceil(bannedPlayers.count / 25)}`,
                        style: ButtonStyle.Secondary,
                        disabled: false
                    },
                    {
                        custom_id: `banlist-page_${parseInt(page) + 1}-${query}`,
                        type: ComponentType.Button,
                        label: '▶️',
                        style: ButtonStyle.Primary,
                        disabled: Math.ceil(bannedPlayers.count / 25) < parseInt(page) + 1
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
    interaction: APIMessageComponentButtonInteraction
): Promise<
    NextResponse<
        {
            success: boolean;
            error?: string;
        } | APIInteractionResponse
    >
> {
    if (interaction.data.custom_id === 'banlist-search') {
        await CreateInteractionResponse(interaction.id, interaction.token, {
            type: InteractionResponseType.ChannelMessageWithSource,
            data: {
                content: "o/",
                flags: 1 << 6
            }
        });
        return NextResponse.json(
            { success: false, error: "Unknown command" },
            { status: 404 }
        );
    }

    // ACK response and update the original message
    await CreateInteractionResponse(interaction.id, interaction.token, {
        type: InteractionResponseType.DeferredMessageUpdate,
    });

    if (interaction.data.custom_id.split('-').length === 3) {
        return await searchBanned(interaction);
    } else {
        return await viewBanned(interaction);
    }
}