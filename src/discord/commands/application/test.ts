import { ConvertSnowflakeToDate, CreateInteractionResponse, FollowupMessage, GetAllGuildMembers, IsleofDucks, RemoveGuildMemberRole } from "@/discord/discordUtils";
import { getHypixelPlayer } from "@/discord/hypixelUtils";
import { getAllDiscordUsers, getAllLinkedUsers, getAllMinecraftUsers, getImmunePlayers, linkDiscordToMinecraft, updateDiscordUser, updateMinecraftUser } from "@/discord/utils";
import { sql } from "@vercel/postgres";
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

    const timestamp = ConvertSnowflakeToDate(interaction.id)
    await CreateInteractionResponse(interaction.id, interaction.token, {
        type: InteractionResponseType.ChannelMessageWithSource,
        data: {
            flags: MessageFlags.Ephemeral,
            content: `<t:${Math.floor(timestamp.getTime() / 1000) + 60}:R>`
        }
    });

    // let linked = 0;
    // const discUsers = await GetAllGuildMembers(IsleofDucks.serverID);
    // const minecraftUsers = await getAllMinecraftUsers();
    // const alreadyLinked = await getAllLinkedUsers();
    // const users = minecraftUsers.filter(u => !alreadyLinked.some(a => a.uuid === u.uuid)).sort((a, b) => b.exp - a.exp);
    // for (const user of users) {
    //     const hypixel = await getHypixelPlayer(user.uuid);
    //     if (!hypixel.success) {
    //         await FollowupMessage(interaction.token, {
    //             content: `Failed to get Hypixel data for ${user.uuid}: ${hypixel.message}\nLinked so far: ${linked}/${users.length}\n${hypixel.retry ? `Try again <t:${Math.floor(( timestamp.getTime() + hypixel.retry ) / 1000)}:R> to continue` : ""}`,
    //         });
    //         if (hypixel.message === "Key throttle") return NextResponse.json(
    //             { success: false, error: "Hypixel API key is being throttled, try again later" },
    //             { status: 500 }
    //         );
    //         continue;
    //     }

    //     const player = hypixel.player;
    //     if (!player.socialMedia || !player.socialMedia.links || !player.socialMedia.links.DISCORD) continue;

    //     const discord = player.socialMedia.links.DISCORD;
    //     const discordUser = discUsers.find(u => u.user.username === discord);
    //     if (!discordUser) continue;
        
    //     if (alreadyLinked.some(l => l.discordid === discordUser.user.id)) continue;
    //     try {
    //         await linkDiscordToMinecraft(discordUser.user.id, user.uuid);
    //         linked++;
    //     } catch (e) {
    //         if (e instanceof Error) {
    //             if (e.message === "Discord user not found") {
    //                 await updateDiscordUser(discordUser.user.id);
    //             } else if (e.message === "Minecraft user not found") {
    //                 await updateMinecraftUser(user.uuid);
    //             } else console.error(e);
    //         } else console.error(e);
    //     }
    // }

    const { rows: immunePlayers } = await sql`SELECT uuid, minecraft FROM immune` as { rows: { uuid: string; minecraft: number | null }[] };
    for (const player of immunePlayers) {
        if (player.minecraft) continue;
        const minecraftUser = await getAllMinecraftUsers().then(users => users.find(u => u.uuid === player.uuid));
        if (!minecraftUser) continue;
        await sql`UPDATE immune SET minecraft = ${minecraftUser.id} WHERE uuid = ${player.uuid}`;
    }

    await FollowupMessage(interaction.token, {
        content: `Done!`,
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