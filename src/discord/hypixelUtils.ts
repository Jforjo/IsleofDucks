import { Guild } from "@zikeji/hypixel/dist/types/Augmented/Guild";
import { SkyBlockProfile } from "@zikeji/hypixel/dist/types/Augmented/SkyBlock/Profile";
import { GuildResponse, SkyblockProfilesResponse } from "@zikeji/hypixel/dist/types/AugmentedTypes";

export type MinetoolsResponse = {
    id: string | null;
    name: string | null;
    status: string;
    error?: string;
    errorMessage?: string;
}

/**
 * Fetches the Minecraft UUID and username from the Minetools API
 * based on the provided query, which can be either a UUID or a username.
 *
 * @param query - The Minecraft username or UUID to retrieve information for.
 * @returns A promise that resolves to an object:
 *          - If unsuccessful, contains an error message and optional ping flag.
 *          - If successful, contains the UUID and username.
 *
 * The function makes an API request to Minetools, and handles errors such as
 * bad responses or missing data. It returns an error message if the response
 * is unsuccessful or if the UUID or username is invalid.
 */
export async function getUsernameOrUUID(
    query: string
): Promise<
{
    success: false;
    status: number;
    message: string;
    ping?: boolean;
} | {
    success: true;
    status: number;
    uuid: string;
    name: string;
}
> {
    const res = await fetch(`https://api.minetools.eu/uuid/${encodeURIComponent(query)}`, {
        mode: 'no-cors'
    });
    let data;
    try {
        data = await res.json() as MinetoolsResponse;
    } catch (e) {
        console.error(e);
        console.error("res", res);
        return {
            success: false,
            status: res.status,
            message: 'Bad response from Minetools'
        };
    }
    if (!res.ok || data.status !== 'OK') {
        if (data && data.errorMessage) {
            return {
                success: false,
                status: res.status,
                message: data.errorMessage,
            };
        }
        return {
            success: false,
            status: res.status,
            message: 'Bad response from Minetools'
        };
    }
    if (data.name === null) return {
        success: false,
        status: res.status,
        message: "Invalid UUID"
    }
    if (data.id === null) return {
        success: false,
        status: res.status,
        message: "Invalid Username"
    }
    return {
        success: true,
        status: res.status,
        uuid: data.id,
        name: data.name
    };
}

/**
 * Fetches SkyBlock profiles from the Hypixel API for a given UUID.
 * 
 * @param uuid - The UUID of the Minecraft player whose profiles are to be retrieved.
 * @returns A promise that resolves to an object:
 *          - If successful, contains a list of SkyBlock profiles.
 *          - If unsuccessful, contains an error message and optional ping flag.
 * 
 * The function requires the HYPIXEL_API_KEY environment variable to be set.
 * It returns an error message if the API key is missing or if the response from
 * Hypixel is not successful.
 */
export async function getProfiles(
    uuid: string
): Promise<
    {
        success: false;
        status?: number;
        message: string;
        ping?: boolean;
    } | {
        success: true;
        status: number;
        profiles: SkyBlockProfile[];
    }
> {
    if (!process.env.HYPIXEL_API_KEY) {
        return {
            success: false,
            message: 'Missing HYPIXEL_API_KEY',
            ping: true
        };
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
    } catch (e) {
        console.error(e);
        console.error("res", res);
        return {
            success: false,
            status: res.status,
            message: 'Bad response from Hypixel'
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
            message: 'Bad response from Hypixel'
        };
    }
    if (data.profiles.length === 0) {
        return {
            success: false,
            status: res.status,
            message: 'User has no profiles'
        };
    }
    return {
        success: true,
        status: res.status,
        profiles: data.profiles
    };
}
// TODO: make values above cata 50 automatic, since they increase by the same amount
export const catalevels: Record<number, number> = {
    1: 50, 2: 125, 3: 235, 4: 395, 5: 625, 6: 955, 7: 1425, 8: 2095, 9: 3045,
    10: 4385, 11: 6275, 12: 8940, 13: 12700, 14: 17960, 15: 25340, 16: 35640,
    17: 50040, 18: 70040, 19: 97640, 20: 135640, 21: 188140, 22: 259640, 23: 356640,
    24: 488640, 25: 668640, 26: 911640, 27: 1239640, 28: 1684640, 29: 2284640,
    30: 3084640, 31: 4149640, 32: 5559640, 33: 7459640, 34: 9959640, 35: 13259640,
    36: 17559640, 37: 23159640, 38: 30359640, 39: 39559640, 40: 51559640, 41: 66559640,
    42: 85559640, 43: 109559640, 44: 139559640, 45: 177559640, 46: 225559640,
    47: 285559640, 48: 360559640, 49: 453559640, 50: 569809640, 51: 769809640,
    52: 967809640, 53: 1167809640, 54: 1367809640, 55: 1567809640, 56: 1767809640,
    57: 1967809640, 58: 2167809640, 59: 2367809640, 60: 2567809640, 61: 2767809640,
    62: 2967809640, 63: 3167809640, 64: 3367809640, 65: 3567809640, 66: 3767809640,
    67: 3967809640, 68: 4167809640, 69: 4367809640, 70: 4567809640, 71: 4767809640,
    72: 4967809640, 73: 5167809640, 74: 5367809640, 75: 5567809640, 76: 5767809640,
    77: 5967809640, 78: 6167809640, 79: 6367809640, 80: 6567809640, 81: 6767809640,
    82: 6967809640, 83: 7167809640, 84: 7367809640, 85: 7567809640, 86: 7767809640,
    87: 7967809640, 88: 8167809640, 89: 8367809640, 90: 8567809640, 91: 8767809640,
    92: 8967809640, 93: 9167809640, 94: 9367809640, 95: 9567809640, 96: 9767809640,
    97: 9967809640, 98: 10167809640, 99: 10367809640, 100: 10567809640,
};
/**
 * Calculates the Catacombs level based on the provided Catacombs experience.
 *
 * @param cataxp - The Catacombs experience points.
 * @returns The calculated Catacombs level as a number.
 *
 * The function iterates through the predefined Catacombs levels and calculates
 * the exact fractional level based on the experience points provided.
 */
export function calcCataLevel(cataxp: number): number {
    let catalvl = 0;
    for (const [key, value] of Object.entries(catalevels)) {
        if (cataxp < value) {
            catalvl += (cataxp - (catalevels[Number(key) - 1] ?? 0)) / (value - (catalevels[Number(key) - 1] ?? 0));
            break;
        }
        catalvl++;
    }
    return catalvl;
}
/**
 * Fetches guild data from the Hypixel API based on the guild name.
 * 
 * @param name - The name of the guild to retrieve data for.
 * @returns A promise that resolves to an object indicating the success status.
 *          - If successful, contains the guild object.
 *          - If unsuccessful, contains an error message and optional ping flag.
 * 
 * The function requires the HYPIXEL_API_KEY environment variable to be set.
 * It returns an error message if the API key is missing or if the response from
 * Hypixel is not successful.
 */
export async function getGuildData(
    name: string
): Promise<
    {
        success: false;
        status?: number;
        message: string;
        ping?: boolean;
    } | {
        success: true;
        status: number;
        guild: Guild;
    }
> {
    if (!process.env.HYPIXEL_API_KEY) {
        return {
            success: false,
            message: 'Missing HYPIXEL_API_KEY',
            ping: true
        };
    }
    const res = await fetch(`https://api.hypixel.net/guild?name=${encodeURIComponent(name)}`, {
        method: 'GET',
        headers: {
            'API-Key': process.env.HYPIXEL_API_KEY
        }
    });
    let data;
    try {
        data = await res.json() as GuildResponse;
    } catch (e) {
        console.error(e);
        console.error("res", res);
        return {
            success: false,
            status: res.status,
            message: 'Bad response from Hypixel'
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
            message: 'Bad response from Hypixel'
        };
    }
    if (data.guild === null) {
        return {
            success: false,
            status: res.status,
            message: 'Guild not found'
        };
    }
    return {
        success: true,
        status: res.status,
        guild: data.guild
    };
}