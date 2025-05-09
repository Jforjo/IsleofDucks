import { CreateInteractionResponse, FollowupMessage, IsleofDucks, SendMessage } from "@/discord/discordUtils";
// import { getUsernameOrUUID } from "@/discord/hypixelUtils";
// import { getDiscordRole } from "@/discord/utils";
// import { sql } from "@vercel/postgres";
import { APIChatInputApplicationCommandInteraction, APIInteractionResponse, ApplicationCommandType, InteractionResponseType, MessageFlags, RESTPatchAPIApplicationCommandJSONBody } from "discord-api-types/v10";
import { NextResponse } from "next/server";
import { UpdateAllDiscordIDsInDb } from "./updatedatabase";

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
    if (!(
        member.user.id === IsleofDucks.staticIDs.Jforjo ||
        member.roles.includes(IsleofDucks.roles.admin)
    )) {
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

    await CreateInteractionResponse(interaction.id, interaction.token, {
        type: InteractionResponseType.DeferredChannelMessageWithSource,
        data: {
            flags: MessageFlags.Ephemeral
        }
    });

    await UpdateAllDiscordIDsInDb();
    
    // const { rows } = await sql`SELECT * FROM users`;

    // const users = await Promise.all(rows.map(async (user) => {
    //     const res = await getUsernameOrUUID(user.uuid);
    //     const disc = await getDiscordRole(user.uuid);
    //     return {
    //         uuid: user.uuid,
    //         name: res.success ? res.name : user.uuid,
    //         disc: disc?.discordid
    //     }
    // }));

    // const chunkSize = 20;
    // for (let i = 0; i < users.length; i += chunkSize) {
    //     await SendMessage(interaction.channel.id, {
    //         content: users.slice(i, i + chunkSize).map((user) => `\`${user.name}\` (${user.uuid}) ${user.disc ? `<@${user.disc}>` : ""}`).join("\n"),
    //         flags: MessageFlags.SuppressNotifications
    //     });
    // }

    // await CreateInteractionResponse(interaction.id, interaction.token, {
    //     type: InteractionResponseType.ChannelMessageWithSource,
    //     data: {
    //         content: `Done!`,
    //         flags: MessageFlags.Ephemeral
    //     }
    // });

    await FollowupMessage(interaction.token, {
        content: `Done!`,
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