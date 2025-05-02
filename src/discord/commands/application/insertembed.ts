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
                    title: "Dungeon Floor Ping Roles :skull1:",
                    color: 12403455,
                    image: {
                        url: "https://media.discordapp.net/attachments/997909150610763900/1340469331670339696/title-_ISLE_OF_DUCKS_-871x37_4.png?ex=68155959&is=681407d9&hm=b8a47ce355a4e5ba57a31bec606024e847d9ca497f3850f0e750b434eeea2b4e&=&format=webp&quality=lossless"
                    },
                    fields: [
                        {
                            name: "Notifications for F1-F7 parties!",
                            value: [
                                ":f1: - <@&1367341590904836178>",
                                ":f2: - <@&1367342170289213470>",
                                ":f3: - <@&1367342276560289862>",
                                ":f4: - <@&1367342554336592013>",
                                ":f5: - <@&1367342642861441105>",
                                ":f6: - <@&1367342754463744031>",
                                ":f7: - <@&1367342876953935922>"
                            ].join("\n")
                        }
                    ]
                },
                {
                    title: "Mastermode Floor Ping Roles :mastermode:",
                    color: 16741120,
                    image: {
                        url: "https://media.discordapp.net/attachments/997909150610763900/1340469058264629389/title-_ISLE_OF_DUCKS_-871x37_3.png?ex=68155918&is=68140798&hm=e7f91559b4ad96964c038cadfe9df1c20efd60f9e2c73c17b41c7146e1fa792c&=&format=webp&quality=lossless"
                    },
                    fields: [
                        {
                            name: "Notifications for M1-M7 parties!",
                            value: [
                                ":m1: - <@&1367343091572281436>",
                                ":m2: - <@&1367343201819689053>",
                                ":m3: - <@&1367343199974068236>",
                                ":m4: - <@&1367343204902506607>",
                                ":m5: - <@&1367343203120054353>",
                                ":m6: - <@&1367343197948346398>",
                                ":m7: - <@&1367343195159269396>"
                            ].join("\n")
                        }
                    ]
                },
                {
                    title: "Kuudra Ping Roles :kuudra:",
                    color: 12403455,
                    image: {
                        url: "https://media.discordapp.net/attachments/997909150610763900/1340469331670339696/title-_ISLE_OF_DUCKS_-871x37_4.png?ex=68155959&is=681407d9&hm=b8a47ce355a4e5ba57a31bec606024e847d9ca497f3850f0e750b434eeea2b4e&=&format=webp&quality=lossless"
                    },
                    fields: [
                        {
                            name: "Notifications for kuudra parties!",
                            value: [
                                ":basic: - <@&1085780744128958555>",
                                ":hot: - <@&1085781441121636465>",
                                ":burning: - <@&1085781135537213520>",
                                ":fiery: - <@&1085781531668262952>",
                                ":infernal: - <@&1085781213404479518>"
                            ].join("\n")
                        }
                    ]
                },
                {
                    title: "Fishing Ping Roles :fishing:",
                    color: 16741120,
                    image: {
                        url: "https://media.discordapp.net/attachments/997909150610763900/1340469058264629389/title-_ISLE_OF_DUCKS_-871x37_3.png?ex=68155918&is=68140798&hm=e7f91559b4ad96964c038cadfe9df1c20efd60f9e2c73c17b41c7146e1fa792c&=&format=webp&quality=lossless"
                    },
                    fields: [
                        {
                            name: "Notifications for fishing parties!",
                            value: [
                                ":emperorskull: - <@&1367681222326616215>",
                                ":lava: - <@&1002999878890311771>",
                                ":megalodon: - <@&1002999651584200835>"
                            ].join("\n")
                        }
                    ]
                },
                {
                    title: "Miscellaneous Ping Roles :hyperion:",
                    color: 12403455,
                    image: {
                        url: "https://media.discordapp.net/attachments/997909150610763900/1340469331670339696/title-_ISLE_OF_DUCKS_-871x37_4.png?ex=68155959&is=681407d9&hm=b8a47ce355a4e5ba57a31bec606024e847d9ca497f3850f0e750b434eeea2b4e&=&format=webp&quality=lossless"
                    },
                    fields: [
                        {
                            name: "Notifications for other parties!",
                            value: [
                                ":diana: - <@&1003000369015689306>",
                                ":edrag: - <@&1085781026929918064>",
                                ":bestiary: - <@&1367683516338405499>",
                                ":mineshaft: - <@&1304830215561678848>",
                                ":other: - <@&1367344619079335987>"
                            ].join("\n")
                        }
                    ]
                }
            ]
        }),
        components: JSON.stringify(arrayChunks(IsleofDucks.roles.reaction.partyping, 5).map(row => ({
            type: ComponentType.ActionRow,
            components: row.map(role => ({
                custom_id: `reaction-partyping-${role.id}`,
                type: ComponentType.Button,
                style: ButtonStyle.Secondary,
                emoji: {
                    // name: role.emoji.name,
                    id: role.emoji.id
                }
            }))
        }))),
    }
}
