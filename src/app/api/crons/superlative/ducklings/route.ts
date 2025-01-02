import { updateGuildSuperlative } from "@/discord/utils";
import type { NextRequest } from "next/server";

export async function GET(request: NextRequest): Promise<Response> {
    const authHeader = request.headers.get("authorization");
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
        return new Response("Unauthorized", {
            status: 401,
        });
    }
    
    const resultDucks = await updateGuildSuperlative("Isle of Ducklings");
    if (!resultDucks.success) return new Response(resultDucks.message, { status: 400 });

    return Response.json({ success: true });
}
