import { APIInteraction, APIInteractionResponse, ApplicationCommandType, InteractionResponseType } from "discord-api-types/v10";
import { ConvertSnowflakeToDate } from "../../discordUtils";
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
    const interaction = req.body as APIInteraction | null;
    if (!interaction) {
        return NextResponse.json(
            { success: false, error: 'Missing request body' },
            { status: 400 }
        );
    }

    const timestamp = ConvertSnowflakeToDate(interaction.id);
    return NextResponse.json({
        type: InteractionResponseType.ChannelMessageWithSource,
        data: {
            content: undefined,
            embeds: [
                {
                    title: "Pong!",
                    color: parseInt("FF69B4", 16),
                    footer: {
                        text: `Response time: ${Date.now() - timestamp.getTime()}ms`,
                    },
                    timestamp: new Date().toISOString()
                }
            ],
        },
    }, { status: 200 });
}
export const CommandData = {
    name: "ping",
    description: "Pings the bot!",
    type: ApplicationCommandType.ChatInput,
}