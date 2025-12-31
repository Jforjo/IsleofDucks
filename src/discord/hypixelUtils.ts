import { Guild } from "@zikeji/hypixel/dist/types/Augmented/Guild";
import { Player } from "@zikeji/hypixel/dist/types/Augmented/Player";
import { SkyBlockProfile } from "@zikeji/hypixel/dist/types/Augmented/SkyBlock/Profile";
import { GuildResponse, PlayerResponse, ResourcesSkyblockCollectionsResponse, SkyblockProfilesResponse } from "@zikeji/hypixel/dist/types/AugmentedTypes";


export async function getUsernameOrUUID(
    query: string
): Promise<
    {
        success: false;
        message: string;
    } | {
        success: true;
        uuid: string;
        uuiddashes: string;
        name: string;
    }
> {
    let res: {
        success: false;
        message: string;
    } | {
        success: true;
        uuid: string;
        uuiddashes: string;
        name: string;
    } | false = false;
    // if (query.length > 25) res = await getUsernameFromMojang(query);
    // else res = await getUUIDFromMojang(query);
    // if (res !== false) return res;
    res = await getUsernameOrUUIDFromPlayerDB(query);
    if (res !== false) return res;
    res = await getUsernameOrUUIDFromMinetools(query);
    if (res !== false) return res;
    // TODO: Implement more backups
    return {
        success: false,
        message: "Could not find player"
    };
}
export interface MojangResponseSuccess {
    id: string;
    name: string;
    path: never;
    error: never;
    errorMessage: never;
}
export interface MojangResponseError {
    id: never;
    name: never;
    path: string;
    error: string;
    errorMessage: string;
}
export async function getUsernameFromMojang(uuid: string): Promise<
    {
        success: false;
        message: string;
    } | {
        success: true;
        uuid: string;
        uuiddashes: string;
        name: string;
    } | false
> {
    const res = await fetch(`https://api.minecraftservices.com/minecraft/profile/lookup/${encodeURIComponent(uuid)}`);
    if (!res.ok) {
        console.log("Mojang response", res);
        console.log("Mojang body", await res.text());
        return false;
    }
    try {
        // It returns other stuff, but I don't care
        const data = await res.json() as MojangResponseSuccess | MojangResponseError
        if (data.error) return {
            success: false,
            message: data.errorMessage
        }
        return {
            success: true,
            uuid: data.id,
            uuiddashes: addDashesToUUID(data.id),
            name: data.name
        }
    } catch {
        return false;
    }
}
export async function getUUIDFromMojang(username: string): Promise<
    {
        success: false;
        message: string;
    } | {
        success: true;
        uuid: string;
        uuiddashes: string;
        name: string;
    } | false
> {
    const res = await fetch(`https://api.mojang.com/users/profiles/minecraft/${encodeURIComponent(username)}`);
    if (!res.ok) {
        console.log("Mojang response", res);
        console.log("Mojang body", await res.text());
        return false;
    }
    try {
        // It returns other stuff, but I don't care
        const data = await res.json() as MojangResponseSuccess | MojangResponseError
        if (data.error) return {
            success: false,
            message: data.errorMessage
        }
        return {
            success: true,
            uuid: data.id,
            uuiddashes: addDashesToUUID(data.id),
            name: data.name
        }
    } catch {
        return false;
    }
}
export async function getUsernameOrUUIDFromPlayerDB(query: string): Promise<
    {
        success: false;
        message: string;
    } | {
        success: true;
        uuid: string;
        uuiddashes: string;
        name: string;
    } | false
> {
    const res = await fetch(`https://playerdb.co/api/player/minecraft/${encodeURIComponent(query)}`);
    if (!res.ok) {
        console.log("PlayerDB response", res);
        console.log("PlayerDB body", await res.text());
        return false;
    }
    try {
        // It returns other stuff, but I don't care
        const data = await res.json() as {
            code: string;
            message: string;
            data: {
                player?: {
                    username: string;
                    id: string;
                    raw_id: string;
                }
            };
            success: boolean;
        }
        if (!data.success) return {
            success: false,
            message: data.message
        }
        if (!data.data.player) return false;
        return {
            success: true,
            uuid: data.data.player.raw_id,
            uuiddashes: data.data.player.id,
            name: data.data.player.username
        }
    } catch {
        return false;
    }
}
export async function getUsernameOrUUIDFromMinetools(query: string): Promise<
    {
        success: false;
        message: string;
    } | {
        success: true;
        uuid: string;
        uuiddashes: string;
        name: string;
    } | false
> {
    // const res = await fetch(`https://api.minetools.eu/uuid/${encodeURIComponent(query)}`, {
    //     mode: 'no-cors'
    // });
    const res = await fetch(`https://api.minetools.eu/uuid/${encodeURIComponent(query)}`);
    if (!res.ok) {
        console.log("Minetools response", res);
        console.log("Minetools body", await res.text());
        return false;
    }
    try {
        const data = await res.json() as {
            id: string | null;
            name: string | null;
            status: string;
            error?: string;
            errorMessage?: string;
        };
        if (data.error || data.errorMessage) {
            console.log("Minetools data", data);
            console.log("Minetools data", JSON.stringify(data));
            return false;
        }
        if (data.name === null) return {
            success: false,
            message: "Invalid UUID"
        }
        if (data.id === null) return {
            success: false,
            message: "Invalid Username"
        }
        return {
            success: true,
            uuid: data.id,
            uuiddashes: addDashesToUUID(data.id),
            name: data.name
        };
    } catch {
        return false;
    }
}

export function addDashesToUUID(uuid: string): string {
    return uuid.slice(0,8) + "-" +
        uuid.slice(8,12) + "-" +
        uuid.slice(12,16) + "-" +
        uuid.slice(16,20) + "-" +
        uuid.slice(20);
}

export async function getProfiles(
    uuid: string
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
    const retryAfter = res.headers.get('RateLimit-Reset');

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
                ping: data.cause === "Invalid API key",
                retry: retryAfter ? parseInt(retryAfter) * 1000 : null
            };
        }
        return {
            success: false,
            status: res.status,
            message: 'Bad response from Hypixel'
        };
    }
    if (!data.profiles || data.profiles.length === 0) {
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

export async function getGuildData(
    name: string
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
    const res = await fetch(`https://api.hypixel.net/v2/guild?name=${encodeURIComponent(name)}`, {
        method: 'GET',
        headers: {
            'API-Key': process.env.HYPIXEL_API_KEY
        }
    });
    const retryAfter = res.headers.get('RateLimit-Reset');

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
                ping: data.cause === "Invalid API key",
                retry: retryAfter ? parseInt(retryAfter) * 1000 : null
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

export async function isPlayerInGuild(
    uuid: string,
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
        isInGuild: false;
    } | {
        success: true;
        status: number;
        isInGuild: true;
        guild: Guild;
    }
> {
    if (!apikey) {
        return {
            success: false,
            message: 'Missing HYPIXEL_API_KEY',
            ping: true
        };
    }
    const res = await fetch(`https://api.hypixel.net/v2/guild?player=${encodeURIComponent(uuid)}`, {
        method: 'GET',
        headers: {
            'API-Key': apikey
        }
    });
    const retryAfter = res.headers.get('RateLimit-Reset');
    
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
                ping: data.cause === "Invalid API key",
                retry: retryAfter ? parseInt(retryAfter) * 1000 : null
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
            success: true,
            status: res.status,
            isInGuild: false
        };
    }
    return {
        success: true,
        status: res.status,
        isInGuild: true,
        guild: data.guild
    };
}

export async function getHypixelPlayer(uuid: string): Promise<
    {
        success: false;
        status?: number;
        message: string;
        ping?: boolean;
        retry?: number | null;
    } | {
        success: true;
        status: number;
        player: Player;
    }
> {
    if (!process.env.HYPIXEL_API_KEY) {
        return {
            success: false,
            message: 'Missing HYPIXEL_API_KEY',
            ping: true
        };
    }
    const res = await fetch(`https://api.hypixel.net/v2/player?uuid=${encodeURIComponent(uuid)}`, {
        method: 'GET',
        headers: {
            'API-Key': process.env.HYPIXEL_API_KEY
        }
    });
    const retryAfter = res.headers.get('RateLimit-Reset');

    let data;
    try {
        data = await res.json() as PlayerResponse;
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
                ping: data.cause === "Invalid API key",
                retry: retryAfter ? parseInt(retryAfter) * 1000 : null
            };
        }
        return {
            success: false,
            status: res.status,
            message: 'Bad response from Hypixel'
        };
    }
    if (data.player === null) {
        return {
            success: false,
            status: res.status,
            message: 'Player not found'
        };
    }
    return {
        success: true,
        status: res.status,
        player: data.player
    };
}

export async function getHypixelCollections(): Promise<
    {
        success: false;
        status?: number;
        message: string;
        ping?: boolean;
        retry?: number | null;
    } | {
        success: true;
        status: number;
        collections: ResourcesSkyblockCollectionsResponse['collections'];
    }
> {
    const res = await fetch('https://api.hypixel.net/v2/resources/skyblock/collections', {
        method: 'GET',
    });
    const retryAfter = res.headers.get('RateLimit-Reset');

    let data;
    try {
        data = await res.json() as ResourcesSkyblockCollectionsResponse;
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
                ping: data.cause === "Invalid API key",
                retry: retryAfter ? parseInt(retryAfter) * 1000 : null
            };
        }
        return {
            success: false,
            status: res.status,
            message: 'Bad response from Hypixel'
        };
    }

    return {
        success: true,
        status: res.status,
        collections: data.collections
    };
}