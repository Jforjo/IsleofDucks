import { CreateInteractionResponse, EditMessage, IsleofDucks } from "@/discord/discordUtils";
import { APIChatInputApplicationCommandInteraction, APIInteractionResponse, ApplicationCommandType, InteractionResponseType, MessageFlags, RESTPatchAPIApplicationCommandJSONBody } from "discord-api-types/v10";
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
    const member = interaction.member;
    if (!member) {
        await CreateInteractionResponse(interaction.id, interaction.token, {
            type: InteractionResponseType.ChannelMessageWithSource,
            data: {
                content: "Could not find who ran the command!",
                flags: MessageFlags.Ephemeral
            }
        });
        return NextResponse.json(
            { success: false, error: "Could not find who ran the command" },
            { status: 400 }
        );
    }
    if (member.user.id !== IsleofDucks.staticIDs.Jforjo) {
        await CreateInteractionResponse(interaction.id, interaction.token, {
            type: InteractionResponseType.ChannelMessageWithSource,
            data: {
                content: "You do not have permission to run this command!",
                flags: MessageFlags.Ephemeral
            }
        });
        return NextResponse.json(
            { success: false, error: "You do not have permission to run this command" },
            { status: 400 }
        );
    }
    await EditMessage("1337447048672448576", "1337447048672448576", {
        content: [
            "**Total Survey Responses**",
            `21 Guild App`
        ].join('\n'),
        embeds: [
            {
                title: "Guild App",
                description: [
                    `Survey presented after players open a guild application ticket`
                ].join('\n'),
                fields: [
                    {
                        name: "Where did you find our guild?",
                        value: [
                            `3 SBZ/SBS Discord`,
                            `6 Forums`,
                            `1 On Hypixel`,
                            `6 A Friend`,
                            `5 I'm a Returning Member`,
                            `0 Other`
                        ].join('\n'),
                    },
                ],
                color: 0xFB9B00,
            }
        ]
    });

    await CreateInteractionResponse(interaction.id, interaction.token, {
        type: InteractionResponseType.ChannelMessageWithSource,
        data: {
            content: `Done!`,
            flags: MessageFlags.Ephemeral
        }
    });

    return NextResponse.json(
        { success: true },
        { status: 200 }
    );
}
export const CommandData: RESTPatchAPIApplicationCommandJSONBody = {
    name: "test",
    description: "Test command",
    type: ApplicationCommandType.ChatInput,
    default_member_permissions: "0",
}