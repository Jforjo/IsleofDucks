import type { NextRequest } from "next/server";
import { createCanvas, loadImage, registerFont, type CanvasRenderingContext2D } from "canvas";
import { getGuildLBPlayer } from "@/discord/guildlb";
import path from "path";

function roundToDP(value: number, dp: number): number {
    const factor = Math.pow(10, dp);
    return Math.round(value * factor) / factor;
}

function codeToColour(code: string): string {
    switch (code.toLowerCase()) {
        case "§0": return "#000000";
        case "§1": return "#0000aa";
        case "§2": return "#00aa00";
        case "§3": return "#00aaaa";
        case "§4": return "#aa0000";
        case "§5": return "#aa00aa";
        case "§6": return "#ffaa00";
        case "§7": return "#aaaaaa";
        case "§8": return "#555555";
        case "§9": return "#5555ff";
        case "§a": return "#55ff55";
        case "§b": return "#55ffff";
        case "§c": return "#ff5555";
        case "§d": return "#ff55ff";
        case "§e": return "#ffff55";
        case "§f": return "#ffffff";
        default: return "#aaaaaa";
    }
}

function levelToColour(level: number): string {
    if (level < 40) return "#aaaaaa";
    if (level < 80) return "#ffffff";
    if (level < 120) return "#ffff55";
    if (level < 160) return "#55ff55";
    if (level < 200) return "#00aa00";
    if (level < 240) return "#55ffff";
    if (level < 280) return "#00aaaa";
    if (level < 320) return "#5555ff";
    if (level < 360) return "#ff55ff";
    if (level < 400) return "#aa00aa";
    if (level < 440) return "#ffaa00";
    if (level < 480) return "#ff5555";
    return "#aa0000";
}

function centerText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string {
    while (true) {
        const temp = ` ${text} `;
        if (ctx.measureText(temp).width > maxWidth) {
            break;
        }
        text = temp;
    }
    return text;
}

export async function GET(request: NextRequest): Promise<Response> {
    const params = request.nextUrl.searchParams;
    const uuid = params.get("uuid");
    if (!uuid) {
        return Response.json({
            success: false,
            message: "Missing UUID"
        });
    }

    const player = await getGuildLBPlayer(uuid);
    if (!player.success) {
        return Response.json({
            success: false,
            message: `[${player.error.code}] ${player.error.message}`
        });
    }

    const lastUpdated = new Date(player.data.updated_at);
    const now = new Date();
    const diffMs = now.getTime() - lastUpdated.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const lastUpdatedText = diffDays === 0 ? "Today" : diffDays === 1 ? "Yesterday" : `${diffDays} days ago`;

    const playerImage = await loadImage(`https://mc-api.io/render/FULL/${uuid}?size256`);
    const bg = await loadImage(path.join(process.cwd(), "public", "images", "playerstats2.png"));
    
    registerFont(path.resolve(process.cwd(), 'public/fonts/AtkinsonHyperlegible-Bold.ttf'), { family: 'AtkinsonHyperlegible', weight: 'bold' });
    registerFont(path.resolve(process.cwd(), 'public/fonts/NotoSansSymbols-Regular.ttf'), { family: 'NotoSymbols' });

    const offset = 8;
    const imageWidth = playerImage.height * 2 + offset * 2;
    const imageHeight = playerImage.height + offset * 2;

    const canvas = createCanvas(imageWidth, imageHeight);
    const ctx = canvas.getContext('2d');

    // ctx.putImageData(backgroundImage, 0, 0);
    // ctx.drawImage(bg, 0, 0, imageWidth, imageHeight);
    // Make bg #10131a
    ctx.fillStyle = "#10131a";
    ctx.fillRect(0, 0, imageWidth, imageHeight);
    ctx.fillStyle = "black";

    ctx.drawImage(playerImage, offset, offset, playerImage.width, playerImage.height);

    ctx.strokeStyle = "gray";
    ctx.lineWidth = 1;
    ctx.beginPath();
    const boxWidth = ( imageWidth - playerImage.width - offset * 3 ) / 2 - offset * 3;
    // Top
    ctx.roundRect(
        playerImage.width + offset * 2,
        offset,
        imageWidth - playerImage.width - offset * 3,
        (imageHeight - offset * 5) / 4,
        [offset * 2]
    );
    // 0,0
    ctx.roundRect(
        playerImage.width + offset * 4,
        offset + ( (imageHeight - offset * 5) / 4 + offset ) * 1,
        boxWidth,
        (imageHeight - offset * 5) / 4,
        [offset * 2]
    );
    // 0,1
    ctx.roundRect(
        playerImage.width + offset * 4 + boxWidth + offset * 2,
        offset + ( (imageHeight - offset * 5) / 4 + offset ) * 1,
        boxWidth,
        (imageHeight - offset * 5) / 4,
        [offset * 2]
    );
    // 1,0
    ctx.roundRect(
        playerImage.width + offset * 4,
        offset + ( (imageHeight - offset * 5) / 4 + offset ) * 2,
        boxWidth,
        (imageHeight - offset * 5) / 4,
        [offset * 2]
    );
    // 1,1
    ctx.roundRect(
        playerImage.width + offset * 4 + boxWidth + offset * 2,
        offset + ( (imageHeight - offset * 5) / 4 + offset ) * 2,
        boxWidth,
        (imageHeight - offset * 5) / 4,
        [offset * 2]
    );
    // 2,0
    ctx.roundRect(
        playerImage.width + offset * 4,
        offset + ( (imageHeight - offset * 5) / 4 + offset ) * 3,
        boxWidth,
        (imageHeight - offset * 5) / 4,
        [offset * 2]
    );
    // 2,1
    ctx.roundRect(
        playerImage.width + offset * 4 + boxWidth + offset * 2,
        offset + ( (imageHeight - offset * 5) / 4 + offset ) * 3,
        boxWidth,
        (imageHeight - offset * 5) / 4,
        [offset * 2]
    );
    ctx.stroke();
    ctx.globalAlpha = 0.5;
    ctx.fill();
    ctx.globalAlpha = 1;

    /**
     * TOP (name)
     */
    for (let i = 20; i >= 0; i--) {
        ctx.font = `bold ${i}px AtkinsonHyperlegible, NotoSymbols`;
        if (!(ctx.measureText(`${player.data.rank_prefix ? player.data.rank_prefix.replaceAll(/§[a-f0-9]/gm, "") + " " : ""}${player.data.name}${player.data.guild_tag ? ` [${player.data.guild_tag}]` : ""}`).width > imageWidth - playerImage.width - offset * 5)) {
            break;
        }
    }
    ctx.textBaseline = "middle";
    let rankText = "";
    if (player.data.rank_prefix) {
        const rankData = [...player.data.rank_prefix.matchAll(/(§[a-f0-9])([^§]*)/gm)];
        for (const [_, code, text] of rankData) {
            ctx.fillStyle = codeToColour(code);
            ctx.fillText(
                text,
                playerImage.width + offset * 3 + ctx.measureText(rankText).width,
                (imageHeight - offset * 5) / 8
            );
            rankText += text;
        }
        ctx.fillStyle = codeToColour(rankData[0][1]);
    } else {
        ctx.fillStyle = "gray";
    }
    ctx.fillText(
        ` ${player.data.name} `,
        playerImage.width + offset * 3 + ctx.measureText(`${rankText}`).width,
        (imageHeight - offset * 5) / 8
    );
    if (player.data.guild_tag && player.data.guild_tag_color) {
        ctx.fillStyle = player.data.guild_tag_color;
        ctx.fillText(
            `[${player.data.guild_tag}]`,
            playerImage.width + offset * 3 + ctx.measureText(`${rankText} ${player.data.name} `).width,
            (imageHeight - offset * 5) / 8
        );
    }
    /**
     * TOP (guild)
     */
    let topGuildText = "";
    if (player.data.guild_rank && player.data.guild_name) {
        topGuildText = `${player.data.guild_rank} in ${player.data.guild_name} • `;
    }
    topGuildText += `Updated ${lastUpdatedText}`;
    ctx.fillStyle = "white";
    for (let i = 10; i >= 0; i--) {
        ctx.font = `bold ${i}px AtkinsonHyperlegible, NotoSymbols`;
        if (!(ctx.measureText(topGuildText).width > imageWidth - playerImage.width - offset * 5)) {
            break;
        }
    }
    ctx.fillText(
        topGuildText,
        playerImage.width + offset * 3,
        (imageHeight - offset * 5) / 8 + offset * 3
    );

    /**
     * 0,0 (Level)
     */
    ctx.fillStyle = "white";
    ctx.font = `bold 16px AtkinsonHyperlegible, NotoSymbols`;
    ctx.fillText(
        centerText(ctx, "Level", boxWidth - offset * 2),
        playerImage.width + offset * 5,
        (imageHeight - offset * 5) / 8 * 3
    );
    ctx.font = `bold 20px AtkinsonHyperlegible, NotoSymbols`;
    ctx.fillStyle = levelToColour(player.data.skyblock_level);
    ctx.fillText(
        centerText(ctx, `${player.data.skyblock_level}`, boxWidth - offset * 2),
        playerImage.width + offset * 5,
        (imageHeight - offset * 5) / 8 * 4
    );

    /**
     * 0,1 (Skills)
     */
    ctx.fillStyle = "white";
    ctx.font = `bold 16px AtkinsonHyperlegible, NotoSymbols`;
    ctx.fillText(
        centerText(ctx, "Skills", boxWidth - offset * 2),
        playerImage.width + boxWidth + offset * 7,
        (imageHeight - offset * 5) / 8 * 3
    );
    ctx.font = `bold 20px AtkinsonHyperlegible, NotoSymbols`;
    ctx.fillStyle = "#ff55ff";
    ctx.fillText(
        centerText(ctx, `${roundToDP(player.data.skills, 2)}`, boxWidth - offset * 2),
        playerImage.width + boxWidth + offset * 7,
        (imageHeight - offset * 5) / 8 * 4
    );

    /**
     * 1,0 (Slayer)
     */
    ctx.fillStyle = "white";
    ctx.font = `bold 16px AtkinsonHyperlegible, NotoSymbols`;
    ctx.fillText(
        centerText(ctx, "Slayer", boxWidth - offset * 2),
        playerImage.width + offset * 5,
        (imageHeight - offset * 5) / 8 * 5 + offset
    );
    ctx.font = `bold 20px AtkinsonHyperlegible, NotoSymbols`;
    ctx.fillStyle = "#55ff55";
    ctx.fillText(
        centerText(ctx, `${player.data.slayers_formatted}`, boxWidth - offset * 2),
        playerImage.width + offset * 5,
        (imageHeight - offset * 5) / 8 * 6 + offset
    );

    /**
     * 1,1 (Cata)
     */
    ctx.fillStyle = "white";
    ctx.font = `bold 16px AtkinsonHyperlegible, NotoSymbols`;
    ctx.fillText(
        centerText(ctx, "Cata", boxWidth - offset * 2),
        playerImage.width + boxWidth + offset * 7,
        (imageHeight - offset * 5) / 8 * 5 + offset
    );
    ctx.font = `bold 20px AtkinsonHyperlegible, NotoSymbols`;
    ctx.fillStyle = "#ff5555";
    ctx.fillText(
        centerText(ctx, `${roundToDP(player.data.dungeons_map.catacombs_level, 2)}`, boxWidth - offset * 2),
        playerImage.width + boxWidth + offset * 7,
        (imageHeight - offset * 5) / 8 * 6 + offset
    );

    /**
     * 2,0 (Networth)
     */
    ctx.fillStyle = "white";
    ctx.font = `bold 16px AtkinsonHyperlegible, NotoSymbols`;
    ctx.fillText(
        centerText(ctx, "Networth", boxWidth - offset * 2),
        playerImage.width + offset * 5,
        (imageHeight - offset * 5) / 8 * 7 + offset * 2
    );
    ctx.font = `bold 20px AtkinsonHyperlegible, NotoSymbols`;
    ctx.fillStyle = "#ffff55";
    ctx.fillText(
        centerText(ctx, `${player.data.networth_formatted}`, boxWidth - offset * 2),
        playerImage.width + offset * 5,
        (imageHeight - offset * 5) / 8 * 8 + offset * 2
    );

    /**
     * 2,1 (Profile)
     */
    ctx.fillStyle = "white";
    const modeText = `Mode: ${player.data.game_mode === '' ? "normal" : player.data.game_mode}`;
    for (let i = 16; i >= 0; i--) {
        ctx.font = `bold ${i}px AtkinsonHyperlegible, NotoSymbols`;
        if (!(ctx.measureText(modeText).width > boxWidth - offset * 2)) {
            break;
        }
    }
    ctx.fillText(
        centerText(ctx, modeText, boxWidth - offset * 2),
        playerImage.width + boxWidth + offset * 7,
        (imageHeight - offset * 5) / 8 * 7 + offset * 2
    );
    const profileText = `Profile: ${player.data.cute_name}`;
    for (let i = 16; i >= 0; i--) {
        ctx.font = `bold ${i}px AtkinsonHyperlegible, NotoSymbols`;
        if (!(ctx.measureText(profileText).width > boxWidth - offset * 2)) {
            break;
        }
    }
    ctx.fillText(
        centerText(ctx, profileText, boxWidth - offset * 2),
        playerImage.width + boxWidth + offset * 7,
        (imageHeight - offset * 5) / 8 * 8 + offset * 2
    );


    return new Response(new Uint8Array(canvas.toBuffer("image/png")), {
        headers: {
            "Content-Type": "image/png",
        },
    });
}
