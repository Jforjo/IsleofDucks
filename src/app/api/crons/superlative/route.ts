import type { NextRequest } from "next/server";
import { updateGuildSuperlative } from "@/discord/utils";
import { getSuperlative } from "@/discord/commands/application/superlative";

export async function GET(request: NextRequest): Promise<Response> {
    const authHeader = request.headers.get("authorization");
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
        return new Response("Unauthorized", {
            status: 401,
        });
    }
    
    const superlativeData = await getSuperlative();
    if (superlativeData == null) return new Response("Superlative not found", { status: 404 });
    
    const resultDucksPromise = updateGuildSuperlative("Isle of Ducks", superlativeData.superlative);
    const resultDucklingsPromise = updateGuildSuperlative("Isle of Ducklings", superlativeData.superlative);

    const resultDucks = await resultDucksPromise;
    const resultDucklings = await resultDucklingsPromise;

    if (!resultDucks.success) return new Response(resultDucks.message, { status: 400 });
    if (!resultDucklings.success) return new Response(resultDucklings.message, { status: 400 });

    return Response.json({ success: true });
}
