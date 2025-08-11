import { ConvertSnowflakeToDate, CreateInteractionResponse, FollowupMessage, IsleofDucks } from "@/discord/discordUtils";
import { getEmojis, getTotalEmojis } from "@/discord/utils";
import { APIInteractionResponse, APIMessageComponentButtonInteraction, ButtonStyle, ComponentType, InteractionResponseType } from "discord-api-types/v10";
import { NextResponse } from "next/server";

async function viewEmojis(
    interaction: APIMessageComponentButtonInteraction
): Promise<
    NextResponse<
        {
            success: boolean;
            error?: string;
        } | APIInteractionResponse
    >
> {
    const timestamp = ConvertSnowflakeToDate(interaction.id);
    
    const page = interaction.data.custom_id.split("-")[1].split('_')[1];
    const emojis = await getEmojis(( parseInt(page) - 1 ) * 25, 25);
    const emojisCount = await getTotalEmojis();
    if (!emojis.length || !emojisCount) {
        await FollowupMessage(interaction.token, {
            embeds: [
                {
                    title: "Something went wrong!",
                    description: "Could not get emojis",
                    color: IsleofDucks.colours.error,
                    footer: {
                        text: `Response time: ${Date.now() - timestamp.getTime()}ms`,
                    },
                    timestamp: new Date().toISOString()
                }
            ]
        });
        return NextResponse.json(
            { success: false, error: "Could not get emojis" },
            { status: 400 }
        );
    }
    if (emojis.length === 0 || emojisCount === 0) {
        await FollowupMessage(interaction.token, {
            embeds: [
                {
                    title: "Something went wrong!",
                    description: "No emojis found",
                    color: IsleofDucks.colours.error,
                    footer: {
                        text: `Response time: ${Date.now() - timestamp.getTime()}ms`,
                    },
                    timestamp: new Date().toISOString()
                }
            ]
        });
        return NextResponse.json(
            { success: false, error: "No emojis found" },
            { status: 400 }
        );
    }

    await FollowupMessage(interaction.token, {
        embeds: [
            {
                title: "Emojis",
                color: IsleofDucks.colours.main,
                description: emojis.map(emoji => `"\:${emoji.replacetext}\:" -> "${emoji.withtext}"`).join("\n"),
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
                        custom_id: `chateomji-page_${parseInt(page) - 1}`,
                        type: ComponentType.Button,
                        label: '◀️',
                        style: ButtonStyle.Primary,
                        disabled: page == '1'
                    },
                    {
                        custom_id: `chateomji-page_${parseInt(page) + 1}`,
                        type: ComponentType.Button,
                        label: '▶️',
                        style: ButtonStyle.Primary,
                        disabled: Math.ceil(emojisCount / 25) < parseInt(page) + 1
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
    // ACK response and update the original message
    await CreateInteractionResponse(interaction.id, interaction.token, {
        type: InteractionResponseType.DeferredMessageUpdate,
    });

    return await viewEmojis(interaction);
}