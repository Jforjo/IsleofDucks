import { formatNumber, getSuperlativeValue, IsleofDucks, SendMessage } from "@/discord/discordUtils";
import { getUsernameOrUUID } from "@/discord/hypixelUtils";
import { getActiveSuperlative } from "@/discord/utils";
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
    if (!process.env.BRIDGE_API_KEY) throw new Error('BRIDGE_API_KEY is not defined');
    if (APIKey !== process.env.BRIDGE_API_KEY) {
        return Response.json({
            success: false,
            message: "Invalid API key"
        });
    }

    const params = request.nextUrl.searchParams;
    const user = params.get("user");
    const guild = params.get("guild");

    const superlative = await getActiveSuperlative();
    if (!superlative) {
        return Response.json({
            success: false,
            message: "No active superlative found"
        });
    }

    if (user) {
        const uuidRes = await getUsernameOrUUID(user);
        if (!uuidRes.success) {
            return Response.json({
                success: false,
                message: "Failed to get UUID from username"
            });
        }
        const uuid = uuidRes.uuid;
        const superlativeData = await getSuperlativeValue(uuid, (value) => formatNumber(value, superlative.dp));
        if (!superlativeData.success) {
            return Response.json({
                success: false,
                message: superlativeData.message
            });
        }

        let rankShould = "";
        if (guild === "duck") {
            superlative.duckranks.sort((a, b) => a.requirement - b.requirement).forEach((rank, _index) => {
                if (rank.requirement <= superlativeData.current) {
                    rankShould = rank.name.toLowerCase();
                }
            });
            await SendMessage(IsleofDucks.channels.duckoc, {
                content: `setrank ${user} ${rankShould}`
            });
        } else if (guild === "duckling") {
            superlative.ducklingranks.sort((a, b) => a.requirement - b.requirement).forEach((rank, _index) => {
                if (rank.requirement <= superlativeData.current) {
                    rankShould = rank.name.toLowerCase();
                }
            });
            await SendMessage(IsleofDucks.channels.ducklingoc, {
                content: `setrank ${user} ${rankShould}`
            });
        } else {
            return Response.json({
                success: false,
                message: "Missing or invalid guild parameter"
            });
        }
    } else {
        return Response.json({
            success: false,
            message: "Missing user or guild parameter"
        });
    }

    return Response.json({
        success: true
    });
}
