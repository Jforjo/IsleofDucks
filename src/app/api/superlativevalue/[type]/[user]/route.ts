import { getProfiles } from "@/discord/hypixelUtils";
import SuperlativeTypes from "@/discord/superlatives";
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

    const type = request.nextUrl.pathname.split("/").slice(-2)[0];
    const user = request.nextUrl.pathname.split("/").slice(-1)[0];

    const profiles = await getProfiles(user);
    if (!profiles.success) {
        return Response.json({
            success: false,
            message: profiles.message || "Failed to fetch profiles"
        });
    }

    const superlative = SuperlativeTypes[type as keyof typeof SuperlativeTypes];
    let value = 0;

    for (const profile of profiles.profiles) {
        const memberProfile = profile.members[user];
        if (!memberProfile) continue;

        const temp = await superlative.value(memberProfile);
        if (temp > value) value = temp;
    }

    return Response.json({
        success: true,
        value
    });
}