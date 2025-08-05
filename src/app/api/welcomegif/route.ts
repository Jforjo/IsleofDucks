import type { NextRequest } from "next/server";
import { GifCodec, GifFrame, GifUtil } from "gifwrap";
import { createCanvas, loadImage, ImageData } from "canvas";
import path from "path";

async function getGifFrames(file: string): Promise<GifFrame[]> {
    return new Promise((resolve) => {
        GifUtil.read(file).then((inputGif) => {
            resolve(inputGif.frames);
        });
    });
}

export async function GET(request: NextRequest): Promise<Response> {
    // const authHeader = request.headers.get("authorization");
    // if (!authHeader?.includes('Bearer ')) {
    //     return Response.json({
    //         success: false,
    //         message: "Missing authorization header"
    //     });
    // }
    // const APIKey = authHeader.split(' ')[1];
    // if (!process.env.BRIDGE_API_KEY) throw new Error('BRIDGE_API_KEY is not defined');
    // if (APIKey !== process.env.BRIDGE_API_KEY) {
    //     return Response.json({
    //         success: false,
    //         message: "Invalid API key"
    //     });
    // }
    const params = request.nextUrl.searchParams;
    const avatarURL = params.get("avatar");
    if (!avatarURL) {
        return Response.json({
            success: false,
            message: "Missing Avatar URL"
        });
    }

    const avatar = await loadImage(avatarURL);
    const frames: GifFrame[] = [];
    const filePath = path.join(process.cwd(), "public", "images", "welcome.gif");
    const gifFrames = await getGifFrames(filePath);
    
    const gifWidth = gifFrames[0].bitmap.width;
    const gifHeight = gifFrames[0].bitmap.height;
    const width = 256;
    const height = width;
    const xCenter = (gifHeight - height) / 2 + width / 2;
    const yCenter = gifHeight / 2;
    const x = xCenter - width / 2;
    const y = yCenter - height / 2;

    for (const frame of gifFrames) {
        const canvas = createCanvas(gifWidth, gifHeight);
        const ctx = canvas.getContext('2d');
        
        const imageData = new ImageData(
            new Uint8ClampedArray(frame.bitmap.data),
            frame.bitmap.width,
            frame.bitmap.height
        );
        ctx.putImageData(imageData, 0, 0);

        // Clip the canvas to a circle
        ctx.save(); // Save the context state
        ctx.beginPath();
        ctx.arc(xCenter, yCenter, width / 2, 0, Math.PI * 2);
        ctx.closePath();
        ctx.clip();

        // Draw circular avatar
        ctx.drawImage(avatar, x, y, width, height);
        ctx.restore(); // Restore state so other drawings aren't affected
        
        const updated = ctx.getImageData(0, 0, gifWidth, gifHeight);
        frame.bitmap = {
            width: gifWidth,
            height: gifHeight,
            data: Buffer.from(updated.data),
        };

        GifUtil.quantizeDekker(frame, 256);

        // frames.push(new GifFrame(new BitmapImage(frame.bitmap)));
        frames.push(frame);
    }

    const codec = new GifCodec();
    const gif = await codec.encodeGif(frames, {
        loops: 0,
    });
    
    return new Response(Buffer.from(gif.buffer), {
        headers: {
            "Content-Type": "image/gif",
        },
    });
}
