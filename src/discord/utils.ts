import { sql } from '@vercel/postgres';
import { getGuildData, getUsernameOrUUID } from './hypixelUtils';
import { getSuperlative } from './commands/application/superlative';
import { Snowflake } from 'discord-api-types/globals';

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
        discords: Snowflake[] | null;
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
            discords: row.discord ? JSON.parse(row.discord) : null,
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
export async function addBannedPlayer(uuid: string, discord: Snowflake | null, reason: string): Promise<void> {
    const discords = [];
    let discordsValue: string | null = null;
    if (discord) {
        discords.push(discord);
        discordsValue = JSON.stringify(discords);
    }
    await sql`INSERT INTO banlist (uuid, discord, reason) VALUES (${uuid}, ${discordsValue}, ${reason})`;
}
export async function updateBannedPlayerDiscord(uuid: string, discord: Snowflake): Promise<void> {
    const user = await getBannedPlayer(uuid);
    if (!user) return;
    const discords = [];
    if (user.discords) discords.push(...user.discords);
    if (discord) discords.push(discord);
    await sql`UPDATE banlist SET discord = ${JSON.stringify(discord)} WHERE uuid = ${uuid}`;
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
        discords: Snowflake[] | null;
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
    { uuid: string; discords: Snowflake[] | null; reason: string } |
    null
> {
    const { rows } = await sql`SELECT * FROM banlist WHERE uuid = ${uuid}`;
    if (rows.length == 0) return null;
    const discords = rows[0].discord ? JSON.parse(rows[0].discord) : null;
    return {
        uuid: rows[0].uuid,
        discords: discords,
        reason: rows[0].reason
    }
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


export function progressPromise(promises: Promise<unknown>[], tickCallback: (progress: number, len: number) => void): Promise<unknown[]> {
    const len = promises.length;
    let progress = 0;

    function tick(promise: Promise<unknown>) {
        promise.then(function () {
            progress++;
            tickCallback(progress, len);
        });
        return promise;
    }

    return Promise.all(promises.map(tick));
}
export async function updateGuildSuperlative(
    guildName: string
): Promise<
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
    const superlative = await getSuperlative();
    if (superlative == null) return {
        success: true
    };

    const guild = await getGuildData(guildName);
    if (!guild.success) return guild;

    // const result = await Promise.all(guild.guild.members.map(async (member, index) => {
    //     if (moreLogs) console.log(`(${index}/${guild.guild.members.length}) Updating superlative for`, member.uuid);
    //     // This should never happen, but Typescript/eslint was complaining
    //     if (!superlative.update) throw new Error("Superlative update function is not defined");
    //     const updated = await superlative.update(member.uuid);
    //     if (moreLogs) console.log(`(${index}/${guild.guild.members.length}) Updated superlative for ${member.uuid} to ${updated}`);

    //     const { rows } = await sql`SELECT * FROM users WHERE uuid = ${member.uuid}`;
    //     if (moreLogs) console.log(`(${index}/${guild.guild.members.length}) SQL statement returned`, JSON.stringify(rows));
    //     if (rows.length === 0) {
    //         await sql`INSERT INTO users(uuid, oldxp, lastupdated) VALUES (${member.uuid}, ${updated}, ${Date.now()})`;
    //         return;
    //     }
    //     if (moreLogs) console.log(`(${index}/${guild.guild.members.length}) Updated superlative for`, member.uuid);

    //     await sql`UPDATE users SET (cataxp, lastupdated) = (${updated}, ${Date.now()}) WHERE uuid = ${member.uuid}`;
    // })).catch((error) => {
    //     return {
    //         success: false,
    //         message: error.message,
    //         error: JSON.stringify(error)
    //     }
    // });

    for (const member of guild.guild.members) {

        const { rows } = await sql`SELECT lastupdated FROM users WHERE uuid = ${member.uuid}`;
        // console.log(`(${index}/${guild.guild.members.length}) SQL statement returned. Hour: ${Date.now() - 1000 * 60 * 60}. Continue?: ${rows.length !== 0 && rows[0].lastUpdated > Date.now() - 1000 * 60 * 60}. Rows: ${JSON.stringify(rows)}`);
        if (rows.length !== 0 && rows[0].lastupdated > Date.now() - 1000 * 60 * 60) continue;

        // This should never happen, but Typescript/eslint was complaining
        if (!superlative.update) return {
            success: false,
            message: "Superlative update function is not defined"
        };
        const updated = await superlative.update(member.uuid);
        if (typeof updated === "object" && "success" in updated && !updated.success) return updated;
        // Shouldn't happen
        if (typeof updated !== "number") continue;

        if (rows.length === 0) {
            await sql`INSERT INTO users(uuid, oldxp, lastupdated) VALUES (${member.uuid}, ${updated}, ${Date.now()})`;
            continue;
        }

        await sql`UPDATE users SET (cataxp, lastupdated) = (${updated}, ${Date.now()}) WHERE uuid = ${member.uuid}`;
    }

    // if ("success" in result && !result.success) {
    //     console.log(`Superlative update for ${guildName} failed`);
    //     console.log(result.error);
    //     return {
    //         success: false,
    //         message: result.message
    //     }
    // }

    console.log(`Superlative update for ${guildName} complete`);
    return {
        success: true
    };
}
