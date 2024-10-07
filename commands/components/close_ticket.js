import { InteractionResponseType } from "discord-interactions";
import { EditChannel, IsleofDucks, ToPermissions } from "../../utils/discordUtils.js";

export default async (req, res) => {
    const interaction = req.body;
    const ticketOwner = interaction.data.custom_id.split('_data_')[1];
    const permToClose = false;
    
    if (ticketOwner == interaction.member.user.id) return await closeTicket(res, interaction);

    interaction.member.roles.forEach(role => {
        if (role.id == IsleofDucks.roles.admin) permToClose = true;
        else if (role.id == IsleofDucks.roles.mod_duck) permToClose = true;
        else if (role.id == IsleofDucks.roles.mod_duckling) permToClose = true;
        else if (role.id == IsleofDucks.roles.service_management) permToClose = true;
    });

    if (!permToClose) return await closeTicket(res, interaction);

    return res.status(200).send({
        type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
        data: {
            content: "You cannot close this ticket!",
            flags: 1 << 6
        }
    });
}

async function closeTicket(res, interaction) {
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