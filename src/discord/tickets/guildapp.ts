import { APIInteractionResponse, APIMessageComponentButtonInteraction, ComponentType, InteractionResponseType, TextInputStyle } from "discord-api-types/v10";
import { CreateInteractionResponse } from "@/discord/discordUtils";
import { NextResponse } from "next/server";
import { getSettingValue, getUserDataFromDiscordID } from "../utils";
import { getUsernameOrUUID } from "../hypixelUtils";

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
    const userData = await getUserDataFromDiscordID(interaction.member!.user.id);

    const duckReq = await getSettingValue("duck_req");
    const ducklingReq = await getSettingValue("duckling_req");

    let username = undefined;
    if (userData?.success && userData.data?.minecraft?.uuid) {
        const mojang = await getUsernameOrUUID(userData.data.minecraft.uuid);
        if (mojang.success) {
            username = mojang.name;
        }
    }

    await CreateInteractionResponse(interaction.id, interaction.token, {
        type: InteractionResponseType.Modal,
        data: {
            custom_id: `guildapp${userData?.success && userData.data?.minecraft?.uuid ? `-${userData.data.minecraft.uuid}` : ""}`,
            title: "Guild Application",
            components: [
                {
                    type: ComponentType.Label,
                    label: "Guild",
                    component: {
                        type: ComponentType.StringSelect,
                        custom_id: "guild",
                        placeholder: "Select a guild",
                        options: [
                            {
                                label: "Isle of Ducks",
                                description: duckReq ? `The current level requirement for Isle of Ducks is ${parseInt(duckReq)}.` : undefined,
                                value: "duck",
                            },
                            {
                                label: "Isle of Ducklings",
                                description: ducklingReq ? `The current level requirement for Isle of Ducklings is ${parseInt(ducklingReq)} (lenient).` : undefined,
                                value: "duckling",
                            },
                        ]
                    }
                },
                {
                    type: ComponentType.Label,
                    label: "Username",
                    component: {
                        type: ComponentType.TextInput,
                        custom_id: "username",
                        value: username,
                        placeholder: "Enter your Minecraft username",
                        style: TextInputStyle.Short,
                        min_length: 3,
                        max_length: 16,
                        required: true,
                    },
                }
            ]
        }
    });

    return NextResponse.json(
        { success: true },
        { status: 200 }
    );
}
