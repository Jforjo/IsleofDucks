import { sql } from '@vercel/postgres';
import { getUsername } from './hypixelUtils.js';

export async function getImmunePlayers() {
    const { rows } = await sql`SELECT uuid, discord, reason FROM immune`;

    const players = rows.map(async row => ({
        uuid: row.uuid,
        name: await getUsername(row.uuid),
        discord: row.discord,
        reason: row.reason
    }));

    return {
        success: true,
        players: players
    };
}
export async function isImmunePlayer(uuid) {
    const { rows } = await sql`SELECT * FROM immune WHERE uuid = ${uuid}`;
    return rows.length > 0;
}
export async function addImmunePlayer(uuid, discord, reason) {
    await sql`INSERT INTO immune (uuid, discord, reason) VALUES (${uuid}, ${discord}, ${reason})`;
}
export async function removeImmunePlayer(uuid) {
    await sql`DELETE FROM immune WHERE uuid = ${uuid}`;
}