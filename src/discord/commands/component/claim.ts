import { ConvertSnowflakeToDate, CreateInteractionResponse, EditChannel, FollowupMessage, IsleofDucks, SendMessage, ToPermissions } from "@/discord/discordUtils";
import { APIInteractionResponse, APIMessageComponentButtonInteraction, ComponentType, InteractionResponseType, MessageFlags, OverwriteType } from "discord-api-types/v10";
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
    // const timestamp = ConvertSnowflakeToDate(interaction.id);

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
    const ticketOwnerID = interaction.data.custom_id.split('-')[2];

    if (interaction.member.user.id === ticketOwnerID && !interaction.member.roles.includes(IsleofDucks.roles.service_management)) {
        await CreateInteractionResponse(interaction.id, interaction.token, {
            type: InteractionResponseType.ChannelMessageWithSource,
            data: {
                content: `You cannot claim your own ${ticketID} ticket!`,
                flags: MessageFlags.Ephemeral
            }
        });
        return NextResponse.json(
            { success: false, error: `You cannot claim your own ${ticketID} ticket` },
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
            if (button.type !== ComponentType.Button) return;
            if (!("custom_id" in button)) return;
            if (button.custom_id.includes('claim-')) button.disabled = true;
        });
    });
    await FollowupMessage(interaction.token, {
        components: components
    });

    await EditChannel(interaction.channel.id, {
        permission_overwrites: [
            {
                id: interaction.guild.id,
                type: OverwriteType.Role,
                allow: null,
                deny: ToPermissions({
                    view_channel: true,
                    send_messages: true
                })
            },
            {
                id: IsleofDucks.roles.service_management,
                type: OverwriteType.Role,
                allow: ToPermissions({
                    view_channel: true,
                    send_messages: true,
                    use_application_commands: true,
                }),
                deny: null
            },
            {
                id: ticketOwnerID,
                type: OverwriteType.Member,
                allow: ToPermissions({
                    view_channel: true,
                    send_messages: true
                }),
                deny: null
            },
            {
                id: interaction.member.user.id,
                type: OverwriteType.Member,
                allow: ToPermissions({
                    view_channel: true,
                    send_messages: true
                }),
                deny: null
            },
        ]
    });

    await SendMessage(interaction.channel.id, {
        content: `<@${ticketOwnerID}>, your ${ticketID} ticket has been claimed by <@${interaction.member.user.id}>.`,
    });

    // Replace the close button with a feedback button
    // components.forEach(row => {
    //     if (row.type !== ComponentType.ActionRow) return;
    //     row.components.forEach(button => {
    //         if (button.type !== ComponentType.Button) return;
    //         if (!("custom_id" in button)) return;
    //         if (button.custom_id.includes('close-')) button.custom_id = button.custom_id.replace('close-', 'feedback-');
    //     });
    // });
    // await FollowupMessage(interaction.token, {
    //     components: components
    // });

    return NextResponse.json(
        { success: true },
        { status: 200 }
    );
}
