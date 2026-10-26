import type { NextRequest } from "next/server";
import { ExecuteWebhook } from "@/discord/discordUtils";
import { ComponentType } from "discord-api-types/v10";

export async function GET(request: NextRequest): Promise<Response> {
    // const authHeader = request.headers.get("authorization");
    // if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    //     return new Response("Unauthorized", {
    //         status: 401,
    //     });
    // }

    const link = "https://isle-of-ducks.vercel.app/api/duck";
    const imageResponse = await fetch(link);
    const fileType = imageResponse.headers.get("content-type")?.split("/")[1]?.split(";")[0] ?? "png";

    await ExecuteWebhook(process.env.DAILYDUCK_WEBHOOK_ID, process.env.DAILYDUCK_WEBHOOK_TOKEN, {
        wait: true,
        with_components: true
    }, {
        components: [
            {
                type: ComponentType.Container,
                accent_color: 0xFFFF00,
                components: [
                    {
                        type: ComponentType.MediaGallery,
                        items: [
                            {
                                media: {
                                    url: `attachment://dailyduck.${fileType}`
                                }
                            }
                        ]
                    }
                ]
            }
        ],
        attachments: [
            {
                id: 1,
                filename: `dailyduck.${fileType}`
            }
        ]
    }, [
        {
            id: 1,
            filename: `dailyduck.${fileType}`,
            url: link
        }
    ]);

    return Response.json({ success: true });
}
