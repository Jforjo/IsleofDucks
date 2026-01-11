import { CloseTicketPermissions, ConvertSnowflakeToDate, CreateInteractionResponse, DeleteChannel, EditChannel, FollowupMessage, SendMessage, ToPermissions } from "@/discord/discordUtils";
import { APIInteractionResponse, APIMessageComponentButtonInteraction, ButtonStyle, ComponentType, InteractionResponseType, MessageFlags } from "discord-api-types/v10";
import { NextResponse } from "next/server";
import { CreateTranscript } from "./transcript";

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
    const timestamp = ConvertSnowflakeToDate(interaction.id);

    if (!interaction.guild) {
        await CreateInteractionResponse(interaction.id, interaction.token, {
            type: InteractionResponseType.ChannelMessageWithSource,
            data: {
                content: "This command can only be used in a server!",
                flags: MessageFlags.Ephemeral
            }
        });
        return NextResponse.json(
            { success: false, error: "This command can only be used in a server" },
            { status: 400 }
        );
    }
    // If guild exists then so should member, but imma still check it
    if (!interaction.member) {
        await CreateInteractionResponse(interaction.id, interaction.token, {
            type: InteractionResponseType.ChannelMessageWithSource,
            data: {
                content: "Could not find who ran the command!",
                flags: MessageFlags.Ephemeral
            }
        });
        return NextResponse.json(
            { success: false, error: "Could not find who ran the command" },
            { status: 400 }
        );
    }

    const ticketID = interaction.data.custom_id.split('-')[1];
    if (!Object.keys(CloseTicketPermissions).includes(ticketID)) {
        await CreateInteractionResponse(interaction.id, interaction.token, {
            type: InteractionResponseType.ChannelMessageWithSource,
            data: {
                content: "Invalid ticket type!",
                flags: MessageFlags.Ephemeral
            }
        });
        return NextResponse.json(
            { success: false, error: "Invalid ticket type" },
            { status: 400 }
        );
    }
    const canClose = CloseTicketPermissions[ticketID as keyof typeof CloseTicketPermissions];
    const userRoles = new Set(interaction.member.roles);
    const ticketOwnerID = interaction.data.custom_id.split('-')[2];
    const autoCloseTicket = interaction.data.custom_id.split('-')[3] === "auto";

    // Typescript complains at the intersection
    // const hasRoles = userRoles.intersection(canClose).size > 0;
    let hasRoles = false;
    userRoles.forEach(role => {
        if (canClose.has(role)) {
            hasRoles = true;
            return;
        }
    })

    if (!hasRoles && interaction.member.user.id !== ticketOwnerID) {
        await CreateInteractionResponse(interaction.id, interaction.token, {
            type: InteractionResponseType.ChannelMessageWithSource,
            data: {
                content: "You do not have permission to close this ticket!",
                flags: MessageFlags.Ephemeral
            }
        });
        return NextResponse.json(
            { success: false, error: "You do not have permission to close this ticket" },
            { status: 403 }
        )
    }
    
    const components = interaction.message.components;
    if (!components) {
        await CreateInteractionResponse(interaction.id, interaction.token, {
            type: InteractionResponseType.ChannelMessageWithSource,
            data: {
                content: "Could not find the original message!",
                flags: MessageFlags.Ephemeral
            }
        });
        return NextResponse.json(
            { success: false, error: "Could not find the original message" },
            { status: 400 }
        );
    }
    
    // ACK response and update the original message
    await CreateInteractionResponse(interaction.id, interaction.token, {
        type: InteractionResponseType.DeferredMessageUpdate,
    });
    
    // Disable all buttons while it loads, since people could spam it
    components.forEach(row => {
        if (row.type !== ComponentType.ActionRow) return;
        row.components.forEach(button => {
            // if (button.type !== ComponentType.Button) return;
            // if (!("custom_id" in button)) return;
            // if (button.custom_id.includes('close-')) button.disabled = true;
            // Disable everything
            button.disabled = true;
        });
    });
    await FollowupMessage(interaction.token, {
        components: components
    });

    await EditChannel(interaction.channel.id, {
        permission_overwrites: [
            {
                id: interaction.guild.id,
                type: 0,
                allow: null,
                deny: ToPermissions({
                    view_channel: true,
                    send_messages: true
                })
            },
        ]
    });

    if (autoCloseTicket) {
        await SendMessage(interaction.channel.id, {
            embeds: [
                {
                    title: "Closed Ticket",
                    fields: [
                        {
                            name: "Closed by:",
                            value: [
                                `<@${interaction.member.user.id}>`,
                                `Discord ID: ${interaction.member.user.id}`,
                                `Username: ${interaction.member.user.username}`,
                                `Nickname: ${interaction.member.nick ?? ""}`,
                            ].join("\n"),
                        }
                    ],
                    color: 0xFB9B00,
                    footer: {
                        text: `Response time: ${Date.now() - timestamp.getTime()}ms`,
                    },
                    timestamp: new Date().toISOString()
                }
            ],
        });
        const transcript = await CreateTranscript(interaction.channel.id, interaction.channel.name, interaction.member.user.id, ticketID, ticketOwnerID);
        if (!transcript.success) {
            await FollowupMessage(interaction.token, {
                content: transcript.message
            });
            return NextResponse.json(
                { success: false, error: transcript.message },
                { status: 400 }
            );
        }
        await DeleteChannel(interaction.channel.id);
    } else {
        await SendMessage(interaction.channel.id, {
            embeds: [
                {
                    title: "Closed Ticket",
                    fields: [
                        {
                            name: "Closed by:",
                            value: [
                                `<@${interaction.member.user.id}>`,
                                `Discord ID: ${interaction.member.user.id}`,
                                `Username: ${interaction.member.user.username}`,
                                `Nickname: ${interaction.member.nick ?? ""}`,
                            ].join("\n"),
                        }
                    ],
                    color: 0xFB9B00,
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
                            custom_id: `transcript-${ticketID}-${interaction.message.id}-${ticketOwnerID}`,
                            type: ComponentType.Button,
                            label: "Save Transcript",
                            style: ButtonStyle.Primary,
                        },
                        {
                            custom_id: `delete-${ticketID}`,
                            type: ComponentType.Button,
                            label: "Delete Ticket",
                            style: ButtonStyle.Danger,
                        }
                    ]
                }
            ]
        });
    }

    return NextResponse.json(
        { success: true },
        { status: 200 }
    );
}
