import { CreateInteractionResponse } from "@/discord/discordUtils";
import { APIApplicationCommandAutocompleteInteraction, APIInteractionResponse, InteractionResponseType } from "discord-api-types/v10";
import { NextResponse } from "next/server";
import { getHypixelItems } from "@/discord/hypixelUtils";

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

    if (!('setup' in options && 'answer' in options.setup && options.setup.answer.focused === true)) {
        return NextResponse.json(
            { success: false, error: "Focused option not found" },
            { status: 400 }
        );
    }

    const items = await getHypixelItems();
    if (!items.success || !items.items) {
        return NextResponse.json(
            { success: false, error: "Failed to fetch Hypixel items" },
            { status: 400 }
        );
    }

    await CreateInteractionResponse(interaction.id, interaction.token, {
        type: InteractionResponseType.ApplicationCommandAutocompleteResult,
        data: {
            choices: items.items.filter((i): i is typeof i & { name: string } => typeof i.name === 'string')
                // remove all instances of /§[0-9a-f]/gm within the names
                .map(i => ({
                    name: i.name.replace(/\/§[0-9a-f]/gm, ''),
                    value: i.name.replace(/\/§[0-9a-f]/gm, '')
                }))
                .filter(i => i.name.toLowerCase().includes(options.setup.answer.value.toLowerCase()))
                .slice(0, 25) || []
        }
    });

    return NextResponse.json(
        { success: true },
        { status: 200 }
    );
}