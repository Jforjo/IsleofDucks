import { ConvertSnowflakeToDate, CreateInteractionResponse, Emojis, FollowupMessage, IsleofDucks } from "@/discord/discordUtils";
import { getUsernameOrUUID, isPlayerInGuild } from "@/discord/hypixelUtils";
import { SkyblockProfilesResponse } from "@zikeji/hypixel/dist/types/AugmentedTypes";
import { APIApplicationCommandInteractionDataStringOption, APIChatInputApplicationCommandInteraction, APIInteractionResponse, ApplicationCommandOptionType, ApplicationCommandType, InteractionResponseType, RESTPatchAPIApplicationCommandJSONBody } from "discord-api-types/v10";
import { NextRequest, NextResponse } from "next/server";
import { isBankingAPI, isCollectionAPI, isInventoryAPI, isPersonalVaultAPI, isSkillsAPI } from "./checkapi";
import { SkyBlockProfileMember } from "@zikeji/hypixel/dist/types/Augmented/SkyBlock/ProfileMember";
import { getBannedPlayer } from "@/discord/utils";

function getGuildRequirements(profileData: SkyBlockProfileMember): { ducks: boolean, ducklings: boolean } {
    const level = profileData.leveling.experience ?? 0;
    return {
        ducks: level > 30000,
        ducklings: level > 20000,
    }
}

async function checkPlayer(
    uuid: string,
    profilename: string
): Promise<
    {
        success: false;
        status?: number;
        message: string;
        ping?: boolean;
    } | {
        success: true;
        status: number;
        name: string;
        inventory: boolean;
        collection: boolean;
        banking: boolean;
        vault: boolean;
        skills: boolean;
        guildRequirements: { ducks: boolean, ducklings: boolean };
    }
> {
    if (!process.env.HYPIXEL_API_KEY) {
        return {
            success: false,
            message: 'Missing HYPIXEL_API_KEY',
            ping: true
        }
    }

    const res = await fetch(`https://api.hypixel.net/v2/skyblock/profiles?uuid=${encodeURIComponent(uuid)}`, {
        method: 'GET',
        headers: {
            'API-Key': process.env.HYPIXEL_API_KEY
        }
    });
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
                ping: data.cause === "Invalid API key"
            };
        }
        return {
            success: false,
            status: res.status,
            message: 'Bad response from Hypixel',
        };
    }
    if (data.profiles.length === 0) {
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

    return {
        success: true,
        status: res.status,
        name: profile.cute_name ?? "",
        inventory: isInventoryAPI(profiledata),
        collection: isCollectionAPI(profiledata),
        banking: isBankingAPI(profile),
        vault: isPersonalVaultAPI(profiledata),
        skills: isSkillsAPI(profiledata),
        guildRequirements: getGuildRequirements(profiledata),
    };
}

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
    });

    const timestamp = ConvertSnowflakeToDate(interaction.id);

    if (!interaction.data) {
        await FollowupMessage(interaction.token, {
            content: null,
            embeds: [
                {
                    title: "Something went wrong!",
                    description: "Missing interaction data",
                    color: parseInt("B00020", 16),
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
            content: null,
            embeds: [
                {
                    title: "Something went wrong!",
                    description: "Missing interaction data",
                    color: parseInt("B00020", 16),
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
            content: null,
            embeds: [
                {
                    title: "Something went wrong!",
                    description: mojang.message,
                    color: parseInt("B00020", 16),
                    footer: {
                        text: `Response time: ${Date.now() - timestamp.getTime()}ms`,
                    },
                    timestamp: new Date().toISOString()
                }
            ],
        });
        return NextResponse.json(
            { success: false, error: mojang.message },
            { status: mojang.status }
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
                    description: guildResponse.message,
                    color: parseInt("B00020", 16),
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
                    description: profileAPIResponse.message,
                    color: parseInt("B00020", 16),
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

    await FollowupMessage(interaction.token, {
        content: undefined,
        embeds: [
            {
                title: mojang.name,
                thumbnail: {
                    url: `https://mineskin.eu/helm/${username}/100.png`
                },
                url: `https://sky.shiiyu.moe/stats/${mojang.uuid}/${profileAPIResponse.name}`,
                description: `
                    ${profileAPIResponse.inventory ? yes : no} Inventory API
                    ${profileAPIResponse.banking ? yes : no} Banking API
                    ${profileAPIResponse.collection ? yes : no} Collection API
                    ${profileAPIResponse.skills ? yes : no} Skills API
                    ${profileAPIResponse.vault ? yes : no} Personal Vault API
                `,
                fields: [
                    {
                        name: "Guild",
                        value: guildResponse.isInGuild ? `${no} ${guildResponse.guild.name}` : `${yes} They are not in a guild`,
                        inline: false
                    },
                    {
                        name: "Guild Requirements",
                        value: [
                            `${profileAPIResponse.guildRequirements.ducks ? yes : no} Ducks`,
                            `${profileAPIResponse.guildRequirements.ducklings ? yes : no} Ducklings`,
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
                    }
                ],
                color: parseInt("FB9B00", 16),
                footer: {
                    text: `Response time: ${Date.now() - timestamp.getTime()}ms`,
                },
                timestamp: new Date().toISOString()
            }
        ],
    });
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