import { ConvertSnowflakeToDate, CreateInteractionResponse, FollowupMessage, GetAllGuildMembers, IsleofDucks, RemoveGuildMemberRole, SendMessage } from "@/discord/discordUtils";
import { getHypixelAuctions, getHypixelPlayer } from "@/discord/hypixelUtils";
import { checkMinecraftInDB, createMinecraftUser, getAllDiscordUsers, getAllLinkedUsers, getAllMinecraftUsers, getBannedPlayers, getImmunePlayers, getUserDataFromUUID, linkDiscordToMinecraft, updateDiscordUser, updateMinecraftUser } from "@/discord/utils";
import { sql } from "@vercel/postgres";
import { APIChatInputApplicationCommandInteraction, APIInteractionResponse, ApplicationCommandType, ComponentType, InteractionResponseType, MessageFlags, RESTPostAPIChannelMessageJSONBody } from "discord-api-types/v10";
import { NextResponse } from "next/server";
import { checkPlayer } from "./recruit";
import { getScammerListFromIDs } from "@/discord/scammerList";
import { addGuildLBBlacklistEntry, getGuildLBBlacklist } from "@/discord/guildlb";

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
    // await CreateInteractionResponse(interaction.id ,interaction.token, {
    //     type: InteractionResponseType.DeferredChannelMessageWithSource,
    // });

    // let linked = 0;
    // const discUsers = await GetAllGuildMembers(IsleofDucks.serverID);
    // const minecraftUsers = await getAllMinecraftUsers();
    // const alreadyLinked = await getAllLinkedUsers();
    // const users = minecraftUsers.filter(u => !alreadyLinked.some(a => a.uuid === u.uuid)).sort(() => Math.random() - 0.5);
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

    // const auctions = await getHypixelAuctions();
    // if (!auctions.success) {
    //     await FollowupMessage(interaction.token, {
    //         content: `Failed to get Hypixel auctions: ${auctions.message}\n${auctions.retry ? `Try again <t:${Math.floor(( timestamp.getTime() + auctions.retry ) / 1000)}:R> to continue` : ""}`,
    //     });
    //     return NextResponse.json(
    //         { success: false, error: "Failed to get Hypixel auctions" },
    //         { status: 500 }
    //     );
    // }

    // for (const auction of auctions.auctions!) {
    //     const user = auction.auctioneer;
    //     if (!user) continue;
    //     const exists = await getUserDataFromUUID(user);
    //     if (!exists.success) {
    //         await createMinecraftUser(user);
    //     }
    //     if (exists.success && exists.data.minecraft.exp !== 0) continue;
    //     const playerData = await checkPlayer(user);
    //     if (!playerData.success) {
    //         if (playerData.message === "Key throttle") {
    //             await FollowupMessage(interaction.token, {
    //                 content: `Hypixel API key is being throttled, try again <t:${Math.floor(( timestamp.getTime() + playerData.retry! ) / 1000)}:R> to continue`,
    //             });
    //             return NextResponse.json(
    //                 { success: false, error: "Hypixel API key is being throttled, try again later" },
    //                 { status: 500 }
    //             );
    //         }
    //         continue;
    //     }
    //     await updateMinecraftUser(user, {
    //         exp: playerData.experience,
    //     });
    // }

    // await getScammerListFromIDs([
    //     // scamming
    //     "1135286141294215168",
    //     // ratting
    //     "1303468907377459200",
    //     // blackmail / defrauding
    //     "1374377451169517681",
    //     // exit scamming, ratting, alt of 340267184041361410
    //     "268803307680563201",
    //     // looting
    //     "268803307680563201"
    // ]);


    // const alrBanned = await getGuildLBBlacklist();
    // if (!alrBanned.success) {
    //     await FollowupMessage(interaction.token, {
    //         content: `Failed to fetch GuildLB blacklist`,
    //     });
    //     return NextResponse.json(
    //         { success: false, error: "Failed to fetch GuildLB blacklist" },
    //         { status: 500 }
    //     );
    // }
    // const banned = await getBannedPlayers(0, 2000000000);
    // const alreadyBannedUUIDs = new Set(alrBanned.data.map(entry => entry.playerUuid));
    // for (const player of banned.players) {
    //     if (alreadyBannedUUIDs.has(player.uuid)) continue;
    //     await addGuildLBBlacklistEntry(player.uuid, player.reason, player.type);
    // }

    const message = {
        flags: MessageFlags.IsComponentsV2,
        components: [
            {
                type: ComponentType.Container,
                accent_color: IsleofDucks.colours.main,
                components: [
                    {
                        type: ComponentType.TextDisplay,
                        content: `## Bridge Commands`
                    },
                    { type: ComponentType.Separator },
                    {
                        type: ComponentType.TextDisplay,
                        content: [
                            "**bank** (ign) - Displays the bank balance of you or the specified player.",
                            "**bz** [item] - Displays the Bazaar price of the specified item.",
                            "**cata** (ign) - Displays the Catacombs stats of you or the specified player.",
                            "**cf** - Coinflip result.",
                            "**cole**/cw (ign) - Displays the Cole weight of you or the specified player.",
                            "**collection** (ign) [collection] - Displays the specified collection for you or the specified player.",
                            "**deaths** (ign) [mob] - Displays the number of deaths from the specified mob for you or the specified player.",
                            "**farming**/fw (ign) - Displays the farming weight of you or the specified player.",
                            "**game** - Start a guild game (scramble). At least 3 people need to run the command for a game to start.",
                            "**grass** (ign) - DIsplays the time that you or the specificed player has been online or offline.",
                            "**guess**/g [item] - Guess the scramble item.",
                            "**gxp**/gexp (ign) - Displays the guild experience of you or the specified player.",
                            "**help** - Displays the list of available commands.",
                            "**hotm** (ign) - Displays the Heart of the Mountain stats of you or the specified player.",
                            "**kills**/bestiary (ign) [mob] - Displays the number of kills for the specified mob for you or the specified player.",
                            "**lbin** [item] - Displays the lowest BIN (Buy It Now) price for the specified item.",
                            "**level**/lvl (ign) - Displays the level of you or the specified player.",
                            "**mp**/ap (ign) - Displays the accessory power of you or the specified player.",
                            "**nw** (ign) - Displays the net worth of you or the specified player.",
                            "**purse** (ign) - Displays the purse balance of you or the specified player.",
                            "**sacks** (ign) - Displays the sacks worth of you or the specified player.",
                            "**skills**/s (ign) - Displays the skills of you or the specified player.",
                            "**slayer** (ign) - Displays the slayer stats of you or the specified player.",
                            "**stalk** (ign) - Displays the online status of you or the specified player.",
                            "**superlative** (ign) - Displays the superlative stats of you or the specified player.",
                            "**uuid** (ign) - Displays the UUID of you or the specified player.",
                            "**wiki** (query) - Displays the wiki page for the specified query."
                        ].join("\n")
                    },
                    { type: ComponentType.Separator },
                    {
                        type: ComponentType.TextDisplay,
                        content: [
                            "Options with () are optional.",
                            "Options with [] are required.",
                            "Commands are case insensitive.",
                            "Commands can be used with ! or without.",
                        ].join("\n")
                    }
                ]
            }
        ]
    } as RESTPostAPIChannelMessageJSONBody;

    await SendMessage("1402532834551533649", message); // combined bridge
    await SendMessage("1166902582464237658", message); // duck bridge
    await SendMessage("1166891695774904410", message); // duckling bridge

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