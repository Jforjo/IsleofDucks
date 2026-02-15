import { getHypixelItems } from "@/discord/hypixelUtils";
import { getAllScrambleBlacklists } from "@/discord/utils";
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

    const scrambleBlacklist = await getAllScrambleBlacklists();
    if (scrambleBlacklist.length === 0) {
        return Response.json({
            success: false,
            message: "No items found in scramble blacklist"
        });
    }

    const itemsRes = await getHypixelItems();
    if (!itemsRes.success || !itemsRes.items) {
        return Response.json({
            success: false,
            message: "Failed to fetch items from Hypixel",
        });
    }

    const items = itemsRes.items
        .map(i => i.name?.toLowerCase() || "")
        .filter(i => i !== "")
        .filter(i => !scrambleBlacklist.some(b => b.item.toLowerCase() === i));

    return Response.json({
        success: true,
        items: items
    });
}
