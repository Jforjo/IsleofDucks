import { getHypixelCollections, getProfiles } from "@/discord/hypixelUtils";
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
            message: "Missing uuid parameter"
        });
    }

    const profiles = await getProfiles(uuid);
    if (!profiles.success || !profiles.profiles || profiles.profiles.length === 0) {
        return Response.json({
            success: false,
            message: 'message' in profiles ? profiles.message : "Failed to fetch profiles"
        });
    }

    const profile = profiles.profiles.find(p => p.selected);
    if (!profile) {
        return Response.json({
            success: false,
            message: "Failed to find selected profile"
        });
    }

    if (!profile.members[uuid]) {
        return Response.json({
            success: false,
            message: "Failed to find profile member data"
        });
    }

    if (!profile.members[uuid].bestiary?.migrated_stats || !profile.members[uuid].bestiary?.migration) {
        return Response.json({
            success: false,
            message: "Bestiary data is not migrated"
        });
    }

    return Response.json({
        success: true,
        bestiary: Object.entries(profile.members[uuid].bestiary.kills).map(([id, count]) => ({ id, count })).reduce((acc, item) => {
            // In case of last_killed_mob
            if (typeof item.count === 'string') return acc;
            // If the key doesn't exist, initialize it to 0, then add the count
            const idArr = item.id.split('_');
            if (!isNaN(Number(idArr[idArr.length - 1]))) idArr.pop();
            acc[idArr.join('_')] = (acc[idArr.join('_')] || 0) + item.count;
            return acc;
        }, {} as { [key: string]: number })
    });
}
