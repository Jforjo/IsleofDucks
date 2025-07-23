import { addDashesToUUID } from "@/discord/hypixelUtils";
import { getScammerFromUUID } from "@/discord/jerry";
import { addBannedPlayer, getBannedPlayer, updateBannedPlayerDiscord } from "@/discord/utils";
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
    if (bannedResponse) return Response.json({
        success: true,
        banned: true,
        reason: bannedResponse.reason
    });
    const scammerResponse = await getScammerFromUUID(addDashesToUUID(uuid.replaceAll('-', '')));
    if (scammerResponse.success && scammerResponse.scammer) {
        const discordIds = scammerResponse.details?.discordIds;
        await addBannedPlayer(uuid, discordIds ? discordIds[0] : null, scammerResponse.details ? scammerResponse.details.reason : "Unknown");
        if (discordIds && discordIds.length > 1) {
            for (const discord of discordIds.slice(1)) {
                await updateBannedPlayerDiscord(uuid, discord);
            }
        }
        return Response.json({
            success: true,
            banned: true,
            reason: scammerResponse.details ? scammerResponse.details.reason : "Unknown"
        });
    }

    return Response.json({
        success: true,
        banned: false
    });
}
