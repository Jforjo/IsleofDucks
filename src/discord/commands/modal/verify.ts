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
        data: { flags: MessageFlags.Ephemeral | MessageFlags.IsComponentsV2 }
    });
    let userId: Snowflake;
    if (interaction.member) userId = interaction.member.user.id;
    else if (interaction.user) userId = interaction.user.id;
    else {
        await FollowupMessage(interaction.token, {
            components: [{ type: ComponentType.TextDisplay, content: "Could not find user ID from interaction!" }],
        });
        return NextResponse.json(
            { success: false, error: "Could not find user ID from interaction" },
            { status: 400 }
        );
    }

    const username = interaction.data.components.map(c => c.type === 1 ? c.components : []).flat().find(c => c.custom_id === "username")?.value;
    if (!username) {
        await FollowupMessage(interaction.token, {
            components: [{ type: ComponentType.TextDisplay, content: "Missing username input in modal!" }],
        });
        return NextResponse.json(
            { success: false, error: "Missing username input in modal" },
            { status: 400 }
        );
    }

    const userRes = await getUsernameOrUUID(username);
    if (!userRes.success) {
        await FollowupMessage(interaction.token, {
            components: [{ type: ComponentType.TextDisplay, content: userRes.message || "An error occurred while fetching your Minecraft data!" }],
        });
        return NextResponse.json(
            { success: false, error: userRes.message || "An error occurred while fetching your Minecraft data" },
            { status: 400 }
        );
    }

    const discordExists = await checkDiscordInDB(userId);
    if (discordExists) {
        await FollowupMessage(interaction.token, {
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
                        url: `${process.env.NEXT_PUBLIC_BASE_URL}/api/auth/discord/redirect`
                    }
                }
            ]
        });
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
            components: [{ type: ComponentType.TextDisplay, content: "An error occurred while linking your Discord account to your Minecraft account!" }]
        });
        throw e;
    }

    const didLink = await checkLinked(userId, userRes.uuid);
    if (!didLink) {
        await FollowupMessage(interaction.token, {
            components: [{ type: ComponentType.TextDisplay, content: "An error occurred while linking your Discord account to your Minecraft account!" }]
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