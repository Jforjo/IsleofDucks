import { InteractionResponseType } from "discord-interactions";
import { EditChannel, IsleofDucks } from "../../utils/discordUtils.js";

export default async (req, res) => {
    const interaction = req.body;
    const ticketOwner = interaction.custom_id.split('_data_')[1];
    const permToClose = false;
    
    interaction.member.roles.forEach(role => {
        if (role.id === IsleofDucks.roles.admin) permToClose = true;
        else if (role.id === IsleofDucks.roles.mod_duck) permToClose = true;
        else if (role.id === IsleofDucks.roles.mod_duckling) permToClose = true;
        else if (role.id === IsleofDucks.roles.service_management) permToClose = true;
    });

    if (ticketOwner === interaction.member.user.id) permToClose = true;

    if (!permToClose) {
        return res.status(200).send({
            type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
            data: {
                content: "You cannot close this ticket!",
                flags: 1 << 6
            }
        });
    }

    if (ticketOwner === interaction.member.user.id) {
        return res.status(200).send({
            type: InteractionResponseType.MODAL,
            data: {
                title: "Care to give us your feedback?",
                custom_id: "close_ticket_feedback_modal",
                components: [
                    {
                        type: MessageComponentTypes.ACTION_ROW,
                        components: [
                            {
                                type: MessageComponentTypes.INPUT_TEXT,
                                custom_id: "feedback",
                                label: "Feedback",
                                style: 2,
                                min_length: 1,
                                max_length: 2000,
                                placeholder: "Leave blank if you do not wish to give us any feedback.",
                                required: false
                            }
                        ]
                    }
                ]
            },
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
        ]
    });

    return res.status(200).send({
        type: InteractionResponseType.UPDATE_MESSAGE,
        data: {
            content: interaction.message?.content,
            embeds: interaction.message?.embeds,
            components: null,
            attachments: interaction.message?.attachments,
            flags: interaction.message?.flags
        },
    });
}

