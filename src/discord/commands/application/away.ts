import { APIChatInputApplicationCommandInteraction, APIChatInputApplicationCommandInteractionData, APIGuildMember, APIInteractionResponse, ApplicationCommandOptionType, InteractionResponseType } from "discord-api-types/v10";
import { CreateInteractionResponse, ConvertSnowflakeToDate, FollowupMessage, IsleofDucks } from "@/discord/discordUtils";
import { addAwayPlayer, removeAwayPlayer, getAwayPlayers } from "@/discord/utils";
import { NextResponse } from "next/server";

async function applyAway(
    interaction: APIChatInputApplicationCommandInteraction,
    reason: string,
    leaveTimestamp: number,
    returnTimestamp: number
): Promise<
    NextResponse<
        {
            success: boolean;
            error?: string;
        } | APIInteractionResponse
    >
> {
    const timestamp = ConvertSnowflakeToDate(interaction.id);

    if (!interaction.member || !interaction.user) {
        await FollowupMessage(interaction.token, {
            content: "Could not find who ran the command!"
        });
        return NextResponse.json(
            { success: false, error: "Could not find who ran the command" },
            { status: 400 }
        );
    }
    if (!(
        interaction.member.roles.includes(IsleofDucks.roles.staff) ||
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

    await addAwayPlayer(interaction.user.id, reason, leaveTimestamp, returnTimestamp);

    // await SendMessage(IsleofDucks.channels.staffgeneral, {
    //     embeds: [
    //         {
    //             title: `\`${interaction.user.username}\` has applied to be away!`,
    //             fields: [
    //                 {
    //                     name: "Reason",
    //                     value: reason
    //                 },
    //                 {
    //                     name: "Leave Time",
    //                     value: `<t:${leaveTimestamp}:F>`
    //                 },
    //                 {
    //                     name: "Return Time",
    //                     value: `<t:${returnTimestamp}:F>`
    //                 }
    //             ],
    //             color: 0xFB9B00,
    //             footer: {
    //                 text: `Response time: ${Date.now() - timestamp.getTime()}ms`,
    //             },
    //             timestamp: new Date().toISOString()
    //         }
    //     ]
    // });

    await FollowupMessage(interaction.token, {
        embeds: [
            {
                title: `Successfully applied to be away!`,
                fields: [
                    {
                        name: "Reason",
                        value: reason
                    },
                    {
                        name: "Leave Time",
                        value: `<t:${leaveTimestamp}:F>`
                    },
                    {
                        name: "Return Time",
                        value: `<t:${returnTimestamp}:F>`
                    }
                ],
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

async function removeAway(
    interaction: APIChatInputApplicationCommandInteraction,
    user: APIGuildMember
): Promise<
    NextResponse<
        {
            success: boolean;
            error?: string;
        } | APIInteractionResponse
    >
> {
    const timestamp = ConvertSnowflakeToDate(interaction.id);

    if (!interaction.member || !interaction.user) {
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

    await removeAwayPlayer(user.user.id);

    await FollowupMessage(interaction.token, {
        embeds: [
            {
                title: `<@${user.user.id}> was removed from my away list!`,
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

async function viewAway(
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

    const awayPlayers = await getAwayPlayers();
    if (!awayPlayers) {
        await FollowupMessage(interaction.token, {
            content: null,
            embeds: [
                {
                    title: "Something went wrong!",
                    description: "Could not get players who will be away.",
                    color: 0xB00020,
                    footer: {
                        text: `Response time: ${Date.now() - timestamp.getTime()}ms`,
                    },
                    timestamp: new Date().toISOString()
                }
            ],
        });
        return NextResponse.json(
            { success: false, error: "Could not get players who will be away" },
            { status: 400 }
        )
    }

    if (awayPlayers.length === 0) {
        await FollowupMessage(interaction.token, {
            content: null,
            embeds: [
                {
                    title: "There are no players who will be away!",
                    color: 0xFB9B00,
                    footer: {
                        text: `Response time: ${Date.now() - timestamp.getTime()}ms`,
                    },
                    timestamp: new Date().toISOString()
                }
            ],
        });
        return NextResponse.json(
            { success: false, error: "There are no players who will be away" },
            { status: 400 }
        )
    }

    await FollowupMessage(interaction.token, {
        embeds: [
            {
                title: "Away Players",
                color: 0xFB9B00,
                description: awayPlayers.map(player => {
                    return `<@${player.id}>: <t:${player.leaveTimestamp}:F> - <t:${player.returnTimestamp}:F>`;
                }).join('\n'),
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

    if (options.apply) {
        return await applyAway(interaction, options.apply.reason, options.apply.leave, options.apply.return);
    } else if (options.remove) {
        return await removeAway(interaction, options.remove.user);
    } else if (options.view) {
        return await viewAway(interaction);
    }

    await FollowupMessage(interaction.token, {
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
    name: "away",
    description: "Leave of absence commands.",
    options: [
        {
            name: "apply",
            description: "Notify us of your leave of absence.",
            type: ApplicationCommandOptionType.Subcommand,
            options: [
                {
                    name: "reason",
                    description: "The reason why you will be away.",
                    type: ApplicationCommandOptionType.String,
                    required: true
                },
                {
                    name: "leave",
                    description: "The timestamp when you will be away. (run '/util convert timestamp')",
                    type: ApplicationCommandOptionType.Integer,
                    required: true,
                },
                {
                    name: "return",
                    description: "The timestamp when you will return. (run '/util convert timestamp')",
                    type: ApplicationCommandOptionType.Integer,
                    required: true
                }
            ]
        },
        {
            name: "remove",
            description: "Remove a player from the away list.",
            type: ApplicationCommandOptionType.Subcommand,
            options: [
                {
                    name: "user",
                    description: "The user to remove.",
                    type: ApplicationCommandOptionType.User,
                    required: true
                }
            ]
        },
        {
            name: "view",
            description: "View all users who have applied for leave.",
            type: ApplicationCommandOptionType.Subcommand
        },
    ]
}