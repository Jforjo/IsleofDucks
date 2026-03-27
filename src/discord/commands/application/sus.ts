import { CreateInteractionResponse, FollowupMessage, GetAllGuildMembers, getUsersGuilds, IsleofDucks, SendMessage } from "@/discord/discordUtils";
import { chunkByMaxChars } from "@/discord/utils";
import { APIChatInputApplicationCommandInteraction, APIGuildMember, APIInteractionResponse, ApplicationCommandType, InteractionResponseType, MessageFlags } from "discord-api-types/v10";
import { NextResponse } from "next/server";

const badGuilds = {
    taunahi: "871537438227570748",
    nebula: "1188447621040328854",
    polar: "1139134033071194174",
    clumpy: "1397641010812682314",
    nethermfas: "1473135707332673616",
    polinex: "1286611281972822046"
};

async function checkUserGuildsForBadGuilds(member: APIGuildMember): Promise<null | {
    id: string;
    guilds: Record<string, string>;
}> {
    const res = await getUsersGuilds(member.user.id);
    if (!res.success) return null;
    const badGuildsTheyAreIn = Object.fromEntries(Object.entries(badGuilds).filter(([, guildId]) => res.guilds.some(g => g.id === guildId)));
    if (Object.keys(badGuildsTheyAreIn).length > 0) return {
        id: member.user.id,
        guilds: badGuildsTheyAreIn
    }
    return null;
}

export default async function(
    interaction: APIChatInputApplicationCommandInteraction
): Promise<
    NextResponse<
        {
            success: boolean;
            error?: string;
        } | APIInteractionResponse
    >
> {
    const member = interaction.member;
    if (!member) {
        await CreateInteractionResponse(interaction.id, interaction.token, {
            type: InteractionResponseType.ChannelMessageWithSource,
            data: {
                content: "Could not find who ran the command!",
                flags: MessageFlags.Ephemeral
            }
        });
        return NextResponse.json(
            { success: false, error: "Could not find who ran the command" },
            { status: 400 }
        );
    }
    if (!(
        member.user.id === IsleofDucks.staticIDs.Jforjo
        // || member.roles.includes(IsleofDucks.roles.admin)
    )) {
        await CreateInteractionResponse(interaction.id, interaction.token, {
            type: InteractionResponseType.ChannelMessageWithSource,
            data: {
                content: "You do not have permission to run this command!",
                flags: MessageFlags.Ephemeral
            }
        });
        return NextResponse.json(
            { success: false, error: "You do not have permission to run this command" },
            { status: 400 }
        );
    }

    await CreateInteractionResponse(interaction.id, interaction.token, {
        type: InteractionResponseType.DeferredChannelMessageWithSource,
    });

    const guildMembers = await GetAllGuildMembers(IsleofDucks.serverID);
    if (!guildMembers || guildMembers.length === 0) {
        await FollowupMessage(interaction.token, {
            content: "Failed to fetch guild members!",
        });
        return NextResponse.json(
            { success: false, error: "Failed to fetch guild members" },
            { status: 400 }
        );
    }

    const users: {
        id: string;
        guilds: Record<string, string>;
    }[] = [];

    const membersToTestFirst = guildMembers.filter(m => m.roles.includes(IsleofDucks.roles.duck_guild_member) || m.roles.includes(IsleofDucks.roles.duckling_guild_member));
    const membersToTestSecond = guildMembers.filter(m => m.roles.includes(IsleofDucks.roles.verified) && !membersToTestFirst.some(mem => mem.user.id === m.user.id));
    const membersToTestThird = guildMembers.filter(m => !membersToTestFirst.some(mem => mem.user.id === m.user.id) && !membersToTestSecond.some(mem => mem.user.id === m.user.id));
    const memberstoTestFirstPromise = Promise.all(membersToTestFirst.map(checkUserGuildsForBadGuilds));
    const membersToTestSecondPromise = Promise.all(membersToTestSecond.map(checkUserGuildsForBadGuilds));
    const membersToTestThirdPromise = Promise.all(membersToTestThird.map(checkUserGuildsForBadGuilds));

    await FollowupMessage(interaction.token, {
        content: [
            "Checking user guilds...",
            "This may take a while. When it's done, the bot will send messages below this one."
        ].join("\n"),
    });

    const membersToCheckFirstresults = (await memberstoTestFirstPromise).filter(r => r !== null);
    if (membersToCheckFirstresults.length > 0) {
        const content = membersToCheckFirstresults.filter(u => membersToTestFirst.some(m => m.user.id === u.id)).map(u => `<@${u.id}> (${Object.keys(u.guilds).join(", ")})`);
        const separatedContent = chunkByMaxChars(content, 1900, "\n"); // Discord has a 2000 character limit, leaving some room for the rest of the message
        for (const chunk of separatedContent) {
            await SendMessage(interaction.channel.id, {
                embeds: [
                    {
                        title: "Users with guild roles in bad guilds",
                        description: chunk.join("\n"),
                    }
                ]
            });
        }
    }

    const membersToCheckSecondResults = (await membersToTestSecondPromise).filter(r => r !== null);
    if (membersToCheckSecondResults.length > 0) {
        const content = membersToCheckSecondResults.filter(u => membersToTestSecond.some(m => m.user.id === u.id)).map(u => `<@${u.id}> (${Object.keys(u.guilds).join(", ")})`);
        const separatedContent = chunkByMaxChars(content, 1900, "\n");
        for (const chunk of separatedContent) {
            await SendMessage(interaction.channel.id, {
                embeds: [
                    {
                        title: "Users with verified role in bad guilds",
                        description: chunk.join("\n"),
                    }
                ]
            });
        }
    }

    const membersToCheckThirdResults = (await membersToTestThirdPromise).filter(r => r !== null);
    if (membersToCheckThirdResults.length > 0) {
        const content = membersToCheckThirdResults.filter(u => membersToTestThird.some(m => m.user.id === u.id)).map(u => `<@${u.id}> (${Object.keys(u.guilds).join(", ")})`);
        const separatedContent = chunkByMaxChars(content, 1900, "\n");
        for (const chunk of separatedContent) {
            await SendMessage(interaction.channel.id, {
                embeds: [
                    {
                        title: "Users with no roles in bad guilds",
                        description: chunk.join("\n"),
                    }
                ]
            });
        }
    }

    await FollowupMessage(interaction.token, {
        content: `Done!`,
    });

    return NextResponse.json(
        { success: true },
        { status: 200 }
    );
}
export const CommandData = {
    name: "sus",
    description: "Displays users in suspicious guilds.",
    type: ApplicationCommandType.ChatInput,
    default_member_permissions: "0"
}