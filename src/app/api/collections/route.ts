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
            message: "Missing UUID"
        });
    }
    
    const collectionData = await getHypixelCollections();
    if (!collectionData.success) {
        return Response.json({
            success: false,
            message: collectionData.message || "Failed to fetch collection data"
        });
    }

    const collectionMap: Record<string, string> = Object.entries(collectionData.collections).map(([, groupData]) => {
        if (!groupData) return [];
        return Object.entries(groupData.items).map(([itemKey, itemData]) => {
            return [itemKey, itemData.name];
        });
    }).flat().reduce((acc, [key, name]) => {
        acc[key] = name;
        return acc;
    }, {} as Record<string, string>);

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

    if (!profile.members[uuid].collection) {
        return Response.json({
            success: false,
            message: "Failed to find profile collection data"
        });
    }

    const profileCollectionData = Object.entries(profile.members[uuid].collection).map(([collectionId, amount]) => ({
        id: collectionId,
        amount: amount,
        name: collectionMap[collectionId] || null
    }));

    return Response.json({
        success: true,
        collections: profileCollectionData
    });
}
