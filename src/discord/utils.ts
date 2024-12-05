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