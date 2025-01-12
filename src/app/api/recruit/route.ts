import { checkPlayer } from "@/discord/commands/application/recruit";
import { getUsernameOrUUID, isPlayerInGuild } from "@/discord/hypixelUtils";
import { getScammerFromUUID } from "@/discord/jerry";
import { getBannedPlayer } from "@/discord/utils";
import type { NextRequest } from "next/server";

export async function GET(request: NextRequest): Promise<Response> {
    // const authHeader = request.headers.get("authorization");
    // if (!authHeader?.includes('Bearer ')) {
    //     return Response.json({
    //         success: false,
    //         reason: "Missing authorization header"
    //     });
    // }
    // const APIKey = authHeader.split(' ')[1];
    const APIKey = process.env.HYPIXEL_API_KEY;

    const params = request.nextUrl.searchParams;
    const username = params.get("username");

    if (!username) {
        return Response.json({
            success: false,
            reason: "Missing username"
        });
    }

    const uuidResponse = await getUsernameOrUUID(username);
    if (!uuidResponse.success) {
        return Response.json({
            success: false,
            reason: uuidResponse.message
        });
    }

    const guildResponse = await isPlayerInGuild(uuidResponse.uuid, APIKey);
    if (!guildResponse.success) {
        return Response.json({
            success: false,
            reason: guildResponse.message
        });
    }

    const profileAPIResponse = await checkPlayer(uuidResponse.uuid, APIKey);
    if (!profileAPIResponse.success) {
        return Response.json({
            success: false,
            reason: profileAPIResponse.message
        });
    }
    
    const bannedResponse = await getBannedPlayer(uuidResponse.uuid);
    const scammerResponse = await getScammerFromUUID(uuidResponse.uuiddashes);

    return Response.json({
        success: true,
        data: {
            apis: {
                inventory: profileAPIResponse.inventory,
                banking: profileAPIResponse.banking,
                collection: profileAPIResponse.collection,
                skills: profileAPIResponse.skills,
                vault: profileAPIResponse.vault,
            },
            experience: profileAPIResponse.experience,
            duckReq: profileAPIResponse.duckReq,
            ducklingReq: profileAPIResponse.ducklingReq,
            guild: guildResponse,
            scammer: scammerResponse,
            banned: bannedResponse,
            cute_name: profileAPIResponse.name,
            username: uuidResponse.name,
            uuid: uuidResponse.uuid
        }
    });
}
