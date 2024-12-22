import { CloseTicketPermissions, ConvertSnowflakeToDate, CreateInteractionResponse, EditChannel, FollowupMessage, SendMessage, ToPermissions } from "@/discord/discordUtils";
import { APIInteractionResponse, APIMessageComponentButtonInteraction, ComponentType, InteractionResponseType } from "discord-api-types/v10";
import { NextResponse } from "next/server";

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
    // ACK response and update the original message
    await CreateInteractionResponse(interaction.id, interaction.token, {
        type: InteractionResponseType.DeferredMessageUpdate,
    });
    
    const timestamp = ConvertSnowflakeToDate(interaction.id);

    if (!interaction.guild) {
        await FollowupMessage(interaction.token, {
            content: "This command can only be used in a server!"
        });
        return NextResponse.json(
            { success: false, error: "This command can only be used in a server" },
            { status: 400 }
        );
    }
    // If guild exists then so should member, but imma still check it
    if (!interaction.member) {
        await FollowupMessage(interaction.token, {
            content: "Could not find who ran the command!"
        });
        return NextResponse.json(
            { success: false, error: "Could not find who ran the command" },
            { status: 400 }
        );
    }

    const ticketID = interaction.data.custom_id.split('-')[1];
    if (!Object.keys(CloseTicketPermissions).includes(ticketID)) {
        await FollowupMessage(interaction.token, {
            content: "Invalid ticket type!"
        });
        return NextResponse.json(
            { success: false, error: "Invalid ticket type" },
            { status: 400 }
        );
    }
    const canClose = CloseTicketPermissions[ticketID as keyof typeof CloseTicketPermissions];
    const userRoles = new Set(interaction.member.roles);
    const ticketOwnerID = interaction.data.custom_id.split('-')[2];

    if (userRoles.intersection(canClose).size === 0 && interaction.member.user.id !== ticketOwnerID) {
        await FollowupMessage(interaction.token, {
            content: "You do not have permission to close this ticket!"
        });
        return NextResponse.json(
            { success: false, error: "You do not have permission to close this ticket" },
            { status: 403 }
        )
    }
    
    const components = interaction.message.components;
    if (!components) {
        await FollowupMessage(interaction.token, {
            content: "Could not find the original message!",
        });
        return NextResponse.json(
            { success: false, error: "Could not find the original message" },
            { status: 400 }
        );
    }
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
        ]
    });

    return NextResponse.json(
        { success: true },
        { status: 200 }
    );
}
