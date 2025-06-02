import { APIInteractionResponse, APIMessageComponentButtonInteraction, ButtonStyle, ComponentType, InteractionResponseType } from "discord-api-types/v10";
import { getUsernameOrUUID, getGuildData } from "@/discord/hypixelUtils";
import { CreateInteractionResponse, FollowupMessage, ConvertSnowflakeToDate, IsleofDucks, Emojis, SendMessage } from "@/discord/discordUtils";
import { NextResponse } from "next/server";
import { updateGuildSuperlative } from "@/discord/utils";
import { getSuperlative } from "../application/superlative";

export default async function Command(
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
    const customIds = interaction.data.custom_id.split("-");
    const buttonID = customIds[1];
    // Default to Ducks
    const guildName = buttonID === "ducks" ? "Isle of Ducks" :
        buttonID === "ducklings" ? "Isle of Ducklings" :
        "Isle of Ducks";
    let detailed = customIds[2] === "detailed";
    const displayTotals = customIds[2] === "total";
    if (customIds.length === 4) {
        detailed = customIds[3] === "detailed";
    }

    // Disable all buttons while it loads, since people could spam it
    await FollowupMessage(interaction.token, {
        components: [
            {
                type: ComponentType.ActionRow,
                components: [
                    {
                        custom_id: `superlative-ducks${displayTotals ? "-total" : ""}${detailed ? "-detailed" : ""}`,
                        type: ComponentType.Button,
                        label: "Ducks",
                        style: buttonID === "ducks" ? ButtonStyle.Success : ButtonStyle.Primary,
                        disabled: true
                    },
                    {
                        custom_id: `superlative-ducklings${displayTotals ? "-total" : ""}${detailed ? "-detailed" : ""}`,
                        type: ComponentType.Button,
                        label: "Ducklings",
                        style: buttonID === "ducklings" ? ButtonStyle.Success : ButtonStyle.Primary,
                        disabled: true
                    }
                ]
            }
        ]
    });

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
            content: undefined,
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
    
    const BACKGROUND_SUPERLATIVE_UPDATE = updateGuildSuperlative(guildName, superlative);

    const guildPromise = getGuildData(guildName);
    const guildUpdateResponse = FollowupMessage(interaction.token, {
        embeds: [
            {
                title: "Superlative - Fetching",
                description: `Fetching ${guildName} guild...`,
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
                    description: guild.message,
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
        // THis should never happen, but Typescript/eslint was complaining
        if (!superlative.callback) throw new Error("Superlative callback is not defined");
        const superlativeData = await superlative.callback(member.uuid);
        if (!superlativeData.success) throw new Error(superlativeData.message);
        
        let rankUp = null;
        let bracketCurrent = -1;
        let bracketShould = 0;
        let untilNextRank = 0;
        let rankShould = "";
        if (buttonID === "ducks" || buttonID === "ducklings") {
            superlative.ranks?.[buttonID].forEach((rank, index) => {
                if (rank.requirement <= superlativeData.current) {
                    bracketShould = index;
                    rankShould = rank.name.toLowerCase();
                } else if (untilNextRank === 0) {
                    untilNextRank = rank.requirement - superlativeData.current;
                }
                if (rank.name.toLowerCase() === member.rank.toLowerCase()) bracketCurrent = index;
            });
        }
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
        current: number;
        untilNextRank: number;
        formattedValue: string;
        rankUp: string | null;
    }[];
    // b - a = bigger number first
    result.sort((a, b) => {
        if (displayTotals) return b.current - a.current;
        return b.value - a.value
    });
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
                    const main = `\`#${field.rank}\` ${field.name.replaceAll('_', '\\_')}: ${displayTotals ? field.current : field.formattedValue}${field.rankUp ? ` ${field.rankUp}` : ''}`;
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
                            custom_id: `superlative-ducks${displayTotals ? "-total" : ""}${detailed ? "-detailed" : ""}`,
                            type: ComponentType.Button,
                            label: "Ducks",
                            style: buttonID === "ducks" ? ButtonStyle.Success : ButtonStyle.Primary,
                            disabled: buttonID === "ducks"
                        },
                        {
                            custom_id: `superlative-ducklings${displayTotals ? "-total" : ""}${detailed ? "-detailed" : ""}`,
                            type: ComponentType.Button,
                            label: "Ducklings",
                            style: buttonID === "ducklings" ? ButtonStyle.Success : ButtonStyle.Primary,
                            disabled: buttonID === "ducklings"
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
                            style: buttonID === "ducks" ? ButtonStyle.Success : ButtonStyle.Primary,
                            disabled: buttonID === "ducks"
                        },
                        {
                            custom_id: `superlative-ducklings${detailed ? "-detailed" : ""}`,
                            type: ComponentType.Button,
                            label: "Ducklings",
                            style: buttonID === "ducklings" ? ButtonStyle.Success : ButtonStyle.Primary,
                            disabled: buttonID === "ducklings"
                        }
                    ]
                }
            ]
        });
    }

    await BACKGROUND_SUPERLATIVE_UPDATE;
    for (const setrank of setranks) {
        if (buttonID === "ducks") await SendMessage(IsleofDucks.channels.duckoc, {
            content: setrank
        });
        else if (buttonID === "ducklings") await SendMessage(IsleofDucks.channels.ducklingoc, {
            content: setrank
        });
        await new Promise(resolve => setTimeout(resolve, 500));
    }

    return NextResponse.json(
        { success: true },
        { status: 200 }
    );
}
