import { ApplicationCommandType, ApplicationCommandOptionType } from "discord-api-types/v10";
import { InteractionResponseType } from "discord-interactions";
import { CreateInteractionResponse, ConvertSnowflakeToDate, FollowupMessage } from "../../utils/discordUtils.js";
import { getImmunePlayers, isImmunePlayer, addImmunePlayer, removeImmunePlayer } from "../../utils/utils.js";
import { getUUID } from "../../utils/hypixelUtils.js";

async function addImmune(interaction, name, reason) {
    const timestamp = ConvertSnowflakeToDate(interaction.id);
    // User sees the "[bot] is thinking..." message
    await CreateInteractionResponse(interaction.id, interaction.token, {
        type: InteractionResponseType.DEFERRED_CHANNEL_MESSAGE_WITH_SOURCE,
        data: { flags: 1 << 6 }
    });

    const user = interaction.member.user;
    if (user.id != IsleofDucks.staticIDs.Jforjo && user.id != IsleofDucks.staticIDs.Ducksicle) {
        return await FollowupMessage(interaction.token, {
            content: "You can't use this command!"
        });
    }

    const mojang = await getUUID(name);
    if (!mojang.success) {
        return await FollowupMessage(interaction.token, {
            content: null,
            embeds: [
                {
                    title: "Something went wrong!",
                    description: mojang.message,
                    color: parseInt("B00020", 16),
                    footer: {
                        text: `Response time: ${Date.now() - timestamp.getTime()}ms`,
                    },
                    timestamp: new Date().toISOString()
                }
            ]
        });
    }
    const uuid = mojang.uuid;

    const immune = await isImmunePlayer(uuid);
    if (immune) {
        return await FollowupMessage(interaction.token, {
            content: null,
            embeds: [
                {
                    title: "That player is already immune!",
                    color: parseInt("FB9B00", 16),
                    footer: {
                        text: `Response time: ${Date.now() - timestamp.getTime()}ms`,
                    },
                    timestamp: new Date().toISOString()
                }
            ]
        });
    }

    await addImmunePlayer(uuid, null, reason);

    return await FollowupMessage(interaction.token, {
        content: null,
        embeds: [
            {
                title: "Player added to the immune list!",
                color: parseInt("FB9B00", 16),
                footer: {
                    text: `Response time: ${Date.now() - timestamp.getTime()}ms`,
                },
                timestamp: new Date().toISOString()
            }
        ]
    });
}

async function removeImmune(interaction, name) {
    const timestamp = ConvertSnowflakeToDate(interaction.id);
    // User sees the "[bot] is thinking..." message
    await CreateInteractionResponse(interaction.id, interaction.token, {
        type: InteractionResponseType.DEFERRED_CHANNEL_MESSAGE_WITH_SOURCE,
        data: { flags: 1 << 6 }
    });

    const user = interaction.member.user;
    if (user.id != IsleofDucks.staticIDs.Jforjo && user.id != IsleofDucks.staticIDs.Ducksicle) {
        return await FollowupMessage(interaction.token, {
            content: "You can't use this command!"
        });
    }

    const mojang = await getUUID(name);
    if (!mojang.success) {
        return await FollowupMessage(interaction.token, {
            content: null,
            embeds: [
                {
                    title: "Something went wrong!",
                    description: mojang.message,
                    color: parseInt("B00020", 16),
                    footer: {
                        text: `Response time: ${Date.now() - timestamp.getTime()}ms`,
                    },
                    timestamp: new Date().toISOString()
                }
            ]
        });
    }
    const uuid = mojang.uuid;

    const immune = await isImmunePlayer(uuid);
    if (!immune) {
        return await FollowupMessage(interaction.token, {
            content: null,
            embeds: [
                {
                    title: "That player is not immune!",
                    color: parseInt("FB9B00", 16),
                    footer: {
                        text: `Response time: ${Date.now() - timestamp.getTime()}ms`,
                    },
                    timestamp: new Date().toISOString()
                }
            ]
        });
    }

    await removeImmunePlayer(uuid);

    return await FollowupMessage(interaction.token, {
        content: null,
        embeds: [
            {
                title: "Player removed from the immune list!",
                color: parseInt("FB9B00", 16),
                footer: {
                    text: `Response time: ${Date.now() - timestamp.getTime()}ms`,
                },
                timestamp: new Date().toISOString()
            }
        ]
    });
}

async function viewImmune(interaction) {
    const timestamp = ConvertSnowflakeToDate(interaction.id);
    // User sees the "[bot] is thinking..." message
    await CreateInteractionResponse(interaction.id, interaction.token, {
        type: InteractionResponseType.DEFERRED_CHANNEL_MESSAGE_WITH_SOURCE,
    });

    const immunePlayers = await getImmunePlayers();
    if (!immunePlayers.success) {
        return await FollowupMessage(interaction.token, {
            content: null,
            embeds: [
                {
                    title: "Something went wrong!",
                    description: immunePlayers.message,
                    color: parseInt("B00020", 16),
                    footer: {
                        text: `Response time: ${Date.now() - timestamp.getTime()}ms`,
                    },
                    timestamp: new Date().toISOString()
                }
            ],
        });
    }

    if (immunePlayers.players.length === 0) {
        return await FollowupMessage(interaction.token, {
            content: null,
            embeds: [
                {
                    title: "There are no immune players!",
                    color: parseInt("FB9B00", 16),
                    footer: {
                        text: `Response time: ${Date.now() - timestamp.getTime()}ms`,
                    },
                    timestamp: new Date().toISOString()
                }
            ],
        });
    }

    const fieldArray = [];
    for (const [key, value] of Object.entries(Object.groupBy(immunePlayers.players, ({ reason }) => reason))) {
        fieldArray.push({
            name: key,
            value: value.map(player => player.name).join('\n').replace('_', '\\_'),
            inline: true
        });
    }

    return await FollowupMessage(interaction.token, {
        content: null,
        embeds: [
            {
                title: "Immune Players",
                color: parseInt("FB9B00", 16),
                fields: fieldArray,
                footer: {
                    text: `Response time: ${Date.now() - timestamp.getTime()}ms`,
                },
                timestamp: new Date().toISOString()
            }
        ],
    });
}

export default async (req, res) => {
    const interaction = req.body;
    const options = Object.fromEntries(interaction.data.options.map(option => [option.name, option.value ?? option.options]));

    if (options.add) {
        return await addImmune(interaction, options.add.name, options.add.reason);
    } else if (options.remove) {
        return await removeImmune(interaction, options.remove.name);
    } else if (options.view) {
        return await viewImmune(interaction);
    } else {
        console.log('interaction', interaction);
        console.log('interaction.data', interaction.data);
        console.log('interaction.data.options', interaction.data.options);
        console.log('options object', options);
        return res.status(200).send({
            type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
            data: { content: "⚠️ Check Logs!" },
        });
    }
}
export const CommandData = {
    name: "immune",
    description: "List or edit immune players.",
    options: [
        {
            name: "add",
            description: "Add a player to the immune list.",
            type: 1, // 1 is type SUB_COMMAND
            options: [
                {
                    name: "name",
                    description: "The name of the player.",
                    type: ApplicationCommandOptionType.String,
                    required: true
                },
                {
                    name: "reason",
                    description: "The reason why the player is immune.",
                    type: ApplicationCommandOptionType.String,
                    required: true,
                    choices: [
                        {
                            name: "Level",
                            value: "level"
                        },
                        {
                            name: "Loyalty",
                            value: "loyalty"
                        }
                    ]
                }
            ]
        },
        {
            name: "remove",
            description: "Remove a player from the immune list.",
            type: 1,
            options: [
                {
                    name: "name",
                    description: "The name of the player.",
                    type: ApplicationCommandOptionType.String,
                    required: true
                }
            ]
        },
        {
            name: "view",
            description: "View the immune list.",
            type: 1
        }
    ]
}