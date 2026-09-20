import { CreateInteractionResponse, GetAllEmbeds } from "@/discord/discordUtils";
import { APIApplicationCommandAutocompleteInteraction, APIInteractionResponse, InteractionResponseType } from "discord-api-types/v10";
import { NextResponse } from "next/server";

export default async function(
    interaction: APIApplicationCommandAutocompleteInteraction
): Promise<
    NextResponse<
        {
            success: boolean;
            error?: string;
        } | APIInteractionResponse
    >
> {
    // I'm not improving this :sob:
    const options = Object.fromEntries(interaction.data.options.map(option => {
        if ('value' in option) {
            return [option.name, option];
        } else if (option.options) {
            return [option.name, Object.fromEntries(option.options.map(option => {
                if ('value' in option) {
                    return [option.name, option];
                } else if (option.options) {
                    return [option.name, Object.fromEntries(option.options.map(option => {
                        return [option.name, option]
                    }))];
                } else {
                    return [option.name, null];
                }
            }))];
        } else {
            return [option.name, null];
        }
    }));

    if (!('name' in options && options.name.focused === true)) {
        return NextResponse.json(
            { success: false, error: "Focused option not found" },
            { status: 400 }
        );
    }

    const items = await GetAllEmbeds();
    if (!items) {
        return NextResponse.json(
            { success: false, error: "Failed to fetch embeds" },
            { status: 400 }
        );
    }

    await CreateInteractionResponse(interaction.id, interaction.token, {
        type: InteractionResponseType.ApplicationCommandAutocompleteResult,
        data: {
            choices: items.filter(i => i.toLowerCase().includes(options.name.value.toLowerCase()))
                .map(i => ({ name: i, value: i }))
                .slice(0, 25) || []
        }
    });

    return NextResponse.json(
        { success: true },
        { status: 200 }
    );
}