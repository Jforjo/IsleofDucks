import { APIButtonComponentWithCustomId, APIInteractionResponse, APIMessage, APIMessageComponentButtonInteraction, ComponentType, InteractionResponseType } from "discord-api-types/v10";
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
        
        await FollowupMessage(interaction.token, {
            content: interaction.message.content,
            embeds: [...interaction.message.embeds, {
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
        });
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
