import { getScrambleScores, updateScrambleScore } from "@/discord/utils";
import { NextRequest } from "next/server";

export async function GET(): Promise<Response> {
// export async function GET(request: NextRequest): Promise<Response> {
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

    const scrambleData = await getScrambleScores();
    if (!scrambleData) {
        return Response.json({
            success: false,
            message: "Failed to fetch scramble data"
        }, { status: 500 });
    }

    return Response.json({
        success: true,
        data: scrambleData
    }, { status: 200 });
}

export async function POST(request: NextRequest): Promise<Response> {
    const authHeader = request.headers.get("authorization");
    if (!authHeader?.includes('Bearer ')) {
        return Response.json({
            success: false,
            message: "Missing authorization header"
        }, { status: 401 });
    }
    const APIKey = authHeader.split(' ')[1];
    if (!process.env.BRIDGE_API_KEY) throw new Error('BRIDGE_API_KEY is not defined');
    if (APIKey !== process.env.BRIDGE_API_KEY) {
        return Response.json({
            success: false,
            message: "Invalid API key"
        }, { status: 403 });
    }

    const body = await request.json();
    if (!body || typeof body !== 'object' || !body.uuid || typeof body.uuid !== 'string' || !body.score || typeof body.score !== 'number') {
        return Response.json({
            success: false,
            message: "Invalid request body"
        }, { status: 400 });
    }

    await updateScrambleScore(body.uuid, body.score);

    return Response.json({
        success: true,
    }, { status: 200 });
}
