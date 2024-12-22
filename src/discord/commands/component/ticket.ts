import { APIInteractionResponse, APIMessageComponentButtonInteraction } from "discord-api-types/v10";
import { NextResponse } from "next/server";

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
    const { default: command } = await import(`@/discord/tickets/${interaction.data.custom_id.split('-')[1].toLowerCase()}.ts`);
    if (command) {
        return await command(interaction);
    } else {
        return NextResponse.json(
            { success: false, error: 'Unknown Ticket', },
            { status: 404 }
        );
    }
}
