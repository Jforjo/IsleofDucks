import { ConvertSnowflakeToDate, CreateInteractionResponse, CreateThread, EditChannel, ExecuteWebhook, FollowupMessage, GetMessagesAfterGenerator, IsleofDucks } from "@/discord/discordUtils";
import { APIInteractionResponse, APIMessageComponentButtonInteraction, CDNRoutes, ComponentType, ImageFormat, InteractionResponseType, RouteBases } from "discord-api-types/v10";
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

    if (!interaction.member.roles.includes(IsleofDucks.roles.admin)) {
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

    const ticketID = interaction.data.custom_id.split('-')[1];
    const firstMessageID = interaction.data.custom_id.split('-')[2];
    const ticketOwnerID = interaction.data.custom_id.split('-')[3];

    const thread = await CreateThread(IsleofDucks.channels.transcriptForum, {
        name: interaction.channel.name ?? "Transcript",
        auto_archive_duration: 60,
        applied_tags: IsleofDucks.transcriptForum.tags.filter(tag => tag.name === ticketID).map(tag => tag.id),
        message: {
            embeds: [
                {
                    title: interaction.channel.name ?? "Transcript",
                    fields: [
                        {
                            name: "Opened by:",
                            value: `<@${ticketOwnerID}>`,
                            inline: true
                        },
                        {
                            name: "Closed by:",
                            value: `<@${interaction.member.user.id}>`,
                            inline: true
                        }
                    ],
                    color: 0xFB9B00,
                }
            ]
        }
    });

    if (!thread) {
        await FollowupMessage(interaction.token, {
            content: "Failed to create transcript thread!"
        });
        return NextResponse.json(
            { success: false, error: "Failed to create transcript thread" },
            { status: 400 }
        )
    }

    // console.log(JSON.stringify(thread));
    // if (!thread.id) return NextResponse.json(
    //     { success: true },
    //     { status: 200 }
    // )

    for await (const message of GetMessagesAfterGenerator(interaction.channel.id, firstMessageID)) {
        if (!message) continue;
        const avatarURL = message.author.avatar ? RouteBases.cdn + CDNRoutes.userAvatar(message.author.id, message.author.avatar, ImageFormat.PNG ) : undefined;
        await ExecuteWebhook({
            thread_id: thread.id,
        }, {
            username: message.author.username,
            avatar_url: avatarURL,
            content: message.content,
            embeds: message.embeds,
            attachments: message.attachments,
            poll: message.poll,
        }, message.attachments.map(attachment => ({
            id: parseInt(attachment.id),
            url: attachment.url,
            filename: attachment.filename
        })));
        console.log(JSON.stringify(message.attachments));
    }
    
    await EditChannel(thread.id, {
        locked: true,
        archived: true
    });
    
    components.forEach(row => {
        if (row.type !== ComponentType.ActionRow) return;
        row.components.forEach(button => {
            // Enable everything but the transcript button
            if (!("custom_id" in button && button.custom_id === interaction.data.custom_id)) button.disabled = false;
        });
    });

    await FollowupMessage(interaction.token, {
        embeds: [
            ...interaction.message.embeds,
            {
                title: "Transcript saved!",
                color: 0xFB9B00,
                footer: {
                    text: `Response time: ${Date.now() - timestamp.getTime()}ms`,
                },
                timestamp: new Date().toISOString()
            }
        ],
        components: components
    });

    return NextResponse.json(
        { success: true },
        { status: 200 }
    );
}
