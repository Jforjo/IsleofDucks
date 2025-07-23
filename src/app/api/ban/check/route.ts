import { addDashesToUUID } from "@/discord/hypixelUtils";
import { getScammerFromUUID } from "@/discord/jerry";
import { getBannedPlayer } from "@/discord/utils";
import type { NextRequest } from "next/server";

export async function GET(request: NextRequest): Promise<Response> {
    const authHeader = request.headers.get("authorization");
    if (!authHeader?.includes('Bearer ')) {
        return Response.json({
            success: false,
            reason: "Missing authorization header"
        });
    }
    const APIKey = authHeader.split(' ')[1];
    if (!process.env.BRIDGE_API_KEY) throw new Error('BRIDGE_API_KEY is not defined');
    if (APIKey !== process.env.BRIDGE_API_KEY) {
        return Response.json({
            success: false,
            reason: "Invalid API key"
        });
    }

    const params = request.nextUrl.searchParams;
    const uuid = params.get("uuid");

    if (!uuid) {
        return Response.json({
            success: false,
            reason: "Missing UUID"
        });
    }
    
    const bannedResponse = await getBannedPlayer(uuid);
    const scammerResponse = await getScammerFromUUID(addDashesToUUID(uuid.replaceAll('-', '')));

    return Response.json({
        success: true,
        banned: bannedResponse,
        scammer: scammerResponse
    });
}
