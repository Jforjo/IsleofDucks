import { verifyKey } from "discord-interactions";
import { NextRequest, NextResponse } from "next/server";
import { APIInteraction, APIInteractionResponse, InteractionResponseType, InteractionType } from 'discord-api-types/v10';

export async function POST(
    req: NextRequest
): Promise<
    NextResponse<
        {
            success: boolean;
            error?: string;
        } | APIInteractionResponse
    >
> {
    if (process.env.DISCORD_PUBLIC_KEY === undefined) {
        return NextResponse.json(
            { success: false, error: 'Missing DISCORD_PUBLIC_KEY' },
            { status: 500 }
        );
    }

    const signature = req.headers.get("x-signature-ed25519");
    const timestamp = req.headers.get("x-signature-timestamp");

    if (!signature || !timestamp) {
        return NextResponse.json(
            { success: false, error: 'Missing required headers' },
            { status: 400 }
        );
    }

    const interaction = await req.json() as APIInteraction | null;
    if (!interaction) {
        return NextResponse.json(
            { success: false, error: 'Missing request body' },
            { status: 400 }
        );
    }

    const isValidRequest = await verifyKey(
        JSON.stringify(interaction),
        signature,
        timestamp,
        process.env.DISCORD_PUBLIC_KEY
    );

    if (!isValidRequest) {
        return NextResponse.json(
            { success: false, error: 'Bad request signature' },
            { status: 401 }
        );
    }

    if (interaction.type === InteractionType.Ping) {
        console.log("Handling ping request")
        return NextResponse.json(
            { type: InteractionResponseType.Pong, },
            { status: 200 }
        );
    } else if (interaction.type === InteractionType.ApplicationCommand) {
        const { default: command } = await import(`@/discord/commands/application/${interaction.data.name.toLowerCase()}.ts`);
        if (command) {
            return await command(interaction);
        } else {
            return NextResponse.json(
                { success: false, error: 'Unknown Command', },
                { status: 404 }
            );
        }
    } else if (interaction.type === InteractionType.MessageComponent) {
        const { default: command } = await import(`@/discord/commands/component/${interaction.data.custom_id.split('-')[0].toLowerCase()}.ts`);
        if (command) {
            return await command(interaction);
        } else {
            return NextResponse.json(
                { success: false, error: 'Unknown Command', },
                { status: 404 }
            );
        }
    } else if (interaction.type === InteractionType.ApplicationCommandAutocomplete) {
        const { default: command } = await import(`@/discord/commands/autocomplete/${interaction.data.name.toLowerCase()}.ts`);
        if (command) {
            return await command(interaction);
        } else {
            return NextResponse.json(
                { success: false, error: 'Unknown Command', },
                { status: 404 }
            );
        }
    } else if (interaction.type === InteractionType.ModalSubmit) {
        const { default: command } = await import(`@/discord/commands/modal/${interaction.data.custom_id.split('-')[0].toLowerCase()}.ts`);
        if (command) {
            return await command(interaction);
        } else {
            return NextResponse.json(
                { success: false, error: 'Unknown Command', },
                { status: 404 }
            );
        }
    }
    return NextResponse.json(
        { success: false, error: 'Unknown Command Type', },
        { status: 404 }
    );
};

export function GET() {
    return NextResponse.json({
        success: true,
        message: "This is the API endpoint for Discord interactions.",
        discord_invite: "https://discord.gg/rvaHetaFHV",
    }, { status: 200 });
}