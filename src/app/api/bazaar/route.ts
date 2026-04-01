import { getHypixelAuctions, getHypixelBazaar, getHypixelItems } from "@/discord/hypixelUtils";
import { SkyblockBazaarResponse } from "@zikeji/hypixel/dist/types/AugmentedTypes";
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
    const item = params.get("item");
    
    const bazaarRes = await getHypixelBazaar();
    if (!bazaarRes.success || !bazaarRes.bazaar) {
        return Response.json({
            success: false,
            message: "Failed to fetch bazaar data from Hypixel",
        });
    }

    const items = await getHypixelItems();
    if (!items.success || !items.items) {
        return Response.json({
            success: false,
            message: "Failed to fetch items from Hypixel",
        });
    }

    const bazaar = Object.fromEntries(Object.entries(bazaarRes.bazaar.products).map(([key, product]) => {
        return [items.items!.find((i) => i.id === key)?.name || null, product]
    }).filter(([name, ]) => name !== null)) as Record<string, SkyblockBazaarResponse['products'][string]>;

    if (!item) return Response.json({
        success: true,
        bazaar: bazaar
    });

    const filteredBazaar = Object.fromEntries(Object.entries(bazaar).filter(([name, ]) => name.toLowerCase().includes(item.toLowerCase())));

    if (Object.keys(filteredBazaar).length === 0) return Response.json({
        success: false,
        message: "No bazaar items found for the specified item"
    });

    return Response.json({
        success: true,
        bazaar: Object.entries(filteredBazaar).map(([name, data]) => ({
            name,
            sell: data.quick_status.sellPrice,
            buy: data.quick_status.buyPrice
        }))[0]
    });
}
