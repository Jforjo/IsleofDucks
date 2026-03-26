import { CreateInteractionResponse, FollowupMessage } from "@/discord/discordUtils";
import { getUsernameOrUUID } from "@/discord/hypixelUtils";
import { checkDiscordInDB, checkLinked, checkMinecraftInDB, createMinecraftUser, linkDiscordToMinecraft } from "@/discord/utils";
import { APIModalSubmitInteraction, APIInteractionResponse, Snowflake, InteractionResponseType, MessageFlags, ComponentType, ButtonStyle } from "discord-api-types/v10";
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
    let userId: Snowflake;
    if (interaction.member) userId = interaction.member.user.id;
    else if (interaction.user) userId = interaction.user.id;
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

    const discordExists = await checkDiscordInDB(userId);
    if (!discordExists) {
        await FollowupMessage(interaction.token, {
            flags: MessageFlags.Ephemeral | MessageFlags.IsComponentsV2,
            components: [
                {
                    type: ComponentType.Section,
                    components: [
                        {
                            type: ComponentType.TextDisplay,
                            content: "You must authorise first!",
                        }
                    ],
                    accessory: {
                        type: ComponentType.Button,
                        style: ButtonStyle.Link,
                        label: "Authorise Me",
                        url: `https://isle-of-ducks.vercel.app/api/auth/discord/redirect`
                    }
                }
            ]
        }, null, true);
        return NextResponse.json(
            { success: false, error: "You must authorise first" },
            { status: 400 }
        );
    }

    const minecraftExists = await checkMinecraftInDB(userRes.uuid);
    if (!minecraftExists) {
        await createMinecraftUser(userRes.uuid);
    }

    try {
        await linkDiscordToMinecraft(userId, userRes.uuid);
    } catch (e) {
        await FollowupMessage(interaction.token, {
            content: "An error occurred while linking your Discord account to your Minecraft account!"
        });
        throw e;
    }

    const didLink = await checkLinked(userId, userRes.uuid);
    if (!didLink) {
        await FollowupMessage(interaction.token, {
            content: "An error occurred while linking your Discord account to your Minecraft account!"
        });
        return NextResponse.json(
            { success: false, error: "An error occurred while linking your Discord account to your Minecraft account" },
            { status: 400 }
        );
    }

    return NextResponse.json(
        { success: true },
        { status: 200 }
    );
}