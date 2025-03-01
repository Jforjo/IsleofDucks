import { sql } from "@vercel/postgres";
import { APIChatInputApplicationCommandInteraction, APIInteractionResponse, ApplicationCommandType, ButtonStyle, ComponentType, InteractionResponseType, RESTPostAPIChannelMessageResult } from "discord-api-types/v10";
import { getUsernameOrUUID, getGuildData } from "@/discord/hypixelUtils";
import { CreateInteractionResponse, FollowupMessage, ConvertSnowflakeToDate, IsleofDucks, type Superlative, Emojis, SendMessage } from "@/discord/discordUtils";
import { NextResponse } from "next/server";
import { updateGuildSuperlative } from "@/discord/utils";

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

export default async function Command(
    interaction: APIChatInputApplicationCommandInteraction
): Promise<
    NextResponse<
        {
            success: boolean;
            error?: string;
        } | APIInteractionResponse
    >
> {
    const BACKGROUND_SUPERLATIVE_UPDATE = updateGuildSuperlative("Isle of Ducks");

    // User sees the "[bot] is thinking..." message
    await CreateInteractionResponse(interaction.id, interaction.token, {
        type: InteractionResponseType.DeferredChannelMessageWithSource,
    });
    
    const timestamp = ConvertSnowflakeToDate(interaction.id);

    const superlativePromise = getSuperlative();
    const superlativeUpdateResponse = FollowupMessage(interaction.token, {
        embeds: [
            {
                title: "Superlative - Fetching",
                description: "Fetching current superlative...",
                color: 0xFB9B00,
                footer: {
                    text: `Response time: ${Date.now() - timestamp.getTime()}ms`,
                },
                timestamp: new Date().toISOString()
            }
        ]
    });
    const superlative = await superlativePromise;
    await superlativeUpdateResponse;
    if (superlative == null || superlative.callback === undefined || typeof superlative.callback !== 'function') {
        await FollowupMessage(interaction.token, {
            embeds: [
                {
                    title: "Superlative - None",
                    description: "There is no superlative right now!",
                    color: 0xFB9B00,
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

    const guildPromise = getGuildData("Isle of Ducks");
    const guildUpdateResponse = FollowupMessage(interaction.token, {
        embeds: [
            {
                title: "Superlative - Fetching",
                description: "Fetching Isle of Ducks guild...",
                color: 0xFB9B00,
                footer: {
                    text: `Response time: ${Date.now() - timestamp.getTime()}ms`,
                },
                timestamp: new Date().toISOString()
            }
        ]
    });
    const guild = await guildPromise;
    await guildUpdateResponse;
    if (!guild.success) {
        let content = undefined;
        if (guild?.ping === true) content = `<@${IsleofDucks.staticIDs.Jforjo}>`;
        await FollowupMessage(interaction.token, {
            content: content,
            embeds: [
                {
                    title: "Something went wrong!",
                    description: guild.message === "Key throttle" && typeof guild.retry === "number" ? [
                        guild.message,
                        `Try again <t:${Math.floor(( timestamp.getTime() + guild.retry ) / 1000)}:R>`
                    ].join("\n") : guild.message,
                    color: 0xB00020,
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
    
    await FollowupMessage(interaction.token, {
        embeds: [
            {
                title: "Superlative - Fetching",
                description: `Fetching player data...`,
                color: 0xFB9B00,
                footer: {
                    text: `Response time: ${Date.now() - timestamp.getTime()}ms`,
                },
                timestamp: new Date().toISOString()
            }
        ]
    });

    const setranks: string[] = [];

    const superlativeResult = await Promise.all(guild.guild.members.map(async (member) => {
        const mojang = await getUsernameOrUUID(member.uuid);
        if (!mojang.success) throw new Error(mojang.message);
        // This should never happen, but Typescript/eslint was complaining
        if (!superlative.callback) throw new Error("Superlative callback is not defined");
        const superlativeData = await superlative.callback(member.uuid);
        if (!superlativeData.success) throw new Error(superlativeData.message);

        let rankUp = null;
        let bracketCurrent = -1;
        let bracketShould = 0;
        let rankShould = "";
        superlative.ranks?.ducks.forEach((rank, index) => {
            if (rank.requirement <= superlativeData.current) {
                bracketShould = index;
                rankShould = rank.name.toLowerCase();
            }
            if (rank.id.toLowerCase() === member.rank.toLowerCase()) bracketCurrent = index;
        });
        if (bracketCurrent !== -1) {
            // Otherwise, GM and staff will always have a green/red arrow
            if (bracketShould > bracketCurrent) {
                rankUp = Emojis.up;
                setranks.push(`setrank ${mojang.name} ${rankShould}`);
            }
            if (bracketShould < bracketCurrent) {
                rankUp = Emojis.down;
                setranks.push(`setrank ${mojang.name} ${rankShould}`);
            }
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
    
    if ("success" in superlativeResult && superlativeResult.success === false) {
        let content = undefined;
        if (superlativeResult.ping === true) content = `<@${IsleofDucks.staticIDs.Jforjo}>`;
        await FollowupMessage(interaction.token, {
            content: content,
            embeds: [
                {
                    title: "Something went wrong!",
                    description: superlativeResult.message.includes("User not found: ") ? [
                        superlativeResult.message,
                        `It's likely that the superlative data needs updating, so run the command again in a minute.`,
                        `(It's currently updating right now)`
                    ].join("\n") : superlativeResult.message,
                    color: 0xB00020,
                    footer: {
                        text: `Response time: ${Date.now() - timestamp.getTime()}ms`,
                    },
                    timestamp: new Date().toISOString()
                }
            ],
        });
        if (superlativeResult.message.includes("User not found: ")) {
            const result = await BACKGROUND_SUPERLATIVE_UPDATE;
            if (!result.success) {
                await FollowupMessage(interaction.token, {
                    embeds: [
                        {
                            title: "Something went wrong",
                            description: result.message === "Key throttle" && typeof result.retry === "number" ? [
                                result.message,
                                `Try again <t:${Math.floor(( timestamp.getTime() + result.retry ) / 1000)}:R>`
                            ].join("\n") : result.message,
                            color: 0xB00020,
                            footer: {
                                text: `Response time: ${Date.now() - timestamp.getTime()}ms`,
                            },
                            timestamp: new Date().toISOString()
                        }
                    ]
                })
                return NextResponse.json(
                    { success: false, error: result.message, },
                    { status: 400 }
                );
            }
            return await Command(interaction);
        }
        return NextResponse.json(
            { success: false, error: superlativeResult.message },
            { status: 400 }
        );
    }
    
    let result = superlativeResult as {
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
                color: 0xFB9B00,
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
                        style: ButtonStyle.Success,
                        disabled: true
                    },
                    {
                        custom_id: "superlative-ducklings",
                        type: ComponentType.Button,
                        label: "Ducklings",
                        style: ButtonStyle.Primary,
                        disabled: false
                    }
                ]
            }
        ]
    });

    await BACKGROUND_SUPERLATIVE_UPDATE;
    for (const setrank of setranks) {
        await SendMessage(IsleofDucks.channels.duckoc, {
            content: setrank
        });
        await new Promise(resolve => setTimeout(resolve, 500));
    }

    return NextResponse.json(
        { success: true },
        { status: 200 }
    );
}
export const CommandData = {
    name: "superlative",
    description: "Displays the superlative data for Isle of Ducks",
    type: ApplicationCommandType.ChatInput,
}