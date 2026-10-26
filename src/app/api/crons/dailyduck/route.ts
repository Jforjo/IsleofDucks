import type { NextRequest } from "next/server";
import { ExecuteWebhook } from "@/discord/discordUtils";
import { ComponentType, MessageFlags } from "discord-api-types/v10";

const DUCK_TITLES = [
    "A Duck Has Appeared!",
    "A Duck Has Been Spotted!",
    "A Duck Is Here!",
    "The Duck Is Here!",
    "The Duck Has Arrived!",
    "Duck Incoming!",
    "Duck Detected!",
    "Duck Spotted!",
    "Duck Alert!",
    "Behold: A Duck",
    "Lo and Behold, Duck",
    "Oh Look, A Duck",
    "Look Who's Here: A Duck",
    "Guess Who Arrived?",
    "Well, Well, Well… A Duck",
    "Everyone, Remain Calm.",
    "Attention: There Is a Duck",
    "Attention! Duck!",
    "We Have Duck",
    "We Got Duck",
    "Duck Has Entered the Premises",
    "The Daily Duck Has Landed",
    "Your Duck Has Arrived",
    "Your Duck Delivery Is Here",
    "The Duck Has Been Delivered",
    "A Duck Has Entered the Chat!",
    "A Duck Has Been Deployed!",
    "A Duck Has Been Released!",
    "A Duck Has Spawned!",
    "A Duck Has Materialized!",
    "A Duck Has Manifested!",
    "A Duck Has Emerged!",
    "A Duck Has Landed!",
    "A Duck Has Arrived Safely!",
    "A Duck Is Approaching!",
    "Duck Approaching!",
    "Duck En Route!",
    "Duck Incoming, Brace Yourselves!",
    "Duck Has Been Detected!",
    "Duck Successfully Located!",
    "Duck Successfully Acquired!",
    "Duck Has Been Secured!",
    "Duck Has Been Obtained!",
    "Duck Has Been Dispatched!",
    "Duck Has Been Deployed!",
    "Duck Has Entered the Building!",
    "Duck Has Entered the Premises!",
    "There Is Now a Duck.",
    "There Is a Duck Here.",
    "There Appears to Be a Duck.",
    "We Have a Duck Situation.",
    "We Have Located the Duck.",
    "We Have Acquired a Duck.",
    "We Have Obtained Duck.",
    "Duck Has Been Delivered.",
    "Duck Delivery Complete!",
    "Your Duck Is Ready.",
    "Your Duck Has Arrived Safely.",
    "Today's Duck Has Arrived!",
    "Today's Duck Has Been Selected!",
    "Today's Duck Has Been Chosen.",
    "Today's Duck Has Been Located.",
    "Today's Duck Is Here.",
    "Please Welcome Today's Duck.",
    "Please Welcome: Duck.",
    "Introducing: A Duck.",
    "Presenting: A Duck.",
    "Now Presenting… Duck.",
    "May I Present: A Duck.",
    "Behold, Today's Duck.",
    "And Now… A Duck.",
    "Without Further Ado: Duck.",
    "As Promised: Duck.",
    "As Scheduled: Duck.",
    "The Duckening Continues.",
    "Another Duck Has Appeared.",
    "Yet Another Duck.",
    "Once Again: Duck.",
    "It Is Time for Duck.",
    "It Is Duck Time.",
    "Duck Time Has Arrived.",
    "The Hour of Duck Is Upon Us.",
    "The Duck Has Spoken.",
    "The Duck Demands Your Attention.",
    "The Duck Requires Your Attention.",
    "Please Direct Your Attention to the Duck.",
    "Kindly Observe the Duck.",
    "Please Observe: Duck.",
    "Everyone Look at This Duck."
]

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
        flags: MessageFlags.IsComponentsV2,
        components: [
            {
                type: ComponentType.Container,
                accent_color: 0xFFFF00,
                components: [
                    {
                        type: ComponentType.TextDisplay,
                        content: DUCK_TITLES[Math.floor(Math.random() * DUCK_TITLES.length)]
                    },
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
