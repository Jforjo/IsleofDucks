import { readdir, readFile } from "fs/promises";
import path from "path";

export async function GET(): Promise<Response> {
    const mimeTypes: Record<string, string> = {
        ".png": "image/png",
        ".jpg": "image/jpeg",
        ".jpeg": "image/jpeg",
        ".gif": "image/gif",
    };

    if (Math.random() < 0.5) {
        const duckRes = await fetch("https://random-d.uk/api/v2/random");
        const duckData = await duckRes.json();
        const duckUrl = duckData.url;
        const duckImageRes = await fetch(duckUrl);
        const duckImageData = new Uint8Array(await duckImageRes.arrayBuffer());
        return new Response(duckImageData, {
            headers: {
                "Content-Type": mimeTypes[path.extname(duckUrl).toLowerCase()],
            },
        });
    }

    const dir = path.join(process.cwd(), "public", "images", "ducks");

    const files = (await readdir(dir)).filter(f => path.extname(f).toLowerCase() in mimeTypes);
    if (files.length === 0) {
        return new Response("No duck images found", { status: 404 });
    }

    const randomDuck = files[Math.floor(Math.random() * files.length)];
    const contentType = mimeTypes[path.extname(randomDuck).toLowerCase()];
    const data = await readFile(path.join(dir, randomDuck));

    return new Response(new Uint8Array(data), {
        headers: {
            "Content-Type": contentType,
        },
    });
}
