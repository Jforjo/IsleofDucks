import { APIApplicationCommandInteractionDataStringOption, APIChatInputApplicationCommandInteraction, APIInteractionResponse, ApplicationCommandOptionType, ApplicationCommandType, InteractionResponseType, RESTPatchAPIApplicationCommandJSONBody } from "discord-api-types/v10";
import { ConvertSnowflakeToDate, CreateInteractionResponse, FollowupMessage, GetChannelMessage } from "../../discordUtils";
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
    // User sees the "[bot] is thinking..." message
    await CreateInteractionResponse(interaction.id, interaction.token, {
        type: InteractionResponseType.DeferredChannelMessageWithSource,
        data: { flags: 1 << 6 }
    });

    const timestamp = ConvertSnowflakeToDate(interaction.id);
    
    if (!interaction.data) {
        await FollowupMessage(interaction.token, {
            content: "Missing interaction data!",
        });
        return NextResponse.json(
            { success: false, error: 'Missing interaction data' },
            { status: 400 }
        );
    }
    if (!interaction.data.options) {
        await FollowupMessage(interaction.token, {
            content: "Missing interaction data!",
        });
        return NextResponse.json(
            { success: false, error: 'Missing interaction data options' },
            { status: 400 }
        );
    }
    
    const options = Object.fromEntries(interaction.data.options.map(option => {
        option = option as APIApplicationCommandInteractionDataStringOption;
        return [option.name, option.value];
    }));

    const message = await GetChannelMessage(interaction.channel.id, options.id);
    console.log(message);
    console.log(JSON.stringify(message));

    await FollowupMessage(interaction.token, {
        embeds: [
            {
                title: `Message ID: ${options.id}`,
                description: `\`\`\`${JSON.stringify(message)}\`\`\``,
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
export const CommandData: RESTPatchAPIApplicationCommandJSONBody = {
    name: "readmessage",
    description: "Outputs the Stringified JSON value of a message!",
    type: ApplicationCommandType.ChatInput,
    options: [
        {
            name: "id",
            description: "ID of the Message",
            type: ApplicationCommandOptionType.String,
            required: true
        }
    ],
}