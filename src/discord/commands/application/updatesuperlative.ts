import { APIChatInputApplicationCommandInteraction, APIInteractionResponse, ApplicationCommandType, InteractionResponseType } from "discord-api-types/v10";
import { CreateInteractionResponse, FollowupMessage, ConvertSnowflakeToDate } from "@/discord/discordUtils";
import { NextResponse } from "next/server";
import { sql } from "@vercel/postgres";
import { updateGuildSuperlative } from "@/discord/utils";



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

    await FollowupMessage(interaction.token, {
        embeds: [
            {
                title: "Updating Superlative Data",
                description: "Updating data for Isle of Ducks...",
                fields: [
                    {
                        name: "Has the data been updated yet?",
                        value: [
                            "This embed will probably not change once it has.",
                            `If it's still here <t:${Math.floor(timestamp.getTime() / 1000) + 60}:R> then try running the command again.`,
                            "It may need to be ran about 4 times."
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

    const ducks = await updateGuildSuperlative("Isle of Ducks", true);
    if (!ducks.success) {
        await FollowupMessage(interaction.token, {
            embeds: [
                {
                    title: "Something went wrong",
                    description: ducks.message,
                    color: 0xB00020,
                    footer: {
                        text: `Response time: ${Date.now() - timestamp.getTime()}ms`,
                    },
                    timestamp: new Date().toISOString()
                }
            ]
        })
        return NextResponse.json(
            { success: false, error: ducks.message },
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
                            "This embed will probably not change once it has.",
                            `If it's still here <t:${Math.floor(timestamp.getTime() / 1000) + 60}:R> then try running the command again.`,
                            "It may need to be ran about 4 times."
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

    const ducklings = await updateGuildSuperlative("Isle of Ducklings", true);
    if (!ducklings.success) {
        await FollowupMessage(interaction.token, {
            embeds: [
                {
                    title: "Something went wrong",
                    description: ducklings.message,
                    color: 0xB00020,
                    footer: {
                        text: `Response time: ${Date.now() - timestamp.getTime()}ms`,
                    },
                    timestamp: new Date().toISOString()
                }
            ]
        })
        return NextResponse.json(
            { success: false, error: ducklings.message, },
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