import { APIApplicationCommandInteractionDataStringOption, APIChatInputApplicationCommandInteraction, APIInteractionResponse, ApplicationCommandOptionType, ApplicationCommandType, InteractionResponseType, RESTPatchAPIApplicationCommandJSONBody } from "discord-api-types/v10";
import { CreateInteractionResponse, FollowupMessage, IsleofDucks, CheckEmbedExists, GetEmbedData, SendMessage, EditMessage } from "@/discord/discordUtils";
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
        data: { flags: 1 << 6 },
    });

    let member;
    if (interaction.member) member = interaction.member;
    else {
        await FollowupMessage(interaction.token, {
            content: "Could not find who ran the command!",
        });
        return NextResponse.json(
            { success: false, error: "Could not find who ran the command" },
            { status: 400 }
        )
    }
    if (!member.roles.includes(IsleofDucks.roles.admin)) {
        await FollowupMessage(interaction.token, {
            content: "You don't have permission to use this command!",
        });
        return NextResponse.json(
            { success: false, error: "You lack the permission to run this command" },
            { status: 403 }
        )
    }
    
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

    const embedExists = await CheckEmbedExists(options.name);
    if (!embedExists) {
        await FollowupMessage(interaction.token, {
            content: "Embed does not exist!",
        });
        return NextResponse.json(
            { success: false, error: 'Embed does not exist' },
            { status: 400 }
        )
    }

    const embedData = await GetEmbedData(options.name);
    if (!embedData.success) {
        await FollowupMessage(interaction.token, {
            content: "Failed to get embed data!",
        });
        return NextResponse.json(
            { success: false, error: 'Failed to get embed data' },
            { status: 400 }
        );
    }

    if (options.message) {
        await EditMessage(interaction.channel.id, options.message, Object.assign({
            content: embedData.content,
            components: embedData.components ? JSON.parse(embedData.components) : undefined,
        }, JSON.parse(embedData.embeds)), embedData.attachments ? JSON.parse(embedData.attachments) : undefined);
    } else {
        await SendMessage(interaction.channel.id, Object.assign({
            content: embedData.content,
            components: embedData.components ? JSON.parse(embedData.components) : undefined,
        }, JSON.parse(embedData.embeds)), embedData.attachments ? JSON.parse(embedData.attachments) : undefined);
    }

    await FollowupMessage(interaction.token, {
        content: "Done!",
    });
    return NextResponse.json(
        { success: true },
        { status: 200 }
    )
}
export const CommandData: RESTPatchAPIApplicationCommandJSONBody = {
    name: "embed",
    description: "Sends an embed to the current channel.",
    type: ApplicationCommandType.ChatInput,
    options: [
        {
            name: "name",
            description: "Name of the embed",
            type: ApplicationCommandOptionType.String,
            required: true
        },
        {
            name: "message",
            description: "ID of the message to edit in the same channel",
            type: ApplicationCommandOptionType.String,
            required: false
        }
    ],
}