import { ConvertSnowflakeToDate, CreateInteractionResponse, CreateThread, EditChannel, ExecuteWebhook, FollowupMessage, GetAllChannelMessages, IsleofDucks } from "@/discord/discordUtils";
import { APIChannel, APIInteractionResponse, APIMessageComponentButtonInteraction, CDNRoutes, ComponentType, ImageFormat, InteractionResponseType, RouteBases, Snowflake } from "discord-api-types/v10";
import { NextResponse } from "next/server";

export async function CreateTranscript(
    channelID: Snowflake,
    channelName: string | null | undefined,
    memberID: Snowflake,
    ticketID: string,
    ticketOwnerID: string
): Promise<
    {
        success: false;
        message: string;
    } | {
        success: true;
    }
> {
    const thread = await CreateThread(IsleofDucks.channels.transcriptForum, {
        name: channelName ?? "Transcript",
        auto_archive_duration: 60,
        applied_tags: IsleofDucks.transcriptForum.tags.filter(tag => tag.name === ticketID).map(tag => tag.id),
        message: {
            embeds: [
                {
                    title: channelName ?? "Transcript",
                    fields: [
                        {
                            name: "Opened by:",
                            value: `<@${ticketOwnerID}>`,
                            inline: true
                        },
                        {
                            name: "Transcript saved by:",
                            value: `<@${memberID}>`,
                            inline: true
                        }
                    ],
                    color: 0xFB9B00,
                }
            ]
        }
    });

    if (!thread) {
        return {
            success: false,
            message: "Failed to create transcript thread"
        }
    }

    // console.log(JSON.stringify(thread));
    // if (!thread.id) return NextResponse.json(
    //     { success: true },
    //     { status: 200 }
    // )

    for (const message of (await GetAllChannelMessages(channelID)).sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())) {
    // for await (const message of GetMessagesAfterGenerator(channelID, firstMessageID)) {
        if (!message) continue;
        const avatarURL = message.author.avatar ? RouteBases.cdn + CDNRoutes.userAvatar(message.author.id, message.author.avatar, ImageFormat.PNG ) : undefined;
        const attachments = message.attachments.map((attachment, index) => {
            attachment.id = index.toString();
            return attachment;
        });
        await ExecuteWebhook({
            thread_id: thread.id,
        }, {
            username: message.author.username,
            avatar_url: avatarURL,
            content: message.content,
            embeds: message.embeds,
            attachments: attachments,
            poll: message.poll,
        }, attachments.map(attachment => ({
            id: attachment.id,
            url: attachment.url,
            filename: attachment.filename
        })));
    }
    
    await EditChannel(thread.id, {
        locked: true,
        archived: true
    });

    return {
        success: true
    }
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
    // const firstMessageID = interaction.data.custom_id.split('-')[2];
    const ticketOwnerID = interaction.data.custom_id.split('-')[3];

    const result = await CreateTranscript(interaction.channel.id, interaction.channel.name, interaction.member.user.id, ticketID, ticketOwnerID);
    if (!result.success) {
        await FollowupMessage(interaction.token, {
            content: result.message
        });
        return NextResponse.json(
            { success: false, error: result.message },
            { status: 400 }
        );
    }

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
