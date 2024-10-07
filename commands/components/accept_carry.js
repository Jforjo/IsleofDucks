import { InteractionResponseType } from "discord-interactions";
import { EditChannel } from "../../utils/discordUtils";

export default async (req, res) => {
    const interaction = req.body;
    const carriedID = interaction.custom_id.split('_data_')[1];

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
                id: interaction.guild.id,
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
                            custom_id: `close_ticket_feedback_data_${carriedID}`,
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

