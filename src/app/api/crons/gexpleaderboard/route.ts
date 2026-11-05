import type { NextRequest } from "next/server";
import { IsleofDucks, SendMessage } from "@/discord/discordUtils";
import { formatNumberWithCommas } from "@/discord/utils";
import { getGuildData, getUsernameOrUUID } from "@/discord/hypixelUtils";

export async function GET(request: NextRequest): Promise<Response> {
    const authHeader = request.headers.get("authorization");
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
        return new Response("Unauthorized", {
            status: 401,
        });
    }

    const guildDataDuck = await getGuildData("Isle of Ducks");
    if (!guildDataDuck.success) {
        return new Response(guildDataDuck.message, {
            status: 400,
        });
    }
    const guildDataDuckling = await getGuildData("Isle of Ducklings");
    if (!guildDataDuckling.success) {
        return new Response(guildDataDuckling.message, {
            status: 400,
        });
    }

    const namesDuck = Object.fromEntries(await Promise.all(guildDataDuck.guild.members.map(async (member) => {
        const uuidRes = await getUsernameOrUUID(member.uuid);
        return [
            member.uuid,
            uuidRes.success ? uuidRes.name : member.uuid
        ];
    }))) as Record<string, string>;
    const namesDuckling = Object.fromEntries(await Promise.all(guildDataDuckling.guild.members.map(async (member) => {
        const uuidRes = await getUsernameOrUUID(member.uuid);
        return [
            member.uuid,
            uuidRes.success ? uuidRes.name : member.uuid
        ];
    }))) as Record<string, string>;

    const names = { ...namesDuck, ...namesDuckling };

    const chunkSize = 21;
    const fieldArrayDuck = [];
    for (let i = 0; i < guildDataDuck.guild.members.length; i += chunkSize) {
        fieldArrayDuck.push(
            {
                name: '\u200b',
                value: guildDataDuck.guild.members.slice(i, i + chunkSize).map((field) => `\`#${field.rank}\`${field.joined > Date.now() - 1000 * 60 * 60 * 24 * 7 ? ' 🆕' : ''} ${names[field.uuid].replaceAll('_', '\\_')}: ${formatNumberWithCommas(Object.values(field.expHistory).reduce((a, b) => ( a ?? 0 ) + ( b ?? 0 ), 0) ?? 0)}`).join('\n'),
                inline: true
            }
        );
    }
    await SendMessage(IsleofDucks.channels.gexpLeaderboard, {
        embeds: [
            {
                title: `Top ${guildDataDuck.guild.members.length} Weekly GEXP for ${guildDataDuck.guild.name} ${guildDataDuck.guild.tag}`,
                description: [
                    "```js",
                    `Total RAW Weekly GEXP ${formatNumberWithCommas(guildDataDuck.guild.members.reduce((acc, member) => {
                        const gexp = Object.values(member.expHistory).reduce((a, b) => ( a ?? 0 ) + ( b ?? 0 ), 0) ?? 0;
                        return acc + gexp;
                    }, 0))}`,
                    "```"
                ].join("\n"),
                fields: fieldArrayDuck,
                color: IsleofDucks.colours.main,
                timestamp: new Date().toISOString(),
            }
        ]
    });

    const fieldArrayDuckling = [];
    for (let i = 0; i < guildDataDuckling.guild.members.length; i += chunkSize) {
        fieldArrayDuckling.push(
            {
                name: '\u200b',
                value: guildDataDuckling.guild.members.slice(i, i + chunkSize).map((field) => `\`#${field.rank}\`${field.joined > Date.now() - 1000 * 60 * 60 * 24 * 7 ? ' 🆕' : ''} ${names[field.uuid].replaceAll('_', '\\_')}: ${formatNumberWithCommas(Object.values(field.expHistory).reduce((a, b) => ( a ?? 0 ) + ( b ?? 0 ), 0) ?? 0)}`).join('\n'),
                inline: true
            }
        );
    }
    await SendMessage(IsleofDucks.channels.gexpLeaderboard, {
        embeds: [
            {
                title: `Top ${guildDataDuckling.guild.members.length} Weekly GEXP for ${guildDataDuckling.guild.name} ${guildDataDuckling.guild.tag}`,
                description: [
                    "```js",
                    `Total RAW Weekly GEXP ${formatNumberWithCommas(guildDataDuckling.guild.members.reduce((acc, member) => {
                        const gexp = Object.values(member.expHistory).reduce((a, b) => ( a ?? 0 ) + ( b ?? 0 ), 0) ?? 0;
                        return acc + gexp;
                    }, 0))}`,
                    "```"
                ].join("\n"),
                fields: fieldArrayDuckling,
                color: IsleofDucks.colours.main,
                timestamp: new Date().toISOString(),
            }
        ]
    });


    return Response.json({ success: true });
}
