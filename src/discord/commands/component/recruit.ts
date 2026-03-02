import { APIButtonComponentWithCustomId, APIInteractionResponse, APIMessage, APIMessageComponentButtonInteraction, ComponentType, InteractionResponseType, MessageFlags } from "discord-api-types/v10";
import { CreateInteractionResponse, FollowupMessage, ConvertSnowflakeToDate, IsleofDucks, SendMessage, GetChannelMessages } from "@/discord/discordUtils";
import { NextResponse } from "next/server";
import { getGuildData, getUsernameOrUUID } from "@/discord/hypixelUtils";
import { getImmunePlayers } from "@/discord/utils";

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
    
    const formattedType = type.slice(0, 1).toUpperCase() + type.slice(1);
    
    if (buttonID === "log") {
        const logEmbed = interaction.message.embeds.find(embed => embed.title === `Guild Log - ${formattedType}`);

        await FollowupMessage(interaction.token, {
            content: interaction.message.content,
            embeds: [...interaction.message.embeds.filter(embed => embed !== logEmbed), {
                title: `Guild Log - ${formattedType}`,
                description: "Sending log command...",
                color: IsleofDucks.colours.main,
                footer: {
                    text: `Response time: ${Date.now() - timestamp.getTime()}ms`,
                },
                timestamp: new Date().toISOString()
            }],
            components: interaction.message.components,
            attachments: interaction.message.attachments.map(attachment => ({
                id: attachment.id,
            }))
        });

        let message: APIMessage | undefined;
        if (type === "duck") {
            message = await SendMessage(IsleofDucks.channels.duckoc, {
                content: `log ${username} 1`
            });
        } else if (type === "duckling") {
            message = await SendMessage(IsleofDucks.channels.ducklingoc, {
                content: `log ${username} 1`
            });
        }
        if (!message) await new Promise(resolve => setTimeout(resolve, 2000));
        if (!message) {
            await FollowupMessage(interaction.token, {
                content: interaction.message.content,
                embeds: [...interaction.message.embeds.filter(embed => embed !== logEmbed), {
                    title: `Guild Log - ${formattedType}`,
                    description: "Failed to send the log command.",
                    color: IsleofDucks.colours.error,
                    footer: {
                        text: `Response time: ${Date.now() - timestamp.getTime()}ms`,
                    },
                    timestamp: new Date().toISOString()
                }],
                components: interaction.message.components,
                attachments: interaction.message.attachments.map(attachment => ({
                    id: attachment.id,
                }))
            });
            return NextResponse.json(
                { success: false, error: "Failed to send the log command." },
                { status: 400 }
            );
        }
        
        await FollowupMessage(interaction.token, {
            content: interaction.message.content,
            embeds: [...interaction.message.embeds.filter(embed => embed !== logEmbed), {
                title: `Guild Log - ${formattedType}`,
                description: "Fetching logs...",
                color: IsleofDucks.colours.main,
                footer: {
                    text: `Response time: ${Date.now() - timestamp.getTime()}ms`,
                },
                timestamp: new Date().toISOString()
            }],
            components: interaction.message.components,
            attachments: interaction.message.attachments.map(attachment => ({
                id: attachment.id,
            }))
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
                embeds: [...interaction.message.embeds.filter(embed => embed !== logEmbed), {
                    title: `Guild Log - ${formattedType}`,
                    description: "Failed to fetch logs.",
                    color: 0xB00020,
                    footer: {
                        text: `Response time: ${Date.now() - timestamp.getTime()}ms`,
                    },
                    timestamp: new Date().toISOString()
                }],
                components: interaction.message.components,
                attachments: interaction.message.attachments.map(attachment => ({
                    id: attachment.id,
                }))
            });
            return NextResponse.json(
                { success: false, error: "Failed to fetch logs." },
                { status: 400 }
            );
        }

        let logMessage: string | undefined;
        messages.forEach(message => {
            if (!message.author.bot) return;
            if (!message.flags) return;
            if (!(message.flags & MessageFlags.IsComponentsV2)) return;
            if (!message.components) return;
            if (message.components.length !== 1) return;
            if (message.components[0].type !== ComponentType.Container) return;

            if (!message.components[0].components) return;
            if (message.components[0].components.length !== 1) return;
            if (message.components[0].components[0].type !== ComponentType.TextDisplay) return;

            const content = message.components[0].components[0].content;
            if (content === "There are no logs to display.") {
                logMessage = content;
                return;
            }
            if (!content.split("\n")[1].includes('Guild Log')) return;
            if (!content.includes(username.replaceAll('_', '\\_'))) return;
            logMessage = content;
            return;
        });
        if (!logMessage) {
            await FollowupMessage(interaction.token, {
                content: interaction.message.content,
                // embeds: interaction.message.embeds.find(embed => embed.title === `Guild Log - ${formattedType}`) ? interaction.message.embeds.map(embed => {
                //     if (embed.title === `Guild Log - ${formattedType}`) {
                //         return {
                //             ...embed,
                //             description: "Failed to fetch log message.",
                //             color: 0xB00020,
                //             footer: {
                //                 text: `Response time: ${Date.now() - timestamp.getTime()}ms`,
                //             }
                //         };
                //     }
                //     return embed;
                // }) : [...interaction.message.embeds, {
                embeds: [...interaction.message.embeds.filter(embed => embed !== logEmbed), {
                    title: `Guild Log - ${formattedType}`,
                    description: "Failed to fetch log message.",
                    color: 0xB00020,
                    footer: {
                        text: `Response time: ${Date.now() - timestamp.getTime()}ms`,
                    },
                    timestamp: new Date().toISOString()
                }],
                components: interaction.message.components,
                attachments: interaction.message.attachments.map(attachment => ({
                    id: attachment.id,
                }))
            });
            return NextResponse.json(
                { success: false, error: "Failed to fetch logs." },
                { status: 400 }
            );
        }

        await FollowupMessage(interaction.token, {
            content: interaction.message.content,
            // embeds: interaction.message.embeds.find(embed => embed.title === `Guild Log - ${formattedType}`) ? interaction.message.embeds.map(embed => {
            //     if (embed.title === `Guild Log - ${formattedType}`) {
            //         return {
            //             ...embed,
            //             description: logMessage,
            //             color: IsleofDucks.colours.main,
            //             footer: {
            //                 text: `Response time: ${Date.now() - timestamp.getTime()}ms`,
            //             }
            //         };
            //     }
            //     return embed;
            // // }) : [...interaction.message.embeds.map(embed => {
            // //     return {
            // //         ...embed,
            // //         thumbnaill: embed.thumbnail && {
            // //             url: `attachment://${embed.thumbnail.url.split('/').pop()?.split('?')[0]}`
            // //         },
            // //         image: embed.image && {
            // //             url: `attachment://${embed.image.url.split('/').pop()?.split('?')[0]}`
            // //         }
            // //     }
            // // }), {
            // }) : [...interaction.message.embeds, {
            embeds: [...interaction.message.embeds.filter(embed => embed !== logEmbed), {
                title: `Guild Log - ${formattedType}`,
                description: logMessage,
                color: IsleofDucks.colours.main,
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
                        if (component.custom_id.split('-')[1] === "gexp" &&
                            component.custom_id.split('-')[2] === type) return {
                            ...component,
                            disabled: false
                        };
                        return component;
                    })
                };
            }),
            attachments: interaction.message.attachments.map(attachment => ({
                id: attachment.id,
            }))
        });
    } else if (buttonID === "invite") {
        const inviteEmbed = interaction.message.embeds.find(embed => embed.title === `Guild Invite - ${formattedType}`);

        await FollowupMessage(interaction.token, {
            content: interaction.message.content,
            embeds: [...interaction.message.embeds.filter(embed => embed !== inviteEmbed), {
                title: `Guild Invite - ${formattedType}`,
                description: "Sending invite command...",
                color: IsleofDucks.colours.main,
                footer: {
                    text: `Response time: ${Date.now() - timestamp.getTime()}ms`,
                },
                timestamp: new Date().toISOString()
            }],
            components: interaction.message.components,
            attachments: interaction.message.attachments.map(attachment => ({
                id: attachment.id,
            }))
        });

        let message: APIMessage | undefined;
        if (type === "duck") {
            message = await SendMessage(IsleofDucks.channels.duckoc, {
                content: `invite ${username}`
            });
        } else if (type === "duckling") {
            message = await SendMessage(IsleofDucks.channels.ducklingoc, {
                content: `invite ${username}`
            });
        }
        if (!message) await new Promise(resolve => setTimeout(resolve, 1000));
        if (!message) {
            await FollowupMessage(interaction.token, {
                content: interaction.message.content,
                embeds: [...interaction.message.embeds.filter(embed => embed !== inviteEmbed), {
                    title: `Guild Invite - ${formattedType}`,
                    description: "Failed to send the invite command.",
                    color: 0xB00020,
                    footer: {
                        text: `Response time: ${Date.now() - timestamp.getTime()}ms`,
                    },
                    timestamp: new Date().toISOString()
                }],
                components: interaction.message.components,
                attachments: interaction.message.attachments.map(attachment => ({
                    id: attachment.id,
                }))
            });
            return NextResponse.json(
                { success: false, error: "Failed to send the invite command." },
                { status: 400 }
            );
        }
        
        await FollowupMessage(interaction.token, {
            content: interaction.message.content,
            embeds: [...interaction.message.embeds.filter(embed => embed !== inviteEmbed), {
                title: `Guild Invite - ${formattedType}`,
                description: "Fetching invite confirmation...",
                color: IsleofDucks.colours.main,
                footer: {
                    text: `Response time: ${Date.now() - timestamp.getTime()}ms`,
                },
                timestamp: new Date().toISOString()
            }],
            components: interaction.message.components,
            attachments: interaction.message.attachments.map(attachment => ({
                id: attachment.id,
            }))
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
                embeds: [...interaction.message.embeds.filter(embed => embed !== inviteEmbed), {
                    title: `Guild Invite - ${formattedType}`,
                    description: "Failed to fetch invite confirmation.",
                    color: 0xB00020,
                    footer: {
                        text: `Response time: ${Date.now() - timestamp.getTime()}ms`,
                    },
                    timestamp: new Date().toISOString()
                }],
                components: interaction.message.components,
                attachments: interaction.message.attachments.map(attachment => ({
                    id: attachment.id,
                }))
            });
            return NextResponse.json(
                { success: false, error: "Failed to fetch invite confirmation." },
                { status: 400 }
            );
        }

        let logMessage: string | undefined;
        let disableButton = true;
        messages.forEach(message => {
            if (!message.author.bot) return;
            if (!message.flags) return;
            if (!(message.flags & MessageFlags.IsComponentsV2)) return;
            if (!message.components) return;
            if (message.components.length !== 1) return;
            if (message.components[0].type !== ComponentType.Container) return;

            if (!message.components[0].components) return;
            if (message.components[0].components.length !== 1) return;
            if (message.components[0].components[0].type !== ComponentType.TextDisplay) return;

            const content = message.components[0].components[0].content;
            if (content === "Your guild is full!") {
                logMessage = content;
                disableButton = false;
            }
            if (content === "You can't invite this player!") {
                logMessage = content;
                disableButton = false;
            }
            if (!content.includes(username)) return;
            if (content.includes("has been sent an offline invite!")) {
                disableButton = true;
            } else if (content.includes("has been invited!")) {
                disableButton = true;
            } else if (content.includes("Could not find a player by the name of")) {
                disableButton = true;
            } else if (content.includes("is already in another guild!")) {
                disableButton = false;
            } else return;
            logMessage = content;
            return;
        });
        if (!logMessage) {
            await FollowupMessage(interaction.token, {
                content: interaction.message.content,
                embeds: [...interaction.message.embeds.filter(embed => embed !== inviteEmbed), {
                    title: `Guild Invite - ${formattedType}`,
                    description: "Failed to fetch invite confirmation message.",
                    color: 0xB00020,
                    footer: {
                        text: `Response time: ${Date.now() - timestamp.getTime()}ms`,
                    },
                    timestamp: new Date().toISOString()
                }],
                components: interaction.message.components,
                attachments: interaction.message.attachments.map(attachment => ({
                    id: attachment.id,
                }))
            });
            return NextResponse.json(
                { success: false, error: "Failed to fetch invite confirmation message." },
                { status: 400 }
            );
        }

        await FollowupMessage(interaction.token, {
            content: interaction.message.content,
            // embeds: [...interaction.message.embeds.map(embed => {
            //     return {
            //         ...embed,
            //         thumbnaill: embed.thumbnail && {
            //             url: `attachment://${embed.thumbnail.url.split('/').pop()?.split('?')[0]}`
            //         },
            //         image: embed.image && {
            //             url: `attachment://${embed.image.url.split('/').pop()?.split('?')[0]}`
            //         }
            //     }
            // }), {
            embeds: [...interaction.message.embeds.filter(embed => embed !== inviteEmbed), {
                title: `Guild Invite - ${formattedType}`,
                description: logMessage,
                color: IsleofDucks.colours.main,
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
                        if (component.custom_id.split('-')[1] === "invite" &&
                            component.custom_id.split('-')[2] === type) return {
                            ...component,
                            disabled: disableButton
                        };
                        return component;
                    })
                };
            }),
            attachments: interaction.message.attachments.map(attachment => ({
                id: attachment.id,
            }))
        });
    } else if (buttonID === "gexp") {
        const gexpEmbed = interaction.message.embeds.find(embed => embed.title === `Lowest GEXP - ${formattedType}`);
    
        await FollowupMessage(interaction.token, {
            content: interaction.message.content,
            embeds: [...interaction.message.embeds.filter(embed => embed !== gexpEmbed), {
                title: `Lowest GEXP - ${formattedType}`,
                description: "Fetching users with the lowest GEXP...",
                color: IsleofDucks.colours.main,
                footer: {
                    text: `Response time: ${Date.now() - timestamp.getTime()}ms`,
                },
                timestamp: new Date().toISOString()
            }],
            components: interaction.message.components,
            attachments: interaction.message.attachments.map(attachment => ({
                id: attachment.id,
            }))
        });

        const guildResponse = await getGuildData(`Isle of ${formattedType}s`);
        if (!guildResponse.success) {
            await FollowupMessage(interaction.token, {
                content: interaction.message.content,
                embeds: [...interaction.message.embeds.filter(embed => embed !== gexpEmbed), {
                    title: `Lowest GEXP - ${formattedType}`,
                    description: guildResponse.message === "Key throttle" && typeof guildResponse.retry === "number" ? [
                        guildResponse.message,
                        `Try again <t:${Math.floor(( timestamp.getTime() + guildResponse.retry ) / 1000)}:R>`
                    ].join("\n") : guildResponse.message,
                    color: 0xB00020,
                    footer: {
                        text: `Response time: ${Date.now() - timestamp.getTime()}ms`,
                    },
                    timestamp: new Date().toISOString()
                }],
                components: interaction.message.components,
                attachments: interaction.message.attachments.map(attachment => ({
                    id: attachment.id,
                }))
            });
            return NextResponse.json(
                { success: false, error: "Failed to fetch guild data." },
                { status: 400 }
            );
        }
        
        const immunePlayers = await getImmunePlayers();
        const immunePlayerIDs = immunePlayers?.players.map(player => player.uuid);
        if (immunePlayers?.success === false) {
            await FollowupMessage(interaction.token, {
                content: interaction.message.content,
                embeds: [...interaction.message.embeds.filter(embed => embed !== gexpEmbed), {
                    title: `Lowest GEXP - ${formattedType}`,
                    description: "Failed to fetch the immune players",
                    color: 0xB00020,
                    footer: {
                        text: `Response time: ${Date.now() - timestamp.getTime()}ms`,
                    },
                    timestamp: new Date().toISOString()
                }],
                components: interaction.message.components,
                attachments: interaction.message.attachments.map(attachment => ({
                    id: attachment.id,
                }))
            });
            return NextResponse.json(
                { success: false, error: "Failed to fetch the immune players" },
                { status: 400 }
            );
        }

        const weekAgo = Date.now() - 1000 * 60 * 60 * 24 * 7;

        const result = await Promise.all(guildResponse.guild.members.map(async (member) => {
            const mojang = await getUsernameOrUUID(member.uuid);
            if (!mojang.success) throw new Error(mojang.message);
            const gexp = Object.values(member.expHistory).reduce((a, b) => ( a ?? 0 ) + ( b ?? 0 ), 0) ?? 0;
            const isNew = member.joined > weekAgo;
            return {
                uuid: member.uuid,
                name: mojang.name,
                gexp: gexp,
                isNew: isNew
            };
        })).catch((err) => {
            console.log(err.message);
            return {
                success: false,
                message: err.message
            };
        });

        if ("success" in result) {
            await FollowupMessage(interaction.token, {
                content: interaction.message.content,
                embeds: [...interaction.message.embeds.filter(embed => embed !== gexpEmbed), {
                    title: `Lowest GEXP - ${formattedType}`,
                    description: result.message,
                    color: 0xB00020,
                    footer: {
                        text: `Response time: ${Date.now() - timestamp.getTime()}ms`,
                    },
                    timestamp: new Date().toISOString()
                }],
                components: interaction.message.components,
                attachments: interaction.message.attachments.map(attachment => ({
                    id: attachment.id,
                }))
            });
            return NextResponse.json(
                { success: false, error: result.message },
                { status: 400 }
            );
        }

        const lowestGEXP = result.sort((a, b) => a.gexp - b.gexp).filter(member => !immunePlayerIDs?.includes(member.uuid) && !member.isNew).slice(0, 5);
        const sortedDesc = result.sort((a, b) => b.gexp - a.gexp);

        await FollowupMessage(interaction.token, {
            content: interaction.message.content,
            embeds: [...interaction.message.embeds.filter(embed => embed !== gexpEmbed), {
                title: `Lowest GEXP - ${formattedType} (${result.length})`,
                description: lowestGEXP.map(member => `**#${sortedDesc.indexOf(member) + 1}** ${member.name.replaceAll('_', '\\_')}: ${member.gexp}`).join("\n"),
                color: IsleofDucks.colours.main,
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
                        if (component.custom_id.split('-')[1] === "gexp" &&
                            component.custom_id.split('-')[2] === type) return {
                            ...component,
                            disabled: true
                        };
                        return component;
                    })
                };
            }),
            attachments: interaction.message.attachments.map(attachment => ({
                id: attachment.id,
            }))
        });
    }

    return NextResponse.json(
        { success: true },
        { status: 200 }
    );
}
