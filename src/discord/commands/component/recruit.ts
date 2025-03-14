import { APIButtonComponentWithCustomId, APIInteractionResponse, APIMessage, APIMessageComponentButtonInteraction, ComponentType, InteractionResponseType, MessageFlags } from "discord-api-types/v10";
import { CreateInteractionResponse, FollowupMessage, ConvertSnowflakeToDate, IsleofDucks, SendMessage, GetChannelMessages } from "@/discord/discordUtils";
import { NextResponse } from "next/server";

export default async function Command(
    interaction: APIMessageComponentButtonInteraction
): Promise<
    NextResponse<
        {
            success: boolean;
            error?: string;
        } | APIInteractionResponse
    >
> {
    if (!interaction.member) {
        await CreateInteractionResponse(interaction.id, interaction.token, {
            type: InteractionResponseType.ChannelMessageWithSource,
            data: {
                content: "Failed to detect the server member",
                flags: MessageFlags.Ephemeral
            }
        });
        return NextResponse.json(
            { success: false, error: "Failed to detect the server member" },
            { status: 400 }
        );
    }
    if (!( interaction.member.roles.includes(IsleofDucks.roles.staff) || interaction.member.roles.includes(IsleofDucks.roles.helper) )) {
        await CreateInteractionResponse(interaction.id, interaction.token, {
            type: InteractionResponseType.ChannelMessageWithSource,
            data: {
                content: "You don't have permission to use this command",
                flags: MessageFlags.Ephemeral
            }
        });
        return NextResponse.json(
            { success: false, error: "You don't have permission to use this command" },
            { status: 403 }
        )
    }

    // ACK response and update the original message
    await CreateInteractionResponse(interaction.id, interaction.token, {
        type: InteractionResponseType.DeferredMessageUpdate,
    });
    
    const timestamp = ConvertSnowflakeToDate(interaction.id);
    const buttonID = interaction.data.custom_id.split("-")[1];
    const type = interaction.data.custom_id.split("-")[2];
    const username = interaction.data.custom_id.split("-")[3];
    
    if (buttonID === "log") {
        await FollowupMessage(interaction.token, {
            content: interaction.message.content,
            embeds: [...interaction.message.embeds, {
                title: `Guild Log - ${type.slice(0, 1).toUpperCase() + type.slice(1)}`,
                description: "Sending log command...",
                color: 0xFB9B00,
                footer: {
                    text: `Response time: ${Date.now() - timestamp.getTime()}ms`,
                },
                timestamp: new Date().toISOString()
            }],
            components: interaction.message.components
        });

        let message: APIMessage | undefined;
        if (type === "duck") {
            message = await SendMessage(IsleofDucks.channels.duckoc, {
                content: `log ${username}`
            });
        } else if (type === "duckling") {
            message = await SendMessage(IsleofDucks.channels.ducklingoc, {
                content: `log ${username}`
            });
        }
        if (!message) await new Promise(resolve => setTimeout(resolve, 1000));
        if (!message) {
            await FollowupMessage(interaction.token, {
                content: interaction.message.content,
                embeds: [...interaction.message.embeds, {
                    title: `Guild Log - ${type.slice(0, 1).toUpperCase() + type.slice(1)}`,
                    description: "Failed to send the log command.",
                    color: 0xB00020,
                    footer: {
                        text: `Response time: ${Date.now() - timestamp.getTime()}ms`,
                    },
                    timestamp: new Date().toISOString()
                }],
                components: interaction.message.components
            });
            return NextResponse.json(
                { success: false, error: "Failed to send the log command." },
                { status: 400 }
            );
        }
        
        await FollowupMessage(interaction.token, {
            content: interaction.message.content,
            embeds: [...interaction.message.embeds, {
                title: `Guild Log - ${type.slice(0, 1).toUpperCase() + type.slice(1)}`,
                description: "Fetching logs...",
                color: 0xFB9B00,
                footer: {
                    text: `Response time: ${Date.now() - timestamp.getTime()}ms`,
                },
                timestamp: new Date().toISOString()
            }],
            components: interaction.message.components
        });

        let messages = await GetChannelMessages(message.channel_id, {
            limit: 5,
            after: message.id
        });
        let count = 0;
        while (!messages || messages.length === 0) {
            if (count > 30) break;
            await new Promise(resolve => setTimeout(resolve, 1000));
            messages = await GetChannelMessages(message.channel_id, {
                limit: 5,
                after: message.id
            });
            count++;
        }
        if (!messages) {
            await FollowupMessage(interaction.token, {
                content: interaction.message.content,
                embeds: [...interaction.message.embeds, {
                    title: `Guild Log - ${type.slice(0, 1).toUpperCase() + type.slice(1)}`,
                    description: "Failed to fetch logs.",
                    color: 0xB00020,
                    footer: {
                        text: `Response time: ${Date.now() - timestamp.getTime()}ms`,
                    },
                    timestamp: new Date().toISOString()
                }],
                components: interaction.message.components
            });
            return NextResponse.json(
                { success: false, error: "Failed to fetch logs." },
                { status: 400 }
            );
        }

        let logMessage: APIMessage | undefined;
        messages.forEach(message => {
            if (!message.author.bot) return;
            if (!message.embeds.length) return;
            if (!message.embeds[0].description) return;
            const description = message.embeds[0].description;
            if (description === "There are no logs to display.") {
                logMessage = message;
                return;
            }
            if (!description.split("\n")[1].includes('Guild Log')) return;
            if (!description.includes(username)) return;
            logMessage = message;
            return;
        });
        if (!logMessage) {
            await FollowupMessage(interaction.token, {
                content: interaction.message.content,
                embeds: [...interaction.message.embeds, {
                    title: `Guild Log - ${type.slice(0, 1).toUpperCase() + type.slice(1)}`,
                    description: "Failed to fetch log message.",
                    color: 0xB00020,
                    footer: {
                        text: `Response time: ${Date.now() - timestamp.getTime()}ms`,
                    },
                    timestamp: new Date().toISOString()
                }],
                components: interaction.message.components
            });
            return NextResponse.json(
                { success: false, error: "Failed to fetch logs." },
                { status: 400 }
            );
        }
        
        const attachments = interaction.message.attachments.length > 0 ? interaction.message.attachments.map(attachment => ({
            id: parseInt(attachment.id),
            filename: attachment.filename,
            url: attachment.url
        })).sort((a, b) => a.id - b.id) : [];

        await FollowupMessage(interaction.token, {
            content: interaction.message.content,
            embeds: [...interaction.message.embeds.map(embed => {
                if (embed.thumbnail) attachments.push({
                    id: attachments.length > 0 ? attachments[attachments.length - 1].id + 1 : 0,
                    filename: embed.thumbnail.url.split('/').pop()?.split('?')[0] ?? "",
                    url: embed.thumbnail.url
                });
                if (embed.image) attachments.push({
                    id: attachments.length > 0 ? attachments[attachments.length - 1].id + 1 : 0,
                    filename: embed.image.url.split('/').pop()?.split('?')[0] ?? "",
                    url: embed.image.url
                });
                return {
                    ...embed,
                    thumbnaill: embed.thumbnail && {
                        url: `attachment://${embed.thumbnail.url.split('/').pop()?.split('?')[0]}`
                    },
                    image: embed.image && {
                        url: `attachment://${embed.image.url.split('/').pop()?.split('?')[0]}`
                    }
                }
            }), {
                title: `Guild Log - ${type.slice(0, 1).toUpperCase() + type.slice(1)}`,
                description: logMessage.embeds[0].description,
                color: 0xFB9B00,
                footer: {
                    text: `Response time: ${Date.now() - timestamp.getTime()}ms`,
                },
                timestamp: new Date().toISOString()
            }],
            components: interaction.message.components?.map(row => {
                if (row.type !== ComponentType.ActionRow) return row;
                return {
                    ...row,
                    components: row.components.map(comp => {
                        const component = comp as APIButtonComponentWithCustomId;
                        if (component.type !== ComponentType.Button) return component;
                        if (component.custom_id.split('-')[1] === "log" &&
                            component.custom_id.split('-')[2] === type) return {
                            ...component,
                            disabled: true
                        };
                        if (component.custom_id.split('-')[1] === "invite" &&
                            component.custom_id.split('-')[2] === type) return {
                            ...component,
                            disabled: false
                        };
                        return component;
                    })
                };
            })
        }, attachments);
        console.log('attachments', attachments);
    } else if (buttonID === "invite") {
        if (type === "duck") {
            await SendMessage(IsleofDucks.channels.duckoc, {
                content: `invite ${username}`
            });
        } else if (type === "duckling") {
            await SendMessage(IsleofDucks.channels.ducklingoc, {
                content: `invite ${username}`
            });
        }
        
        await FollowupMessage(interaction.token, {
            content: interaction.message.content,
            embeds: interaction.message.embeds,
            components: interaction.message.components?.map(row => {
                if (row.type !== ComponentType.ActionRow) return row;
                return {
                    ...row,
                    components: row.components.map(comp => {
                        const component = comp as APIButtonComponentWithCustomId;
                        if (component.type !== ComponentType.Button) return component;
                        if (component.custom_id.split('-')[1] === "invite" &&
                            component.custom_id.split('-')[2] === type) return {
                            ...component,
                            disabled: true
                        };
                        return component;
                    })
                };
            })
        });
    }

    return NextResponse.json(
        { success: true },
        { status: 200 }
    );
}
