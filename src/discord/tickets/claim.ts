import { APIInteractionResponse, APIMessageComponentButtonInteraction, ComponentType, InteractionResponseType, Snowflake, TextInputStyle } from "discord-api-types/v10";
import { CreateInteractionResponse, GetChannelMessages, IsleofDucks } from "@/discord/discordUtils";
import { NextResponse } from "next/server";

export async function CheckGiveaways(
    channelId: Snowflake, 
    discordId: Snowflake
): Promise<
    undefined | {
        channelId: Snowflake;
        messageId: Snowflake;
    }[]
> {
    const messagesToCheck = await GetChannelMessages(channelId, { limit: 20 });
    if (!messagesToCheck) return;

    const giveaways: {
        title: string;
        winner: Snowflake;
        messageID: Snowflake;
    }[] = [];

    for (const message of messagesToCheck) {
        // Backslash: .*+?^=!:${}()|[]/\
        const newWinnerCheck = /The new winner of the giveaway (.*) is <@(.*)>. Congrats!/gm.exec(message.content);
        if (newWinnerCheck) {
            const title = newWinnerCheck[1];
            const winner = newWinnerCheck[2];
            if (giveaways.filter(gw => gw.title === title).length === 0) {
                giveaways.push({
                    title: title,
                    winner: winner,
                    messageID: message.id
                })
            }
        }
        if (!('embeds' in message)) continue;
        if (message.embeds.length === 0) continue;
        if (!('description' in message.embeds[0])) continue;
        if (!message.embeds[0].description) continue;
        const winnerCheck = /<@(.*)> won the giveaway of \[(.*)\]/gm.exec(message.embeds[0].description);
        if (winnerCheck) {
            const winner = winnerCheck[1];
            const title = winnerCheck[2];
            if (giveaways.filter(gw => gw.title === title).length === 0) {
                giveaways.push({
                    title: title,
                    winner: winner,
                    messageID: message.id
                })
            }
        }
    }

    const won = giveaways.filter(gw => gw.winner === discordId);
    if (won.length === 0) return;
    return won.map(gw => ({channelId: channelId, messageId: gw.messageID}));
}

export async function CheckAllGiveaways(
    userId: Snowflake
): Promise<
    {
        channelId: Snowflake;
        messageId: Snowflake;
    }[]
> {
    const giveawaysWon: {
        channelId: Snowflake;
        messageId: Snowflake;
    }[] = [];

    const giveawayMessagesPromise = CheckGiveaways(IsleofDucks.channels.reqgiveaways, userId);
    const reqgiveawayMessagesPromise = CheckGiveaways(IsleofDucks.channels.flashgiveaways, userId);
    const flashgiveawayMessagesPromise = CheckGiveaways(IsleofDucks.channels.giveaways, userId);

    const giveawayMessages = await giveawayMessagesPromise;
    const reqgiveawayMessages = await reqgiveawayMessagesPromise;
    const flashgiveawayMessages = await flashgiveawayMessagesPromise;

    if (giveawayMessages) giveawaysWon.push(...giveawayMessages);
    if (reqgiveawayMessages) giveawaysWon.push(...reqgiveawayMessages);
    if (flashgiveawayMessages) giveawaysWon.push(...flashgiveawayMessages);

    const messagesToCheck = await GetChannelMessages(IsleofDucks.channels.giveawaypayout, {
        limit: 40
    });
    if (messagesToCheck) {
        for (const giveaway of giveawaysWon) {
            for (const message of messagesToCheck) {
                if (!('content' in message)) continue;
                if (!message.content) continue;
                if (message.content.includes(giveaway.messageId)) {
                    giveawaysWon.filter(gw => gw.messageId !== giveaway.messageId);
                    break;
                }
            }
        }
    }

    return giveawaysWon;
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
    const member = interaction.member;
    // If guild exists then so should member, but imma still check it
    if (!member) {
        await CreateInteractionResponse(interaction.id, interaction.token, {
            type: InteractionResponseType.ChannelMessageWithSource,
            data: {
                content: "Failed to detect the server member",
                flags: 1 << 6
            }
        });
        return NextResponse.json(
            { success: false, error: "Failed to detect the server member" },
            { status: 400 }
        );
    }

    const giveawaysWon = await CheckAllGiveaways(member.user.id);

    if (giveawaysWon.length === 0) {
        // Even if the automatic check failed, we should ask them to make sure
        await CreateInteractionResponse(interaction.id, interaction.token, {
            type: InteractionResponseType.Modal,
            data: {
                custom_id: "claim",
                title: "Claim Giveaway",
                components: [
                    {
                        type: ComponentType.ActionRow,
                        components: [
                            {
                                type: ComponentType.TextInput,
                                custom_id: "giveaway",
                                label: "The message link for the giveaway you won",
                                style: TextInputStyle.Short,
                                required: true,
                            },
                        ],
                    },
                ],
            }
        });
        return NextResponse.json(
            { success: true },
            { status: 200 }
        );
    }

    const { default: command } = await import(`@/discord/commands/modal/${interaction.data.custom_id.split('-')[1].toLowerCase()}.ts`);
    if (command) {
        return await command(interaction, giveawaysWon);
    }

    return NextResponse.json(
        { success: true },
        { status: 200 }
    );
}
