import { InteractionResponseType, MessageComponentTypes, ButtonStyleTypes } from "discord-interactions";
import { decodeCarrierData, IsleofDucks, CreateChannel, SendMessage, ToPermissions } from "../../utils/discordUtils.js";

export default async (req, res) => {
    const interaction = req.body;
    const user = interaction.member.user;

    const username = interaction.data.components[0].components[0].value;
    const timezone = interaction.data.components[1].components[0].value;
    const details = interaction.data.components[2].components[0].value;

    const channelPermissions = [
        {
            id: interaction.guild_id,
            type: 0,
            allow: null,
            deny: ToPermissions({
                view_channel: true
            })
        },
        {
            id: user.id,
            type: 1,
            allow: ToPermissions({
                view_channel: true,
                send_messages: true
            }),
            deny: null
        },
        {
            id: IsleofDucks.roles.staff,
            type: 0,
            allow: ToPermissions({
                view_channel: true
            }),
            deny: ToPermissions({
                send_messages: true
            })
        },
        {
            id: IsleofDucks.roles.service_management,
            type: 0,
            allow: ToPermissions({
                view_channel: true,
                send_messages: true
            }),
            deny: null
        }
    ];
    
    const channel = await CreateChannel(process.env.GUILD_ID, {
        type: 0,
        name: `carrier-${interaction.member.nick ?? user.username}`,
        topic: `Carry application for ${user.username} - ${user.id}`,
        parent_id: IsleofDucks.channelGroups.tickets,
        permission_overwrites: channelPermissions
    });

    if (channel == null && channel?.id == null) {
        return res.status(200).send({
            type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
            data: {
                content: "Failed to create the carry ticket.",
                flags: 1 << 6
            },
        });
    }
    // Sends a message in the newly created channel
    await SendMessage(channel.id, {
        content: `<@${user.id}> requested help from <&${IsleofDucks.roles.service_management}>`,
        embeds: [
            {
                title: "Carrier Application",
                description: `Hello, <@${user.id}>! 👋`,
                color: parseInt("FB9B00", 16),
                fields: [
                    {
                        name: "Username",
                        value: `\`\`\`${username}\`\`\``,
                    },
                    {
                        name: "Timezone",
                        value: `\`\`\`${timezone}\`\`\``,
                    },
                    {
                        name: "Roles",
                        value: `\`\`\`${details}\`\`\``,
                    },
                ],
            },
            {
                title: "Provide Screenshot Proof",
                description: `* Must be fullscreen, **not** cropped\n* Must show you meeting the requirements of the role(s) found in <#${IsleofDucks.channels.carrierapps}>`,
                color: parseInt("FB9B00", 16),
            },
        ],
        components: [
            {
                type: MessageComponentTypes.ACTION_ROW,
                components: [
                    {
                        type: MessageComponentTypes.BUTTON,
                        label: "Close",
                        style: ButtonStyleTypes.DANGER,
                        custom_id: `close_carrierapp_ticket_data_${user.id}`,
                        emoji: {
                            name: "🔒",
                            id: null
                        }
                    }
                ]
            }
        ],
    });

    return res.status(200).send({
        type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
        data: {
            content: `Carry ticket created: <#${channel.id}>`,
            flags: 1 << 6
        },
    });
}

