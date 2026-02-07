import { ConvertSnowflakeToDate, CreateInteractionResponse, FollowupMessage, IsleofDucks, SendMessage } from "@/discord/discordUtils";
import { getUsernameOrUUID } from "@/discord/hypixelUtils";
import { getScrambleScoresWithLimit } from "@/discord/utils";
import { APIChatInputApplicationCommandInteraction, APIInteractionResponse, ApplicationCommandOptionType, ComponentType, InteractionResponseType, MessageFlags, RESTPatchAPIApplicationCommandJSONBody } from "discord-api-types/v10";
import { NextResponse } from "next/server";

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
    await CreateInteractionResponse(interaction.id, interaction.token, {
        type: InteractionResponseType.DeferredChannelMessageWithSource,
    });
    const timestamp = ConvertSnowflakeToDate(interaction.id);

    const scrambleScores = await getScrambleScoresWithLimit(10);
    const users = await Promise.all(scrambleScores.map(async score => {
        const user = await getUsernameOrUUID(score.uuid);
        if (!user.success) throw new Error(user.message);
        return {
            name: user.name,
            score: score.score,
        };
    })).catch((err) => {
        console.error(err.message);
        return {
            success: false,
            message: err.message
        };
    });

    if ("success" in users && !users.success) {
        await SendMessage(interaction.token, {
            embeds: [
                {
                    title: "Something went wrong!",
                    description: users.message,
                    color: IsleofDucks.colours.error,
                    footer: {
                        text: `Response time: ${Date.now() - timestamp.getTime()}ms`,
                    },
                    timestamp: new Date().toISOString()
                }
            ]
        });
        return NextResponse.json(
            { success: false, error: users.message },
            { status: 400 }
        );
    }

    await FollowupMessage(interaction.token, {
        flags: MessageFlags.IsComponentsV2,
        components: [
            {
                type: ComponentType.Container,
                accent_color: IsleofDucks.colours.main,
                components: [
                    {
                        type: ComponentType.TextDisplay,
                        content: "## Scramble Leaderboard",
                    },
                    { type: ComponentType.Separator },
                    {
                        type: ComponentType.TextDisplay,
                        content: (users as { name: string; score: number; }[])
                            .sort((a, b) => b.score - a.score)
                            .map((user, index) => `**${index + 1})** ${user.name} - ${user.score}`).join("\n"),
                    },
                    { type: ComponentType.Separator },
                    {
                        type: ComponentType.TextDisplay,
                        content: `Response time: ${Date.now() - timestamp.getTime()}ms • <t:${Math.floor(Date.now() / 1000)}:F>`,
                    },
                ]
            }
        ]
    });

    return NextResponse.json(
        { success: true },
        { status: 200 }
    );
}
export const CommandData: RESTPatchAPIApplicationCommandJSONBody = {
    name: "leaderboard",
    description: "Shows the top 10 players in verious catagories.",
    options: [
        {
            type: ApplicationCommandOptionType.Subcommand,
            name: "scramble",
            description: "Shows the top 10 players with the highest scramble score.",
        }
    ]
}