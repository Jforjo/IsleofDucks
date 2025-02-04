import { ConvertSnowflakeToDate, CreateInteractionResponse, Emojis, FollowupMessage, IsleofDucks } from "@/discord/discordUtils";
import { getUsernameOrUUID, isPlayerInGuild } from "@/discord/hypixelUtils";
import { SkyblockProfilesResponse } from "@zikeji/hypixel/dist/types/AugmentedTypes";
import { APIApplicationCommandInteractionDataStringOption, APIChatInputApplicationCommandInteraction, APIInteractionResponse, ApplicationCommandOptionType, ApplicationCommandType, ButtonStyle, ComponentType, InteractionResponseType, RESTPatchAPIApplicationCommandJSONBody } from "discord-api-types/v10";
import { NextResponse } from "next/server";
import { isBankingAPI, isCollectionAPI, isInventoryAPI, isPersonalVaultAPI, isSkillsAPI } from "./checkapi";
import { getBannedPlayer, getSettingValue } from "@/discord/utils";
import { getScammerFromUUID } from "@/discord/jerry";

export async function checkPlayer(
    uuid: string,
    profilename = "",
    apikey = process.env.HYPIXEL_API_KEY
): Promise<
    {
        success: false;
        status?: number;
        message: string;
        ping?: boolean;
        retry?: number | null;
    } | {
        success: true;
        status: number;
        name: string;
        inventory: boolean;
        collection: boolean;
        banking: boolean;
        vault: boolean;
        skills: boolean;
        duckReq: number;
        ducklingReq: number;
        experience: number;
    }
> {
    if (!apikey) {
        return {
            success: false,
            message: 'Missing HYPIXEL_API_KEY',
            ping: true
        }
    }

    const res = await fetch(`https://api.hypixel.net/v2/skyblock/profiles?uuid=${encodeURIComponent(uuid)}`, {
        method: 'GET',
        headers: {
            'API-Key': apikey
        }
    });
    const retryAfter = res.headers.get('RateLimit-Reset');

    let data;
    try {
        data = await res.json() as SkyblockProfilesResponse;
    } catch (err) {
        console.error(err);
        console.error("res", res);
        return {
            success: false,
            status: res.status,
            message: 'Bad response from Hypixel',
        };
    }
    if (!res.ok) {
        if (data && data.cause) {
            return {
                success: false,
                status: res.status,
                message: typeof data.cause === "string" ? data.cause : "Unknown error",
                ping: data.cause === "Invalid API key",
                retry: retryAfter ? parseInt(retryAfter) * 1000 : null
            };
        }
        return {
            success: false,
            status: res.status,
            message: 'Bad response from Hypixel',
        };
    }
    if (!data.profiles || data.profiles.length === 0) {
        return {
            success: false,
            status: res.status,
            message: 'User has no profiles',
        };
    }
    let profile = data.profiles.find((p) => p.cute_name === profilename);
    if (!profile) profile = data.profiles.find((p) => p.selected);
    if (!profile) {
        return {
            success: false,
            status: res.status,
            message: 'User has no selected profile',
        };
    }
    const profiledata = profile.members[uuid];

    let totalExp = 0;
    for (const profile of data.profiles) {
        const member = profile.members[uuid];
        if (!member) continue;
        if (!("leveling" in member)) continue;
        if (!member.leveling) continue;
        if (!("experience" in member.leveling)) continue;
        if (!member.leveling.experience) continue;
        if (totalExp < member.leveling.experience) totalExp = member.leveling.experience;
    }

    return {
        success: true,
        status: res.status,
        name: profile.cute_name ?? "",
        inventory: isInventoryAPI(profiledata),
        collection: isCollectionAPI(profiledata),
        banking: isBankingAPI(profile),
        vault: isPersonalVaultAPI(profiledata),
        skills: isSkillsAPI(profiledata),
        duckReq: Number(await getSettingValue("duck_req") ?? "0"),
        ducklingReq: Number(await getSettingValue("duckling_req") ?? "0"),
        experience: totalExp,
    };
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

    if (!interaction.member) {
        await FollowupMessage(interaction.token, {
            embeds: [
                {
                    title: "Something went wrong!",
                    description: "Could not find who ran the command",
                    color: 0xB00020,
                    footer: {
                        text: `Response time: ${Date.now() - timestamp.getTime()}ms`,
                    },
                    timestamp: new Date().toISOString()
                }
            ],
        });
        return NextResponse.json(
            { success: false, error: "Could not find who ran the command" },
            { status: 400 }
        );
    }
    if (!interaction.data) {
        await FollowupMessage(interaction.token, {
            embeds: [
                {
                    title: "Something went wrong!",
                    description: "Missing interaction data",
                    color: 0xB00020,
                    footer: {
                        text: `Response time: ${Date.now() - timestamp.getTime()}ms`,
                    },
                    timestamp: new Date().toISOString()
                }
            ],
        });
        return NextResponse.json(
            { success: false, error: 'Missing interaction data' },
            { status: 400 }
        );
    }
    if (!interaction.data.options) {
        await FollowupMessage(interaction.token, {
            embeds: [
                {
                    title: "Something went wrong!",
                    description: "Missing interaction data",
                    color: 0xB00020,
                    footer: {
                        text: `Response time: ${Date.now() - timestamp.getTime()}ms`,
                    },
                    timestamp: new Date().toISOString()
                }
            ],
        });
        return NextResponse.json(
            { success: false, error: 'Missing interaction data options' },
            { status: 400 }
        );
    }

    const options = Object.fromEntries(interaction.data.options.map(option => {
        option = option as APIApplicationCommandInteractionDataStringOption;
        return [option.name, option.value];
    }));
    const username = options.username;
    const profile = options.profile;
    const yes = Emojis.yes;
    const no = Emojis.no;
    const mojang = await getUsernameOrUUID(username);

    if (!mojang.success) {
        await FollowupMessage(interaction.token, {
            embeds: [
                {
                    title: "Something went wrong!",
                    description: mojang.message,
                    color: 0xB00020,
                    footer: {
                        text: `Response time: ${Date.now() - timestamp.getTime()}ms`,
                    },
                    timestamp: new Date().toISOString()
                }
            ],
        });
        return NextResponse.json(
            { success: false, error: mojang.message },
            { status: 400 }
        );
    }

    const guildResponse = await isPlayerInGuild(mojang.uuid);
    if (!guildResponse.success) {
        let content = undefined;
        if (guildResponse.ping === true) content = `<@${IsleofDucks.staticIDs.Jforjo}>`;
        await FollowupMessage(interaction.token, {
            content: content,
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
            { status: guildResponse.status }
        );
    }

    const profileAPIResponse = await checkPlayer(mojang.uuid, profile);
    if (!profileAPIResponse.success) {
        let content = undefined;
        if (profileAPIResponse.ping === true) content = `<@${IsleofDucks.staticIDs.Jforjo}>`;
        await FollowupMessage(interaction.token, {
            content: content,
            embeds: [
                {
                    title: "Something went wrong!",
                    description: profileAPIResponse.message === "Key throttle" && typeof profileAPIResponse.retry === "number" ? [
                        profileAPIResponse.message,
                        `Try again <t:${Math.floor(( timestamp.getTime() + profileAPIResponse.retry ) / 1000)}:R>`
                    ].join("\n") : profileAPIResponse.message,
                    color: 0xB00020,
                    footer: {
                        text: `Response time: ${Date.now() - timestamp.getTime()}ms`,
                    },
                    timestamp: new Date().toISOString()
                }
            ],
        });
        return NextResponse.json(
            { success: false, error: profileAPIResponse.message },
            { status: profileAPIResponse.status }
        );
    }

    const bannedResponse = await getBannedPlayer(mojang.uuid);
    // const oldScammerResponse = await isOnOldScammerList(mojang.uuid);
    const scammerResponse = await getScammerFromUUID(mojang.uuiddashes);

    await FollowupMessage(interaction.token, {
        embeds: [
            {
                title: mojang.name.replaceAll('_', '\\_'),
                thumbnail: {
                    url: `attachment://${mojang.name}.png`
                },
                url: `https://sky.shiiyu.moe/stats/${mojang.uuid}/${profileAPIResponse.name}`,
                description: 
                    profileAPIResponse.inventory &&
                    profileAPIResponse.collection &&
                    profileAPIResponse.skills &&
                    profileAPIResponse.vault &&
                    ( profileAPIResponse.experience >= profileAPIResponse.duckReq || profileAPIResponse.experience >= profileAPIResponse.ducklingReq ) &&
                    !guildResponse.isInGuild &&
                    ( scammerResponse.success && !scammerResponse.scammer ) &&
                    !bannedResponse ? `\`\`\`/g invite ${mojang.name}\`\`\`` : undefined,
                fields: [
                    {
                        name: "Guild",
                        value: guildResponse.isInGuild ?
                            [
                                `${no} [${guildResponse.guild.name}](https://plancke.io/hypixel/guild/player/${mojang.uuid}) [${guildResponse.guild.tag}] (${guildResponse.guild.members.length}/125)`,
                                `Rank: ${guildResponse.guild.members.find(member => member.uuid === mojang.uuid)?.rank}`
                            ].join('\n') :
                            `${yes} They are not in a guild`,
                        inline: false
                    },
                    {
                        name: "Guild Requirements",
                        value: [
                            `${profileAPIResponse.experience < profileAPIResponse.duckReq ? no : yes} Ducks (${Math.floor(profileAPIResponse.experience / 100)}/${Math.floor(profileAPIResponse.duckReq / 100)})`,
                            `${profileAPIResponse.experience < profileAPIResponse.ducklingReq ? no : yes} Ducklings (${Math.floor(profileAPIResponse.experience / 100)}/${Math.floor(profileAPIResponse.ducklingReq / 100)})`,
                        ].join('\n'),
                        inline: false
                    },
                    {
                        name: "APIs",
                        value: [
                            `${profileAPIResponse.inventory ? yes : no} Inventory API`,
                            `${profileAPIResponse.banking ? yes : no} Banking API`,
                            `${profileAPIResponse.collection ? yes : no} Collection API`,
                            `${profileAPIResponse.skills ? yes : no} Skills API`,
                            `${profileAPIResponse.vault ? yes : no} Personal Vault API`,
                        ].join('\n'),
                        inline: false
                    },
                    {
                        name: "Banned",
                        value: bannedResponse ? `${no} ${bannedResponse.reason}` : `${yes} They are not in my ban list`,
                        inline: false
                    },
                    {
                        name: "Jerry Scammer List (by SkyblockZ: discord.gg/skyblock)",
                        value: [
                            scammerResponse.success && scammerResponse.scammer ? (
                                scammerResponse.details === null ?
                                    `${no} They are a scammer!` :
                                    `${no} ${scammerResponse.details.reason}`
                            ) : `${yes} They are not in the Jerry scammer list`,
                        ].join('\n'),
                        inline: false
                    }
                ],
                color: 0xFB9B00,
                footer: {
                    text: `Response time: ${Date.now() - timestamp.getTime()}ms`,
                },
                timestamp: new Date().toISOString()
            }
        ],
        components: !interaction.member.roles.includes(IsleofDucks.roles.staff) ? undefined : [
            {
                type: ComponentType.ActionRow,
                components: [
                    {
                        type: ComponentType.Button,
                        custom_id: `recruit-log-duck-${mojang.name}`,
                        label: "Duck Log",
                        style: ButtonStyle.Primary
                    },
                    {
                        type: ComponentType.Button,
                        custom_id: `recruit-invite-duck-${mojang.name}`,
                        label: "Duck Invite",
                        style: ButtonStyle.Primary,
                        disabled: true
                    }
                ]
            },
            {
                type: ComponentType.ActionRow,
                components: [
                    {
                        type: ComponentType.Button,
                        custom_id: `recruit-log-duckling-${mojang.name}`,
                        label: "Duckling Log",
                        style: ButtonStyle.Primary
                    },
                    {
                        type: ComponentType.Button,
                        custom_id: `recruit-invite-duckling-${mojang.name}`,
                        label: "Duckling Invite",
                        style: ButtonStyle.Primary,
                        disabled: true
                    }
                ]
            }
        ]
    }, [
        {
            id: 0,
            url: `https://mineskin.eu/helm/${mojang.name}/100.png`,
            filename: `${mojang.name}.png`
        }
    ]);
    return NextResponse.json(
        { success: true },
        { status: 200 }
    );
}
export const CommandData: RESTPatchAPIApplicationCommandJSONBody = {
    name: "recruit",
    description: "Checks if a user passes all guild requirements.",
    type: ApplicationCommandType.ChatInput,
    options: [
        {
            name: "username",
            description: "Minecraft username",
            type: ApplicationCommandOptionType.String,
            required: true
        },
        {
            name: "profile",
            description: "Profile name (cute name)",
            type: ApplicationCommandOptionType.String,
            required: false
        }
    ],
}