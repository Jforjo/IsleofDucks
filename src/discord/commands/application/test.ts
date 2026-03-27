import { CreateInteractionResponse, CreateThread, FollowupMessage, getUserDetails, IsleofDucks } from "@/discord/discordUtils";
import { getUserDataFromDiscordID } from "@/discord/utils";
import { APIChatInputApplicationCommandInteraction, APIInteractionResponse, ApplicationCommandType, InteractionResponseType, MessageFlags } from "discord-api-types/v10";
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
    if (!(
        member.user.id === IsleofDucks.staticIDs.Jforjo
        // || member.roles.includes(IsleofDucks.roles.admin)
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

    const userDataRes = await getUserDataFromDiscordID(member.user.id);
    if (!userDataRes.success) {
        await FollowupMessage(interaction.token, {
            content: "Could not find user in DB!",
        });
        return NextResponse.json(
            { success: false, error: "Could not find user in DB" },
            { status: 400 }
        );
    }
    const user = await getUserDetails(userDataRes.data.discord.accesstoken);
    if (!user) {
        await FollowupMessage(interaction.token, {
            content: "Could not find user!",
        });
        return NextResponse.json(
            { success: false, error: "Could not find user" },
            { status: 400 }
        );
    }

    console.log("user", JSON.stringify(user, null, 2));
    await FollowupMessage(interaction.token, {
        content: `\`\`\`${JSON.stringify(user, null, 2)}\`\`\``,
    });

    return NextResponse.json(
        { success: true },
        { status: 200 }
    );
}
export const CommandData = {
    name: "test",
    description: "Test command",
    type: ApplicationCommandType.ChatInput,
}