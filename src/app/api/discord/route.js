import { InteractionResponseType, InteractionType, verifyKey } from "discord-interactions";
import { NextResponse } from "next/server";

export async function POST(req, res) {
    const signature = req.headers.get("x-signature-ed25519");
    const timestamp = req.headers.get("x-signature-timestamp");
    const rawBody = JSON.stringify(req.body); 

    const isValidRequest = await verifyKey(
        rawBody,
        signature,
        timestamp,
        process.env.DISCORD_PUBLIC_KEY
    );

    if (!isValidRequest) {
        return NextResponse.json({
            error: 'Bad request signature',
            status: 401
        });
    }

    const interaction = req.body;

    if (interaction.type === InteractionType.PING) {
        return NextResponse.json({
            type: InteractionResponseType.PONG,
        });
    } else if (interaction.type === InteractionType.APPLICATION_COMMAND) {
        const { default: command } = await import(`@/discord/commands/application/${interaction.data.name.toLowerCase()}.ts`);
        if (command) {
            await command(req, res);
        } else {
            return NextResponse.json({
                error: 'Unknown Command',
                status: 400
            });
        }
    } else if (interaction.type === InteractionType.MESSAGE_COMPONENT) {
        const { default: command } = await import(`@/discord/commands/component/${interaction.data.custom_id.toLowerCase()}.ts`);
        if (command) {
            await command(req, res);
        } else {
            return NextResponse.json({
                error: 'Unknown Command',
                status: 400
            });
        }
    } else if (interaction.type === InteractionType.MODAL_SUBMIT) {
        const { default: command } = await import(`@/discord/commands/modal/${interaction.data.custom_id.toLowerCase()}.ts`);
        if (command) {
            await command(req, res);
        } else {
            return NextResponse.json({
                error: 'Unknown Command',
                status: 400
            });
        }
    } else {
        return NextResponse.json({
            error: 'Unknown Command Type',
            status: 400
        });
    }
};
