import { CreateTranscript } from "@/discord/commands/component/transcript";
import { DeleteChannel, GetCurrentTranscript, GetGuildChannels, IsleofDucks, SendMessage } from "@/discord/discordUtils";
import { APITextChannel, ChannelType, RESTAPIGuildChannelResolvable } from "discord-api-types/v10";
import { NextResponse, type NextRequest } from "next/server";

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
    const name = params.get("name");

    if (!name) {
        return Response.json({
            success: false,
            message: "Missing Username"
        });
    }
    
    const channels = await GetGuildChannels(IsleofDucks.serverID);
    if (!channels) {
        return Response.json({
            success: false,
            message: "Failed to fetch guild channels"
        });
    }
    const channel = (channels as RESTAPIGuildChannelResolvable[]).find(c => {
        if (c.type !== ChannelType.GuildText) return false;
        if (!c.topic) return false;
        const topicParts = c.topic.split(' | ');
        if (topicParts[0] !== "duckapp" && topicParts[0] !== "ducklingapp") return false;
        return topicParts[1].toLowerCase() === name.toLowerCase();
    }) as APITextChannel | undefined;
    if (!channel || !channel.topic) {
        return Response.json({
            success: false,
            message: "No ticket channel found for this user"
        });
    }

    const currentTranscript = await GetCurrentTranscript();
    if (!currentTranscript) {
        return Response.json({
            success: false,
            message: "Failed to fetch transcript data"
        });
    }
    // Check if a transcript already exists for this channel
    const threadChannel = (channels as RESTAPIGuildChannelResolvable[]).find(c => {
        if (c.type !== ChannelType.PublicThread) return false;
        if (c.parent_id !== currentTranscript.channelId) return false;
        if (!c.name) return false;
        if (c.name !== channel.name) return false;
        // if created within the past minute then return true
        if (c.thread_metadata?.create_timestamp && (new Date().getTime() - new Date(c.thread_metadata.create_timestamp).getTime()) < 60000) {
            return true;
        }
        return false;
    }) as APITextChannel | undefined;
    if (threadChannel) {
        return Response.json({
            success: true
        });
    }

    const [ticketID, , ticketOwnerID, ] = channel.topic.split(' | ');
    
    await SendMessage(channel.id, {
        embeds: [
            {
                title: "Closed Ticket",
                description: "Automatically closed ticket as the user has joined the guild in-game.",
                color: 0xFB9B00,
                timestamp: new Date().toISOString()
            }
        ],
    });
    const transcript = await CreateTranscript(channel.id, channel.name, IsleofDucks.staticIDs.IsleofDucksBot, ticketID, ticketOwnerID);
    if (!transcript.success) {
        return NextResponse.json(
            { success: false, error: transcript.message },
            { status: 400 }
        );
    }
    await DeleteChannel(channel.id);

    return Response.json({
        success: true
    });
}
