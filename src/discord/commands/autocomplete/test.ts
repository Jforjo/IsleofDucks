import { APIApplicationCommandAutocompleteInteraction, APIInteractionResponse } from "discord-api-types/v10";
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
    console.log(interaction);
    console.log(JSON.stringify(interaction));

    return NextResponse.json(
        { success: true },
        { status: 200 }
    );
}