import { sql } from '@vercel/postgres';
import { getUsernameOrUUID } from './hypixelUtils';

export async function getImmunePlayers(): Promise<{
    success: boolean;
    players: {
        uuid: string;
        name?: string;
        discord: string | null;
        reason: string;
    }[];
}> {
    const { rows } = await sql`SELECT uuid, discord, reason FROM immune`;

    const players = await Promise.all(rows.map(async (row) => {
        const nameRes = await getUsernameOrUUID(row.uuid);
        let name = undefined;
        if (nameRes.success === true) name = nameRes.name;
        return {
            uuid: row.uuid,
            name: name,
            discord: row.discord,
            reason: row.reason
        }
    }));

    return {
        success: true,
        players: players
    };
}
export async function isImmunePlayer(uuid: string): Promise<boolean> {
    const { rows } = await sql`SELECT * FROM immune WHERE uuid = ${uuid}`;
    return rows.length > 0;
}
export async function addImmunePlayer(uuid: string, discord: string | null, reason: string): Promise<void> {
    await sql`INSERT INTO immune (uuid, discord, reason) VALUES (${uuid}, ${discord}, ${reason})`;
}
export async function removeImmunePlayer(uuid: string): Promise<void> {
    await sql`DELETE FROM immune WHERE uuid = ${uuid}`;
}
export async function getImmunePlayer(uuid: string): Promise<{ uuid: string; discord: string | null; reason: string } | null> {
    const { rows } = await sql`SELECT * FROM immune WHERE uuid = ${uuid}`;
    if (rows.length > 0) return rows[0] as { uuid: string; discord: string | null; reason: string };
    return null;
}

export async function getBannedPlayers(
    offset = 0,
    limit = 100
): Promise<{
    success: boolean;
    players: {
        uuid: string;
        name?: string;
        discord: string | null;
        reason: string;
    }[];
}> {
    const { rows } = await sql`SELECT uuid, discord, reason FROM banlist LIMIT ${limit} OFFSET ${offset}`;

    const players = await Promise.all(rows.map(async (row) => {
        const nameRes = await getUsernameOrUUID(row.uuid);
        let name = undefined;
        if (nameRes.success === true) name = nameRes.name;
        return {
            uuid: row.uuid,
            name: name,
            discord: row.discord,
            reason: row.reason
        }
    }));

    return {
        success: true,
        players: players
    };
}
export async function getBannedPlayersCount(): Promise<number> {
    const { rows } = await sql`SELECT COUNT(*) FROM banlist`;
    return rows[0].count;
}
export async function addBannedPlayer(uuid: string, discord: string | null, reason: string): Promise<void> {
    await sql`INSERT INTO banlist (uuid, discord, reason) VALUES (${uuid}, ${discord}, ${reason})`;
}
export async function updateBannedPlayerDiscord(uuid: string, discord: string | null): Promise<void> {
    await sql`UPDATE banlist SET discord = ${discord} WHERE uuid = ${uuid}`;
}
export async function removeBannedPlayer(uuid: string): Promise<void> {
    await sql`DELETE FROM banlist WHERE uuid = ${uuid}`;
}
export async function isBannedPlayer(uuid: string): Promise<boolean> {
    const { rows } = await sql`SELECT * FROM banlist WHERE uuid = ${uuid}`;
    return rows.length > 0;
}
export async function searchBannedPlayers(
    query: string,
    offset = 0,
    limit = 100
): Promise<{
    success: boolean;
    players: {
        uuid: string;
        name?: string;
        discord: string | null;
        reason: string;
    }[];
    count: number;
}> {
    const players = await getBannedPlayers(0, 9999);
    if (!players.success) return {
        success: false,
        players: [],
        count: 0
    }

    const filteredPlayers = players.players.filter((player) => {
        if (!player.name) return false;
        return player.name.toLowerCase().includes(query.toLowerCase()) || player.reason.toLowerCase().includes(query.toLowerCase());
    });

    return {
        success: true,
        players: filteredPlayers.slice(offset, offset + limit),
        count: filteredPlayers.length
    };
}
export async function getBannedPlayer(uuid: string): Promise<
    { uuid: string; discord: string | null; reason: string } |
    null
> {
    const { rows } = await sql`SELECT * FROM banlist WHERE uuid = ${uuid}`;
    if (rows.length == 0) return null;
    return rows[0] as { uuid: string; discord: string | null; reason: string };
}
// export async function getBannedPlayer(uuid: string): Promise<
//     { uuid: string; discord: string | null; reason: string }[] |
//     { uuid: string; discord: string | null; reason: string } |
//     null
// > {
//     const { rows } = await sql`SELECT * FROM banlist WHERE uuid = ${uuid}`;
//     if (rows.length == 0) return null;
//     if (rows.length == 1) return rows[0] as { uuid: string; discord: string | null; reason: string };
//     return rows as { uuid: string; discord: string | null; reason: string }[];
// }

export async function getSettingValue(key: string): Promise<string | null> {
    const { rows } = await sql`SELECT value FROM settings WHERE key = ${key}`;
    if (rows.length == 0) return null;
    return rows[0]?.value;
}
export async function setSettingValue(key: string, value: string): Promise<void> {
    await sql`UPDATE settings SET value = ${value} WHERE key = ${key}`;
}

export async function isOnOldScammerList(
    uuid: string
): Promise<
    {
        success: false;
        message: string;
    } | {
        success: true;
        scammer: false;
    } | {
        success: true;
        scammer: true;
        reason: string;
    }
> {
    const res = await fetch('https://raw.githubusercontent.com/skyblockz/pricecheckbot/master/scammer.json', {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json'
        }
    });

    if (!res.ok) {
        return {
            success: false,
            message: 'Failed to fetch scammer list'
        };
    }

    let data;
    try {
        data = await res.json() as Record<string, {
            operated_staff: string;
            uuid: string;
            reason: string;
        }>;
    } catch (e) {
        console.error(e);
        return {
            success: false,
            message: 'Failed to fetch scammer list'
        };
    }

    // let players = [];
    // for (const [uuid, value] of Object.entries(data)) {
    //     players.push({
    //         uuid: uuid,
    //         reason: value.reason
    //     });
    // }

    if (Object.hasOwn(data, uuid)) {
        return {
            success: true,
            scammer: true,
            reason: data[uuid].reason
        };
    } else {
        return {
            success: true,
            scammer: false
        };
    }
}