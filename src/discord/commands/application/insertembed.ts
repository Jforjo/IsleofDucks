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

    const name = "carrierpolicy";

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
        embeds[name].components,
        embeds[name].attachments
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

// const roles = IsleofDucks.roles.reaction.partyping.reduce((acc: Record<string, { role: string; name: string; id: string; }>, role) => {
//     acc[role.emoji.name] = {
//         role: role.role,
//         name: role.emoji.name,
//         id: role.emoji.id,
//     };
//     return acc;
// }, {});

const embeds = {
    roleinfo: {
        content: null,
        data: JSON.stringify({
            embeds: [
                {
                    title: "Server Role Information and Reaction Roles",
                    description: "We provide a variety of server roles, including earnable roles, guild roles, donor roles, carrier roles, and reaction roles for ping notifications. This guide will show you how to unlock them!",
                    color: 16741120,
                    image: {
                        url: "https://media.discordapp.net/attachments/997909150610763900/1368312766925897769/title-_Role_Information_-871x37.png?ex=6817c411&is=68167291&hm=bbeb2b4a3f3c88a662f7d114065468c3361aef42e2da510f9fc30c6077fdb52e&=&format=webp&quality=lossless"
                    }
                },
                {
                    title: "Donator Roles",
                    description: "These roles can be obtained by hosting giveaways or events!",
                    color: 12403455,
                    fields: [
                        {
                            name: "Values and Perks",
                            value: "<@&1368319830025048224> [1B+ Donation] - Custom rank name/color/icon, bridge access, 3x gw entries\n<@&1368319005051322489> [500M+ Donation] - Custom rank name/color/icon, 2x gw entries\n<@&982001040142528512> [100M+ Donation] - Custom rank name/color\n<@&823071806835523624> [50M Donation]\n<@&823071749137629265> [10M Donation]"
                        }
                    ],
                    image: {
                        url: "https://media.discordapp.net/attachments/997909150610763900/1368347752374730933/title-_Donor_Roles_-871x37.png?ex=6817e4a6&is=68169326&hm=1c49262bac64a2e9938dc10db3fcecf63f82dad34c148fa2536a1d2af9ae632b&=&format=webp&quality=lossless"
                    }
                },
                {
                    title: "Guild Roles",
                    description: "Guild-specific roles for Duck and Duckling members. They are synced by verification with <@684986294459564042> \n<@&933258162931400764> - Isle of Ducks member\n<@&998380474407846000> - Isle of Ducklings member\n<@&1276013765405704266> - [See more](https://discord.com/channels/823061629812867113/1320463957273739274/1328077452974493768)",
                    color: 16741120,
                    fields: [
                        {
                            name: "Level Roles",
                            value: "Auto-synced cosmetic SkyBlock level roles:\n<@&1328090605481627698>\n<@&1328090513793880234>\n<@&1328090470974230680>\n<@&1328090385909809173>\n<@&1328090310470795335>\n<@&1328090223221149786>\n<@&1328089436894007506>"
                        }
                    ],
                    image: {
                        url: "https://media.discordapp.net/attachments/997909150610763900/1368329676891881472/title-_Guild_Roles_-871x37_1.png?ex=6817d3d1&is=68168251&hm=b7d7639d54889e2a0b86b1ea03150e9c563e5034442de53e20c7ceebd7659f60&=&format=webp&quality=lossless"
                    }
                },
                {
                    title: "Carrier Roles",
                    description: "Apply to become a carrier here, after fulfilling requirements <#1004135601534152755>",
                    color: 12403455,
                    fields: [
                        {
                            name: "Dungeon Carrier Roles",
                            value: "<@&1004131288023830638>\n<@&1004131419553005710>\n<@&1004131451077406750>\n<@&1004131476650070036>\n<@&1004131503640420424>\n<@&1004131520656707686>\n<@&1004131539539468369>\n<@&1004131565124730991>\n<@&1004131581696422109>\n<@&1004131601971675246>"
                        },
                        {
                            name: "Slayer Carrier Roles",
                            value: "<@&1004131669487403078>\n<@&1004131737795833936>\n<@&1004131758616367225>\n<@&1004131780682596352>\n<@&1004131845266493500>\n<@&1004131871774494842>\n<@&1004131911263854713>"
                        },
                        {
                            name: "Kuudra Carrier Roles",
                            value: "<@&1119807379903623258>\n<@&1119807706841235496>\n<@&1119807771458670654>"
                        }
                    ],
                    image: {
                        url: "https://media.discordapp.net/attachments/997909150610763900/1368347769416188015/title-_Carrier_Roles_-871x37.png?ex=6817e4aa&is=6816932a&hm=8e7af934e294ec710e43ddaf489a04b15204771f9b659b7b4d760af795a1fa98&=&format=webp&quality=lossless"
                    }
                },
                {
                    title: "Activity Roles",
                    description: "You can level up by chatting, vcing with people or inviting people to the server.\n\nYou gain:\n▫️10xp per message\n▫️5xp every minute in vc\nSpamming or message splitting you will get <@&985708515484114966> for 1 week (Blocked from gaining xp and participating in giveaways)",
                    color: 16741120,
                    fields: [
                        {
                            name: "Leveling",
                            value: "Auto-synced cosmetic SkyBlock level roles:\n<@&983211131894128640> - Level 5 - Gain access to <#993685988582895677>\n<@&983211898868752445> - Level 10\n<@&983212247142785074> - Level 15\n<@&983212181501919243> - Level 20\n<@&983212199747133470> - Level 25 - 2x giveaway entries\n<@&983212798072995852> - Level 30\n<@&983212803705933854> - Level 35\n<@&983212794008711188> - Level 40\n<@&983215827111264256> - Level 45\n<@&983215795884683304> - Level 50+"
                        }
                    ],
                    image: {
                        url: "https://media.discordapp.net/attachments/997909150610763900/1368347392331481149/title-_Activity_Roles_-871x37.png?ex=6817e450&is=681692d0&hm=65c90dd4d17d503579fb556364cac8fa8a24f1d8b7d238bde68902a102881cc5&=&format=webp&quality=lossless"
                    }
                },
                {
                    title: "Miscellaneous Roles",
                    color: 12403455,
                    fields: [
                        {
                            name: "Nitro Boosters",
                            value: "<@&881421446017056799> receive:\n▫️Special <:boost:982021740932780072> icon\n▫️Role is displayed separately from other members\n▫️2x default giveaway entries\n▫️Bypass some giveaway requirements\n\n<@&993257342848213126> receive:\n▫️Special <:nitrodiamond:993267599376912496> icon\n▫️3x default giveaway entries"
                        },
                        {
                            name: "Other",
                            value: "<@&960351169094516827> - Representative of a partnered Discord server listed in <#960326317230915636>. To apply, review our partnership requirements in <#833548595826917396> and create a support ticket.\n<@&980349849876717579> - Alchemy 50 and brews potions for Bingo god splashes. Create a ticket to apply."
                        }
                    ],
                    image: {
                        url: "https://media.discordapp.net/attachments/997909150610763900/1368347794175426643/title-_Other_Roles_-871x37.png?ex=6817e4b0&is=68169330&hm=5ae85c2e4e01c6ce86f63350faadf01099aee620221e77745c067479b7eef66b&=&format=webp&quality=lossless"
                    }
                },
                {
                    title: "Reaction Roles",
                    description: "Click the buttons for ping notification roles!",
                    color: 16741120,
                    fields: [
                        {
                            name: "Notifications",
                            value: [
                                "<:announcement:1368346213459427389> <@&908496520809160805>",
                                "<:giveaway:1368346244275114046> <@&882144884428013578>",
                                "<:event:1368346864461811864> <@&912107961164369971>",
                                "<:splash:1048865701068292136> <@&927088424408735764>",
                                "<:partner:1368347024084176926> <@&960328108462997534>",
                                "<:chat:1368347056288043059> <@&988892995329863710>"
                            ].join("\n")
                        }
                    ],
                    image: {
                        url: "https://media.discordapp.net/attachments/997909150610763900/1368347367006277723/title-_Reaction_Roles_-871x37.png?ex=6817e44a&is=681692ca&hm=ff79b70e9847ca5541b25218c30d15d79845974c8233b4766f45795ad5c57378&=&format=webp&quality=lossless"
                    }
                }
            ],
            attachments: [
                {
                    id: 0
                }
            ]
        }),
        components: JSON.stringify(arrayChunks(IsleofDucks.roles.reaction.general, 5).slice(0, 5).map(row => ({
            type: ComponentType.ActionRow,
            components: row.map(role => ({
                custom_id: `reaction-general-${role.id}`,
                type: ComponentType.Button,
                style: ButtonStyle.Secondary,
                emoji: {
                    name: role.emoji.name,
                    id: role.emoji.id
                }
            }))
        }))),
        attachments: JSON.stringify([
            {
                id: 0,
                filename: 'title.png',
                url: "https://cdn.discordapp.com/attachments/1300979867881312347/1368349716655640596/68169435441da.png?ex=6817e67b&is=681694fb&hm=58a52baefb5549c71b203969a7ed5571a42e7f65825150a54d781dd915b60ada&"
            }
        ])
    },
    carrierpolicy: {
        content: null,
        data: JSON.stringify({
            embeds: [
                {
                    title: "Service Information",
                    description: "We offer carry services to help players complete dungeon runs, slayer bosses, and Kuudra. Whether you’re aiming for completions, XP, or level requirements, our team is here to ensure you succeed.\n\n### Our Terms of Service:",
                    color: 16741120,
                    image: {
                        url: "https://media.discordapp.net/attachments/997909150610763900/1403881577108475914/title-Carry_Services_-871x37.png?ex=68992a1a&is=6897d89a&hm=1d10d4aebff5b8d158d11b11ae11cdc82114ee03d621a8cd3f2d7c2f2f713b1e&=&format=webp&quality=lossless"
                    },
                    thumbnail: {
                        url: "https://media.discordapp.net/attachments/997909150610763900/1320132348041236572/2191214_attack_game_gaming_multimedia_play_icon.png?ex=6899070e&is=6897b58e&hm=ac702036e41e5a6bdef6e0257eb5c87029f0d57c639fa32a49a2d64e18806a2b&=&format=webp&quality=lossless"
                    },
                    fields: [
                        {
                            name: "Payment Policy",
                            value: "▫️All carries must be paid upfront to prevent scamming.\n▫️The order limit is 20M at a time for security reasons.\n▫️If you believe a carrier scammed you, provide evidence so we can investigate and decide on a refund. "
                        },
                        {
                            name: "Carrier Rules",
                            value: "▫️Scamming a client will get you permanently banned.\n▫️You are responsible for explaining to your client what to do and what items to have prepared before starting.\n▫️If you fail the carry, you are obligated to do it again unless the client is the reason you failed."
                        },
                        {
                            name: "Buyer Rules",
                            value: "▫️Scamming a carrier will get you permanently banned.\n▫️Treat carriers respectfully, and be patient if ticket responses take time.\n▫️Creating troll tickets will result in punishment.\n▫️Listen to your carrier’s guidance on surviving dungeons and slayer bosses. If you are not properly prepared for the carries and fail the runs or bosses then they are not obligated to refund you or continue to help."
                        }
                    ]
                },
                {
                    title: "Become a Carrier",
                    description: "Want to join the carry service team? Help players defeat dungeons and slayer bosses while earning rewards for your time and skill. Apply once you meet the following requirements!",
                    color: 12403455,
                    image: {
                        url: "https://media.discordapp.net/attachments/997909150610763900/1403881617587441794/title-Carry_Services_-871x37_1.png?ex=68992a24&is=6897d8a4&hm=9db10b0820f64d6ba90b7e805dd205003264fa96d6bfaaed4ff04aac5ef25563&=&format=webp&quality=lossless"
                    },
                    thumbnail: {
                        url: "https://media.discordapp.net/attachments/997909150610763900/1340814151286657168/7585315_adventure_journey_bow_arrow_icon.png?ex=68991efc&is=6897cd7c&hm=1a87b9f0342a18deb50b571de1335f7c1a58b083a5fc4e94dbfe3eb3eb2a106d&=&format=webp&quality=lossless"
                    },
                    fields: [
                        {
                            name: "Dungeon Carrier Requirements",
                            value: "<:f1:993373840744914994> <@1004131288023830638> 100+ F4 completions\n<:f5:993374590342529024> <@1004131419553005710> 200+ F6 completions and Cata 30+\n<:f7:993374993088008212> <@1004131451077406750> 300+ F7 completions, a solo/duo completion screenshot and Cata 35+"
                        },
                        {
                            name: "Mastermode Carrier Requirements",
                            value: "<:m1:993379795142447124> <@1004131539539468369> 100+ M3 completions and Cata 35+\n<:m4:993380134855905300> <@1004131581696422109> 200+ M6 completions and Cata 40+\n<:m7:993380168632639568> <@1004131601971675246> 300+ M7 completions, a solo/duo completion screenshot and Cata 45+"
                        },
                        {
                            name: "Slayer Carriers Requirements",
                            value: "<:rev5:993695057850925066> <@1004131669487403078> Screenshot of sub 15s T5 kill\n<:tara1:993695654410997770> <@1004131737795833936> Screenshot of sub 35s T5 kill\n<:sven1:993695666213757088> <@1004131758616367225> Screenshot of sub 15s T5 kill\n<:voidgloom1:993695676292681738> <@1004131845266493500> Screenshot of sub 35s T5 kill\n<:inferno1:993695699776569396> <@1004131911263854713> Screenshot of sub 35s T5 kill"
                        },
                        {
                            name: "Kuudra Carriers Requirements",
                            value: "<:kuudra:1119812565275517019> <@1119807379903623258> Screenshot of sub 5min T2 solo/duo completion \n<:kuudra:1119812565275517019> <@1119807771458670654> Screenshot of sub 9min T5 solo/duo completion "
                        }
                    ]
                }
            ],
            attachments: [
                {
                    id: 0
                }
            ]
        }),
        components: JSON.stringify([
            {
                type: 1,
                components: [
                    {
                        type: 3,
                        custom_id: "carrier-apply",
                        options: [
                            {
                                label: "F1-4",
                                description: "Apply to become a Floors 1-4 carrier",
                                value: "f4",
                                emoji: {
                                    name: "f1",
                                    id: "993373840744914994"
                                }
                            },
                            {
                                label: "F6",
                                description: "Apply to become a Floor 6 carrier",
                                value: "f6",
                                emoji: {
                                    name: "f5",
                                    id: "993374590342529024"
                                }
                            },
                            {
                                label: "F7",
                                description: "Apply to become a Floor 7 carrier",
                                value: "f7",
                                emoji: {
                                    name: "f7",
                                    id: "993374993088008212"
                                }
                            },
                            {
                                label: "M1-3",
                                description: "Apply to become a Mastermode 1-3 carrier",
                                value: "m3",
                                emoji: {
                                    name: "m1",
                                    id: "993379795142447124"
                                }
                            },
                            {
                                label: "M4-6",
                                description: "Apply to become a Mastermode 4-6 carrier",
                                value: "m4",
                                emoji: {
                                    name: "m4",
                                    id: "993380134855905300"
                                }
                            },
                            {
                                label: "M7",
                                description: "Apply to become a Mastermode 7 carrier",
                                value: "m7",
                                emoji: {
                                    name: "m7",
                                    id: "993380168632639568"
                                }
                            },
                            {
                                label: "Revenant Carrier",
                                description: "Apply to become a revenant carrier",
                                value: "revenant",
                                emoji: {
                                    name: "rev5",
                                    id: "993695057850925066"
                                }
                            },
                            {
                                label: "Tarantula Carrier",
                                description: "Apply to become a tarantula carrier",
                                value: "tarantula",
                                emoji: {
                                    name: "tara1",
                                    id: "993695654410997770"
                                }
                            },
                            {
                                label: "Sven Carrier",
                                description: "Apply to become a sven carrier",
                                value: "sven",
                                emoji: {
                                    name: "sven1",
                                    id: "993695666213757088"
                                }
                            },
                            {
                                label: "Voidgloom Carrier",
                                description: "Apply to become a voidgloom carrier",
                                value: "voidgloom",
                                emoji: {
                                    name: "voidgloom1",
                                    id: "993695676292681738"
                                }
                            },
                            {
                                label: "Inferno Carrier",
                                description: "Apply to become an inferno carrier",
                                value: "inferno",
                                emoji: {
                                    name: "inferno1",
                                    id: "993695699776569396"
                                }
                            },
                            {
                                label: "T1-2 Kuudra Carrier",
                                description: "Apply to become a T1-2 Kuudra carrier",
                                value: "kuudra2",
                                emoji: {
                                    name: "kuudra",
                                    id: "1119812565275517019"
                                }
                            },
                            {
                                label: "T3-5 Kuudra Carrier",
                                description: "Apply to become a T3-5 Kuudra carrier",
                                value: "kuudra5",
                                emoji: {
                                    name: "kuudra",
                                    id: "1119812565275517019"
                                }
                            }
                        ],
                        placeholder: "Become a carrier ⚔️"
                    }
                ]
            }
        ]),
        attachments: JSON.stringify([
            {
                id: 0,
                filename: 'title.png',
                url: "https://cdn.discordapp.com/attachments/1300979867881312347/1423269281197723798/image.png?ex=68dfb24f&is=68de60cf&hm=2821356b2e0a540ff6a238ac0c73e976b5a95d5348e1e7f3715d03560f7dadce&"
            }
        ])
    }
}
