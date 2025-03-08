import { APIChatInputApplicationCommandInteraction, APIInteractionResponse, ApplicationCommandType } from "discord-api-types/v10";
import Superlative from "./superlative";
import { NextResponse } from "next/server";

export default async function Command(
    interaction: APIChatInputApplicationCommandInteraction
): Promise<
    NextResponse<
        {
            success: boolean;
            error?: string;
        } | APIInteractionResponse
    >
> {
    return await Superlative(interaction, true);
}

export const CommandData = {
    name: "superlativedetailed",
    description: "Displays more detailed superlative data for Isle of Ducks",
    type: ApplicationCommandType.ChatInput,
}