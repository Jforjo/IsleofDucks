import { CreateInteractionResponse, FollowupMessage, IsleofDucks, SendMessage } from "@/discord/discordUtils";
import { SkyblockBazaarResponse } from "@zikeji/hypixel/dist/types/AugmentedTypes";
import { APIChatInputApplicationCommandInteraction, APIInteractionResponse, ApplicationCommandType, ComponentType, InteractionResponseType, MessageFlags } from "discord-api-types/v10";
import { NextResponse } from "next/server";

const mutations = {
    ASHWREATH: {
        coins: 10000,
        copper: 5
    },
    CHOCONUT: {
        coins: 10000,
        copper: 5
    },
    DUSTGRAIN: {
        coins: 10000,
        copper: 5
    },
    GLOOMGOURD: {
        coins: 10000,
        copper: 5
    },
    LONELILY: {
        coins: 50000,
        copper: 25
    },
    SCOURROOT: {
        coins: 10000,
        copper: 5
    },
    SHADEVINE: {
        coins: 10000,
        copper: 5
    },
    VEILSHROOM: {
        coins: 10000,
        copper: 5
    },
    WITHERBLOOM: {
        coins: 40000,
        copper: 20
    },
    CHOCOBERRY: {
        coins: 60000,
        copper: 30
    },
    CINDERSHADE: {
        coins: 80000,
        copper: 40
    },
    COALROOT: {
        coins: 80000,
        copper: 40
    },
    CREAMBLOOM: {
        coins: 60000,
        copper: 30
    },
    DUSKBLOOM: {
        coins: 80000,
        copper: 40
    },
    THORNSHADE: {
        coins: 80000,
        copper: 40
    },
    BLASTBERRY: {
        coins: 240000,
        copper: 120
    },
    CHEESEBITE: {
        coins: 80000,
        copper: 80
    },
    CHLORONITE: {
        coins: 40000,
        copper: 20
    },
    DO_NOT_EACH_SHROOM: {
        coins: 240000,
        copper: 120
    },
    FLESHTRAP: {
        coins: 360000,
        copper: 180
    },
    MAGIC_JELLYBEAN: {
        coins: 160000,
        copper: 80
    },
    NOCTILUME: {
        coins: 300000,
        copper: 150
    },
    SNOOZLING: {
        coins: 600000,
        copper: 300
    },
    SOGGYBUD: {
        coins: 60000,
        copper: 30
    },
    CHORUS_FRUIT: {
        coins: 600000,
        copper: 300
    },
    PLANTBOY_ADVANCE: {
        coins: 700000,
        copper: 350
    },
    PUFFERCLOUD: {
        coins: 1000000,
        copper: 500
    },
    SHELLFRUIT: {
        coins: 500000,
        copper: 250
    },
    STARTLEVINE: {
        coins: 500000,
        copper: 250
    },
    STOPLIGHT_PETAL: {
        coins: 4000000,
        copper: 2000
    },
    THUNDERLING: {
        coins: 800000,
        copper: 400
    },
    TURTLELLINI: {
        coins: 240000,
        copper: 120
    },
    ZOMBUD: {
        coins: 1000000,
        copper: 500
    },
    ALL_IN_ALOE: {
        coins: 4600000,
        copper: 2300
    },
    DEVOURER: {
        coins: 10000000,
        copper: 5000
    },
    GLASSCORN: {
        coins: 4000000,
        copper: 2000
    },
    GODSEED: {
        coins: 1000000,
        copper: 5000
    },
    JERRYFLOWER: {
        coins: 20000,
        copper: 10
    },
    PHANTOMLEAF: {
        coins: 3000000,
        copper: 1500
    },
    TIMESTALK: {
        coins: 19000000,
        copper: 9500
    },
};

async function getMutations(): Promise<[keyof typeof mutations, SkyblockBazaarResponse["products"][string]][] | undefined> {
    const bzRes = await fetch("https://api.hypixel.net/v2/skyblock/bazaar");
    if (!bzRes.ok) return;
    const bzData = await bzRes.json() as SkyblockBazaarResponse;
    if (!bzData.success) return;
    return Object.entries(bzData.products)
        .filter(([key,]) => mutations.hasOwnProperty(key))
        .map(([key, value]) => [key as keyof typeof mutations, value])
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

    const bzData = await getMutations();
    if (!bzData) {
        await FollowupMessage(interaction.token, {
            content: "Failed to fetch mutations"
        });
        return NextResponse.json(
            { success: false, error: "Failed to fetch mutations" },
            { status: 400 }
        );
    }

    const mutationPrices = bzData.map(([key, value]) => {
        const mutationInfo = mutations[key];
        const sellPrice = value.quick_status.sellPrice;
        const buyPrice = value.quick_status.buyPrice;
        return {
            mutation: key,
            sell: ( mutationInfo.coins + sellPrice ) / mutationInfo.copper,
            buy: ( mutationInfo.coins + buyPrice ) / mutationInfo.copper
        };
    }).sort((a, b) => a.sell - b.sell);

    // for (const chunk of arrayChunks(mutationPrices, 39)) {
        await SendMessage(interaction.channel.id, {
            flags: MessageFlags.IsComponentsV2,
            components: [
                {
                    type: ComponentType.Container,
                    accent_color: IsleofDucks.colours.main,
                    components: mutationPrices.map(({ mutation, sell, buy }) => ({
                        type: ComponentType.TextDisplay,
                        content: `**${mutation}** - ${sell.toLocaleString("en-US", { maximumFractionDigits: 2, minimumFractionDigits: 0 })} / ${buy.toLocaleString("en-US", { maximumFractionDigits: 2, minimumFractionDigits: 0 })}`,
                    }))
                }
            ]
        })
    // }

    await FollowupMessage(interaction.token, {
        content: `Done!`,
    });

    return NextResponse.json(
        { success: true },
        { status: 200 }
    );
}
export const CommandData = {
    name: "cointocopper",
    description: "Shows the cheapest coins-to-copper mutations on the bazaar.",
    type: ApplicationCommandType.ChatInput,
}
export const RequiredRoles = [
    IsleofDucks.roles.verified
];
