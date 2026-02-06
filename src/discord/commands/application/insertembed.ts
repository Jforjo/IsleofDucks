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

    const name = "info";

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
    info: {
        content: null,
        data: JSON.stringify({
            embeds: [
                {
                    title: "˗ˏˋ 🦆 ˎˊ˗  ISLE OF DUCKS DISCORD  ˗ˏˋ 🦆 ˎˊ˗",
                    description: "Welcome to Isle of Ducks! We are a community of Hypixel SkyBlock players who support and help one another. We regularly host giveaways, events, manage our guilds, offer services, and more. Make sure you read our <#823061630300192790> and verify for full server access here <#1287099048796356608>!",
                    color: 16741120,
                    image: {
                        url: "https://media.discordapp.net/attachments/997909150610763900/1340469058264629389/title-_ISLE_OF_DUCKS_-871x37_3.png?ex=6857ecd8&is=68569b58&hm=e16f0749b9b10b4a0966e97cad45a52d0452c065440058ba878adae6c03e85ae&=&format=webp&quality=lossless"
                    },
                    thumbnail: {
                        url: "https://media.discordapp.net/attachments/997909150610763900/1320123627307401266/6383229_baby_cartoon_cute_duck_icon.png?ex=6857bcaf&is=68566b2f&hm=4a05bcee7689894f822af591e1bb07e4fd6f7c0f633f7874dda8b707e7599c35&=&format=webp&quality=lossless"
                    }
                },
                {
                    title: "OUR GUILDS  ˗ˏˋ ⚔️ ˎˊ˗",
                    description: "Isle of Ducks is consistently ranked as a top 20 SkyBlock guild, bringing together some of the best players in the game. Our mission is to foster a friendly community of players from all areas of SkyBlock, primarily focusing on game progression and advancing levels. For lower-level players, we offer a supportive entry point through our baby guild, Isle of Ducklings.",
                    color: 12403455,
                    image: {
                        url: "https://media.discordapp.net/attachments/997909150610763900/1340469331670339696/title-_ISLE_OF_DUCKS_-871x37_4.png?ex=6857ed19&is=68569b99&hm=6625deb1415cd54ea4500a5575fb1656111b64f348c21fd1ab0842ee78b4d3a3&=&format=webp&quality=lossless"
                    },
                    thumbnail: {
                        url: "https://media.discordapp.net/attachments/997909150610763900/1340470711520596059/2191214_attack_game_gaming_multimedia_play_icon.png?ex=6857ee62&is=68569ce2&hm=be551379738ee9a8399adf993ab93b12ec0de28714fdf28793972c8733e91df4&=&format=webp&quality=lossless"
                    },
                    fields: [
                        {
                            name: "Isle of Ducks",
                            value: "▫️Level 320+"
                        },
                        {
                            name: "Isle of Ducklings",
                            value: "▫️Level 240+"
                        },
                        {
                            name: '\u200b',
                            value: "More info and applications here <#1320463957273739274>!"
                        }
                    ]
                },
                {
                    title: "GIVEAWAYS  ˗ˏˋ🎁 ˎˊ˗",
                    description: "We love giving back to our community by hosting exciting giveaways for SkyBlock coins and prizes!",
                    color: 16741120,
                    image: {
                        url: "https://media.discordapp.net/attachments/997909150610763900/1340469058264629389/title-_ISLE_OF_DUCKS_-871x37_3.png?ex=6857ecd8&is=68569b58&hm=e16f0749b9b10b4a0966e97cad45a52d0452c065440058ba878adae6c03e85ae&=&format=webp&quality=lossless"
                    },
                    thumbnail: {
                        url: "https://media.discordapp.net/attachments/997909150610763900/1340477358699712592/5443031_box_christmas_gift_present_xmas_icon.png?ex=6857f493&is=6856a313&hm=52b40fa18c3a74ffdb430ecf75e2031da739f95b340f5368b38c8e7f97f0bb92&=&format=webp&quality=lossless"
                    },
                    fields: [
                        {
                            name: "Regular Giveaways",
                            value: "> <#882151291340611605> These are giveaways open to all verified server members. They are normally our big ticket giveaways!"
                        },
                        {
                            name: "Requirement Giveaways",
                            value: "> <#980520250766426142> These are normally exclusive to guild members, but can also be for certain activity ranks, nitro boosters, partnerships, and more!"
                        },
                        {
                            name: "Flash Giveaways",
                            value: "> <#1066461763266154537> These giveaways last less than 24 hours and typically have smaller prizes, but participants have better odds of winning because there are fewer entries."
                        },
                        {
                            name: "Donor Roles 🎀",
                            value: "Roles and perks can be found [here](https://discord.com/channels/823061629812867113/843010913158299669/1368484625839816796)."
                        },
                        {
                            name: '\u200b',
                            value: "Sponsor or claim a giveaway here <#1330207810872676403>!"
                        }
                    ]
                },
                {
                    title: "EVENTS  ˗ˏˋ 🏆 ˎˊ˗",
                    description: "Our server hosts exciting events with valuable prizes, giving players a chance to compete, have fun, and win rewards!",
                    color: 12403455,
                    image: {
                        url: "https://media.discordapp.net/attachments/997909150610763900/1340469331670339696/title-_ISLE_OF_DUCKS_-871x37_4.png?ex=6857ed19&is=68569b99&hm=6625deb1415cd54ea4500a5575fb1656111b64f348c21fd1ab0842ee78b4d3a3&=&format=webp&quality=lossless"
                    },
                    thumbnail: {
                        url: "https://media.discordapp.net/attachments/997909150610763900/1340483600100884550/4579061_marketing_outline_trophy_winner_icon.png?ex=6857fa63&is=6856a8e3&hm=feb04c3b1ace1bf0c103998ff0b65d8c124d879180c3822c9003256c0bfaea4f&=&format=webp&quality=lossless"
                    },
                    fields: [
                        {
                            name: "Types of Events",
                            value: "▫️`SkyBlock` - Grinding certain areas of the game, including skills, dungeons, collections, and more. Our guilds have unique SkyBlock Superlative competitions every month.\n▫️`Hypixel games` - Contests outside of SkyBlock, such as PvP gamemodes. We also collaborate with partnered servers and other guilds.\n▫️`Creative corner` - Making art, edits, and emotes."
                        }
                    ]
                },
                {
                    title: "ROLES  ˗ˏˋ 📢 ˎˊ˗",
                    description: "Our server offers a variety of roles, including reaction roles, auto-assigned roles, and roles that must be earned. You can find information about all our server roles here <#843010913158299669>.",
                    color: 16741120,
                    image: {
                        url: "https://media.discordapp.net/attachments/997909150610763900/1340469058264629389/title-_ISLE_OF_DUCKS_-871x37_3.png?ex=6857ecd8&is=68569b58&hm=e16f0749b9b10b4a0966e97cad45a52d0452c065440058ba878adae6c03e85ae&=&format=webp&quality=lossless"
                    },
                    thumbnail: {
                        url: "https://media.discordapp.net/attachments/997909150610763900/1340803649450016989/4313120_chat_communication_conversation_message_speech_icon_1.png?ex=6857d2f4&is=68568174&hm=486c45c6af590d17c892c6e56d77fe9e1acd75a06abb949baf512dea972ba8ae&=&format=webp&quality=lossless"
                    },
                    fields: [
                        {
                            name: "Reaction Roles",
                            value: "These are selected upon onboarding, but can be edited [here](https://discord.com/channels/823061629812867113/843010913158299669/1368484625839816796). You can also discover <#1367849368459153470>, used to create parties for dungeons, kuudra, diana, fishing, and more!"
                        },
                        {
                            name: "Auto-roles",
                            value: "Only Hypxiel-linked members gain full server access with <@1287098228067664004> by verifying with <@684986294459564042>\nGuild  members will automatically be assigned:\n▫️<@&933258162931400764>\n▫️<@&998380474407846000>"
                        }
                    ]
                }
            ],
        }),
        components: undefined,
        attachments: undefined
    },
    info2: {
        content: null,
        data: JSON.stringify({
            embeds: [
                {
                    title: "CARRY SERVICES  ˗ˏˋ 🏹 ˎˊ˗",
                    description: "Our carry services are here to assist you with completions and XP in dungeons, slayers, and Kuudra! <#1004139630792298606>",
                    color: 12403455,
                    image: {
                        url: "https://media.discordapp.net/attachments/997909150610763900/1340469331670339696/title-_ISLE_OF_DUCKS_-871x37_4.png?ex=6857ed19&is=68569b99&hm=6625deb1415cd54ea4500a5575fb1656111b64f348c21fd1ab0842ee78b4d3a3&=&format=webp&quality=lossless"
                    },
                    thumbnail: {
                        url: "https://media.discordapp.net/attachments/997909150610763900/1340814151286657168/7585315_adventure_journey_bow_arrow_icon.png?ex=6857dcbc&is=68568b3c&hm=5b99d8e7a166489245d9d63e0704cd36defccc54c6cc2c91a695a9885d7355ad&=&format=webp&quality=lossless"
                    },
                    fields: [
                        {
                            name: "Buying Carries",
                            value: "You can purchase carries by creating a ticket here:\n<#1429428088751521832>"
                        },
                        {
                            name: "Apply for Carrier",
                            value: "To apply to become a carrier, you must fulfil the requirements listed in <#1424099154472472739> and gather screenshots prior to opening a ticket."
                        }
                    ]
                },
                {
                    title: "PARTNERSHIPS  ˗ˏˋ 🤝 ˎˊ˗",
                    description: "We provide valuable resources to support your SkyBlock journey and believe every server has something unique to offer! We partner with other Discord servers to connect you with communities we endorse and collaborate to host exciting events. If you'd like to partner with us, here are the criteria you must meet:",
                    color: 16741120,
                    image: {
                        url: "https://media.discordapp.net/attachments/997909150610763900/1340469058264629389/title-_ISLE_OF_DUCKS_-871x37_3.png?ex=6857ecd8&is=68569b58&hm=e16f0749b9b10b4a0966e97cad45a52d0452c065440058ba878adae6c03e85ae&=&format=webp&quality=lossless"
                    },
                    thumbnail: {
                        url: "https://media.discordapp.net/attachments/997909150610763900/1340817569745076245/9151145_handshake_congratulations_congrats_collaboration_partnership_icon.png?ex=6857dfeb&is=68568e6b&hm=df1521c2b87dd886c63e722eeb93a2713a79a4a22a48549a8ab2adf6412e7c8d&=&format=webp&quality=lossless"
                    },
                    fields: [
                        {
                            name: '\u200b',
                            value: "▫️Must be related to Hypixel SkyBlock\n▫️The server members/staff must be friendly\n▫️Must have at least 1000 members\n▫️The rules must follow Discord/Hypixel TOS\n▫️Must be an active and established server, and it cannot be a rebrand or revive situation\n▫️A representative must remain in the server for the partnership to continue\n\n> Upon applying for a partnership, please explain why you think your community is different than others, what we will both gain from this, and what event ideas you have in mind for us to collaborate in the future.\n\n*Please note, meeting all requirements does not guarantee a partnership. We review your server, and then decide whether or not you qualify.*"
                        }
                    ]
                },
                {
                    title: "MODS  ˗ˏˋ 📁 ˎˊ˗",
                    description: "This lists the different mods available for SkyBlock and their Discord/website where you can download them safely.\n        ⚠️ Pay attention to the files you use on your computer and be aware of [account stealing](https://hypixel.net/threads/all-about-skyblock-account-stealing-part-ii.5231557/).",
                    color: 12403455,
                    image: {
                        url: "https://media.discordapp.net/attachments/997909150610763900/1340469331670339696/title-_ISLE_OF_DUCKS_-871x37_4.png?ex=6857ed19&is=68569b99&hm=6625deb1415cd54ea4500a5575fb1656111b64f348c21fd1ab0842ee78b4d3a3&=&format=webp&quality=lossless"
                    },
                    thumbnail: {
                        url: "https://media.discordapp.net/attachments/997909150610763900/1340823450222333952/5355689_archive_data_document_file_file_format_icon.png?ex=6857e565&is=685693e5&hm=e7431e08c34959888c935f4cf5f18b02feb380a25f1a495f7a76900c007e3241&=&format=webp&quality=lossless"
                    },
                    fields: [
                        {
                            name: "Clients",
                            value: "Built-in SkyBlock mods:\n> [Badlion Client](https://client.badlion.net/)\n> [Lunar Client](https://www.lunarclient.com/)\nAdd your own mods:\n> [Essential](https://essential.gg/)"
                        },
                        {
                            name: "1.21.10 SkyBlock/QOL Mods:",
                            value: "> [SkyBlocker](https://modrinth.com/mod/skyblocker-liap)\n> [SkyBlock Overhaul (SBO)](https://modrinth.com/mod/skyblock-overhaul)\n> [SkyBlock Profile Viewer](https://modrinth.com/mod/skyblock-profile-viewer)\n> [SkyHanni](https://modrinth.com/mod/skyhanni) ([Discord](https://discord.com/invite/skyhanni-997079228510117908))\n> [SkyOcean](https://modrinth.com/mod/skyocean)\n> [Odin](https://modrinth.com/mod/odin) ([Discord](https://discord.gg/2nCbC9hkxT))\n> [Bazaar Utils](https://modrinth.com/mod/bazaar-utils/versions?g=1.21.10)\n> [Aaron's Mod](https://modrinth.com/mod/aaron-mod)\n> [DulkirMod](https://modrinth.com/mod/dulkirmod-fabric) ([Discord](https://discord.gg/SesTMWhBsW))\n> [More Chat History](https://modrinth.com/mod/morechathistory)\n> [Gamme Utils](https://modrinth.com/mod/gamma-utils)\n> [Mod Menu](https://modrinth.com/mod/modmenu)\n> [Zoomify](https://modrinth.com/mod/zoomify)\n> [Scrollable Tooltips](https://modrinth.com/mod/sk1er-scrollable-tooltips)\n> [Chat Patches](https://modrinth.com/mod/chatpatches)"
                        },
                        {
                            name: "Dependencies (Things that other mods require):",
                            value: "> [Fabric API](https://modrinth.com/mod/fabric-api)\n> [Fabric Language Koitlin](https://modrinth.com/mod/fabric-language-kotlin)\n> [Collective](https://modrinth.com/mod/collective)\n> [Cloth Config](https://modrinth.com/mod/cloth-config)\n> [YetAnotherConfigLib (YACL)](https://modrinth.com/mod/yacl)\n> [Text Placeholder API](https://modrinth.com/mod/placeholder-api)\n> [Architectury API](https://modrinth.com/mod/architectury-api)"
                        },
                        {
                            name: "Performance Mods:",
                            value: "> [Sodium](https://modrinth.com/mod/sodium)\n> [Sodium Extra](https://modrinth.com/mod/sodium-extra)\n> [FerriteCore](https://modrinth.com/mod/ferrite-core)\n> [Lithium](https://modrinth.com/mod/lithium)\n> [ImmediatelyFast](https://modrinth.com/mod/immediatelyfast)\n> [Entity Culling](https://modrinth.com/mod/entityculling)\n> [More Culling](https://modrinth.com/mod/moreculling)\n> [BadOptimisations](https://modrinth.com/mod/badoptimizations)\n> [Concurrent Chunk Management Engine (C2ME)](https://modrinth.com/mod/c2me-fabric)\n> [Particle Core](https://modrinth.com/mod/particle-core)\n> [ModernFix-mVUS](https://modrinth.com/mod/modernfix-mvus)\n> [Better Block Entities](https://modrinth.com/mod/better-block-entities)\n> [Ixeris](https://modrinth.com/mod/ixeris)\n> [Nvidium](https://modrinth.com/mod/nvidium) (**NVIDIA GPUs Only**)"
                        }
                    ]
                }
            ],
        }),
        components: undefined,
        attachments: undefined
    }
}
