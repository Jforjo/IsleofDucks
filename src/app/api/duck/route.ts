import { readdir, readFile } from "fs/promises";
import path from "path";

export async function GET(): Promise<Response> {
    if (Math.random() < 0.5) {
        const duckRes = await fetch("https://random-d.uk/api/v2/random");
        const duckData = await duckRes.json();
        const duckUrl = duckData.url;
        return Response.json({
            success: true,
            url: duckUrl
        }, { status: 200 });
    }

    const dir = path.join(process.cwd(), "public", "images", "ducks");

    const files = (await readdir(dir)).filter(f => [".png", ".jpg", ".jpeg", ".gif", ".webp"].includes(path.extname(f).toLowerCase()));
    if (files.length === 0) {
        return new Response("No duck images found", { status: 404 });
    }

    const randomDuck = files[Math.floor(Math.random() * files.length)];
    return Response.json({
        success: true,
        url: `https://isle-of-ducks.vercel.app/images/ducks/${randomDuck}`
    }, { status: 200 });
}
