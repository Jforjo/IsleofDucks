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

    const params = request.nextUrl.searchParams;
    const bridge = params.get("bridge");

    const timestamp = Date.now();
    let messageId = "";
    
    if (!bridge) {
        const message = await SendMessage(IsleofDucks.channels.staffgeneral, {
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

        if (!message) {
            return new Response("Something went wrong", {
                status: 500,
            });
        }

        messageId = message.id;
    }
    const resultPromise = UpdateRoles(IsleofDucks.serverID);

    const result = await resultPromise;

    if (!bridge) {
        await EditMessage(IsleofDucks.channels.staffgeneral, messageId, {
            embeds: [
                {
                    title: "Cron Job result for updateroles!",
                    description: [
                        `Added ${result.rolesAdded} roles to ${result.usersHadRolesAdded.filter((value, index) => result.usersHadRolesAdded.indexOf(value) === index).length} users.`,
                        `Removed ${result.rolesRemoved} roles from ${result.usersHadRolesRemoved.filter((value, index) => result.usersHadRolesRemoved.indexOf(value) === index).length} users.`,
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

    return Response.json({
        success: true,
        result
    });
}
