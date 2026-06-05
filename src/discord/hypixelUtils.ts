import { Guild } from "@zikeji/hypixel/dist/types/Augmented/Guild";
import { Player } from "@zikeji/hypixel/dist/types/Augmented/Player";
import { SkyBlockProfile } from "@zikeji/hypixel/dist/types/Augmented/SkyBlock/Profile";
import { SkyBlockProfilePetsData } from "@zikeji/hypixel/dist/types/Augmented/SkyBlock/ProfileMember";
import { GuildResponse, PlayerResponse, ResourcesSkyblockCollectionsResponse, ResourcesSkyblockItemsResponse, SkyblockAuctionsResponse, SkyblockBazaarResponse, SkyblockProfilesResponse } from "@zikeji/hypixel/dist/types/AugmentedTypes";


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
        next: { revalidate: 600 },
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
        next: { revalidate: 600 },
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

export async function getHypixelItems(): Promise<
    {
        success: false;
        status?: number;
        message: string;
        ping?: boolean;
        retry?: number | null;
    } | {
        success: true;
        status: number;
        items: ResourcesSkyblockItemsResponse['items'];
    }
> {
    const res = await fetch('https://api.hypixel.net/v2/resources/skyblock/items', {
        method: 'GET',
    });
    const retryAfter = res.headers.get('RateLimit-Reset');

    let data;
    try {
        data = await res.json() as ResourcesSkyblockItemsResponse;
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
        items: data.items
    }
}

export async function getHypixelAuctions(page = 0): Promise<
    {
        success: false;
        status?: number;
        message: string;
        ping?: boolean;
        retry?: number | null;
    } | {
        success: true;
        status: number;
        auctions: SkyblockAuctionsResponse['auctions'];
    }
> {
    const res = await fetch(`https://api.hypixel.net/v2/skyblock/auctions?page=${page}`, {
        method: 'GET',
    });
    const retryAfter = res.headers.get('RateLimit-Reset');

    let data;
    try {
        data = await res.json() as SkyblockAuctionsResponse;
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

    const auctions = data.auctions!;

    if (page === 0 && data.page && data.totalPages && data.page < data.totalPages) {
        const promises = [];
        for (let pageNumber = data.page + 1; pageNumber <= data.totalPages; pageNumber++) {
            promises.push(getHypixelAuctions(pageNumber));
        }
        const results = await Promise.all(promises);
        for (const result of results) {
            if (!result.success) {
                console.error("Failed to fetch additional auction page:", result.message);
                return result;
            }
            auctions.push(...result.auctions!);
        }
    }

    return {
        success: true,
        status: res.status,
        auctions: auctions
    }
}

export async function getHypixelBazaar(): Promise<
    {
        success: false;
        status?: number;
        message: string;
        ping?: boolean;
        retry?: number | null;
    } | {
        success: true;
        status: number;
        bazaar: SkyblockBazaarResponse;
    }
> {
    const res = await fetch('https://api.hypixel.net/v2/skyblock/bazaar', {
        method: 'GET',
    });
    const retryAfter = res.headers.get('RateLimit-Reset');

    let data;
    try {
        data = await res.json() as SkyblockBazaarResponse;
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
        bazaar: data
    }
}

export const PetLevels: Record<number, number> = {
    1: 0,
    2: 660,
    3: 1_390,
    4: 2_190,
    5: 3_070,
    6: 4_030,
    7: 5_080,
    8: 6_230,
    9: 7_490,
    10: 8_870,
    11: 10_380,
    12: 12_030,
    13: 13_830,
    14: 15_790,
    15: 17_920,
    16: 20_230,
    17: 22_730,
    18: 25_430,
    19: 28_350,
    20: 31_510,
    21: 34_930,
    22: 38_630,
    23: 42_630,
    24: 46_980,
    25: 51_730,
    26: 56_930,
    27: 62_630,
    28: 68_930,
    29: 75_930,
    30: 83_730,
    31: 92_430,
    32: 102_130,
    33: 112_930,
    34: 124_930,
    35: 138_230,
    36: 152_930,
    37: 169_130,
    38: 186_930,
    39: 206_430,
    40: 227_730,
    41: 250_930,
    42: 276_130,
    43: 303_530,
    44: 333_330,
    45: 365_730,
    46: 400_930,
    47: 439_130,
    48: 480_530,
    49: 525_330,
    50: 573_730,
    51: 625_930,
    52: 682_130,
    53: 742_530,
    54: 807_330,
    55: 876_730,
    56: 950_930,
    57: 1_030_130,
    58: 1_114_830,
    59: 1_205_530,
    60: 1_302_730,
    61: 1_406_930,
    62: 1_518_630,
    63: 1_638_330,
    64: 1_766_530,
    65: 1_903_730,
    66: 2_050_430,
    67: 2_207_130,
    68: 2_374_830,
    69: 2_554_530,
    70: 2_747_230,
    71: 2_953_930,
    72: 3_175_630,
    73: 3_413_330,
    74: 3_668_030,
    75: 3_940_730,
    76: 4_232_430,
    77: 4_544_130,
    78: 4_877_830,
    79: 5_235_530,
    80: 5_619_230,
    81: 6_030_930,
    82: 6_472_630,
    83: 6_949_330,
    84: 7_466_030,
    85: 8_027_730,
    86: 8_639_430,
    87: 9_306_130,
    88: 10_032_830,
    89: 10_824_530,
    90: 11_686_230,
    91: 12_622_930,
    92: 13_639_630,
    93: 14_741_330,
    94: 15_933_030,
    95: 17_219_730,
    96: 18_606_430,
    97: 20_103_130,
    98: 21_719_830,
    99: 23_466_530,
    100: 25_353_230,
    101: 25_353_230,
    102: 25_358_785,
    103: 27_245_485,
    104: 29_132_185,
    105: 31_018_885,
    106: 32_905_585,
    107: 34_792_285,
    108: 36_678_985,
    109: 38_565_685,
    110: 40_452_385,
    111: 42_339_085,
    112: 44_225_785,
    113: 46_112_485,
    114: 47_999_185,
    115: 49_885_885,
    116: 51_772_585,
    117: 53_659_285,
    118: 55_545_985,
    119: 57_432_685,
    120: 59_319_385,
    121: 61_206_085,
    122: 63_092_785,
    123: 64_979_485,
    124: 66_866_185,
    125: 68_752_885,
    126: 70_639_585,
    127: 72_526_285,
    128: 74_412_985,
    129: 76_299_685,
    130: 78_186_385,
    131: 80_073_085,
    132: 81_959_785,
    133: 83_846_485,
    134: 85_733_185,
    135: 87_619_885,
    136: 89_506_585,
    137: 91_393_285,
    138: 93_279_985,
    139: 95_166_685,
    140: 97_053_385,
    141: 98_940_085,
    142: 100_826_785,
    143: 102_713_485,
    144: 104_600_185,
    145: 106_486_885,
    146: 108_373_585,
    147: 110_260_285,
    148: 112_146_985,
    149: 114_033_685,
    150: 115_920_385,
    151: 117_807_085,
    152: 119_693_785,
    153: 121_580_485,
    154: 123_467_185,
    155: 125_353_885,
    156: 127_240_585,
    157: 129_127_285,
    158: 131_013_985,
    159: 132_900_685,
    160: 134_787_385,
    161: 136_674_085,
    162: 138_560_785,
    163: 140_447_485,
    164: 142_334_185,
    165: 144_220_885,
    166: 146_107_585,
    167: 147_994_285,
    168: 149_880_985,
    169: 151_767_685,
    170: 153_654_385,
    171: 155_541_085,
    172: 157_427_785,
    173: 159_314_485,
    174: 161_201_185,
    175: 163_087_885,
    176: 164_974_585,
    177: 166_861_285,
    178: 168_747_985,
    179: 170_634_685,
    180: 172_521_385,
    181: 174_408_085,
    182: 176_294_785,
    183: 178_181_485,
    184: 180_068_185,
    185: 181_954_885,
    186: 183_841_585,
    187: 185_728_285,
    188: 187_614_985,
    189: 189_501_685,
    190: 191_388_385,
    191: 193_275_085,
    192: 195_161_785,
    193: 197_048_485,
    194: 198_935_185,
    195: 200_821_885,
    196: 202_708_585,
    197: 204_595_285,
    198: 206_481_985,
    199: 208_368_685,
    200: 210_255_385
}
export function calcPetLevel(petxp: number): number {
    let petlvl = 0;
    for (const [key, value] of Object.entries(PetLevels)) {
        if (petxp < value) {
            petlvl += (petxp - (PetLevels[Number(key) - 1] ?? 0)) / (value - (PetLevels[Number(key) - 1] ?? 0));
            break;
        }
        petlvl++;
    }
    return petlvl;
}

export async function getPets(profiles: SkyBlockProfile[], uuid: string): Promise<
    {
        success: false;
        message: string;
        status: number;
    } | {
        success: true;
        pets: SkyBlockProfilePetsData['pets'];
    }> {
    
    const activeProfile = profiles.find(profile => profile.selected);
    if (!activeProfile) {
        return {
            success: false,
            message: 'No active profile found',
            status: 500
        };
    }
    return {
        success: true,
        pets: activeProfile.members[uuid].pets_data?.pets ?? []
    };
}