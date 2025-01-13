import type { NextRequest } from "next/server";
import { EditMessage, IsleofDucks, SendMessage } from "@/discord/discordUtils";
import { UpdateRoles } from "@/discord/commands/application/updateroles";

export async function GET(request: NextRequest): Promise<Response> {
    const authHeader = request.headers.get("authorization");
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
        return new Response("Unauthorized", {
            status: 401,
        });
    }

    const timestamp = Date.now();
    
    const messagePromise = SendMessage(IsleofDucks.channels.staffgeneral, {
        embeds: [
            {
                title: "Cron Job started for updateroles!",
                description: [
                    "Updating roles...",
                    `If this embed doesn't change <t:${Math.floor(timestamp / 1000) + 60}:R> then it might have failed.`,
                ].join("\n"),
                color: 0xFB9B00,
                footer: {
                    text: `Response time: ${Date.now() - timestamp}ms`,
                },
                timestamp: new Date().toISOString(),
            },
        ],
    });
    const resultPromise = UpdateRoles(IsleofDucks.serverID);

    const message = await messagePromise;
    const result = await resultPromise;

    if (!message || !result) {
        return new Response("Something went wrong", {
            status: 500,
        });
    }

    await EditMessage(IsleofDucks.channels.staffgeneral, message.id, {
        embeds: [
            {
                title: "Cron Job result for updateroles!",
                description: [
                    `Added ${result.rolesAdded} roles to ${result.usersHadRolesAdded} users.`,
                    `Removed ${result.rolesRemoved} roles from ${result.usersHadRolesRemoved} users.`,
                ].join("\n"),
                color: 0xFB9B00,
                footer: {
                    text: `Response time: ${Date.now() - timestamp}ms`,
                },
                timestamp: new Date().toISOString(),
            },
        ],
    });

    return Response.json({ success: true });
}
