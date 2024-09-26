import { ApplicationCommandOptionType, ApplicationCommandType } from "discord-api-types/v10";
import { InteractionResponseType } from "discord-interactions";
import { getUUID, getUsername } from "../../utils/hypixelUtils";
import { CreateInteractionResponse, FollowupMessage } from "../../utils/discordUtils";

const catalevels = { 0: 0,
    1: 50, 2: 125, 3: 235, 4: 395, 5: 625, 6: 955, 7: 1425, 8: 2095, 9: 3045,
    10: 4385, 11: 6275, 12: 8940, 13: 12700, 14: 17960, 15: 25340, 16: 35640,
    17: 50040, 18: 70040, 19: 97640, 20: 135640, 21: 188140, 22: 259640, 23: 356640,
    24: 488640, 25: 668640, 26: 911640, 27: 1239640, 28: 1684640, 29: 2284640,
    30: 3084640, 31: 4149640, 32: 5559640, 33: 7459640, 34: 9959640, 35: 13259640,
    36: 17559640, 37: 23159640, 38: 30359640, 39: 39559640, 40: 51559640, 41: 66559640,
    42: 85559640, 43: 109559640, 44: 139559640, 45: 177559640, 46: 225559640,
    47: 285559640, 48: 360559640, 49: 453559640, 50: 569809640
};

async function getCurrentCataLevel(uuid) {
    const response = await fetch(`https://api.hypixel.net/v2/skyblock/profiles?uuid=${encodeURIComponent(uuid)}`, {
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
                message: data.cause
            };
        }
        return {
            success: false,
            message: 'Bad response from Hypixel'
        };
    }
    if (data.profiles.length === 0) {
        return {
            success: false,
            message: 'User has no profiles'
        };
    }
    let cataexp = 0;
    data.profiles.forEach((profile) => {
        let temp = profile.members[uuid]?.dungeons?.dungeon_types?.catacombs?.experience;
        if (temp && temp > 0) {
            if (cataexp < temp) cataexp = temp;
        }
    });

    let catalvl = -1;
    for (const [key, value] of Object.entries(catalevels)) {
        if (cataexp < value) {
            catalvl += (cataexp - catalevels[key - 1]) / (value - catalevels[key - 1]);
            break;
        }
        catalvl++;
    }
    return {
        success: true,
        level: catalvl
    }
}

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
                message: data.cause
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

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms))
}

export default async (req, res) => {
    const interaction = req.body;
    const date = new Date();

    await CreateInteractionResponse(interaction.id, interaction.token, {
        type: InteractionResponseType.DEFERRED_CHANNEL_MESSAGE_WITH_SOURCE,
    });

    const guild = await getGuildData("Isle of Ducks");  
    if (!guild.success) {
        return await FollowupMessage(interaction.token, {
            content: null,
            embeds: [
                {
                    title: "Something went wrong!",
                    description: guild.message,
                    color: parseInt("B00020", 16)
                }
            ],
        });
    }

    let result = await Promise.all(guild.guild.members.map(async (member) => {
        const mojang = await getUsername(member.uuid);
        if (!mojang.success) throw new Error(mojang.message);
        const cataLevel = await getCurrentCataLevel(member.uuid);
        if (!cataLevel.success) throw new Error(cataLevel.message);
        return {
            uuid: member.uuid,
            name: mojang.name,
            cataLevel: cataLevel.level
        };
    })).catch((err) => {
        console.log(err.message);
        return {
            success: false,
            message: err.message
        };
    });
    
    if (result?.success === false) {
        return await FollowupMessage(interaction.token, {
            content: null,
            embeds: [
                {
                    title: "Something went wrong!",
                    description: result.message,
                    color: parseInt("B00020", 16)
                }
            ],
        });
    }
    // console.log(result);
    result.sort((a, b) => b.cataLevel - a.cataLevel);
    result = result.map((member, index) => {
        return {
            rank: index + 1,
            uuid: member.uuid,
            name: member.name,
            cataLevel: member.cataLevel
        };
    });
    let fieldArray = [];
    const chunkSize = 21;
    for (let i = 0; i < result.length; i += chunkSize) {
        fieldArray.push(
            {
                name: '\u200b',
                value: result.slice(i, i + chunkSize).map((field) => `\`${field.rank}\` ${field.name}: ${Math.round((field.cataLevel + Number.EPSILON) * 100) / 100}`).join('\n'),
                inline: true
            }
        );
    }

    return await FollowupMessage(interaction.token, {
        content: null,
        embeds: [
            {
                title: 'Superlative - Cata level',
                // description: ``,
                color: parseInt("FB9B00", 16),
                fields: fieldArray
            }
        ],
    });
}
export const CommandData = {
    name: "guildcata",
    description: "Displays the change in a user's Catacombs level for Isle of Ducks",
    type: ApplicationCommandType.ChatInput,
}