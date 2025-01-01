import { APIChatInputApplicationCommandInteraction, APIInteractionResponse, ApplicationCommandType, InteractionResponseType } from "discord-api-types/v10";
import { CreateInteractionResponse, FollowupMessage, ConvertSnowflakeToDate } from "@/discord/discordUtils";
import { NextResponse } from "next/server";
import { updateGuildSuperlative } from "@/app/api/crons/superlative/route";
import { sql } from "@vercel/postgres";



export default async function(
    interaction: APIChatInputApplicationCommandInteraction
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

    const { rows } = await sql`SELECT lastUpdated FROM users ORDER BY lastUpdated DESC LIMIT 1`;
    // Update once per hour
    if (rows.length > 0 && rows[0].lastUpdated && rows[0].lastUpdated > timestamp.getTime() - 60 * 60 * 1000) {
        await FollowupMessage(interaction.token, {
            embeds: [
                {
                    title: "Failed to update superlative data",
                    description: [
                        "The last update was too recent.",
                        `Try again <t:${Math.floor(rows[0].lastUpdated / 1000) + ( 60 * 60 )}:R>`
                    ].join("\n"),
                    color: 0xFB9B00,
                    footer: {
                        text: `Response time: ${Date.now() - timestamp.getTime()}ms`,
                    },
                    timestamp: new Date().toISOString()
                }
            ]
        });
        return NextResponse.json(
            { success: false, error: "The last update was too recent." },
            { status: 400 }
        )
    }

    await FollowupMessage(interaction.token, {
        embeds: [
            {
                title: "Updating Superlative Data",
                description: "Updating data for Isle of Ducks...",
                fields: [
                    {
                        name: "Has the data been updated yet?",
                        value: [
                            "This embed will change once it has.",
                            `If it's still here <t:${Math.floor(timestamp.getTime() / 1000) + 60}:R> then try running the command again.`
                        ].join("\n")
                    }
                ],
                color: 0xFB9B00,
                footer: {
                    text: `Response time: ${Date.now() - timestamp.getTime()}ms`,
                },
                timestamp: new Date().toISOString()
            }
        ]
    });

    const ducks = await updateGuildSuperlative("Isle of Ducks");
    if (!ducks.ok) {
        await FollowupMessage(interaction.token, {
            embeds: [
                {
                    title: "Something went wrong",
                    description: "Failed to update Isle of Ducks superlative data",
                    color: 0xB00020,
                    footer: {
                        text: `Response time: ${Date.now() - timestamp.getTime()}ms`,
                    },
                    timestamp: new Date().toISOString()
                }
            ]
        })
        return NextResponse.json(
            { success: false, error: "Filed to update Isle of Ducks superlative data" },
            { status: 400 }
        );
    }

    await FollowupMessage(interaction.token, {
        embeds: [
            {
                title: "Updating Superlative Data",
                description: [
                    "Data for Isle of Ducks has been updated.",
                    "Updating data for Isle of Ducklings..."
                ].join("\n"),
                fields: [
                    {
                        name: "Has the data been updated yet?",
                        value: [
                            "This embed will change once it has.",
                            `If it's still here <t:${Math.floor(timestamp.getTime() / 1000) + 60}:R> then try running the command again.`
                        ].join("\n")
                    }
                ],
                color: 0xFB9B00,
                footer: {
                    text: `Response time: ${Date.now() - timestamp.getTime()}ms`,
                },
                timestamp: new Date().toISOString()
            }
        ]
    });

    const ducklings = await updateGuildSuperlative("Isle of Ducklings");
    if (!ducklings.ok) {
        await FollowupMessage(interaction.token, {
            embeds: [
                {
                    title: "Something went wrong",
                    description: "Failed to update Isle of Ducklings superlative data",
                    color: 0xB00020,
                    footer: {
                        text: `Response time: ${Date.now() - timestamp.getTime()}ms`,
                    },
                    timestamp: new Date().toISOString()
                }
            ]
        })
        return NextResponse.json(
            { success: false, error: "Filed to update Isle of Ducklings superlative data" },
            { status: 400 }
        );
    }

    await FollowupMessage(interaction.token, {
        embeds: [
            {
                title: "Superlative Data Updated",
                description: [
                    "Data for Isle of Duckls has been updated.",
                    "Data for Isle of Ducklings has been updated.",
                ].join("\n"),
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
export const CommandData = {
    name: "updatesuperlative",
    description: "Updates superlative data.",
    type: ApplicationCommandType.ChatInput
}