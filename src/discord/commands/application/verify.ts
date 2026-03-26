import { APIChatInputApplicationCommandInteraction, APIInteractionResponse, ApplicationCommandType, ComponentType, InteractionResponseType, TextInputStyle } from "discord-api-types/v10";
import { CreateInteractionResponse } from "@/discord/discordUtils";
import { NextResponse } from "next/server";

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
        type: InteractionResponseType.Modal,
        data: {
            custom_id: `verify`,
            title: "Verify your Minecraft account",
            components: [
                {
                    type: ComponentType.Label,
                    label: "Username",
                    component: {
                        type: ComponentType.TextInput,
                        custom_id: "username",
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
        { success: false },
        { status: 200 }
    );
}
export const CommandData = {
    name: "verify",
    description: "Verify your Minecraft account.",
    type: ApplicationCommandType.ChatInput,
}
export const RequiredRoles: string[] = [];