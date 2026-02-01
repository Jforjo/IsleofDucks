import { sql } from '@vercel/postgres';
import { getGuildData, getUsernameOrUUID } from './hypixelUtils';
import { Snowflake } from 'discord-api-types/globals';
import { formatNumber, getSuperlativeValue, updateSuperlativeValue } from './discordUtils';
import superlativeTypes from './superlatives';

/**
 * Returns a new string with the first letter capitalized.
 * @param {string} string The string to capitalize.
 * @returns {string} The capitalized string.
 */
export function capitalizeFirstLetter(string: string): string {
    return string.charAt(0).toUpperCase() + string.slice(1);
}

export function arrayChunks<T>(array: T[], chunk_size: number): T[][] {
    return Array(Math.ceil(array.length / chunk_size))
        .fill(null)
        .map((_, index) => index * chunk_size)
        .map(begin => array.slice(begin, begin + chunk_size));
}

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
        const level = await sql`SELECT exp FROM discordroles WHERE uuid = ${row.uuid}`;
        if (level.rows.length > 0 && level.rows[0].exp) {
            name = `**${name}** (${Math.floor(level.rows[0].exp / 100)})`;
        }
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
export async function isImmunePlayer(uuid: string, reason?: string): Promise<boolean> {
    if (reason) {
        const { rows } = await sql`SELECT * FROM immune WHERE uuid = ${uuid} AND reason = ${reason}`;
        return rows.length > 0;
    }
    const { rows } = await sql`SELECT * FROM immune WHERE uuid = ${uuid}`;
    return rows.length > 0;
}
export async function addImmunePlayer(uuid: string, discord: string | null, reason: string): Promise<void> {
    await sql`INSERT INTO immune (uuid, discord, reason) VALUES (${uuid}, ${discord}, ${reason})`;
}
export async function removeImmunePlayer(uuid: string, reason?: string): Promise<void> {
    if (reason) await sql`DELETE FROM immune WHERE uuid = ${uuid} AND reason = ${reason}`;
    else await sql`DELETE FROM immune WHERE uuid = ${uuid}`;
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
    await sql`UPDATE banlist SET discord = ${JSON.stringify(discords)} WHERE uuid = ${uuid}`;
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
        // is 'discords' is a string then return that in an array, otherwise return it as normal
        discords: typeof discords === 'string' ? [discords] : discords,
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
    guildName: string,
    superlative: ActiveSuperlative
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

        const updated = await updateSuperlativeValue(member.uuid, superlative.data.value);
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

export interface DiscordRole {
    uuid: string | null;
    discordname: string | null;
    discordid: Snowflake | null;
    discordupdated: number;
    exp: number | null;
    expupdated: number;
}
export async function addDiscordRole(uuid: string | null, discordname: string | null, discordid: Snowflake | null, experience: number | null): Promise<void> {
    const timestamp = Date.now();
    // Only add timestamps if the data isn't null
    let discordTimestamp = 0;
    if (discordname || discordid) discordTimestamp = timestamp;
    let experienceTimestamp = 0;
    if (experience) experienceTimestamp = timestamp;
    await sql`INSERT INTO discordroles (uuid, discordname, discordid, discordupdated, exp, expupdated) VALUES (${uuid}, ${discordname}, ${discordid}, ${discordTimestamp}, ${experience}, ${experienceTimestamp})`;
}
export async function updateDiscordRoleName(uuid: string | null, discordname: string, discordid: Snowflake | null): Promise<void> {
    await sql`UPDATE discordroles SET (discordname, discordid, discordupdated) = (${discordname}, ${discordid}, ${Date.now()}) WHERE uuid = ${uuid}`;
}
export async function updateDiscordRoleNameFromName(discordname: string, discordid: Snowflake | null): Promise<void> {
    await sql`UPDATE discordroles SET (discordid, discordupdated) = (${discordid}, ${Date.now()}) WHERE discordname = ${discordname}`;
}
export async function updateDiscordRoleExp(uuid: string | null, experience: number): Promise<void> {
    await sql`UPDATE discordroles SET (exp, expupdated) = (${experience}, ${Date.now()}) WHERE uuid = ${uuid}`;
}
export async function deleteDiscordRole(uuid: string | null): Promise<void> {
    await sql`DELETE FROM discordroles WHERE uuid = ${uuid}`;
}
export async function getDiscordRole(uuid: string | null): Promise<null | DiscordRole> {
    const { rows } = await sql`SELECT * FROM discordroles WHERE uuid = ${uuid}`;
    if (rows.length === 0) return null;
    return rows[0] as DiscordRole;
}
export async function getDiscordRoleFromDiscordName(discordname: string): Promise<null | DiscordRole> {
    const { rows } = await sql`SELECT * FROM discordroles WHERE discordname = ${discordname}`;
    if (rows.length === 0) return null;
    return rows[0] as DiscordRole;
}
export async function getDiscordRoleFromDiscordID(discordid: string): Promise<null | DiscordRole> {
    const { rows } = await sql`SELECT * FROM discordroles WHERE discordid = ${discordid}`;
    if (rows.length === 0) return null;
    return rows[0] as DiscordRole;
}
export async function getAllDiscordRolesWhereIDIsNull(limit = 100): Promise<DiscordRole[]> {
    const { rows } = await sql`SELECT * FROM discordroles WHERE discordid IS NULL LIMIT ${limit}`;
    return rows as DiscordRole[];
}
export async function getAllDiscordRolesWhereNameIsNull(limit = 100): Promise<DiscordRole[]> {
    const { rows } = await sql`SELECT * FROM discordroles WHERE discordname IS NULL LIMIT ${limit}`;
    return rows as DiscordRole[];
}

export interface HyGuessrData {
    answer: {
        x: string;
        y: string;
        z: string;
    };
    image: string;
    island: string;
}
export async function getHyGuessrData(id: string): Promise<HyGuessrData[] | null> {
    const { rows } = await sql`SELECT data FROM hyguessr WHERE id = ${id}`;
    if (rows.length === 0) return null;
    return JSON.parse(rows[0].data);
}
export async function createHyGuessr(data: HyGuessrData[]): Promise<string> {
    const { rows } = await sql`INSERT INTO hyguessr (data) VALUES (${JSON.stringify(data)}) RETURNING id`;
    return rows[0].id;
}

export async function addAwayPlayer(userid: Snowflake, reason: string, leaveTimestamp: number, returnTimestamp: number): Promise<void> {
    await sql`INSERT INTO away (userid, reason, leave, return) VALUES (${userid}, ${reason}, ${leaveTimestamp}, ${returnTimestamp})`;
}
export async function removeAwayPlayer(id: number): Promise<{ id: number, userid: Snowflake; reason: string; leave: number; return: number }> {
    const { rows } = await sql`DELETE FROM away WHERE id = ${id} RETURNING *`;
    return rows[0] as { id: number, userid: Snowflake; reason: string; leave: number; return: number };
}
export async function getAwayPlayers(): Promise<{ id: number, userid: Snowflake; reason: string; leave: number; return: number }[]> {
    const { rows } = await sql`SELECT * FROM away ORDER BY leave ASC`;
    return rows as { id: number, userid: Snowflake; reason: string; leave: number; return: number }[];
}


export async function setDonation(userid: Snowflake, amount: number): Promise<void> {
    await sql`UPDATE discordroles SET donation = ${amount} WHERE discordid = ${userid}`;
}
export async function getDonation(userid: Snowflake): Promise<{ donation: number; discordname: string } | null> {
    const { rows } = await sql`SELECT discordname, donation FROM discordroles WHERE discordid = ${userid}`;
    if (rows.length === 0) return null;
    return {
        donation: rows[0].donation,
        discordname: rows[0].discordname
    };
}
export async function getDonations(
    offset = 0,
    limit = 100
): Promise<{
    donation: number;
    discordid: string;
}[]> {
    const { rows } = await sql`SELECT discordid, donation FROM discordroles WHERE donation > 0 ORDER BY donation DESC LIMIT ${limit} OFFSET ${offset}`;
    return rows as { donation: number; discordid: string; }[];
}
export async function getDonationsCount(): Promise<number> {
    const { rows } = await sql`SELECT COUNT(*) FROM discordroles WHERE donation > 0`;
    return rows[0].count;
}
export async function getTotalDonation(): Promise<number> {
    const { rows } = await sql`SELECT SUM(donation) FROM discordroles WHERE donation > 0`;
    return rows[0].sum;
}

export async function saveSuperlativeData(superlative: ActiveSuperlative): Promise<boolean> {
    const ducks = await getGuildData("Isle of Ducks");
    if (!ducks.success) return false;
    const ducklings = await getGuildData("Isle of Ducklings");
    if (!ducklings.success) return false;
    
    const duckDataPromise = Promise.all(
        ducks.guild.members.map(async (member) => {
            const guildData = await getSuperlativeValue(member.uuid, (value) => formatNumber(value, superlative.dp));
            return {
                uuid: member.uuid,
                value: guildData.success ? guildData.value : 0
            };
        })
    );
    const ducklingDataPromise = Promise.all(
        ducklings.guild.members.map(async (member) => {
            const guildData = await getSuperlativeValue(member.uuid, (value) => formatNumber(value, superlative.dp));
            return {
                uuid: member.uuid,
                value: guildData.success ? guildData.value : 0
            };
        })
    );
    const [duckData, ducklingData] = await Promise.all([duckDataPromise, ducklingDataPromise]);

    const duckStats = updateSuperlativeStatsDuck(superlative.start, duckData);
    const ducklingstats = updateSuperlativeStatsDuckling(superlative.start, ducklingData);
    await Promise.all([duckStats, ducklingstats]);
    return true;
}
export async function saveSuperlative(): Promise<boolean> {
    const activeSuperlative = await getActiveSuperlative();
    if (!activeSuperlative) return false;
    
    if (activeSuperlative.duckstats.length === 0 && activeSuperlative.ducklingstats.length === 0) {
        const prevSuperlative = await getPreviousSuperlative();
        if (!prevSuperlative) return false;
        await Promise.all([
            saveSuperlativeData(prevSuperlative),
            updateSuperlativeStatsDuck(activeSuperlative.start, [{
                uuid: "",
                value: 0
            }]),
            updateSuperlativeStatsDuckling(activeSuperlative.start, [{
                uuid: "",
                value: 0
            }]),
        ]);
        await sql`TRUNCATE TABLE users`;
    } else {
        await saveSuperlativeData(activeSuperlative);
    }
    return true;
}
export interface PartialActiveSuperlative {
    data: typeof superlativeTypes[keyof typeof superlativeTypes];
    start: string;
}
export interface ActiveSuperlative extends PartialActiveSuperlative {
    dp: number | null;
    duckranks: {
        id: string;
        name: string;
        requirement: number;
    }[];
    ducklingranks: {
        id: string;
        name: string;
        requirement: number;
    }[];
    duckstats: SuperlativeStats[];
    ducklingstats: SuperlativeStats[];
}
export async function getActiveSuperlative(): Promise<ActiveSuperlative | null> {
    const { rows } = await sql`
        SELECT type, start, dp, duckranks, ducklingranks, duckstats, ducklingstats
        FROM superlatives
        WHERE EXTRACT (MONTH FROM start) = EXTRACT (MONTH FROM now())
        LIMIT 1
    `;

    if (rows.length === 0) return null;

    return {
        data: superlativeTypes[rows[0].type as keyof typeof superlativeTypes],
        start: rows[0].start,
        dp: rows[0].dp,
        duckranks: rows[0].duckranks,
        ducklingranks: rows[0].ducklingranks,
        duckstats: rows[0].duckstats,
        ducklingstats: rows[0].ducklingstats
    };
}
export async function getPreviousSuperlative(): Promise<ActiveSuperlative | null> {
    const { rows } = await sql`
        SELECT type, start, dp, duckranks, ducklingranks, duckstats, ducklingstats
        FROM superlatives
        WHERE EXTRACT (MONTH FROM start) = EXTRACT (MONTH FROM now()) - 1
        LIMIT 1
    `;

    if (rows.length === 0) return null;

    return {
        data: superlativeTypes[rows[0].type as keyof typeof superlativeTypes],
        start: rows[0].start,
        dp: rows[0].dp,
        duckranks: rows[0].duckranks,
        ducklingranks: rows[0].ducklingranks,
        duckstats: rows[0].duckstats,
        ducklingstats: rows[0].ducklingstats
    };
}
export async function getSuperlativesList(): Promise<PartialActiveSuperlative[]> {
    const { rows } = await sql`
        SELECT type, start
        FROM superlatives
    `;

    if (rows.length === 0) return [];

    return rows.map((row) => ({
        data: superlativeTypes[row.type as keyof typeof superlativeTypes],
        start: row.start
    }));
}
export async function getSuperlativesListLimit(offset = 0, limit = 5): Promise<PartialActiveSuperlative[]> {
    const { rows } = await sql`
        SELECT type, start
        FROM superlatives
        LIMIT ${limit} OFFSET ${offset}
    `;

    if (rows.length === 0) return [];

    return rows.map((row) => ({
        data: superlativeTypes[row.type as keyof typeof superlativeTypes],
        start: row.start
    }));
}
export async function getTotalSuperlatives(): Promise<number> {
    const { rows } = await sql`
        SELECT COUNT(*)
        FROM superlatives
    `;
    return rows[0].count;
}
export async function getSuperlative(start: string): Promise<ActiveSuperlative | null> {
    const { rows } = await sql`
        SELECT type, start, dp, duckranks, ducklingranks, duckstats, ducklingstats
        FROM superlatives
        WHERE start = ${start}
        LIMIT 1
    `;

    if (rows.length === 0) return null;

    return {
        data: superlativeTypes[rows[0].type as keyof typeof superlativeTypes],
        start: rows[0].start,
        dp: rows[0].dp,
        duckranks: rows[0].duckranks,
        ducklingranks: rows[0].ducklingranks,
        duckstats: rows[0].duckstats,
        ducklingstats: rows[0].ducklingstats
    };
}
interface SuperlativeStats {
    uuid: string;
    value: number;
}
export async function updateSuperlativeStatsDuck(start: string, duckStats: SuperlativeStats[]): Promise<void> {
    await sql`
        UPDATE superlatives
        SET duckstats = ${JSON.stringify(duckStats)}
        WHERE start = ${start}
    `;
}
export async function updateSuperlativeStatsDuckling(start: string, ducklingStats: SuperlativeStats[]): Promise<void> {
    await sql`
        UPDATE superlatives
        SET ducklingstats = ${JSON.stringify(ducklingStats)}
        WHERE start = ${start}
    `;
}
export async function createSuperlative(
    start: string,
    type: keyof typeof superlativeTypes,
    dp: number | null,
    duckranks: {
        id: string;
        name: string;
        requirement: number;
    }[],
    ducklingranks: {
        id: string;
        name: string;
        requirement: number;
    }[]
): Promise<boolean> {
    const { rows } = await sql`SELECT COUNT(*) FROM superlatives WHERE start = ${start}`;
    if (rows[0].count > 0) return false;
    const duckTemp: string[] = [];
    const ducklingTemp: string[] = [];
    await sql`
        INSERT INTO superlatives (start, type, dp, duckranks, ducklingranks, duckstats, ducklingstats)
        VALUES (${start}, ${type}, ${dp}, ${JSON.stringify(duckranks)}, ${JSON.stringify(ducklingranks)}, ${JSON.stringify(duckTemp)}, ${JSON.stringify(ducklingTemp)})
    `;
    return true;
}
export async function deleteSuperlative(start: string): Promise<void> {
    await sql`DELETE FROM superlatives WHERE start = ${start}`;
}

export async function checkBridgeFilter(query: string): Promise<boolean> {
    const { rows } = await sql`SELECT COUNT(*) FROM bridgefilters WHERE replacetext ILIKE ${query}`;
    return rows[0].count > 0;
}
export async function addBridgeFilter(replacetext: string, withtext: string): Promise<void> {
    // if (await checkBridgeFilter(replacetext)) return false;
    await sql`INSERT INTO bridgefilters (replacetext, withtext) VALUES (${replacetext}, ${withtext})`;
    // return true;
}
export async function removeBridgeFilter(replacetext: string): Promise<void> {
    await sql`DELETE FROM bridgefilters WHERE replacetext = ${replacetext}`;
}
export async function getBridgeFilters(
    offset = 0,
    limit = 100
): Promise<{
    replacetext: number;
    withtext: string;
}[]> {
    const { rows } = await sql`SELECT replacetext, withtext FROM bridgefilters ORDER BY replacetext ASC LIMIT ${limit} OFFSET ${offset}`;
    return rows as { replacetext: number; withtext: string; }[];
}
export async function getAllBridgeFilters(): Promise<{ replacetext: number; withtext: string }[]> {
    const { rows } = await sql`SELECT replacetext, withtext FROM bridgefilters ORDER BY replacetext ASC`;
    return rows as { replacetext: number; withtext: string; }[];
}
export async function getTotalBridgeFilters(): Promise<number> {
    const { rows } = await sql`SELECT COUNT(*) FROM bridgefilters`;
    return rows[0].count;
}


export async function checkEmoji(query: string): Promise<boolean> {
    const { rows } = await sql`SELECT COUNT(*) FROM emojis WHERE replacetext ILIKE ${query}`;
    return rows[0].count > 0;
}
export async function addEmoji(replacetext: string, withtext: string): Promise<void> {
    // if (await checkEmoji(replacetext)) return false;
    await sql`INSERT INTO emojis (replacetext, withtext) VALUES (${replacetext}, ${withtext})`;
    // return true;
}
export async function removeEmoji(replacetext: string): Promise<void> {
    await sql`DELETE FROM emojis WHERE replacetext = ${replacetext}`;
}
export async function getEmojis(
    offset = 0,
    limit = 100
): Promise<{
    replacetext: number;
    withtext: string;
}[]> {
    const { rows } = await sql`SELECT replacetext, withtext FROM emojis ORDER BY replacetext ASC LIMIT ${limit} OFFSET ${offset}`;
    return rows as { replacetext: number; withtext: string; }[];
}
export async function getAllEmojis(): Promise<{ replacetext: number; withtext: string }[]> {
    const { rows } = await sql`SELECT replacetext, withtext FROM emojis ORDER BY replacetext ASC`;
    return rows as { replacetext: number; withtext: string; }[];
}
export async function getTotalEmojis(): Promise<number> {
    const { rows } = await sql`SELECT COUNT(*) FROM emojis`;
    return rows[0].count;
}
