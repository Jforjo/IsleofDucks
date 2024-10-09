import { InteractionResponseType, MessageComponentTypes, ButtonStyleTypes } from "discord-interactions";
import { EditChannel, ToPermissions } from "../../utils/discordUtils.js";

export default async (req, res) => {
    const interaction = req.body;
    const carriedID = interaction.data.custom_id.split('_data_')[1];

    if (carriedID === interaction.member.user.id) {
        return res.status(200).send({
            type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
            data: {
                content: "You cannot accept your own ticket!",
                flags: 1 << 6
            }
        });
    }

    await EditChannel(interaction.channel_id, {
        permission_overwrites: [
            {
                id: interaction.guild_id,
                type: 0,
                allow: null,
                deny: ToPermissions({
                    view_channel: true,
                    send_messages: true
                })
            },
            {
                id: carriedID,
                type: 1,
                allow: ToPermissions({
                    view_channel: true,
                    send_messages: true
                }),
                deny: null
            },
            {
                id: interaction.member.user.id,
                type: 1,
                allow: ToPermissions({
                    view_channel: true,
                    send_messages: true
                }),
                deny: null
            }
        ]
    });

    await SendMessage(interaction.channel_id, {
        content: `<@${carriedID}>, your ticket has been accepted by ${interaction.member.nick ?? interaction.member.user.username}!`,
    });

    return res.status(200).send({
        type: InteractionResponseType.UPDATE_MESSAGE,
        data: {
            content: interaction.message?.content,
            embeds: interaction.message?.embeds,
            components: [
                {
                    type: MessageComponentTypes.ACTION_ROW,
                    components: [
                        {
                            type: MessageComponentTypes.BUTTON,
                            label: "Close",
                            style: ButtonStyleTypes.DANGER,
                            custom_id: `close_carry_ticket_feedback_data_${carriedID}`,
                            emoji: {
                                name: "🔒",
                                id: null
                            }
                        }
                    ]
                }
            ],
            attachments: interaction.message?.attachments,
            flags: interaction.message?.flags
        },
    });
}

