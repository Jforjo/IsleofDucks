import { sql } from "@vercel/postgres";
import { getSuperlative } from "@/discord/commands/application/superlative";
import type { NextRequest } from "next/server";
import { getGuildData } from "@/discord/hypixelUtils";

export async function GET(request: NextRequest): Promise<Response> {
    const authHeader = request.headers.get("authorization");
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
        return new Response("Unauthorized", {
            status: 401,
        });
    }
    
    const resultDucksPromise = updateGuildSuperlative("Isle of Ducks");
    const resultDucklingsPromise = updateGuildSuperlative("Isle of Ducklings");

    const resultDucks = await resultDucksPromise;
    const resultDucklings = await resultDucklingsPromise;
    
    if (!resultDucks.ok) return resultDucks;
    if (!resultDucklings.ok) return resultDucklings;

    return Response.json({ success: true });
}

export async function updateGuildSuperlative(guildName: string): Promise<Response> {
    const superlative = await getSuperlative();
    if (superlative == null) return Response.json({ success: true });

    const guild = await getGuildData(guildName);
    if (!guild.success) return new Response(guild.message, { status: 400 });

    const result = await Promise.all(guild.guild.members.map(async (member) => {
        // This should never happen, but Typescript/eslint was complaining
        if (!superlative.update) throw new Error("Superlative update function is not defined");
        const updated = await superlative.update(member.uuid);

        const { rows } = await sql`SELECT * FROM users WHERE uuid = ${member.uuid}`;
        if (rows.length === 0) {
            await sql`INSERT INTO users(uuid, oldxp, lastupdated) VALUES (${member.uuid}, ${updated}, ${Date.now()})`;
            return;
        }

        await sql`UPDATE users SET (cataxp, lastupdated) = (${updated}, ${Date.now()}) WHERE uuid = ${member.uuid}`;
    })).catch((error) => {
        return {
            success: false,
            message: error.message,
            error: JSON.stringify(error)
        }
    });

    if ("success" in result && !result.success) return new Response(`Error: ${result.error}`, { status: 400 });

    console.log(`Superlative update for ${guildName} complete`);
    return Response.json({ success: true });
}