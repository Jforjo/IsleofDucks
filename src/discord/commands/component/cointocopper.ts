import { ConvertSnowflakeToDate, CreateInteractionResponse, ErrorEmbed, FollowupMessage, IsleofDucks } from "@/discord/discordUtils";
import { calcPetLevel, getPets, getProfiles } from "@/discord/hypixelUtils";
import { getUserDataFromDiscordID } from "@/discord/utils";
import { APIInteractionResponse, APIMessageComponentButtonInteraction, ButtonStyle, ComponentType, InteractionResponseType, MessageFlags } from "discord-api-types/v10";
import { NextResponse } from "next/server";
import { getMutations, mutations } from "../application/cointocopper";

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
    const timestamp = ConvertSnowflakeToDate(interaction.id);
    // ACK response and update the original message
    await CreateInteractionResponse(interaction.id, interaction.token, {
        type: InteractionResponseType.DeferredMessageUpdate,
    });
    const userId = interaction.member?.user.id || interaction.user?.id;
    if (!userId) {
        await FollowupMessage(interaction.token, {
            flags: MessageFlags.Ephemeral | MessageFlags.IsComponentsV2,
            components: ErrorEmbed("Unable to identify user.", timestamp, true)
        }, null, true);
        return NextResponse.json(
            { success: false, error: "Unable to identify user." },
            { status: 400 }
        );
    }

    const userData = await getUserDataFromDiscordID(userId);
    if (!userData.success || !userData.data.minecraft) {
        await FollowupMessage(interaction.token, {
            flags: MessageFlags.Ephemeral | MessageFlags.IsComponentsV2,
            components: ErrorEmbed("Unable to fetch your linked Minecraft account data. Please make sure you have linked your account using /verify.", timestamp, true)
        }, null, true);
        return NextResponse.json(
            { success: false, error: "Unable to fetch user data." },
            { status: 400 }
        );
    }

    const profileData = await getProfiles(userData.data.minecraft.uuid);
    if (!profileData.success || !profileData.profiles) {
        await FollowupMessage(interaction.token, {
            flags: MessageFlags.Ephemeral | MessageFlags.IsComponentsV2,
            components: ErrorEmbed("Unable to fetch your linked Minecraft account data. Please make sure you have linked your account using /verify.", timestamp, true)
        }, null, true);
        return NextResponse.json(
            { success: false, error: "Unable to fetch user data." },
            { status: 400 }
        );
    }

    const playerData = profileData.profiles.find(profile => profile.selected)?.members[userData.data.minecraft.uuid]?.player_data;
    if (!playerData) {
        await FollowupMessage(interaction.token, {
            flags: MessageFlags.Ephemeral | MessageFlags.IsComponentsV2,
            components: ErrorEmbed("Unable to fetch profile data.", timestamp, true)
        }, null, true);
        return NextResponse.json(
            { success: false, error: "Unable to fetch profile data." },
            { status: 400 }
        );
    }
    if (!("garden_chips" in playerData)) {
        await FollowupMessage(interaction.token, {
            flags: MessageFlags.Ephemeral | MessageFlags.IsComponentsV2,
            components: ErrorEmbed("Unable to find garden chip data in profile data.", timestamp, true)
        }, null, true);
        return NextResponse.json(
            { success: false, error: "Unable to find garden chip data in profile data." },
            { status: 400 }
        );
    }
    const chips = playerData.garden_chips as {
        cropshot?: number;
        mechamind?: number;
        overdrive?: number;
        quickdraw?: number;
        sowledge?: number;
        hypercharge?: number;
        rarefinder?: number;
        synthesis?: number;
        evergreen?: number;
        vermin_vaporizer?: number;
    }
    // if (!("synthesis" in chips) || chips.synthesis === undefined) {
    //     await FollowupMessage(interaction.token, {
    //         flags: MessageFlags.Ephemeral | MessageFlags.IsComponentsV2,
    //         components: ErrorEmbed("Unable to find synthesis data in garden chip data.", timestamp, true)
    //     }, null, true);
    //     return NextResponse.json(
    //         { success: false, error: "Unable to find synthesis data in garden chip data." },
    //         { status: 400 }
    //     );
    // }

    const synthChipLevel = chips.synthesis || 0;
    const synthBonus = synthChipLevel <= 10 ? synthChipLevel * 1 : synthChipLevel <= 15 ? synthChipLevel * 1.5 : synthChipLevel * 2;

    const petData = await getPets(profileData.profiles, userData.data.minecraft.uuid);
    if (!petData.success || !petData.pets) {
        await FollowupMessage(interaction.token, {
            flags: MessageFlags.Ephemeral | MessageFlags.IsComponentsV2,
            components: ErrorEmbed("Unable to fetch pet data.", timestamp, true)
        }, null, true);
        return NextResponse.json(
            { success: false, error: "Unable to fetch pet data." },
            { status: 400 }
        );
    }
    const rdragExp = petData.pets.find(pet => pet.tier === "LEGENDARY" && pet.type === "ROSE_DRAGON")?.exp || 0;
    const rdragLevel = Math.floor(calcPetLevel(rdragExp));
    // if (rdragLevel < 101) {
    //     await FollowupMessage(interaction.token, {
    //         flags: MessageFlags.Ephemeral | MessageFlags.IsComponentsV2,
    //         components: ErrorEmbed(`Your Rose Dragon is not high enough level to use the Rose Dragon calculator. (Level ${rdragLevel}/101)`, timestamp, true)
    //     }, null, true);
    //     return NextResponse.json(
    //         { success: false, error: "Your Rose Dragon is not high enough level to use the Rose Dragon calculator." },
    //         { status: 400 }
    //     );
    // }
    const copperBonus = rdragLevel < 101 ? 0 : rdragLevel / 10;

    const bzData = await getMutations();
    if (!bzData) {
        await FollowupMessage(interaction.token, {
            flags: MessageFlags.Ephemeral | MessageFlags.IsComponentsV2,
            components: ErrorEmbed("Failed to fetch mutation data from the bazaar API", timestamp, true)
        }, null, true);
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
            sell: ( mutationInfo.coins + sellPrice ) / ( mutationInfo.copper * (1 + copperBonus / 100 + synthBonus / 100) ),
            buy: ( mutationInfo.coins + buyPrice ) / ( mutationInfo.copper * (1 + copperBonus / 100 + synthBonus / 100) )
        };
    }).sort((a, b) => a.sell - b.sell);

    await FollowupMessage(interaction.token, {
        flags: MessageFlags.IsComponentsV2,
        components: [
            {
                type: ComponentType.Container,
                accent_color: IsleofDucks.colours.main,
                components: [
                    {
                        type: ComponentType.TextDisplay,
                        content: `## Cheapest Coins-to-Copper Mutations (with Rose Dragon Bonus: ${copperBonus}% • Synthesis Bonus: ${synthBonus}%)`
                    },
                    { type: ComponentType.Separator },
                    {
                        type: ComponentType.TextDisplay,
                        content: mutationPrices.map(({ mutation, sell, buy }) => 
                            `**${mutation}** - ${sell.toLocaleString("en-US", { maximumFractionDigits: 2, minimumFractionDigits: 0 })} / ${buy.toLocaleString("en-US", { maximumFractionDigits: 2, minimumFractionDigits: 0 })}`
                        ).join("\n")
                    },
                    { type: ComponentType.Separator },
                    {
                        type: ComponentType.TextDisplay,
                        content: `-# Response time: ${Date.now() - timestamp.getTime()}ms • <t:${Math.floor(Date.now() / 1000)}:F>`
                    }
                ]
            }
        ]
    }, null, true);

    return NextResponse.json(
        { success: true },
        { status: 200 }
    );
}