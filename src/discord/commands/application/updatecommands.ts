import { APIChatInputApplicationCommandInteraction, APIInteractionResponse, ApplicationCommandType, InteractionResponseType, RESTPutAPIApplicationCommandsJSONBody } from "discord-api-types/v10";
import { CreateInteractionResponse, FollowupMessage, IsleofDucks, InstallGlobalCommands } from "@/discord/discordUtils";
import { NextResponse } from "next/server";

import { CommandData as CheckAPI } from "./checkapi";
// import { CommandData as GuildCata } from "./guildcata";
import { CommandData as Superlative } from "./superlative";
import { CommandData as Ping } from "./ping";
// import { CommandData as Test } from "./test";
import { CommandData as Embed } from "./embed";
import { CommandData as Immune } from "./immune";
import { CommandData as Weekly } from "./weekly";
import { CommandData as UpdateRoles } from "./updateroles";
import { CommandData as Recruit } from "./recruit";
import { CommandData as BanList } from "./banlist";
import { CommandData as InsertEmbed } from "./insertembed";
import { CommandData as ReadMessage } from "./readmessage";
import { CommandData as Test } from "./test";
import { CommandData as Util } from "./util";
import { CommandData as Away } from "./away";
import { CommandData as Donor } from "./donor";
import { CommandData as SuperlativeAdv } from "./superlativeadv";
import { CommandData as cheapestshards } from "./cheapestshards";
import { CommandData as Bridge } from "./bridge";
import { CommandData as Leaderboard } from "./leaderboard";
import { CommandData as Ban } from "./ban";
import { CommandData as Settings } from "./settings";
import { CommandData as Verify } from "./verify";
import { CommandData as Sus } from "./sus";
import { CommandData as Help } from "@/discord/commandDatas/help";

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
        Superlative,
        Ping,
        Embed,
        Immune,
        Weekly,
        UpdateRoles,
        Recruit,
        BanList,
        InsertEmbed,
        ReadMessage,
        Test,
        Util,
        Away,
        Donor,
        SuperlativeAdv,
        cheapestshards,
        Bridge,
        Leaderboard,
        Ban,
        Settings,
        Help,
        Verify,
        Sus,
    ] as RESTPutAPIApplicationCommandsJSONBody);

    console.log(result);
    if (result && "errors" in result) {
        console.error("errors:", result.errors);
        console.log("Stringified errors:", JSON.stringify(result.errors));
    }

    await FollowupMessage(interaction.token, {
        content: "Done! Check Vercel's logs for any errors.",
    });
    return NextResponse.json(
        { success: true },
        { status: 200 }
    )
}
export const CommandData = {
    name: "updatecommands",
    description: "Updates the bot's global commands.",
    type: ApplicationCommandType.ChatInput,
    default_member_permissions: "0",
}