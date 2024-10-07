import { InteractionResponseType } from "discord-interactions";
import { EditChannel, SendMessage, ToPermissions } from "../../utils/discordUtils.js";

export default async (req, res) => {
    const interaction = req.body;

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

    await SendMessage(interaction.channel_id, {
        content: null,
        embeds: [{
            title: "Feedback",
            description: interaction.data.components[0].components[0].value
        }]
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

