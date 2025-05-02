import { APIChatInputApplicationCommandInteraction, APIInteractionResponse, ApplicationCommandType, ButtonStyle, ComponentType, InteractionResponseType, RESTPatchAPIApplicationCommandJSONBody } from "discord-api-types/v10";
import { CreateInteractionResponse, FollowupMessage, IsleofDucks, CheckEmbedExists, CreateEmbedData } from "@/discord/discordUtils";
import { NextResponse } from "next/server";
import { arrayChunks } from "@/discord/utils";

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
    // User sees the "[bot] is thinking..." message
    await CreateInteractionResponse(interaction.id, interaction.token, {
        type: InteractionResponseType.DeferredChannelMessageWithSource,
        data: { flags: 1 << 6 },
    });

    let userId;
    if (interaction.member) userId = interaction.member.user.id;
    else if (interaction.user) userId = interaction.user.id;
    else {
        await FollowupMessage(interaction.token, {
            content: "Could not find who ran the command!",
        });
        return NextResponse.json(
            { success: false, error: "Could not find who ran the command" },
            { status: 400 }
        )
    }
    if (userId != IsleofDucks.staticIDs.Jforjo) {
        await FollowupMessage(interaction.token, {
            content: `Only <@${IsleofDucks.staticIDs.Jforjo}> can use this command!`,
        });
        return NextResponse.json(
            { success: false, error: "You lack the permission to run this command" },
            { status: 403 }
        )
    }

    const name = "partyfinder";

    const embed = await CheckEmbedExists(name);
    if (embed) {
        await FollowupMessage(interaction.token, {
            content: "Embed already exists!",
        });
        return NextResponse.json(
            { success: false, error: "Embed already exists" },
            { status: 400 }
        )
    }

    await CreateEmbedData(
        name,
        embeds[name].content,
        embeds[name].data,
        embeds[name].components
    );

    await FollowupMessage(interaction.token, {
        content: "Done!",
    });
    return NextResponse.json(
        { success: true },
        { status: 200 }
    )
}
export const CommandData: RESTPatchAPIApplicationCommandJSONBody = {
    name: "insertembed",
    description: "Inserts an embed into the database.",
    type: ApplicationCommandType.ChatInput,
    default_member_permissions: "0",
}

const roles = IsleofDucks.roles.reaction.partyping.reduce((acc: Record<string, { role: string; name: string; id: string; }>, role) => {
    acc[role.emoji.name] = {
        role: role.id,
        name: role.emoji.name,
        id: role.emoji.id,
    };
    return acc;
}, {});

const embeds = {
    partyfinder: {
        content: null,
        data: JSON.stringify({
            embeds: [
                {
                    title: "Party Ping Roles 🌎",
                    description: "Click on the buttons for parties you would like notifications for!",
                    color: 16741120,
                    image: {
                        url: "https://media.discordapp.net/attachments/997909150610763900/1340469058264629389/title-_ISLE_OF_DUCKS_-871x37_3.png?ex=68155918&is=68140798&hm=e7f91559b4ad96964c038cadfe9df1c20efd60f9e2c73c17b41c7146e1fa792c&=&format=webp&quality=lossless"
                    },
                    fields: [
                        {
                            name: "Global Party Finder",
                            value: "*What is global party finder?*\nWe manage a server called Guilds Alliance, where top Skyblock guilds collaborate and create valuable connections. SBU's developer, minemort, created a system where we could host/join parties for various activities in skyblock and chat across different Discord servers."
                        },
                        {
                            name: "How to create a party",
                            value: "Members can use commands in <#1054312132365275197> with <@1357548227741749359>, such as:\n`/floor 7 description:Looking for tank!\n/kuudra 5 applications:Enabled\n/view_parties to see active parties.\nAnd more! Use /help for a full list.`\nIf you would like to join a party, click on the embed!"
                        }
                    ]
                },
                {
                    title: "Dungeon Floor Ping Roles <:skull1:1087569775292579851>",
                    color: 12403455,
                    image: {
                        url: "https://media.discordapp.net/attachments/997909150610763900/1340469331670339696/title-_ISLE_OF_DUCKS_-871x37_4.png?ex=68155959&is=681407d9&hm=b8a47ce355a4e5ba57a31bec606024e847d9ca497f3850f0e750b434eeea2b4e&=&format=webp&quality=lossless"
                    },
                    fields: [
                        {
                            name: "Notifications for F1-F7 parties!",
                            value: [
                                `<:${roles.f1.name}:${roles.f1.id}:> - <@&${roles.f1.role}>`,
                                `<:${roles.f2.name}:${roles.f2.id}:> - <@&${roles.f2.role}>`,
                                `<:${roles.f3.name}:${roles.f3.id}:> - <@&${roles.f3.role}>`,
                                `<:${roles.f4.name}:${roles.f4.id}:> - <@&${roles.f4.role}>`,
                                `<:${roles.f5.name}:${roles.f5.id}:> - <@&${roles.f5.role}>`,
                                `<:${roles.f6.name}:${roles.f6.id}:> - <@&${roles.f6.role}>`,
                                `<:${roles.f7.name}:${roles.f7.id}:> - <@&${roles.f7.role}>`
                            ].join("\n")
                        }
                    ]
                },
                {
                    title: "Mastermode Floor Ping Roles <:mastermode:1087569150081249300>",
                    color: 16741120,
                    image: {
                        url: "https://media.discordapp.net/attachments/997909150610763900/1340469058264629389/title-_ISLE_OF_DUCKS_-871x37_3.png?ex=68155918&is=68140798&hm=e7f91559b4ad96964c038cadfe9df1c20efd60f9e2c73c17b41c7146e1fa792c&=&format=webp&quality=lossless"
                    },
                    fields: [
                        {
                            name: "Notifications for M1-M7 parties!",
                            value: [
                                `<:${roles.m1.name}:${roles.m1.id}:> - <@&${roles.m1.role}>`,
                                `<:${roles.m2.name}:${roles.m2.id}:> - <@&${roles.m2.role}>`,
                                `<:${roles.m3.name}:${roles.m3.id}:> - <@&${roles.m3.role}>`,
                                `<:${roles.m4.name}:${roles.m4.id}:> - <@&${roles.m4.role}>`,
                                `<:${roles.m5.name}:${roles.m5.id}:> - <@&${roles.m5.role}>`,
                                `<:${roles.m6.name}:${roles.m6.id}:> - <@&${roles.m6.role}>`,
                                `<:${roles.m7.name}:${roles.m7.id}:> - <@&${roles.m7.role}>`
                            ].join("\n")
                        }
                    ]
                },
                {
                    title: "Kuudra Ping Roles <:kuudra:1119812565275517019>",
                    color: 12403455,
                    image: {
                        url: "https://media.discordapp.net/attachments/997909150610763900/1340469331670339696/title-_ISLE_OF_DUCKS_-871x37_4.png?ex=68155959&is=681407d9&hm=b8a47ce355a4e5ba57a31bec606024e847d9ca497f3850f0e750b434eeea2b4e&=&format=webp&quality=lossless"
                    },
                    fields: [
                        {
                            name: "Notifications for kuudra parties!",
                            value: [
                                `<:${roles.basic.name}:${roles.basic.id}:> - <@&${roles.basic.role}>`,
                                `<:${roles.hot.name}:${roles.hot.id}:> - <@&${roles.hot.role}>`,
                                `<:${roles.burning.name}:${roles.burning.id}:> - <@&${roles.burning.role}>`,
                                `<:${roles.fiery.name}:${roles.fiery.id}:> - <@&${roles.fiery.role}>`,
                                `<:${roles.infernal.name}:${roles.infernal.id}:> - <@&${roles.infernal.role}>`
                            ].join("\n")
                        }
                    ]
                },
                {
                    title: "Fishing Ping Roles <:fishing:1367681771738497237>",
                    color: 16741120,
                    image: {
                        url: "https://media.discordapp.net/attachments/997909150610763900/1340469058264629389/title-_ISLE_OF_DUCKS_-871x37_3.png?ex=68155918&is=68140798&hm=e7f91559b4ad96964c038cadfe9df1c20efd60f9e2c73c17b41c7146e1fa792c&=&format=webp&quality=lossless"
                    },
                    fields: [
                        {
                            name: "Notifications for fishing parties!",
                            value: [
                                `<:${roles.emperorskull.name}:${roles.emperorskull.id}:> - <@&${roles.emperorskull.role}>`,
                                `<:${roles.lava.name}:${roles.lava.id}:> - <@&${roles.lava.role}>`,
                                `<:${roles.megalodon.name}:${roles.megalodon.id}:> - <@&${roles.megalodon.role}>`
                            ].join("\n")
                        }
                    ]
                },
                {
                    title: "Miscellaneous Ping Roles <:hyperion:1367683086929629215>",
                    color: 12403455,
                    image: {
                        url: "https://media.discordapp.net/attachments/997909150610763900/1340469331670339696/title-_ISLE_OF_DUCKS_-871x37_4.png?ex=68155959&is=681407d9&hm=b8a47ce355a4e5ba57a31bec606024e847d9ca497f3850f0e750b434eeea2b4e&=&format=webp&quality=lossless"
                    },
                    fields: [
                        {
                            name: "Notifications for other parties!",
                            value: [
                                `<:${roles.diana.name}:${roles.diana.id}:> - <@&${roles.diana.role}>`,
                                `<:${roles.edrag.name}:${roles.edrag.id}:> - <@&${roles.edrag.role}>`,
                                `<:${roles.bestiary.name}:${roles.bestiary.id}:> - <@&${roles.bestiary.role}>`,
                                `<:${roles.mineshaft.name}:${roles.mineshaft.id}:> - <@&${roles.mineshaft.role}>`,
                                `<:${roles.other.name}:${roles.other.id}:> - <@&${roles.other.role}>`
                            ].join("\n")
                        }
                    ]
                }
            ]
        }),
        components: JSON.stringify(arrayChunks(IsleofDucks.roles.reaction.partyping, 5).slice(0, 5).map(row => ({
            type: ComponentType.ActionRow,
            components: row.map(role => ({
                custom_id: `reaction-partyping-${role.id}`,
                type: ComponentType.Button,
                style: ButtonStyle.Secondary,
                emoji: {
                    name: role.emoji.name,
                    id: role.emoji.id
                }
            }))
        }))),
    },
    partyfinder1: {
        content: null,
        data: null,
        components: JSON.stringify(arrayChunks(IsleofDucks.roles.reaction.partyping, 5).slice(5, 10).map(row => ({
            type: ComponentType.ActionRow,
            components: row.map(role => ({
                custom_id: `reaction-partyping-${role.id}`,
                type: ComponentType.Button,
                style: ButtonStyle.Secondary,
                emoji: {
                    name: role.emoji.name,
                    id: role.emoji.id
                }
            }))
        }))),
    }
}
