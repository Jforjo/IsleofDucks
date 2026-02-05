import { getScrambleScoreFromUUID, getScrambleScores, updateScrambleScore } from "@/discord/utils";
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

    const params = request.nextUrl.searchParams;
    const uuid = params.get("uuid");

    if (!uuid) {
        return Response.json({
            success: false,
            message: "Missing UUID"
        });
    }

    const scoreRes = await getScrambleScoreFromUUID(uuid);
    if (!scoreRes) {
        return Response.json({
            success: false,
            message: "Failed to fetch scramble score"
        }, { status: 500 });
    }
    await updateScrambleScore(uuid, scoreRes.score + 1);

    return Response.json({
        success: true,
    }, { status: 200 });
}
