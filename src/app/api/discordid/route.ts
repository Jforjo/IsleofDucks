import { getDiscordRole } from "@/discord/utils";
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
    const uuid = params.get("uuid");
    if (!uuid) {
        return Response.json({
            success: false,
            message: "Missing UUID"
        });
    }

    const data = await getDiscordRole(uuid);
    if (!data) {
        return Response.json({
            success: false,
            message: "No Discord data found in DB"
        });
    }

    return Response.json({
        success: true,
        data: data
    });
}
