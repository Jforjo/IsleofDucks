import type { NextRequest } from "next/server";
import { IsleofDucks, SendMessage } from "@/discord/discordUtils";
import { formatNumberWithCommas, getImmunePlayer } from "@/discord/utils";
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

    const duckData = guildDataDuck.guild.members.map(member => ({
        ...member,
        gexp: Object.values(member.expHistory).reduce((a, b) => ( a ?? 0 ) + ( b ?? 0 ), 0) ?? 0,
        gexpRank: 0
    }));
    const ducklingData = guildDataDuckling.guild.members.map(member => ({
        ...member,
        gexp: Object.values(member.expHistory).reduce((a, b) => ( a ?? 0 ) + ( b ?? 0 ), 0) ?? 0,
        gexpRank: 0
    }));
    duckData.sort((a, b) => b.gexp - a.gexp);
    ducklingData.sort((a, b) => b.gexp - a.gexp);
    duckData.forEach((member, i) => member.gexpRank = i + 1);
    ducklingData.forEach((member, i) => member.gexpRank = i + 1);

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

    const immuneDuck = Object.fromEntries(await Promise.all(guildDataDuck.guild.members.map(async (member) => {
        const immuneRes = await getImmunePlayer(member.uuid);
        return [
            member.uuid,
            immuneRes !== null
        ];
    }))) as Record<string, boolean>;
    const immuneDuckling = Object.fromEntries(await Promise.all(guildDataDuckling.guild.members.map(async (member) => {
        const immuneRes = await getImmunePlayer(member.uuid);
        return [
            member.uuid,
            immuneRes !== null
        ];
    }))) as Record<string, boolean>;

    const names = { ...namesDuck, ...namesDuckling };

    const chunkSize = 21;
    const fieldArrayDuck = [];
    for (let i = 0; i < duckData.length; i += chunkSize) {
        fieldArrayDuck.push(
            {
                name: '\u200b',
                value: duckData.slice(i, i + chunkSize).map((field) => `\`#${field.gexpRank}\`${field.joined > Date.now() - 1000 * 60 * 60 * 24 * 7 ? ' 🆕' : ''}${immuneDuck[field.uuid] ? ' 🛡️' : ''} ${names[field.uuid].replaceAll('_', '\\_')}: ${formatNumberWithCommas(field.gexp)}`).join('\n'),
                inline: true
            }
        );
    }
    await SendMessage(IsleofDucks.channels.gexpLeaderboard, {
        embeds: [
            {
                title: `Top ${duckData.length} Weekly GEXP for ${guildDataDuck.guild.name} ${guildDataDuck.guild.tag}`,
                description: [
                    "```js",
                    `Total RAW Weekly GEXP ${formatNumberWithCommas(duckData.reduce((acc, member) => acc + member.gexp, 0))}`,
                    "```"
                ].join("\n"),
                fields: fieldArrayDuck,
                color: IsleofDucks.colours.main,
                timestamp: new Date().toISOString(),
            }
        ]
    });

    const fieldArrayDuckling = [];
    for (let i = 0; i < ducklingData.length; i += chunkSize) {
        fieldArrayDuckling.push(
            {
                name: '\u200b',
                value: ducklingData.slice(i, i + chunkSize).map((field) => `\`#${field.gexpRank}\`${field.joined > Date.now() - 1000 * 60 * 60 * 24 * 7 ? ' 🆕' : ''}${immuneDuckling[field.uuid] ? ' 🛡️' : ''} ${names[field.uuid].replaceAll('_', '\\_')}: ${formatNumberWithCommas(field.gexp)}`).join('\n'),
                inline: true
            }
        );
    }
    await SendMessage(IsleofDucks.channels.gexpLeaderboard, {
        embeds: [
            {
                title: `Top ${ducklingData.length} Weekly GEXP for ${guildDataDuckling.guild.name} ${guildDataDuckling.guild.tag}`,
                description: [
                    "```js",
                    `Total RAW Weekly GEXP ${formatNumberWithCommas(ducklingData.reduce((acc, member) => acc + member.gexp, 0))}`,
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
