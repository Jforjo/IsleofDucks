import { ApplicationCommandType } from "discord-api-types/v10";
import { InteractionResponseType } from "discord-interactions";
import { getUsername } from "../../utils/hypixelUtils.js";
import { CreateInteractionResponse, FollowupMessage, ConvertSnowflakeToDate, IsleofDucks } from "../../utils/discordUtils.js";

async function getGuildData(name) {
    const response = await fetch(`https://api.hypixel.net/guild?name=${encodeURIComponent(name)}`, {
        method: 'GET',
        headers: {
            'API-Key': process.env.HYPIXEL_API_KEY
        }
    });
    const data = await response.json();
    if (!response.ok) {
        if (data && data.cause) {
            return {
                success: false,
                message: data.cause,
                ping: data.cause === "Invalid API key"
            };
        }
        return {
            success: false,
            message: 'Bad response from Hypixel'
        };
    }
    if (data.guild === null) {
        return {
            success: false,
            message: 'Guild not found'
        };
    }
    return {
        success: true,
        guild: data.guild
    };
}

export default async (req, res) => {
    const interaction = req.body;
    // User sees the "[bot] is thinking..." message
    await CreateInteractionResponse(interaction.id, interaction.token, {
        type: InteractionResponseType.DEFERRED_CHANNEL_MESSAGE_WITH_SOURCE,
    });
    // Date object of the timestamp on the interaction
    const timestamp = ConvertSnowflakeToDate(interaction.id);

    const guild = await getGuildData("Isle of Ducks");
    if (!guild.success) {
        let content = null;
        if (guild?.ping === true) content = `<@${IsleofDucks.staticIDs.Jforjo}>`;
        return await FollowupMessage(interaction.token, {
            content: content,
            embeds: [
                {
                    title: "Something went wrong!",
                    description: guild.message,
                    color: parseInt("B00020", 16),
                    footer: {
                        text: `Response time: ${Date.now() - timestamp.getTime()}ms`,
                    },
                    timestamp: new Date().toISOString()
                }
            ],
        });
    }

    const immunePlayers = await getImmunePlayers();
    const immunePlayerIDs = immunePlayers?.players.map(player => player.id);
    
    if (immunePlayers?.success === false) {
        let content = null;
        if (immunePlayers?.ping === true) content = `<@${IsleofDucks.staticIDs.Jforjo}>`;
        return await FollowupMessage(interaction.token, {
            content: content,
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

    let result = await Promise.all(guild.guild.members.map(async (member) => {
        const mojang = await getUsername(member.uuid);
        if (!mojang.success) throw new Error(mojang.message);
        const gexp = Object.values(member.expHistory).reduce((a, b) => a + b, 0);
        return {
            uuid: member.uuid,
            name: mojang.name,
            gexp: gexp
        };
    })).catch((err) => {
        console.log(err.message);
        return {
            success: false,
            message: err.message,
            ping: err.message === "Invalid API key"
        };
    });

    // console.log(result);
    result.sort((a, b) => b.gexp - a.gexp);
    result = result.map((member, index) => {
        return {
            rank: index + 1,
            uuid: member.uuid,
            name: member.name,
            gexp: member.gexp,
            immune: immunePlayerIDs.includes(member.uuid),
        };
    });
    let fieldArray = [];
    const chunkSize = 21;
    for (let i = 0; i < result.length; i += chunkSize) {
        fieldArray.push(
            {
                name: '\u200b',
                value: result.slice(i, i + chunkSize).map((field) => `\`#${field.rank}\`${field.immune ? ' 🛡️' : ''} ${field.name.replace('_', '\\_')}: ${field.gexp}`).join('\n'),
                inline: true
            }
        );
    }

    return await FollowupMessage(interaction.token, {
        content: null,
        embeds: [
            {
                title: 'Weekly Guild Experience',
                // description: ``,
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
export const CommandData = {
    name: "weekly",
    description: "Displays the weekly GEXP for Isle of Ducks",
    type: ApplicationCommandType.ChatInput,
}