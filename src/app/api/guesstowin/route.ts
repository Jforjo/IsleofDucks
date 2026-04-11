import { endGuessToWin, getGuessToWin } from "@/discord/utils";
import type { NextRequest } from "next/server";

export async function GET(request: NextRequest): Promise<Response> {
    const authHeader = request.headers.get("authorization");
    if (!authHeader?.includes('Bearer ')) {
        return Response.json({
            success: false,
            message: "Missing authorization header"
        });
    }
    const APIKey = authHeader.split(' ')[1];
    if (!process.env.BRIDGE_API_KEY) throw new Error('BRIDGE_API_KEY is not defined');
    if (APIKey !== process.env.BRIDGE_API_KEY) {
        return Response.json({
            success: false,
            message: "Invalid API key"
        });
    }

    const params = request.nextUrl.searchParams;
    const id = params.get("id");

    if (!id) {
        return Response.json({
            success: false,
            message: "Missing ID"
        });
    }

    const guesstowin = await getGuessToWin(id);
    if (!guesstowin) {
        return Response.json({
            success: false,
            message: "No guesstowin found"
        });
    }

    return Response.json({
        success: true,
        data: guesstowin
    });
}

export async function POST(request: NextRequest): Promise<Response> {
    const authHeader = request.headers.get("authorization");
    if (!authHeader?.includes('Bearer ')) {
        return Response.json({
            success: false,
            message: "Missing authorization header"
        });
    }
    const APIKey = authHeader.split(' ')[1];
    if (!process.env.BRIDGE_API_KEY) throw new Error('BRIDGE_API_KEY is not defined');
    if (APIKey !== process.env.BRIDGE_API_KEY) {
        return Response.json({
            success: false,
            message: "Invalid API key"
        });
    }

    const params = request.nextUrl.searchParams;
    const id = params.get("id");

    if (!id) {
        return Response.json({
            success: false,
            message: "Missing ID"
        });
    }

    // Get request body and parse it as JSON
    const body = await request.json();
    if (!body || typeof body !== "object") {
        return Response.json({
            success: false,
            message: "Invalid request body"
        });
    }
    const { guesses, winner } = body;

    const guesstowin = await getGuessToWin(id);
    if (!guesstowin) {
        return Response.json({
            success: false,
            message: "No guesstowin found"
        });
    }

    await endGuessToWin(id, guesses, winner);

    return Response.json({
        success: true,
    });
}
