import { UpdateRoles } from "@/discord/commands/application/updateroles";
import { IsleofDucks } from "@/discord/discordUtils";
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
    
    const result = await UpdateRoles(IsleofDucks.serverID);
    if (!result) {
        return Response.json({
            success: false,
            message: "Failed to update roles"
        });
    }

    return Response.json({
        success: true,
        result
    });
}
