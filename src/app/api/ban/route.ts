import { getBannedPlayer } from "@/discord/utils";
import type { NextRequest } from "next/server";

export async function GET(request: NextRequest): Promise<Response> {
    const authHeader = request.headers.get("authorization");
    if (!authHeader?.includes('Bearer ')) {
        return Response.json({
            success: false,
            message: "Missing authorization header"
        });
    }
    const APIKey = authHeader.split(' ')[1];
    if (!process.env.BAN_API_KEY) throw new Error('BAN_API_KEY is not defined');
    if (APIKey !== process.env.BAN_API_KEY) {
        return Response.json({
            success: false,
            message: "Invalid API key"
        });
    }

    const params = request.nextUrl.searchParams;
    const uuid = params.get("uuid");

    if (!uuid) {
        return Response.json({
            success: false,
            message: "Missing UUID"
        });
    }

    console.log(`[BAN API] Checking ban status for UUID: ${uuid}`);
    
    const bannedResponse = await getBannedPlayer(uuid);
    if (bannedResponse) return Response.json({
        success: true,
        banned: true,
        reason: bannedResponse.reason,
        discords: bannedResponse.discords
    });

    return Response.json({
        success: true,
        banned: false
    });
}
