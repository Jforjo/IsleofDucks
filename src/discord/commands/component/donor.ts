import { ConvertSnowflakeToDate, CreateInteractionResponse, FollowupMessage, formatNumber } from "@/discord/discordUtils";
import { getDonations, getDonationsCount, getTotalDonation } from "@/discord/utils";
import { APIInteractionResponse, APIMessageComponentButtonInteraction, ButtonStyle, ComponentType, InteractionResponseType } from "discord-api-types/v10";
import { NextResponse } from "next/server";

async function viewDonations(
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
    const donations = await getDonations(( parseInt(page) - 1 ) * 25, 25);
    const donationCount = await getDonationsCount();
    const donationsTotal = await getTotalDonation();
    if (!donations.length || !donationCount || !donationsTotal) {
        await FollowupMessage(interaction.token, {
            content: null,
            embeds: [
                {
                    title: "Something went wrong!",
                    description: "Could not get donations",
                    color: 0xB00020,
                    footer: {
                        text: `Response time: ${Date.now() - timestamp.getTime()}ms`,
                    },
                    timestamp: new Date().toISOString()
                }
            ],
        });
        return NextResponse.json(
            { success: false, error: "Could not get donations" },
            { status: 400 }
        );
    }

    if (donations.length === 0 || donationCount === 0 || donationsTotal === 0) {
        await FollowupMessage(interaction.token, {
            content: null,
            embeds: [
                {
                    title: "There are no donations!",
                    color: 0xFB9B00,
                    footer: {
                        text: `Response time: ${Date.now() - timestamp.getTime()}ms`,
                    },
                    timestamp: new Date().toISOString()
                }
            ],
        });
        return NextResponse.json(
            { success: false, error: "There are no donations" },
            { status: 400 }
        )
    }

    await FollowupMessage(interaction.token, {
        embeds: [
            {
                title: `Donations - ${formatNumber(donationsTotal, 3)}`,
                color: 0xFB9B00,
                description: donations.map(donation => `<@${donation.discordid}> - ${formatNumber(donation.donation, 3)}`).join('\n'),
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
                        custom_id: `donor-page_${parseInt(page) - 1}`,
                        type: ComponentType.Button,
                        label: '◀️',
                        style: ButtonStyle.Primary,
                        disabled: page == '1'
                    },
                    {
                        custom_id: `donor-page_${parseInt(page) + 1}`,
                        type: ComponentType.Button,
                        label: '▶️',
                        style: ButtonStyle.Primary,
                        disabled: Math.ceil(donationCount / 25) < parseInt(page) + 1
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

    return await viewDonations(interaction);
}