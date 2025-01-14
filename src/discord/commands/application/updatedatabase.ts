import { ConvertSnowflakeToDate, CreateInteractionResponse, FollowupMessage, IsleofDucks } from "@/discord/discordUtils";
import { getGuildData, getHypixelPlayer } from "@/discord/hypixelUtils";
import { addDiscordRole, getAllDiscordRolesWhereNameIsNull, getDiscordRole, updateDiscordRoleName } from "@/discord/utils";
import { APIChatInputApplicationCommandInteraction, APIInteractionResponse, ApplicationCommandType, InteractionResponseType } from "discord-api-types/v10";
import { NextResponse } from "next/server";

export async function UpdateDiscord(uuid: string): Promise<boolean> {
    const discordResult = await getDiscordRole(uuid);
    // Only update Discord if it hasn't been updated in the last 7 days
    if (discordResult && discordResult.discordupdated > Date.now() - 1000 * 60 * 60 * 24 * 7) return false;

    const playerResult = await getHypixelPlayer(uuid);
    if (!playerResult.success) return false;
    const player = playerResult.player;
    if (!player) return false;
    if (!player.uuid) return false;
    if (!player.socialMedia) return false;
    if (!player.socialMedia.links) return false;
    if (!player.socialMedia.links.DISCORD) return false;

    if (!discordResult) {
        await addDiscordRole(player.uuid, player.socialMedia.links.DISCORD, null, null);
        return true;
    }

    if (player.socialMedia.links.DISCORD === discordResult.discordname) return false;
    // Resetting Discord ID is intended
    await updateDiscordRoleName(player.uuid, player.socialMedia.links.DISCORD, null);
    return true;
}

export async function UpdateGuildDiscord(guildname: string): Promise<
    {
        success: false;
        status?: number;
        message: string;
        ping?: boolean;
        retry?: number | null;
    } | {
        success: true;
    }
> {
    const guildResponse = await getGuildData(guildname);
    if (!guildResponse.success) return guildResponse;
    await Promise.all(guildResponse.guild.members.map(async member => {
        await UpdateDiscord(member.uuid);
    }));
    // for (const member of guildResponse.guild.members) {
    //     await UpdateDiscord(member.uuid);
    // }
    return { success: true };
}

export async function UpdateAllDiscordRolesInDb(): Promise<number> {
    const users = await getAllDiscordRolesWhereNameIsNull();
    if (!users) return 0;
    if (users.length === 0) return 0;
    let count = 0;
    for (const user of users) {
        if (await UpdateDiscord(user.uuid)) count++;
    }
    return count;
}

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
    });
    
    const timestamp = ConvertSnowflakeToDate(interaction.id);

    if (!interaction.guild) {
        await FollowupMessage(interaction.token, {
            content: "This command can only be used in a server!"
        });
        return NextResponse.json(
            { success: false, error: "This command can only be used in a server" },
            { status: 400 }
        );
    }
    // If guild exists then so should member, but imma still check it
    if (!interaction.member) {
        await FollowupMessage(interaction.token, {
            content: "Could not find who ran the command!"
        });
        return NextResponse.json(
            { success: false, error: "Could not find who ran the command" },
            { status: 400 }
        );
    }
    let perm = false;
    for (const role of interaction.member.roles) {
        if (role === IsleofDucks.roles.admin) perm = true;
        // else if (role === IsleofDucks.roles.mod_duck) perm = true;
        // else if (role === IsleofDucks.roles.mod_duckling) perm = true;
        // else if (role === IsleofDucks.roles.service_management) perm = true;
        if (perm) break;
    }
    if (!perm) {
        await FollowupMessage(interaction.token, {
            content: "You don't have permission to use this command!"
        });
        return NextResponse.json(
            { success: false, error: "You don't have permission to use this command" },
            { status: 403 }
        );
    }

    await FollowupMessage(interaction.token, {
        embeds: [
            {
                title: "Updating Discord Data...",
                description: [
                    "Updating Discord Data for Isle of Ducks...",
                    "",
                    `If this embed doesn't change <t:${Math.floor(timestamp.getTime() / 1000) + 60}:R> then run the command again.`,
                    `Also, please note that this command is VERY likely to throttle the key if ran multiple times in a row.`
                ].join("\n"),
                color: 0xFB9B00,
                footer: {
                    text: `Response time: ${Date.now() - timestamp.getTime()}ms`,
                },
                timestamp: new Date().toISOString()
            }
        ]
    });

    let guildResponse = await UpdateGuildDiscord("Isle of Ducks");
    if (!guildResponse.success) {
        await FollowupMessage(interaction.token, {
            embeds: [
                {
                    title: "Something went wrong!",
                    description: guildResponse.message === "Key throttle" && typeof guildResponse.retry === "number" ? [
                        guildResponse.message,
                        `Try again <t:${Math.floor(( timestamp.getTime() + guildResponse.retry ) / 1000)}:R>`
                    ].join("\n") : guildResponse.message,
                    color: 0xB00020,
                    footer: {
                        text: `Response time: ${Date.now() - timestamp.getTime()}ms`,
                    },
                    timestamp: new Date().toISOString()
                }
            ],
        });
        return NextResponse.json(
            { success: false, error: guildResponse.message },
            { status: 500 }
        );
    }

    await FollowupMessage(interaction.token, {
        embeds: [
            {
                title: "Updating Discord Data...",
                description: [
                    "Updated Discord Data for Isle of Ducks.",
                    "Updating Discord Data for Isle of Ducklings...",
                    "",
                    `If this embed doesn't change <t:${Math.floor(timestamp.getTime() / 1000) + 60}:R> then run the command again.`,
                    `Also, please note that this command is VERY likely to throttle the key if ran multiple times in a row.`
                ].join("\n"),
                color: 0xFB9B00,
                footer: {
                    text: `Response time: ${Date.now() - timestamp.getTime()}ms`,
                },
                timestamp: new Date().toISOString()
            }
        ]
    });

    guildResponse = await UpdateGuildDiscord("Isle of Ducklings");
    if (!guildResponse.success) {
        await FollowupMessage(interaction.token, {
            embeds: [
                {
                    title: "Something went wrong!",
                    description: guildResponse.message === "Key throttle" && typeof guildResponse.retry === "number" ? [
                        guildResponse.message,
                        `Try again <t:${Math.floor(( timestamp.getTime() + guildResponse.retry ) / 1000)}:R>`
                    ].join("\n") : guildResponse.message,
                    color: 0xB00020,
                    footer: {
                        text: `Response time: ${Date.now() - timestamp.getTime()}ms`,
                    },
                    timestamp: new Date().toISOString()
                }
            ],
        });
        return NextResponse.json(
            { success: false, error: guildResponse.message },
            { status: 500 }
        );
    }

    await FollowupMessage(interaction.token, {
        embeds: [
            {
                title: "Updating Discord Data...",
                description: [
                    "Updated Discord Data for Isle of Ducks.",
                    "Updated Discord Data for Isle of Ducklings.",
                    "Updating Discord Data for existing users...",
                    "",
                    `If this embed doesn't change <t:${Math.floor(timestamp.getTime() / 1000) + 60}:R> then run the command again.`,
                    `Also, please note that this command is VERY likely to throttle the key if ran multiple times in a row.`
                ].join("\n"),
                color: 0xFB9B00,
                footer: {
                    text: `Response time: ${Date.now() - timestamp.getTime()}ms`,
                },
                timestamp: new Date().toISOString()
            }
        ]
    });

    let updatedCount = await UpdateAllDiscordRolesInDb();
    while (updatedCount >= 100) updatedCount = await UpdateAllDiscordRolesInDb();

    await FollowupMessage(interaction.token, {
        embeds: [
            {
                title: "Updated Discord Data!",
                description: [
                    "Updated Discord Data for Isle of Ducks.",
                    "Updated Discord Data for Isle of Ducklings.",
                    "Updated Discord Data for existing users.",
                ].join("\n"),
                color: 0xFB9B00,
                footer: {
                    text: `Response time: ${Date.now() - timestamp.getTime()}ms`,
                },
                timestamp: new Date().toISOString()
            }
        ]
    });

    return NextResponse.json(
        { success: true },
        { status: 200 }
    );
}
export const CommandData = {
    name: "updatedatabase",
    description: "Updates some internal data for all users.",
    type: ApplicationCommandType.ChatInput
}