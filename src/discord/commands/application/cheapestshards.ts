import { CreateInteractionResponse, FollowupMessage, IsleofDucks, SendMessage } from "@/discord/discordUtils";
import { arrayChunks } from "@/discord/utils";
import { SkyblockBazaarResponse } from "@zikeji/hypixel/dist/types/AugmentedTypes";
import { APIChatInputApplicationCommandInteraction, APIInteractionResponse, ApplicationCommandType, ComponentType, InteractionResponseType, MessageFlags, RESTPatchAPIApplicationCommandJSONBody } from "discord-api-types/v10";
import { NextResponse } from "next/server";

async function getShards() {
    const bzRes = await fetch("https://api.hypixel.net/v2/skyblock/bazaar");
    if (!bzRes.ok) return;
    const bzData = await bzRes.json() as SkyblockBazaarResponse;
    if (!bzData.success) return;
    return Object.entries(bzData.products)
        .filter(([key,]) => key.startsWith("SHARD_"))
        .sort(([, valueA], [, valueB]) => valueA.buy_summary[0].pricePerUnit - valueB.buy_summary[0].pricePerUnit)
    ;
}

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
        data: {
            flags: MessageFlags.Ephemeral
        }
    });

    const bzData = await getShards();
    if (!bzData) {
        await FollowupMessage(interaction.token, {
            content: "Failed to fetch shards"
        });
        return NextResponse.json(
            { success: false, error: "Failed to fetch shards" },
            { status: 400 }
        );
    }

    for (const chunk of arrayChunks(bzData, 39)) {
        await SendMessage(interaction.channel.id, {
            flags: MessageFlags.IsComponentsV2,
            components: [
                {
                    type: ComponentType.Container,
                    accent_color: IsleofDucks.colours.main,
                    components: chunk.map(([key, value]) => ({
                        type: ComponentType.TextDisplay,
                        content: `**${key}** - ${Number(value.quick_status.sellPrice).toLocaleString("en-US", { maximumFractionDigits: 2, minimumFractionDigits: 0 })} / ${Number(value.quick_status.buyPrice).toLocaleString("en-US", { maximumFractionDigits: 2, minimumFractionDigits: 0 })}`,
                    }))
                }
            ]
        })
    }

    await FollowupMessage(interaction.token, {
        content: `Done!`,
    });

    return NextResponse.json(
        { success: true },
        { status: 200 }
    );
}
export const CommandData: RESTPatchAPIApplicationCommandJSONBody = {
    name: "cheapestshards",
    description: "Shows the cheapest bazaar shards.",
    type: ApplicationCommandType.ChatInput,
}