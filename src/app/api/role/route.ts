import { AddGuildMemberRole, IsleofDucks, RemoveGuildMemberRole } from "@/discord/discordUtils";
import { getUserDataFromUUID } from "@/discord/utils";
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
    const guild = params.get("guild");
    const status = params.get("status");

    if (!uuid) {
        return Response.json({
            success: false,
            message: "Missing UUID"
        });
    }
    if (!guild) {
        return Response.json({
            success: false,
            message: "Missing guild"
        });
    }
    if (!status) {
        return Response.json({
            success: false,
            message: "Missing status"
        });
    }

    const data = await getUserDataFromUUID(uuid);
    if (!data.success) {
        return Response.json({
            success: false,
            message: data.message
        });
    }
    if (!data.data.discord) {
        return Response.json({
            success: false,
            message: "User does not have a linked Discord account"
        });
    }

    if (guild === "duck") {
        if (status === "joined") {
            await AddGuildMemberRole(IsleofDucks.serverID, data.data.discord.discordid, IsleofDucks.roles.duck_guild_member);
            await AddGuildMemberRole(IsleofDucks.serverID, data.data.discord.discordid, IsleofDucks.roles.guild_member);
        } else if (status === "left") {
            await RemoveGuildMemberRole(IsleofDucks.serverID, data.data.discord.discordid, IsleofDucks.roles.duck_guild_member);
            await RemoveGuildMemberRole(IsleofDucks.serverID, data.data.discord.discordid, IsleofDucks.roles.guild_member);
        }
    } else if (guild === "duckling") {
        if (status === "joined") {
            await AddGuildMemberRole(IsleofDucks.serverID, data.data.discord.discordid, IsleofDucks.roles.duckling_guild_member);
            await AddGuildMemberRole(IsleofDucks.serverID, data.data.discord.discordid, IsleofDucks.roles.guild_member);
        } else if (status === "left") {
            await RemoveGuildMemberRole(IsleofDucks.serverID, data.data.discord.discordid, IsleofDucks.roles.duckling_guild_member);
            await RemoveGuildMemberRole(IsleofDucks.serverID, data.data.discord.discordid, IsleofDucks.roles.guild_member);
        }
    } else {
        return Response.json({
            success: false,
            message: "Invalid guild"
        });
    }

    return Response.json({
        success: true
    });
}