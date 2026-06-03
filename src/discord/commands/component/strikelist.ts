import { ConvertSnowflakeToDate, CreateInteractionResponse, FollowupMessage } from "@/discord/discordUtils";
import { getAllStrikesLimited, getTotalStrikesCount } from "@/discord/utils";
import { APIInteractionResponse, APIMessageComponentButtonInteraction, ButtonStyle, ComponentType, InteractionResponseType } from "discord-api-types/v10";
import { NextResponse } from "next/server";

async function viewStrikes(
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
    const strikes = await getAllStrikesLimited(( parseInt(page) - 1 ) * 25, 25);
    const strikesCount = await getTotalStrikesCount();
    if (!strikes) {
        await FollowupMessage(interaction.token, {
            content: null,
            embeds: [
                {
                    title: "Something went wrong!",
                    description: "Could not get strikes",
                    color: 0xB00020,
                    footer: {
                        text: `Response time: ${Date.now() - timestamp.getTime()}ms`,
                    },
                    timestamp: new Date().toISOString()
                }
            ],
        });
        return NextResponse.json(
            { success: false, error: "Could not get strikes" },
            { status: 400 }
        )
    }

    if (strikes.length === 0 || strikesCount === 0) {
        await FollowupMessage(interaction.token, {
            content: null,
            embeds: [
                {
                    title: "There are no strikes!",
                    color: 0xFB9B00,
                    footer: {
                        text: `Response time: ${Date.now() - timestamp.getTime()}ms`,
                    },
                    timestamp: new Date().toISOString()
                }
            ],
        });
        return NextResponse.json(
            { success: false, error: "There are no strikes" },
            { status: 400 }
        )
    }

    await FollowupMessage(interaction.token, {
        content: undefined,
        embeds: [
            {
                title: "Strikes",
                color: 0xFB9B00,
                description: strikes.map(user => {
                    return `<@${user.discordid}> - ${user.discordid}: ${user.strikes} strike${user.strikes !== 1 ? 's' : ''}`;
                }).join('\n'),
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
                        custom_id: `strikelist-page_${parseInt(page) - 1}`,
                        type: ComponentType.Button,
                        label: '◀️',
                        style: ButtonStyle.Primary,
                        disabled: page == '1'
                    },
                    {
                        custom_id: `strikelist-search`,
                        type: ComponentType.Button,
                        label: `Page ${page}/${Math.ceil(strikesCount / 25)}`,
                        style: ButtonStyle.Secondary,
                        disabled: false
                    },
                    {
                        custom_id: `strikelist-page_${parseInt(page) + 1}`,
                        type: ComponentType.Button,
                        label: '▶️',
                        style: ButtonStyle.Primary,
                        disabled: Math.ceil(strikesCount / 25) < parseInt(page) + 1
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
    if (interaction.data.custom_id === 'strikelist-search') {
        await CreateInteractionResponse(interaction.id, interaction.token, {
            type: InteractionResponseType.ChannelMessageWithSource,
            data: {
                content: "o/",
                flags: 1 << 6
            }
        });
        return NextResponse.json(
            { success: false, error: "Unknown command" },
            { status: 404 }
        );
    }

    // ACK response and update the original message
    await CreateInteractionResponse(interaction.id, interaction.token, {
        type: InteractionResponseType.DeferredMessageUpdate,
    });

    return await viewStrikes(interaction);
}