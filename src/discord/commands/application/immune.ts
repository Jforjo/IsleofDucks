import { APIChatInputApplicationCommandInteraction, APIChatInputApplicationCommandInteractionData, APIInteractionResponse, ApplicationCommandOptionType, InteractionResponseType } from "discord-api-types/v10";
import { CreateInteractionResponse, ConvertSnowflakeToDate, FollowupMessage, IsleofDucks } from "@/discord/discordUtils";
import { getImmunePlayers, isImmunePlayer, addImmunePlayer, removeImmunePlayer } from "@/discord/utils";
import { getUsernameOrUUID } from "@/discord/hypixelUtils";
import { NextResponse } from "next/server";

async function addImmune(
    interaction: APIChatInputApplicationCommandInteraction,
    name: string,
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

    const immune = await isImmunePlayer(uuid, reason);
    if (immune) {
        await FollowupMessage(interaction.token, {
            content: undefined,
            embeds: [
                {
                    title: `\`${uuidResponse.name}\` already has that immunity type!`,
                    color: 0xFB9B00,
                    footer: {
                        text: `Response time: ${Date.now() - timestamp.getTime()}ms`,
                    },
                    timestamp: new Date().toISOString()
                }
            ]
        });
        return NextResponse.json(
            { success: false, error: "This player already has that immunity type" },
            { status: 400 }
        );
    }

    await addImmunePlayer(uuid, null, reason);

    await FollowupMessage(interaction.token, {
        content: null,
        embeds: [
            {
                title: `\`${uuidResponse.name}\` was added to the immune list!`,
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

async function removeImmune(
    interaction: APIChatInputApplicationCommandInteraction,
    name: string,
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

    const immune = await isImmunePlayer(uuid, reason);
    if (!immune) {
        await FollowupMessage(interaction.token, {
            content: null,
            embeds: [
                {
                    title: `\`${uuidResponse.name}\` is not immune!`,
                    color: 0xFB9B00,
                    footer: {
                        text: `Response time: ${Date.now() - timestamp.getTime()}ms`,
                    },
                    timestamp: new Date().toISOString()
                }
            ]
        });
        return NextResponse.json(
            { success: false, error: "This player is not immune" },
            { status: 400 }
        );
    }

    await removeImmunePlayer(uuid, reason);

    await FollowupMessage(interaction.token, {
        content: null,
        embeds: [
            {
                title: `\`${uuidResponse.name}\` was removed from the ${reason} immune list!`,
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

async function viewImmune(
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

    const immunePlayers = await getImmunePlayers();
    if (!immunePlayers.success) {
        await FollowupMessage(interaction.token, {
            content: null,
            embeds: [
                {
                    title: "Something went wrong!",
                    description: "Could not get immune players",
                    color: 0xB00020,
                    footer: {
                        text: `Response time: ${Date.now() - timestamp.getTime()}ms`,
                    },
                    timestamp: new Date().toISOString()
                }
            ],
        });
        return NextResponse.json(
            { success: false, error: "Could not get immune players" },
            { status: 400 }
        )
    }

    if (immunePlayers.players.length === 0) {
        await FollowupMessage(interaction.token, {
            content: null,
            embeds: [
                {
                    title: "There are no immune players!",
                    color: 0xFB9B00,
                    footer: {
                        text: `Response time: ${Date.now() - timestamp.getTime()}ms`,
                    },
                    timestamp: new Date().toISOString()
                }
            ],
        });
        return NextResponse.json(
            { success: false, error: "There are no immune players" },
            { status: 400 }
        )
    }

    const fieldArray = [];
    for (const [key, value] of Object.entries(immunePlayers.players.reduce<Record<string, { uuid: string, name?: string, discord: string | null, reason: string }[]>>((accumlator: Record<string, { uuid: string, name?: string, discord: string | null, reason: string }[]>, current: { uuid: string, name?: string, discord: string | null, reason: string }) => {
        (accumlator[current.reason] = accumlator[current.reason] || []).push(current);
        return accumlator;
    }, {}))) {
        fieldArray.push({
            name: key,
            value: value.map(player => player.name ?? player.uuid).join('\n').replaceAll('_', '\\_'),
            inline: true
        });
    }

    await FollowupMessage(interaction.token, {
        content: undefined,
        embeds: [
            {
                title: "Immune Players",
                color: 0xFB9B00,
                fields: fieldArray,
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

    if (options.add) {
        return await addImmune(interaction, options.add.name, options.add.reason);
    } else if (options.remove) {
        return await removeImmune(interaction, options.remove.name, options.remove.reason);
    } else if (options.view) {
        return await viewImmune(interaction);
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
    name: "immune",
    description: "List or edit immune players.",
    options: [
        {
            name: "add",
            description: "Add a player to the immune list.",
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
                    description: "The reason why the player is immune.",
                    type: ApplicationCommandOptionType.String,
                    required: true,
                    choices: [
                        {
                            name: "Level",
                            value: "Level"
                        },
                        {
                            name: "Loyalty",
                            value: "Loyalty"
                        }
                    ]
                }
            ]
        },
        {
            name: "remove",
            description: "Remove a player from the immune list.",
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
                    description: "The type of immune list.",
                    type: ApplicationCommandOptionType.String,
                    required: true,
                    choices: [
                        {
                            name: "Level",
                            value: "Level"
                        },
                        {
                            name: "Loyalty",
                            value: "Loyalty"
                        }
                    ]
                }
            ]
        },
        {
            name: "view",
            description: "View the immune list.",
            type: ApplicationCommandOptionType.Subcommand
        }
    ]
}