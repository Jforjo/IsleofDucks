import { APIApplicationCommand, APIChatInputApplicationCommandInteraction, APIInteractionResponse, ApplicationCommandType, InteractionResponseType, RESTPatchAPIApplicationCommandJSONBody, RESTPutAPIApplicationCommandsJSONBody } from "discord-api-types/v10";
import { CreateInteractionResponse, FollowupMessage, IsleofDucks, InstallGlobalCommands } from "@/discord/discordUtils";
import { NextRequest, NextResponse } from "next/server.js";

import { CommandData as CheckAPI } from "./checkapi";
// import { CommandData as GuildCata } from "./guildcata";
// import { CommandData as Superlative } from "./superlative";
import { CommandData as Ping } from "./ping";
// import { CommandData as Test } from "./test";
// import { CommandData as Embed } from "./embed";
// import { CommandData as Immune } from "./immune";
// import { CommandData as Weekly } from "./weekly";
// import { CommandData as UpdateRoles } from "./updateroles";

export default async function(
    req: NextRequest
): Promise<
    NextResponse<
        {
            success: boolean;
            error?: string;
        } | APIInteractionResponse
    >
> {
    const interaction = req.body as APIChatInputApplicationCommandInteraction | null;
    if (!interaction) {
        return NextResponse.json(
            { success: false, error: 'Missing request body' },
            { status: 400 }
        );
    }

    // User sees the "[bot] is thinking..." message
    await CreateInteractionResponse(interaction.id, interaction.token, {
        type: InteractionResponseType.DeferredChannelMessageWithSource,
        data: { flags: 1 << 6 },
    });

    let userId;
    if (interaction.member) userId = interaction.member.user.id;
    else if (interaction.user) userId = interaction.user.id;
    else {
        await FollowupMessage(interaction.token, {
            content: "Could not find who ran the command!",
        });
        return NextResponse.json(
            { success: false, error: "Could not find who ran the command" },
            { status: 400 }
        )
    }
    if (userId != IsleofDucks.staticIDs.Jforjo) {
        await FollowupMessage(interaction.token, {
            content: `Only <@${IsleofDucks.staticIDs.Jforjo}> can use this command!`,
        });
        return NextResponse.json(
            { success: false, error: "You lack the permission to run this command" },
            { status: 403 }
        )
    }

    const result = await InstallGlobalCommands([
        CommandData,
        CheckAPI,
        // Superlative,
        Ping,
        // Embed,
        // Immune,
        // Weekly,
        // UpdateRoles
    ] as RESTPutAPIApplicationCommandsJSONBody);

    console.log(result);

    await FollowupMessage(interaction.token, {
        content: "Done! Check Vercel's logs for any errors.",
    });
    return NextResponse.json(
        { success: true },
        { status: 200 }
    )
}
export const CommandData: RESTPatchAPIApplicationCommandJSONBody = {
    name: "updatecommands",
    description: "Updates the bot's global commands.",
    type: ApplicationCommandType.ChatInput,
    default_member_permissions: "0",
}