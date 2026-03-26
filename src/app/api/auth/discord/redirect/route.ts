import { getUserDetails } from "@/discord/discordUtils";
import { NextRequest, NextResponse } from "next/server";
import { AES } from 'crypto-ts';
import { createDiscordUser } from "@/discord/utils";
import { sign } from 'jsonwebtoken';
import { cookies } from "next/headers";
import { serialize } from 'cookie';

const scope = [
    "identify",
    "guilds"
].join(" ");

const OAUTH_QS = new URLSearchParams({
    client_id: process.env.DISCORD_CLIENT_ID!,
    redirect_uri: `${process.env.NEXT_PUBLIC_BASE_URL}/api/auth/discord/redirect`,
    response_type: "code",
    scope
}).toString();

const OAUTH_URL = `https://discord.com/api/oauth2/authorize?${OAUTH_QS}`;

export async function GET(req: NextRequest): Promise<Response> {
    const code = req.nextUrl.searchParams.get("code");
    const error = req.nextUrl.searchParams.get("error");

    if (error) {
        return NextResponse.json(JSON.stringify(error), { status: 400 });
    }

    if (!code) {
        return NextResponse.redirect(OAUTH_URL);
    }

    const body = new URLSearchParams({
        client_id: process.env.DISCORD_CLIENT_ID!,
        client_secret: process.env.DISCORD_CLIENT_SECRET!,
        grant_type: "authorization_code",
        code,
        redirect_uri: `${process.env.NEXT_PUBLIC_BASE_URL}/api/auth/discord/redirect`,
        scope
    }).toString();

    try {
        const res = await fetch("https://discord.com/api/v10/oauth2/token", {
            method: "POST",
            headers: {
                "Content-Type": "application/x-www-form-urlencoded"
            },
            body
        });

        if (!res.ok) {
            try {
                const errorData = await res.json();
                console.log(`Error response from Discord token endpoint: ${JSON.stringify(errorData)}`);
                return NextResponse.json(JSON.stringify(errorData), { status: res.status });
            } catch (err) {
                console.error(err);
                console.error(JSON.stringify(err));
                console.error("res", res);
                return NextResponse.json(JSON.stringify(err), { status: res.status });
            }
        }

        const data = await res.json();

        const { access_token, refresh_token } = data;

        const user = await getUserDetails(access_token);
        if (!user.success) return NextResponse.json(user.message, { status: user.status });

        try {
            await createDiscordUser(
                user.user.id,
                AES.encrypt(access_token, process.env.ENCRYPTION_KEY!).toString(),
                AES.encrypt(refresh_token, process.env.ENCRYPTION_KEY!).toString()
            );
        } catch (e) {
            console.log(`Error creating user: ${e}`);
        }

        const token = sign(user.user, process.env.JWT_SECRET!, { expiresIn: "24h" });

        (await cookies()).set(`discord-session`, serialize("discord-session", token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
            path: "/"
        }));

        return NextResponse.redirect(process.env.NEXT_PUBLIC_BASE_URL!);

    } catch (e) {
        console.log(`Error exchanging code for token: ${e}`);
        return NextResponse.json(JSON.stringify(e), { status: 500 });
    }
}