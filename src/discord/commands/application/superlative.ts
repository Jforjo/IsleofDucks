import { sql } from "@vercel/postgres";
import { APIChatInputApplicationCommandInteraction, APIInteractionResponse, ApplicationCommandType, ButtonStyle, ComponentType, InteractionResponseType } from "discord-api-types/v10";
import { getUsernameOrUUID, getGuildData } from "@/discord/hypixelUtils";
import { CreateInteractionResponse, FollowupMessage, ConvertSnowflakeToDate, IsleofDucks, type Superlative, Emojis, SendMessage } from "@/discord/discordUtils";
import { NextResponse } from "next/server";
import { saveSuperlativeData, updateGuildSuperlative } from "@/discord/utils";

export async function getSuperlative(): Promise<{
    superlative: Superlative;
    new: boolean;
} | null> {
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
            await saveSuperlativeData();
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
                    return {
                        superlative: superlativeList[i + 1],
                        new: true
                    };
                }
            }
            return {
                superlative: superlative,
                new: false
            }
        }
    }

    return null;
}

async function superlativeNew(
    interaction: APIChatInputApplicationCommandInteraction,
    superlative: Superlative
): Promise<
NextResponse<
    {
        success: boolean;
        error?: string;
    } | APIInteractionResponse
>
> {
    const timestamp = ConvertSnowflakeToDate(interaction.id);

    const guildDuckPromise = getGuildData("Isle of Ducks");
    const guildDuckUpdateResponse = FollowupMessage(interaction.token, {
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
    const guildDuck = await guildDuckPromise;
    await guildDuckUpdateResponse;
    if (!guildDuck.success) {
        let content = undefined;
        if (guildDuck?.ping === true) content = `<@${IsleofDucks.staticIDs.Jforjo}>`;
        await FollowupMessage(interaction.token, {
            content: content,
            embeds: [
                {
                    title: "Something went wrong!",
                    description: guildDuck.message === "Key throttle" && typeof guildDuck.retry === "number" ? [
                        guildDuck.message,
                        `Try again <t:${Math.floor(( timestamp.getTime() + guildDuck.retry ) / 1000)}:R>`
                    ].join("\n") : guildDuck.message,
                    color: 0xB00020,
                    footer: {
                        text: `Response time: ${Date.now() - timestamp.getTime()}ms`,
                    },
                    timestamp: new Date().toISOString()
                }
            ],
        });
        return NextResponse.json(
            { success: false, error: guildDuck.message },
            { status: 400 }
        );
    }

    const guildDucklingPromise = getGuildData("Isle of Ducklings");
    const guildDucklingUpdateResponse = FollowupMessage(interaction.token, {
        embeds: [
            {
                title: "Superlative - Fetching",
                description: "Fetching Isle of Ducklings guild...",
                color: 0xFB9B00,
                footer: {
                    text: `Response time: ${Date.now() - timestamp.getTime()}ms`,
                },
                timestamp: new Date().toISOString()
            }
        ]
    });
    const guildDuckling = await guildDucklingPromise;
    await guildDucklingUpdateResponse;
    if (!guildDuckling.success) {
        let content = undefined;
        if (guildDuckling?.ping === true) content = `<@${IsleofDucks.staticIDs.Jforjo}>`;
        await FollowupMessage(interaction.token, {
            content: content,
            embeds: [
                {
                    title: "Something went wrong!",
                    description: guildDuckling.message === "Key throttle" && typeof guildDuckling.retry === "number" ? [
                        guildDuckling.message,
                        `Try again <t:${Math.floor(( timestamp.getTime() + guildDuckling.retry ) / 1000)}:R>`
                    ].join("\n") : guildDuckling.message,
                    color: 0xB00020,
                    footer: {
                        text: `Response time: ${Date.now() - timestamp.getTime()}ms`,
                    },
                    timestamp: new Date().toISOString()
                }
            ],
        });
        return NextResponse.json(
            { success: false, error: guildDuckling.message },
            { status: 400 }
        );
    }

    const superlativeDuckResult = await Promise.all(guildDuck.guild.members.map(async (member) => {
        const mojang = await getUsernameOrUUID(member.uuid);
        // This should never happen, but Typescript/eslint was complaining
        if (!superlative.callback) throw new Error("Superlative callback is not defined");
        const superlativeData = await superlative.callback(member.uuid);
        // Error = Tough shit bro
        if (!superlativeData.success) return null;

        return {
            uuid: member.uuid,
            name: "name" in mojang ? mojang.name : member.uuid,
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
    
    if ("success" in superlativeDuckResult && superlativeDuckResult.success === false) {
        let content = undefined;
        if (superlativeDuckResult.ping === true) content = `<@${IsleofDucks.staticIDs.Jforjo}>`;
        await FollowupMessage(interaction.token, {
            content: content,
            embeds: [
                {
                    title: "Something went wrong!",
                    description: superlativeDuckResult.message.includes("User not found: ") ? [
                        superlativeDuckResult.message,
                        `It's likely that the superlative data needs updating, so run the command again in a minute.`,
                        `(It's currently updating right now)`
                    ].join("\n") : superlativeDuckResult.message,
                    color: 0xB00020,
                    footer: {
                        text: `Response time: ${Date.now() - timestamp.getTime()}ms`,
                    },
                    timestamp: new Date().toISOString()
                }
            ],
        });
        return NextResponse.json(
            { success: false, error: superlativeDuckResult.message },
            { status: 400 }
        );
    }
    
    let resultDuck = superlativeDuckResult as {
        uuid: string;
        name: string;
        value: number;
        formattedValue: string;
    }[];
    // b - a = bigger number first
    resultDuck.sort((a, b) => b.value - a.value);
    resultDuck = resultDuck.map((member, index) => {
        return {
            rank: index + 1,
            uuid: member.uuid,
            name: member.name,
            value: member.value,
            formattedValue: member.formattedValue,
        };
    });
    const finalResultDuck = resultDuck as {
        rank: number;
        uuid: string;
        name: string;
        value: number;
        formattedValue: string;
    }[];
    const fieldArrayDuck = [];
    for (let i = 0; i < finalResultDuck.length; i += 21) {
        fieldArrayDuck.push(
            {
                name: '\u200b',
                value: finalResultDuck.slice(i, i + 21).map((field) => {
                    return `\`#${field.rank}\` ${field.name.replaceAll('_', '\\_')}: ${field.formattedValue}`;
                }).join('\n'),
                inline: true
            }
        );
    }

    const superlativeDucklingResult = await Promise.all(guildDuck.guild.members.map(async (member) => {
        const mojang = await getUsernameOrUUID(member.uuid);
        // This should never happen, but Typescript/eslint was complaining
        if (!superlative.callback) throw new Error("Superlative callback is not defined");
        const superlativeData = await superlative.callback(member.uuid);
        // Error = Tough shit bro
        if (!superlativeData.success) return null;

        return {
            uuid: member.uuid,
            name: "name" in mojang ? mojang.name : member.uuid,
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
    
    if ("success" in superlativeDucklingResult && superlativeDucklingResult.success === false) {
        let content = undefined;
        if (superlativeDucklingResult.ping === true) content = `<@${IsleofDucks.staticIDs.Jforjo}>`;
        await FollowupMessage(interaction.token, {
            content: content,
            embeds: [
                {
                    title: "Something went wrong!",
                    description: superlativeDucklingResult.message.includes("User not found: ") ? [
                        superlativeDucklingResult.message,
                        `It's likely that the superlative data needs updating, so run the command again in a minute.`,
                        `(It's currently updating right now)`
                    ].join("\n") : superlativeDucklingResult.message,
                    color: 0xB00020,
                    footer: {
                        text: `Response time: ${Date.now() - timestamp.getTime()}ms`,
                    },
                    timestamp: new Date().toISOString()
                }
            ],
        });
        return NextResponse.json(
            { success: false, error: superlativeDucklingResult.message },
            { status: 400 }
        );
    }
    
    let resultDuckling = superlativeDucklingResult as {
        uuid: string;
        name: string;
        value: number;
        formattedValue: string;
    }[];
    // b - a = bigger number first
    resultDuckling.sort((a, b) => b.value - a.value);
    resultDuckling = resultDuckling.map((member, index) => {
        return {
            rank: index + 1,
            uuid: member.uuid,
            name: member.name,
            value: member.value,
            formattedValue: member.formattedValue,
        };
    });
    const finalResultDuckling = resultDuckling as {
        rank: number;
        uuid: string;
        name: string;
        value: number;
        formattedValue: string;
    }[];
    const fieldArrayDuckling = [];
    for (let i = 0; i < finalResultDuckling.length; i += 21) {
        fieldArrayDuckling.push(
            {
                name: '\u200b',
                value: finalResultDuckling.slice(i, i + 21).map((field) => {
                    return `\`#${field.rank}\` ${field.name.replaceAll('_', '\\_')}: ${field.formattedValue}`;
                }).join('\n'),
                inline: true
            }
        );
    }

    await FollowupMessage(interaction.token, {
        embeds: [
            {
                title: `Superlative - ${superlative.title}`,
                // description: ``,
                color: 0xFB9B00,
                fields: fieldArrayDuck,
                footer: {
                    text: `Response time: ${Date.now() - timestamp.getTime()}ms`,
                },
                timestamp: new Date().toISOString()
            },
        ],
    });

    await SendMessage(interaction.channel.id, {
        embeds: [
            {
                title: `Superlative - ${superlative.title}`,
                // description: ``,
                color: 0xFB9B00,
                fields: fieldArrayDuckling,
                footer: {
                    text: `Response time: ${Date.now() - timestamp.getTime()}ms`,
                },
                timestamp: new Date().toISOString()
            }
        ]
    });

    return NextResponse.json(
        { success: true },
        { status: 200 }
    );
}

export default async function Command(
    interaction: APIChatInputApplicationCommandInteraction,
    detailed = false
): Promise<
    NextResponse<
        {
            success: boolean;
            error?: string;
        } | APIInteractionResponse
    >
> {
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
    const superlativeData = await superlativePromise;
    const superlative = superlativeData?.superlative;
    await superlativeUpdateResponse;
    if (superlativeData == null || superlative == null || superlative.callback === undefined || typeof superlative.callback !== 'function') {
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

    if (superlativeData.new) return superlativeNew(interaction, superlative);
    
    const BACKGROUND_SUPERLATIVE_UPDATE = updateGuildSuperlative("Isle of Ducks", superlative);

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
        let untilNextRank = 0;
        let rankShould = "";
        superlative.ranks?.ducks.forEach((rank, index) => {
            if (rank.requirement <= superlativeData.current) {
                bracketShould = index;
                rankShould = rank.name.toLowerCase();
            } else if (untilNextRank === 0) {
                untilNextRank = rank.requirement - superlativeData.current;
            }
            if (rank.name.toLowerCase() === member.rank.toLowerCase()) bracketCurrent = index;
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
            current: superlativeData.current,
            untilNextRank: untilNextRank,
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
        if (!superlativeData.new && superlativeResult.message.includes("User not found: ")) {
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
            return await Command(interaction, detailed);
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
        current: number;
        untilNextRank: number;
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
            current: member.current,
            untilNextRank: member.untilNextRank,
            formattedValue: member.formattedValue,
            rankUp: member.rankUp
        };
    });
    const finalResult = result as {
        rank: number;
        uuid: string;
        name: string;
        value: number;
        current: number;
        untilNextRank: number;
        formattedValue: string;
        rankUp: string | null;
    }[];
    const fieldArray = [];
    const chunkSize = detailed ? 7 : 21;
    for (let i = 0; i < finalResult.length; i += chunkSize) {
        fieldArray.push(
            {
                name: '\u200b',
                value: finalResult.slice(i, i + chunkSize).map((field) => {
                    const main = `\`#${field.rank}\` ${field.name.replaceAll('_', '\\_')}: ${field.formattedValue}${field.rankUp ? ` ${field.rankUp}` : ''}`;
                    if (!detailed) return main;
                    const result = [
                        main,
                        `Total: ${field.current}`,
                        `Value: ${field.value}`
                    ];
                    if (field.untilNextRank > 0) result.push(`Until: ${field.untilNextRank}`);
                    return result.join('\n');
                }).join('\n'),
                inline: true
            }
        );
    }

    if (detailed) {
        await FollowupMessage(interaction.token, {
            embeds: [
                {
                    title: `Superlative - ${superlative.title}`,
                    color: 0xFB9B00,
                    fields: fieldArray.slice(0, fieldArray.length / 2),
                }
            ]
        });
        await SendMessage(interaction.channel.id, {
            embeds: [
                {
                    color: 0xFB9B00,
                    fields: fieldArray.slice(fieldArray.length / 2),
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
                            custom_id: `superlative-ducks${detailed ? "-detailed" : ""}`,
                            type: ComponentType.Button,
                            label: "Ducks",
                            style: ButtonStyle.Success,
                            disabled: true
                        },
                        {
                            custom_id: `superlative-ducklings${detailed ? "-detailed" : ""}`,
                            type: ComponentType.Button,
                            label: "Ducklings",
                            style: ButtonStyle.Primary,
                            disabled: false
                        }
                    ]
                }
            ]
        });
    } else {
        await FollowupMessage(interaction.token, {
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
                            custom_id: `superlative-ducks${detailed ? "-detailed" : ""}`,
                            type: ComponentType.Button,
                            label: "Ducks",
                            style: ButtonStyle.Success,
                            disabled: true
                        },
                        {
                            custom_id: `superlative-ducklings${detailed ? "-detailed" : ""}`,
                            type: ComponentType.Button,
                            label: "Ducklings",
                            style: ButtonStyle.Primary,
                            disabled: false
                        }
                    ]
                }
            ]
        });
    }

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