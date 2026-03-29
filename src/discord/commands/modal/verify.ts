import { AddGuildMemberRole, CreateInteractionResponse, FollowupMessage, IsleofDucks } from "@/discord/discordUtils";
import { getHypixelPlayer, getUsernameOrUUID } from "@/discord/hypixelUtils";
import { checkDiscordInDB, checkLinked, checkMinecraftInDB, createDiscordUser, createMinecraftUser, linkDiscordToMinecraft } from "@/discord/utils";
import { APIModalSubmitInteraction, APIInteractionResponse, InteractionResponseType, MessageFlags, ComponentType, APIUser } from "discord-api-types/v10";
import { NextResponse } from "next/server";

export default async function(
    interaction: APIModalSubmitInteraction
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
        data: { flags: MessageFlags.Ephemeral }
    });
    let user: APIUser;
    if (interaction.member) user = interaction.member.user;
    else if (interaction.user) user = interaction.user;
    else {
        await FollowupMessage(interaction.token, {
            content: "Could not find user ID from interaction!" ,
        }, null, true);
        return NextResponse.json(
            { success: false, error: "Could not find user ID from interaction" },
            { status: 400 }
        );
    }

    if (interaction.data.components[0].type !== ComponentType.Label ||
        interaction.data.components[0].component.type !== ComponentType.TextInput
    ) {
        await FollowupMessage(interaction.token, {
            content: "Invalid modal response!",
        });
        return NextResponse.json(
            { success: false, error: "Invalid modal response" },
            { status: 400 }
        );
    }
    const username = interaction.data.components[0].component.value;
    if (!username) {
        await FollowupMessage(interaction.token, {
            content: "Missing username input in modal!",
        });
        return NextResponse.json(
            { success: false, error: "Missing username input in modal" },
            { status: 400 }
        );
    }

    const userRes = await getUsernameOrUUID(username);
    if (!userRes.success) {
        await FollowupMessage(interaction.token, {
            content: userRes.message || "An error occurred while fetching your Minecraft data!",
        });
        return NextResponse.json(
            { success: false, error: userRes.message || "An error occurred while fetching your Minecraft data" },
            { status: 400 }
        );
    }

    const discordHypixelRes = await getHypixelPlayer(userRes.uuid);
    if (!discordHypixelRes.success) {
        await FollowupMessage(interaction.token, {
            content: discordHypixelRes.message || "An error occurred while fetching your Hypixel data!",
        });
        return NextResponse.json(
            { success: false, error: discordHypixelRes.message || "An error occurred while fetching your Hypixel data" },
            { status: 400 }
        );
    }

    if (!discordHypixelRes.player.socialMedia || !discordHypixelRes.player.socialMedia.links || !discordHypixelRes.player.socialMedia.links.DISCORD) {
        await FollowupMessage(interaction.token, {
            content: "You must link your Discord account on Hypixel!",
        });
        return NextResponse.json(
            { success: false, error: "You must link your Discord account on Hypixel" },
            { status: 400 }
        );
    }
    const linkedDiscord = discordHypixelRes.player.socialMedia.links.DISCORD;
    if (linkedDiscord !== user.username) {
        await FollowupMessage(interaction.token, {
            content: `The Discord account linked on your Hypixel profile (${linkedDiscord}) does not match the Discord account you used to verify (${user.username})!`,
        });
        return NextResponse.json(
            { success: false, error: "The Discord account linked on your Hypixel profile does not match the Discord account you used to verify" },
            { status: 400 }
        );
    }

    // const discordExists = await checkDiscordInDB(user.id);
    // if (!discordExists) {
    //     await FollowupMessage(interaction.token, {
    //         flags: MessageFlags.Ephemeral | MessageFlags.IsComponentsV2,
    //         components: [
    //             {
    //                 type: ComponentType.Section,
    //                 components: [
    //                     {
    //                         type: ComponentType.TextDisplay,
    //                         content: "You must authorise first!",
    //                     }
    //                 ],
    //                 accessory: {
    //                     type: ComponentType.Button,
    //                     style: ButtonStyle.Link,
    //                     label: "Authorise Me",
    //                     url: `https://isle-of-ducks.vercel.app/api/auth/discord/redirect`
    //                 }
    //             }
    //         ]
    //     }, null, true);
    //     return NextResponse.json(
    //         { success: false, error: "You must authorise first" },
    //         { status: 400 }
    //     );
    // }

    const discordExists = await checkDiscordInDB(user.id);
    if (!discordExists) {
        await createDiscordUser(user.id);
    }
    const minecraftExists = await checkMinecraftInDB(userRes.uuid);
    if (!minecraftExists) {
        await createMinecraftUser(userRes.uuid);
    }

    try {
        await linkDiscordToMinecraft(user.id, userRes.uuid);
    } catch (e: any) {
        await FollowupMessage(interaction.token, {
            // content: "message" in e ? e.message : "An error occurred while linking your Discord account to your Minecraft account!"
            content: "message" in e ? e.message : "An error occurred while verifying!"
        });
        throw e;
    }

    const didLink = await checkLinked(user.id, userRes.uuid);
    if (!didLink) {
        await FollowupMessage(interaction.token, {
            // content: "An error occurred while linking your Discord account to your Minecraft account!"
            content: "An error occurred while verifying!"
        });
        return NextResponse.json(
            // { success: false, error: "An error occurred while linking your Discord account to your Minecraft account" },
            { success: false, error: "An error occurred while verifying" },
            { status: 400 }
        );
    }

    try {
        await AddGuildMemberRole(IsleofDucks.serverID, user.id, IsleofDucks.roles.verified);
    } catch (e) {
        await FollowupMessage(interaction.token, {
            // content: "Successfully linked your Discord account to your Minecraft account, but failed to add the verified role!\nPlease contact our staff to resolve this issue.",
            content: "Successfully verified, but failed to add the verified role!\nPlease contact our staff to resolve this issue.",
        });
        throw e;
    }

    await FollowupMessage(interaction.token, {
        // content: "Successfully linked your Discord account to your Minecraft account!"
        content: "Successfully verified!"
    });

    return NextResponse.json(
        { success: true },
        { status: 200 }
    );
}