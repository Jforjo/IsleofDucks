import { APIApplicationCommandInteractionDataStringOption, APIChatInputApplicationCommandInteraction, APIChatInputApplicationCommandInteractionData, APIInteraction, APIInteractionResponse, ApplicationCommandOptionType, ApplicationCommandType, InteractionResponseType } from "discord-api-types/v10";
import { getUsernameOrUUID } from "../../hypixelUtils";
import { CreateInteractionResponse, ConvertSnowflakeToDate, FollowupMessage, IsleofDucks } from "../../discordUtils";
import { NextRequest, NextResponse } from "next/server.js";
import { SkyBlockProfileMember } from "@zikeji/hypixel/dist/types/Augmented/SkyBlock/ProfileMember.js";
import { SkyBlockProfile } from "@zikeji/hypixel/dist/types/Augmented/SkyBlock/Profile.js";
import { SkyblockProfilesResponse } from "@zikeji/hypixel/dist/types/AugmentedTypes.js";

function isInventoryAPI(profiledata: SkyBlockProfileMember): boolean {
    if (!profiledata) return false;
    if (!profiledata.inventory) return false;
    if (!profiledata.inventory.inv_contents) return false;
    return true;
}
function isCollectionAPI(profiledata: SkyBlockProfileMember): boolean {
    if (!profiledata) return false;
    if (!profiledata.collection) return false;
    return true;
}
function isBankingAPI(profile: SkyBlockProfile): boolean {
    if (!profile) return false;
    if (!profile.banking) return false;
    if (!profile.banking.balance) return false;
    if (profile.banking.balance === -1) return false;
    return true;
}
function isPersonalVaultAPI(profiledata: SkyBlockProfileMember): boolean {
    if (!profiledata) return false;
    if (!profiledata.inventory) return false;
    if (!profiledata.inventory.personal_vault_contents) return false;
    return true;
}
function isSkillsAPI(profiledata: SkyBlockProfileMember): boolean {
    if (!profiledata) return false;
    if (!profiledata.player_data) return false;
    return true;
}

async function checkAPI(
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
        skills: boolean
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
        skills: isSkillsAPI(profiledata)
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
    const yes = "<:yes:1288141736756908113>";
    const no = "<:no:1288141853018951811>";
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
    const profileAPIResponse = await checkAPI(mojang.uuid, profile);
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
export const CommandData = {
    name: "checkapi",
    description: "Checks if a user has their APIs enabled on Hypixel Skyblock",
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