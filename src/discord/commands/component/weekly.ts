import { APIInteractionResponse, APIMessageComponentButtonInteraction, ButtonStyle, ComponentType, InteractionResponseType } from "discord-api-types/v10";
import { getUsernameOrUUID, getGuildData } from "@/discord/hypixelUtils";
import { getImmunePlayers } from "@/discord/utils";
import { CreateInteractionResponse, FollowupMessage, ConvertSnowflakeToDate, IsleofDucks } from "@/discord/discordUtils";
import { NextResponse } from "next/server";

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
    // User sees the "[bot] is thinking..." message
    await CreateInteractionResponse(interaction.id, interaction.token, {
        type: InteractionResponseType.DeferredChannelMessageWithSource,
    });
    
    const timestamp = ConvertSnowflakeToDate(interaction.id);
    const buttonID = interaction.data.custom_id.split("-")[1];
    // Default to Ducks
    const guildName = buttonID === "ducks" ? "Isle of Ducks" :
        buttonID === "ducklings" ? "Isle of Ducklings" :
        "Isle of Ducks";

    // Disable all buttons while it loads, since people could spam it
    await FollowupMessage(interaction.token, {
        embeds: [
            {
                title: `Weekly Guild Experience - ${guildName}`,
                description: `Fetching current weekly guild experience data...`,
                color: 0xFB9B00,
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
                        custom_id: `superlative-ducks`,
                        type: ComponentType.Button,
                        label: "Ducks",
                        style: buttonID === "ducks" ? ButtonStyle.Success : ButtonStyle.Primary,
                        disabled: true
                    },
                    {
                        custom_id: `superlative-ducklings`,
                        type: ComponentType.Button,
                        label: "Ducklings",
                        style: buttonID === "ducklings" ? ButtonStyle.Success : ButtonStyle.Primary,
                        disabled: true
                    }
                ]
            }
        ]
    });

    const guildResponse = await getGuildData(guildName);
    if (!guildResponse.success) {
        let content = undefined;
        if (guildResponse.ping) content = `<@${IsleofDucks.staticIDs.Jforjo}>`;
        await FollowupMessage(interaction.token, {
            content: content,
            embeds: [
                {
                    title: "Something went wrong!",
                    description: guildResponse.message === "Key throttle" && typeof guildResponse.retry === "number" ? [
                        guildResponse.message,
                        `Try again <t:${Math.floor(( timestamp.getTime() + guildResponse.retry ) / 1000)}:R>`
                    ].join("\n") : guildResponse.message,
                    color: 0xB00020,
                    footer: {
                        text: `Response time: ${Date.now() - timestamp.getTime()}ms`,
                    },
                    timestamp: new Date().toISOString()
                }
            ],
        });
        return NextResponse.json(
            { success: false, error: guildResponse.message },
            { status: 400 }
        );
    }

    const immunePlayers = await getImmunePlayers();
    const immunePlayerIDs = immunePlayers?.players.map(player => player.uuid);
    
    if (immunePlayers?.success === false) {
        await FollowupMessage(interaction.token, {
            embeds: [
                {
                    title: "Something went wrong!",
                    description: "Failed to fetch the immune players",
                    color: 0xB00020,
                    footer: {
                        text: `Response time: ${Date.now() - timestamp.getTime()}ms`,
                    },
                    timestamp: new Date().toISOString()
                }
            ],
        });
        return NextResponse.json(
            { success: false, error: "Failed to fetch the immune players" },
            { status: 400 }
        );
    }

    const weekAgo = Date.now() - 1000 * 60 * 60 * 24 * 7;

    let result = await Promise.all(guildResponse.guild.members.map(async (member) => {
        const mojang = await getUsernameOrUUID(member.uuid);
        if (!mojang.success) throw new Error(mojang.message);
        const gexp = Object.values(member.expHistory).reduce((a, b) => ( a ?? 0 ) + ( b ?? 0 ), 0) ?? 0;
        const isNew = member.joined > weekAgo;
        return {
            uuid: member.uuid,
            name: mojang.name,
            gexp: gexp,
            isNew: isNew
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
                    color: 0xB00020,
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
        gexp: number;
        isNew: boolean;
    }[];
    result.sort((a, b) => b.gexp - a.gexp);
    result = result.map((member, index) => {
        return {
            rank: index + 1,
            uuid: member.uuid,
            name: member.name,
            gexp: member.gexp,
            isNew: member.isNew,
            immune: immunePlayerIDs.includes(member.uuid),
        };
    });
    const finalResult = result as {
        rank: number;
        uuid: string;
        name: string;
        gexp: number;
        isNew: boolean;
        immune: boolean;
    }[];
    const fieldArray = [];
    const chunkSize = 21;
    for (let i = 0; i < finalResult.length; i += chunkSize) {
        fieldArray.push(
            {
                name: '\u200b',
                value: finalResult.slice(i, i + chunkSize).map((field) => `\`#${field.rank}\`${field.isNew ? ' 🆕' : ''}${field.immune ? ' 🛡️' : ''} ${field.name.replaceAll('_', '\\_')}: ${field.gexp}`).join('\n'),
                inline: true
            }
        );
    }

    await FollowupMessage(interaction.token, {
        embeds: [
            {
                title: `Weekly Guild Experience - ${guildName}`,
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
                        custom_id: `weekly-ducks`,
                        type: ComponentType.Button,
                        label: "Ducks",
                        style: buttonID === "ducks" ? ButtonStyle.Success : ButtonStyle.Primary,
                        disabled: buttonID === "ducks"
                    },
                    {
                        custom_id: `weekly-ducklings`,
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