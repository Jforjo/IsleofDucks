import NextAuth from "next-auth";
import DiscordProvider from "next-auth/providers/discord";
import type { NextAuthOptions } from "next-auth"

const scope = [
    "identify",
    "guilds",
    "guilds.members.read",
].join(" ");

const authOptions: NextAuthOptions = {
    providers: [
        DiscordProvider({
            clientId: process.env.DISCORD_CLIENT_ID ?? "",
            clientSecret: process.env.DISCORD_CLIENT_SECRET ?? "",
            authorization: {
                url: "https://discord.com/api/oauth2/authorize",
                params: { scope: scope },
            },
        }),
    ],
};

const { handler } = NextAuth(authOptions);

export { handler as GET, handler as POST };