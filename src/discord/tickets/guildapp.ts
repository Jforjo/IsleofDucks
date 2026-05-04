import { APIInteractionResponse, APIMessageComponentButtonInteraction, APIModalInteractionResponseCallbackComponent, ComponentType, InteractionResponseType, TextInputStyle } from "discord-api-types/v10";
import { CreateInteractionResponse } from "@/discord/discordUtils";
import { NextResponse } from "next/server";
import { getSettingValue, getUserDataFromDiscordID } from "../utils";
import { getUsernameOrUUID } from "../hypixelUtils";
import { checkPlayer } from "../commands/application/recruit";

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

    const components: APIModalInteractionResponseCallbackComponent[] = [
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
    ];

    if (userData?.success && userData.data?.minecraft?.uuid) {
        const profileRes = await checkPlayer(userData.data.minecraft.uuid);
        if (profileRes.success && profileRes.experience < profileRes.ducklingReq) {
            components.push({
                type: ComponentType.Label,
                label: "Reason",
                component: {
                    type: ComponentType.TextInput,
                    custom_id: "reason",
                    style: TextInputStyle.Paragraph,
                    placeholder: `As you do not meet the requirements for Isle of Ducklings, please say your reason for applying.`,
                    required: true
                }
            });
        }
    }

    await CreateInteractionResponse(interaction.id, interaction.token, {
        type: InteractionResponseType.Modal,
        data: {
            custom_id: `guildapp`,
            title: "Guild Application",
            components: components
        }
    });

    return NextResponse.json(
        { success: true },
        { status: 200 }
    );
}
