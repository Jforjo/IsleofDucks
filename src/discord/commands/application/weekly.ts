import { APIChatInputApplicationCommandInteraction, APIInteractionResponse, ApplicationCommandType, InteractionResponseType } from "discord-api-types/v10";
import { getUsernameOrUUID, getGuildData } from "@/discord/hypixelUtils";
import { getImmunePlayers } from "@/discord/utils";
import { CreateInteractionResponse, FollowupMessage, ConvertSnowflakeToDate, IsleofDucks } from "@/discord/discordUtils";
import { NextRequest, NextResponse } from "next/server";

export default async function(
    req: NextRequest
): Promise<
    NextResponse<
        {
            success: boolean;
            error?: string;
        } | APIInteractionResponse
    >
> {
    const interaction = await req.json() as APIChatInputApplicationCommandInteraction | null;
    if (!interaction) {
        return NextResponse.json(
            { success: false, error: 'Missing request body' },
            { status: 400 }
        );
    }

    // User sees the "[bot] is thinking..." message
    await CreateInteractionResponse(interaction.id, interaction.token, {
        type: InteractionResponseType.DeferredChannelMessageWithSource,
    });
    
    const timestamp = ConvertSnowflakeToDate(interaction.id);

    const guildResponse = await getGuildData("Isle of Ducks");
    if (!guildResponse.success) {
        let content = undefined;
        if (guildResponse.ping) content = `<@${IsleofDucks.staticIDs.Jforjo}>`;
        await FollowupMessage(interaction.token, {
            content: content,
            embeds: [
                {
                    title: "Something went wrong!",
                    description: guildResponse.message,
                    color: parseInt("B00020", 16),
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
            content: undefined,
            embeds: [
                {
                    title: "Something went wrong!",
                    description: "Failed to fetch the immune players",
                    color: parseInt("B00020", 16),
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
        content: undefined,
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
    return NextResponse.json(
        { success: true },
        { status: 200 }
    );
}
export const CommandData = {
    name: "weekly",
    description: "Displays the weekly GEXP for Isle of Ducks",
    type: ApplicationCommandType.ChatInput,
}