import { sql } from "@vercel/postgres";
import { APIInteractionResponse, APIMessageComponentButtonInteraction, ButtonStyle, ComponentType, InteractionResponseType } from "discord-api-types/v10";
import { getUsernameOrUUID, getGuildData } from "@/discord/hypixelUtils";
import { CreateInteractionResponse, FollowupMessage, ConvertSnowflakeToDate, IsleofDucks, type Superlative, Emojis } from "@/discord/discordUtils";
import { NextResponse } from "next/server";

export async function getSuperlative(): Promise<Superlative | null> {
    // Sort array, but the last one is first in the array
    const superlativeList = IsleofDucks.superlatives.sort((a, b) => b.start - a.start);
    let currentSuperlative;

    const { rows } = await sql`SELECT value FROM settings WHERE key = 'superlative' LIMIT 1`;
    if (rows.length > 0) {
        currentSuperlative = rows[0].value as string;
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
                // Return the previous superlative to get the final results
                if (superlativeList[i + 1] != null) {
                    return superlativeList[i + 1];
                }
            }
            return superlative;
        }
    }

    return null;
}

export default async function(
    interaction: APIMessageComponentButtonInteraction
): Promise<
    NextResponse<
        {
            success: boolean;
            error?: string;
        } | APIInteractionResponse
    >
> {
    // ACK response and update the original message
    await CreateInteractionResponse(interaction.id, interaction.token, {
        type: InteractionResponseType.DeferredMessageUpdate,
    });
    
    const timestamp = ConvertSnowflakeToDate(interaction.id);
    const buttonID = interaction.data.custom_id.split("-")[1];

    // Disable all buttons while it loads, since people could spam it
    await FollowupMessage(interaction.token, {
        content: undefined,
        components: [
            {
                type: ComponentType.ActionRow,
                components: [
                    {
                        custom_id: "superlative-ducks",
                        type: ComponentType.Button,
                        label: "Ducks",
                        style: buttonID === "ducks" ? ButtonStyle.Success : ButtonStyle.Primary,
                        disabled: true
                    },
                    {
                        custom_id: "superlative-ducklings",
                        type: ComponentType.Button,
                        label: "Ducklings",
                        style: buttonID === "ducklings" ? ButtonStyle.Success : ButtonStyle.Primary,
                        disabled: true
                    }
                ]
            }
        ]
    })

    const superlative = await getSuperlative();
    if (superlative == null || superlative.callback === undefined || typeof superlative.callback !== 'function') {
        await FollowupMessage(interaction.token, {
            content: undefined,
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
        return NextResponse.json(
            { success: true },
            { status: 200 }
        );
    }

    // Default to Ducks
    const guildName = buttonID === "ducks" ? "Isle of Ducks" :
        buttonID === "ducklings" ? "Isle of Ducklings" :
        "Isle of Ducks";
    const guild = await getGuildData(guildName);  
    if (!guild.success) {
        let content = undefined;
        if (guild?.ping === true) content = `<@${IsleofDucks.staticIDs.Jforjo}>`;
        await FollowupMessage(interaction.token, {
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
        return NextResponse.json(
            { success: false, error: guild.message },
            { status: 400 }
        );
    }

    let result = await Promise.all(guild.guild.members.map(async (member) => {
        const mojang = await getUsernameOrUUID(member.uuid);
        if (!mojang.success) throw new Error(mojang.message);
        // THis should never happen, but Typescript/eslint was complaining
        if (!superlative.callback) throw new Error("Superlative callback is not defined");
        const superlativeData = await superlative.callback(member.uuid);
        if (!superlativeData.success) throw new Error(superlativeData.message);
        
        let rankUp = null;
        let bracketCurrent = -1;
        let bracketShould = 0
        if (buttonID === "ducks" || buttonID === "ducklings") {
            superlative.ranks?.[buttonID].forEach((rank, index) => {
                if (rank.requirement <= superlativeData.original) bracketShould = index;
                if (rank.id.toLowerCase() === member.rank.toLowerCase()) bracketCurrent = index;
            });
        }
        if (bracketCurrent !== -1) {
            // Otherwise, GM and staff will always have a green/red arrow
            if (bracketShould > bracketCurrent) rankUp = Emojis.up;
            if (bracketShould < bracketCurrent) rankUp = Emojis.down;
        }

        return {
            uuid: member.uuid,
            name: mojang.name,
            value: superlativeData.value,
            formattedValue: superlativeData.formattedValue,
            rankUp: rankUp
        };
    })).catch((err) => {
        console.log(err.message);
        return {
            success: false,
            message: err.message,
            ping: err.message === "Invalid API key"
        };
    });
    
    if ("success" in result && result.success === false) {
        let content = undefined;
        if (result.ping === true) content = `<@${IsleofDucks.staticIDs.Jforjo}>`;
        await FollowupMessage(interaction.token, {
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
        return NextResponse.json(
            { success: false, error: result.message },
            { status: 400 }
        );
    }
    
    
    result = result as {
        uuid: string;
        name: string;
        value: number;
        formattedValue: string;
        rankUp: string | null;
    }[];
    // b - a = bigger number first
    result.sort((a, b) => b.value - a.value);
    result = result.map((member, index) => {
        return {
            rank: index + 1,
            uuid: member.uuid,
            name: member.name,
            value: member.value,
            formattedValue: member.formattedValue,
            rankUp: member.rankUp
        };
    });
    const finalResult = result as {
        rank: number;
        uuid: string;
        name: string;
        value: number;
        formattedValue: string;
        rankUp: string | null;
    }[];
    const fieldArray = [];
    const chunkSize = 21;
    for (let i = 0; i < finalResult.length; i += chunkSize) {
        fieldArray.push(
            {
                name: '\u200b',
                value: finalResult.slice(i, i + chunkSize).map((field) => `\`#${field.rank}\` ${field.name.replaceAll('_', '\\_')}: ${field.formattedValue}${field.rankUp ? ` ${field.rankUp}` : ''}`).join('\n'),
                inline: true
            }
        );
    }

    await FollowupMessage(interaction.token, {
        content: undefined,
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
        components: [
            {
                type: ComponentType.ActionRow,
                components: [
                    {
                        custom_id: "superlative-ducks",
                        type: ComponentType.Button,
                        label: "Ducks",
                        style: buttonID === "ducks" ? ButtonStyle.Success : ButtonStyle.Primary,
                        disabled: buttonID === "ducks"
                    },
                    {
                        custom_id: "superlative-ducklings",
                        type: ComponentType.Button,
                        label: "Ducklings",
                        style: buttonID === "ducklings" ? ButtonStyle.Success : ButtonStyle.Primary,
                        disabled: buttonID === "ducklings"
                    }
                ]
            }
        ]
    });

    return NextResponse.json(
        { success: true },
        { status: 200 }
    );
}
