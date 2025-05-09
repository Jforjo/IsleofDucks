import { APIChatInputApplicationCommandInteraction, APIChatInputApplicationCommandInteractionData, APIInteractionResponse, ApplicationCommandOptionType, CDNRoutes, ImageFormat, InteractionResponseType, MessageFlags, RouteBases } from "discord-api-types/v10";
import { CreateInteractionResponse, ConvertSnowflakeToDate, FollowupMessage, ExecuteWebhook, GetChannelMessages, EditChannel, DeleteChannel, IsleofDucks } from "@/discord/discordUtils";
import { getUsernameOrUUID } from "@/discord/hypixelUtils";
import { NextResponse } from "next/server";

async function convertUUID(
    interaction: APIChatInputApplicationCommandInteraction,
    query: string,
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

    const uuidResponse = await getUsernameOrUUID(query);
    if (!uuidResponse.success) {
        await FollowupMessage(interaction.token, {
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

    await FollowupMessage(interaction.token, {
        embeds: [
            {
                title: `Conversion Completed`,
                description: [
                    `UUID: ${uuidResponse.uuid}`,
                    `Username: ${uuidResponse.name.replaceAll('_', '\\_')}`
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

async function convertTimestamp(
    interaction: APIChatInputApplicationCommandInteraction,
    year: number,
    month: number,
    day: number,
    hour: number,
    minute: number,
    second: number
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

    const date = new Date(
        year ? year : timestamp.getUTCFullYear(),
        month ? month - 1 : timestamp.getUTCMonth(),
        day ? day : timestamp.getUTCDate(),
        hour ? hour : timestamp.getUTCHours(),
        minute ? minute : timestamp.getUTCMinutes(),
        second ? second : timestamp.getUTCSeconds()
    );

    await FollowupMessage(interaction.token, {
        embeds: [
            {
                title: `Conversion Completed`,
                description: [
                    `Timestamp: ${Math.floor(date.getTime() / 1000)}`,
                    `Date: <t:${Math.floor(date.getTime() / 1000)}:F>`,
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

async function transcript(
    interaction: APIChatInputApplicationCommandInteraction,
    threadID: string,
    messageID: string
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
        data: { flags: MessageFlags.Ephemeral }
    });

    if (!interaction.user) {
        await FollowupMessage(interaction.token, {
            content: "Could not find who ran the command!"
        });
        return NextResponse.json(
            { success: false, error: "Could not find who ran the command" },
            { status: 400 }
        );
    }
    if (interaction.user.id !== IsleofDucks.staticIDs.Jforjo) {
        await FollowupMessage(interaction.token, {
            content: "You don't have permission to use this command!"
        });
        return NextResponse.json(
            { success: false, error: "You don't have permission to use this command" },
            { status: 403 }
        );
    }

    const messages = await GetChannelMessages(interaction.channel.id, { limit: 100, after: messageID });
    if (!messages) {
        await FollowupMessage(interaction.token, {
            content: "No messages found!",
        });
        return NextResponse.json(
            { success: false, error: 'No messages found' },
            { status: 404 }
        )
    }

    for (const message of messages.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())) {
    // for await (const message of GetMessagesAfterGenerator(channelID, firstMessageID)) {
        if (!message) continue;
        const avatarURL = message.author.avatar ? RouteBases.cdn + CDNRoutes.userAvatar(message.author.id, message.author.avatar, ImageFormat.PNG ) : undefined;
        const attachments = message.attachments.map((attachment, index) => {
            attachment.id = index.toString();
            return attachment;
        });
        await ExecuteWebhook({
            thread_id: threadID,
            wait: true
        }, {
            username: message.author.username,
            avatar_url: avatarURL,
            content: message.content,
            embeds: message.embeds,
            attachments: attachments,
            poll: message.poll,
            flags: MessageFlags.SuppressNotifications,
            allowed_mentions: {
                parse: []
            }
        }, attachments.map(attachment => ({
            id: attachment.id,
            url: attachment.url,
            filename: attachment.filename
        })));
    }
    
    await EditChannel(threadID, {
        locked: true,
        archived: true
    });

    await FollowupMessage(interaction.token, {
        content: "Done!",
    });
    
    await DeleteChannel(interaction.channel.id);

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

    if (!interaction.data) {
        await CreateInteractionResponse(interaction.id, interaction.token, {
            type: InteractionResponseType.ChannelMessageWithSource,
            data: {
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

    if (options.convert?.uuid) {
        return await convertUUID(interaction, options.convert.uuid.query);
    } else if (options.convert?.timestamp) {
        return await convertTimestamp(interaction,
            options.convert.timestamp.year,
            options.convert.timestamp.month,
            options.convert.timestamp.day,
            options.convert.timestamp.hour,
            options.convert.timestamp.minute,
            options.convert.timestamp.second
        );
    } else if (options.transcript) return await transcript(interaction, options.transcript.thread, options.transcript.message);

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
    name: "util",
    description: "Various utility commands.",
    options: [
        {
            name: "transcript",
            description: "Resume saving a transcript.",
            type: ApplicationCommandOptionType.Subcommand,
            options: [
                {
                    name: "thread",
                    description: "The ID of the thread to save the transcript to.",
                    type: ApplicationCommandOptionType.String,
                    required: true
                },
                {
                    name: "message",
                    description: "The ID of the message to start saving the transcript from. (exclusive)",
                    type: ApplicationCommandOptionType.String,
                    required: true
                }
            ]
        },
        {
            name: "convert",
            description: "Various conversion commands.",
            type: ApplicationCommandOptionType.SubcommandGroup,
            options: [
                {
                    name: "uuid",
                    description: "Convert a username to a UUID or vice versa.",
                    type: ApplicationCommandOptionType.Subcommand,
                    options: [
                        {
                            name: "query",
                            description: "The name or UUID of the player.",
                            type: ApplicationCommandOptionType.String,
                            required: true
                        }
                    ]
                },
                {
                    name: "timestamp",
                    description: "Convert a date to a timestamp",
                    type: ApplicationCommandOptionType.Subcommand,
                    options: [
                        {
                            name: "year",
                            description: "The year of the date.",
                            type: ApplicationCommandOptionType.Integer,
                        },
                        {
                            name: "month",
                            description: "The month of the date.",
                            type: ApplicationCommandOptionType.Integer,
                        },
                        {
                            name: "day",
                            description: "The day of the date.",
                            type: ApplicationCommandOptionType.Integer,
                        },
                        {
                            name: "hour",
                            description: "The hour of the date.",
                            type: ApplicationCommandOptionType.Integer,
                        },
                        {
                            name: "minute",
                            description: "The minute of the date.",
                            type: ApplicationCommandOptionType.Integer,
                        },
                        {
                            name: "second",
                            description: "The second of the date.",
                            type: ApplicationCommandOptionType.Integer,
                        }
                    ]
                }
            ]
        },
    ]
}