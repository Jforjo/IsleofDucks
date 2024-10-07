import { InteractionResponseType, MessageComponentTypes, ButtonStyleTypes } from "discord-interactions";
import { CreateChannel, SendMessage, ToPermissions } from "../../utils";
import { decodeCarrierData, IsleofDucks } from "../../utils/discordUtils";

export default async (req, res) => {
    const interaction = req.body;
    const encodedCarrierData = interaction.data.custom_id.split('_data_')[1];
    const carryData = decodeCarrierData(encodedCarrierData);
    const user = interaction.member.user;

    const username = interaction.data.components[0].components[0].value;
    const carries = interaction.data.components[1].components[0].value;
    const timezone = interaction.data.components[2].components[0].value;
    const notes = interaction.data.components[3].components[0].value === "" ? null : interaction.data.components[3].components[0].value;

    const channelPermissions = [
        {
            id: interaction.guild.id,
            type: 0,
            allow: null,
            deny: ToPermissions({
                view_channel: true
            })
        },
        {
            id: IsleofDucks.roles.verified,
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
                view_channel: true
            }),
            deny: ToPermissions({
                send_messages: true
            })
        }
    ];
    const carrierIDs = [];

    for (const [key, value] of Object.entries(carryData)) {
        if (value && value.value === true) {
            channelPermissions.push({
                id: value.role,
                type: 0,
                allow: ToPermissions({
                    view_channel: true
                }),
                deny: ToPermissions({
                    send_messages: true
                })
            });
            carrierIDs.push(`<@&${value.role}>`);
        }
    }
    
    const channel = await CreateChannel(process.env.GUILD_ID, {
        type: 0,
        name: `carry-${interaction.member.nick ?? user.username}`,
        topic: `Carry ticket for ${user.username} - ${user.id}`,
        parent_id: IsleofDucks.channelGroups.carrytickets,
        nsfw: false,
        permission_overwrites: channelPermissions
    });

    if (channel == null && channel?.id == null) {
        return res.status(200).send({
            type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
            data: {
                content: "Failed to create the apply ticket.",
                flags: 1 << 6
            },
        });
    }
    // Sends a message in the newly created channel
    await SendMessage(channel.id, {
        content: `<@${user.id}> has requested help from ${carrierIDs.join(', ')}`,
        embeds: [
            {
                title: "Carry Request",
                description: `Hello, <@${user.id}>! 👋`,
                color: parseInt("FB9B00", 16),
                fields: [
                    {
                        name: "Username",
                        value: `\`\`\`${username}\`\`\``,
                    },
                    {
                        name: "Number of Carries",
                        value: `\`\`\`${carries}\`\`\``,
                    },
                    {
                        name: "Timezone",
                        value: `\`\`\`${timezone}\`\`\``,
                    },
                    {
                        name: "Extra Information",
                        value: `\`\`\`${notes ?? " "}\`\`\``,
                    },
                ],
                components: [
                    {
                        type: MessageComponentTypes.ACTION_ROW,
                        components: [
                            {
                                type: MessageComponentTypes.BUTTON,
                                label: "Accept",
                                style: ButtonStyleTypes.SUCCESS,
                                custom_id: `accept_carry_data_${user.id}`,
                                emoji: {
                                    name: "✅",
                                    id: null
                                }
                            },
                            {
                                type: MessageComponentTypes.BUTTON,
                                label: "Close",
                                style: ButtonStyleTypes.DANGER,
                                custom_id: "close_ticket",
                                emoji: {
                                    name: "🔒",
                                    id: null
                                }
                            }
                        ]
                    }
                ],
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

