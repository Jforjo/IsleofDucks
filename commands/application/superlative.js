import { sql } from "@vercel/postgres";
import { ApplicationCommandType } from "discord-api-types/v10";
import { InteractionResponseType } from "discord-interactions";
import { getUsername, getGuildData } from "../../utils/hypixelUtils.js";
import { CreateInteractionResponse, FollowupMessage, ConvertSnowflakeToDate, IsleofDucks } from "../../utils/discordUtils.js";

async function getSuperlative() {
    // Sort array, but the last one is first in the array
    const superlativeList = IsleofDucks.superlatives.sort((a, b) => b.start - a.start);
    let currentSuperlative;

    const { rows } = await sql`SELECT value FROM settings WHERE key = 'superlative' LIMIT 1`;
    if (rows.length > 0) {
        currentSuperlative = rows[0].value;
    }

    const { rows: reset } = await sql`SELECT value FROM settings WHERE key = 'superlativeReset' LIMIT 1`;
    if (reset.length > 0) {
        if (reset[0].value === "true") {
            await sql`TRUNCATE TABLE users`;
            await sql`UPDATE settings SET value = ${"false"} WHERE key = 'superlativeReset'`;
        }
    }

    for (let i = 0; i < superlativeList.length; i++) {
        const superlative = superlativeList[i];
        if (Date.now() >= superlative.start) {
            if (superlative.id !== currentSuperlative) {
                await sql`UPDATE settings SET value = ${superlative.id} WHERE key = 'superlative'`;
                await sql`UPDATE settings SET value = ${"true"} WHERE key = 'superlativeReset'`;
            }
            return superlative;
        }
    }

    return null;
}

export default async (req, res) => {
    const interaction = req.body;
    // User sees the "[bot] is thinking..." message
    await CreateInteractionResponse(interaction.id, interaction.token, {
        type: InteractionResponseType.DEFERRED_CHANNEL_MESSAGE_WITH_SOURCE,
    });
    // Date object of the timestamp on the interaction
    const timestamp = ConvertSnowflakeToDate(interaction.id);

    const superlative = await getSuperlative();
    if (superlative == null || superlative.callback == null || typeof superlative.callback !== 'function') {
        return await FollowupMessage(interaction.token, {
            content: null,
            embeds: [
                {
                    title: "Superlative - None",
                    description: "There is no superlative right now!",
                    color: parseInt("FB9B00", 16),
                    footer: {
                        text: `Response time: ${Date.now() - timestamp.getTime()}ms`,
                    },
                    timestamp: new Date().toISOString()
                }
            ],
        });
    }

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

    let result = await Promise.all(guild.guild.members.map(async (member) => {
        const mojang = await getUsername(member.uuid);
        if (!mojang.success) throw new Error(mojang.message);
        const superlativeData = await superlative.callback(member.uuid);
        if (!superlativeData.success) throw new Error(superlativeData.message);
        return {
            uuid: member.uuid,
            name: mojang.name,
            value: superlativeData.value,
            formattedValue: superlativeData.formattedValue
        };
    })).catch((err) => {
        console.log(err.message);
        return {
            success: false,
            message: err.message,
            ping: err.message === "Invalid API key"
        };
    });
    
    if (result?.success === false) {
        let content = null;
        if (result?.ping === true) content = `<@${IsleofDucks.staticIDs.Jforjo}>`;
        return await FollowupMessage(interaction.token, {
            content: content,
            embeds: [
                {
                    title: "Something went wrong!",
                    description: result.message,
                    color: parseInt("B00020", 16),
                    footer: {
                        text: `Response time: ${Date.now() - timestamp.getTime()}ms`,
                    },
                    timestamp: new Date().toISOString()
                }
            ],
        });
    }
    // console.log(result);
    // b - a = bigger number first
    result.sort((a, b) => b.value - a.value);
    result = result.map((member, index) => {
        return {
            rank: index + 1,
            uuid: member.uuid,
            name: member.name,
            value: member.value,
            formattedValue: member.formattedValue
        };
    });
    let fieldArray = [];
    const chunkSize = 21;
    for (let i = 0; i < result.length; i += chunkSize) {
        fieldArray.push(
            {
                name: '\u200b',
                value: result.slice(i, i + chunkSize).map((field) => `\`#${field.rank}\` ${field.name.replace('_', '\\_')}: ${field.formattedValue}`).join('\n'),
                inline: true
            }
        );
    }

    return await FollowupMessage(interaction.token, {
        content: null,
        embeds: [
            {
                title: `Superlative - ${superlative.title}`,
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
    name: "superlative",
    description: "Displays the superlative data for Isle of Ducks",
    type: ApplicationCommandType.ChatInput,
}