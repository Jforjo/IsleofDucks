import { ApplicationCommandOptionType, ApplicationCommandType } from "discord-api-types/v10";
import { InteractionResponseType } from "discord-interactions";
import { getUUID } from "../../utils/hypixelUtils.js";
import { ConvertSnowflakeToDate, IsleofDucks } from "../../utils/discordUtils.js";

function isInventoryAPI(profiledata) {
    return "inventory" in profiledata && "inv_contents" in profiledata.inventory;
}
function isCollectionAPI(profiledata) {
    return "collection" in profiledata;
}
function isBankingAPI(profile) {
    return "banking" in profile && "balance" in profile.banking && profile.banking.balance !== -1;
}
function isPersonalVaultAPI(profiledata) {
    return "inventory" in profiledata && "personal_vault_contents" in profiledata.inventory;
}
function isSkillsAPI(profiledata) {
    return "experience" in profiledata.player_data;
}

async function checkAPI(uuid, profilename) {
    const res = await fetch(`https://api.hypixel.net/v2/skyblock/profiles?uuid=${encodeURIComponent(uuid)}`, {
        method: 'GET',
        headers: {
            'API-Key': process.env.HYPIXEL_API_KEY
        }
    });
    const data = await res.json();
    if (!res.ok) {
        if (data && data.cause) {
            return {
                success: false,
                message: data.cause,
                ping: data.cause === "Invalid API key"
            };
        }
        return {
            success: false,
            message: 'Bad response from Hypixel',
            ping: false
        };
    }
    if (data.profiles.length === 0) {
        return {
            success: false,
            message: 'User has no profiles',
            ping: false
        };
    }
    let profile = data.profiles.find((p) => p.cute_name === profilename);
    if (!profile) profile = data.profiles.find((p) => p.selected);
    if (!profile) {
        return {
            success: false,
            message: 'User has no selected profile',
            ping: false
        };
    }
    const profiledata = profile.members[uuid];

    return {
        success: true,
        name: profile.cute_name,
        inventory: isInventoryAPI(profiledata),
        collection: isCollectionAPI(profiledata),
        banking: isBankingAPI(profile),
        vault: isPersonalVaultAPI(profiledata),
        skills: isSkillsAPI(profiledata)
    };
}

export default async (req, res) => {
    const interaction = req.body;
    const timestamp = ConvertSnowflakeToDate(interaction.id);
    const options = Object.fromEntries(interaction.data.options.map(option => [option.name, option.value]));
    const username = options.username;
    const profile = options.profile;
    const yes = "<:yes:1288141736756908113>";
    const no = "<:no:1288141853018951811>";
    const mojang = await getUUID(username);
    if (!mojang.success) {
        return res.status(200).send({
            type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
            data: {
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
            },
        });
    }
    const { success, message, ping, name, inventory, collection, banking, vault, skills } = await checkAPI(mojang.uuid, profile);
    if (!success) {
        let content = null;
        if (ping === true) content = `<@${IsleofDucks.staticIDs.Jforjo}>`;
        return res.status(200).send({
            type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
            data: {
                content: content,
                embeds: [
                    {
                        title: "Something went wrong!",
                        description: message,
                        color: parseInt("B00020", 16),
                        footer: {
                            text: `Response time: ${Date.now() - timestamp.getTime()}ms`,
                        },
                        timestamp: new Date().toISOString()
                    }
                ],
            },
        });
    }
    return res.status(200).send({
        type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
        data: {
            content: null,
            embeds: [
                {
                    title: mojang.name,
                    thumbnail: {
                        url: `https://mineskin.eu/helm/${username}/100.png`
                    },
                    url: `https://sky.shiiyu.moe/stats/${mojang.uuid}/${name}`,
                    description: `
                        ${inventory ? yes : no} Inventory API
                        ${banking ? yes : no} Banking API
                        ${collection ? yes : no} Collection API
                        ${skills ? yes : no} Skills API
                        ${vault ? yes : no} Personal Vault API
                    `,
                    color: parseInt("FB9B00", 16),
                    footer: {
                        text: `Response time: ${Date.now() - timestamp.getTime()}ms`,
                    },
                    timestamp: new Date().toISOString()
                }
            ],
        },
    });
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