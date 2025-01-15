import { APIChatInputApplicationCommandInteraction, APIInteractionResponse, ApplicationCommandType, ButtonStyle, ComponentType, InteractionResponseType, RESTPatchAPIApplicationCommandJSONBody } from "discord-api-types/v10";
import { CreateInteractionResponse, FollowupMessage, IsleofDucks, CheckEmbedExists, CreateEmbedData } from "@/discord/discordUtils";
import { NextResponse } from "next/server";

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

    const name = "support";

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

const embeds = {
    guildinfo: {
        content: null,
        data: JSON.stringify({
            embeds: [
                {
                    title: "Isle of Ducks - Guild Information and Applications",
                    description: "Welcome to our [Guild Information](https://hypixel.net/threads/isle-of-ducks-%E2%9C%A7-duck%E2%9C%A7-24-skyblock-guild-late-end-game-active-and-friendly-community-custom-bridge-bot.5760753/) channel!\n\nIsle of Ducks is a top 20 Skyblock guild created on July 10th, 2021, by Ducksicle.",
                    color: 0xff7300,
                    fields: [
                        {
                            name: "About us",
                            value: "Our guild comprises experienced late-end game Skyblock players, and we're eager to grow our beloved community. If you are a high-level player seeking like-minded companions to join you on your Skyblock journey, our guild is the place for you! We are committed to creating an engaging and supportive atmosphere for all our members."
                        },
                        {
                            name: "Our Community Dynamics",
                            value: "As a guild, we frequently do parties together, participate in events, share strategies, and assist each other in tackling challenges. You'll also find a lively chat where you can connect with others, share tips, and enjoy great conversations while playing. Whether you're grinding for resources or coins, competing in dungeons, or aiming to climb the leaderboards, you'll find a team here to support your goals. Join us and become part of a thriving community that values teamwork, growth, and fun!"
                        }
                    ],
                    image: {
                        url: "https://media.discordapp.net/attachments/997909150610763900/1320118544113074186/title-_GUILD_-871x37.png?ex=67686fb3&is=67671e33&hm=1ecbfe220c88b3c64fcbfaa0d499092e0ddaa66603aa154666ba4209682c10cb"
                    },
                    thumbnail: {
                        url: "https://media.discordapp.net/attachments/997909150610763900/1320123627307401266/6383229_baby_cartoon_cute_duck_icon.png?ex=6768746f&is=676722ef&hm=97ecda2b468058aad73a5f19e7f02580267aa7ad01b6d12d502c3e4f532f3549"
                    }
                },
                {
                    title: "Skyblock Superlatives - Guild Ranks",
                    description: "While most guilds have a set of ranks, our guild aims to have some fun with them by hosting Skyblock Superlatives! Every month, we change our ranks based on a unique skill or statistic in-game, challenging our members to progress for a promotion. We utilize our rank system to incentivize members to progress in-game, as our goal is to be a well-rounded guild with players that exceed in all areas of the game.",
                    color: 0xbd42ff,
                    fields: [
                        {
                            name: "Superlative Rewards",
                            value: "Some examples we've done in the past are dungeons, slayers, levels, collections, and skill-based statistics. Whenever we have sponsors for the month, we distribute coin prizes to the top 3 players who have significantly improved in the month's category. Player progression can be tracked using `/superlative` through the Isle of Ducks bot in #bots, created by our developer, J\\_forjoooooo"
                        }
                    ],
                    image: {
                        url: "https://media.discordapp.net/attachments/997909150610763900/1320118576958406686/title-_RANKS_-871x37.png?ex=67686fbb&is=67671e3b&hm=f57510f902998c2441a6d7a1bea4c8a0fe06057be1dfead9af8acb47faeae19c"
                    },
                    thumbnail: {
                        url: "https://media.discordapp.net/attachments/997909150610763900/1320124365521555579/8684579_medal_champion_award_winner_olympic_icon.png?ex=6768751f&is=6767239f&hm=f0c64a046f803f9d141ab0f47806712de7bd551e61761d8bee1e86b0515d63f9"
                    }
                },
                {
                    title: "Bridge Bot",
                    description: "Our custom made Bridge bots were created by our developer, Chizuru",
                    color: 0xff7300,
                    fields: [
                        {
                            name: "What is a Bridge Bot?",
                            value: "A bridge bot allows members to communicate in guild chat through a discord channel, and vice versa. It transfers all the guild messages to the discord channel. This will enable members to chat or read what's going on, even if they aren't online."
                        },
                        {
                            name: "Bridge Commands",
                            value: "We have a variety of commands you can use in guild chat/through the bridge channel!\n\n▫️ `gxp [IGN]`: shows the player's calculated weekly gxp (past 7 days from when the command is ran)\n▫️ `nw [IGN]`: shows the player's networth\n▫️ `stalk [IGN]`: shows the player's location in-game\n▫️ `wiki [item]`: pulls up wiki link\n▫️ `cf`: coinflip, head or tails"
                        }
                    ],
                    image: {
                        url: "https://media.discordapp.net/attachments/997909150610763900/1320120951727460393/title-_BRIDGE_BOT_-871x37.png?ex=676871f1&is=67672071&hm=cc5ef6817396544d164bd335617a49af1e47e9aa99814640696c666cc9389c32"
                    },
                    thumbnail: {
                        url: "https://media.discordapp.net/attachments/997909150610763900/1320123417177100371/3465595_architecture_bridge_gate_golden_landmark_icon.png?ex=6768743d&is=676722bd&hm=12b8dc09ef941d4a9ada446bfd18b2bb4cdd523f47b863475c728b8cbe9900b2"
                    }
                },
                {
                    title: "Guild Immunity",
                    description: "Guild immunity only applies to the main guild. There are 2 ways to become immune to GXP kicks: \n\n▫️`Loyalty Immunity`: If you have been in the Isle of Ducks guild for over 6 months (from first join)\n▫️`Level Immunity`: If you have Skyblock level 400+",
                    color: 0xbd42ff,
                    fields: [
                        {
                            name: "Important Notes",
                            value: "You will receive immunity ONLY if you have consistently been in the guild for over a month. It is not upon joining or rejoining.\n\nWhile you are exempt from the 50k weekly GXP requirement, being immune means you should still be obtaining over **50k monthly GXP.** If this is not reached, you will lose immunity.\n\nAt the end of the month, we update the immunity list for members who have reached either milestones or if the requirements have changed."
                        }
                    ],
                    image: {
                        url: "https://media.discordapp.net/attachments/997909150610763900/1320129253056188546/title-_IMMUNITY_-871x37.png?ex=676879ac&is=6767282c&hm=4aaa79b75ba5aa26c80c8e3de027b36837e9d295b9b1f6cd606d134d82661a45"
                    },
                    thumbnail: {
                        url: "https://media.discordapp.net/attachments/997909150610763900/1320129008012099604/185077_shield_first_aid_medecine_icon.png?ex=67687972&is=676727f2&hm=8b17ea29ed1feba6ab5a8b18471b0a4646bb7acda6f01720c1401de3acbcd0c1"
                    }
                },
                {
                    title: "Requirements to Join",
                    description: "Before clicking the button below to apply for our guilds, please make sure you meet our requirements:",
                    color: 0xff7300,
                    fields: [
                        {
                            name: "Isle of Ducks",
                            value: "▫️ `Skyblock Level 320+`\n▫️ `50k weekly GXP`\n▫️ `All APIs enabled`"
                        },
                        {
                            name: "Isle of Ducklings",
                            value: "▫️ `Skyblock Level 200+`\n▫️ `50k weekly GXP`\n▫️ `All APIs enabled`"
                        },
                        {
                            name: "\u200b",
                            value: "Please note: If you have been kicked 3+ times for low GXP, you may only join back if you recruit a friend to the guild OR sponsor a 10M flash giveaway for guild members.\n\nIf there is a reason why you won't be able to keep up with our GXP requirement, it is your responsibility to leave the guild and reapply when you can play again.\n\nCheaters, macroers, scammers, and anyone who causes harmful behaviour to the community will be removed."
                        },
                        {
                            name: "Ready to join our guild? Create a ticket below!",
                            value: "\u200b"
                        }
                    ],
                    image: {
                        url: "https://media.discordapp.net/attachments/997909150610763900/1320131999398363177/title-_REQUIREMENTS_-871x37_3.png?ex=67687c3b&is=67672abb&hm=03b1841a125a2d9d761bc597f3fb939e94371c4f92eccc484ff0ce0c575c0704"
                    },
                    thumbnail: {
                        url: "https://media.discordapp.net/attachments/997909150610763900/1320132348041236572/2191214_attack_game_gaming_multimedia_play_icon.png?ex=67687c8e&is=67672b0e&hm=f4a14c74f0869dec106123531b7e6c7847ec8349dc5aaac36a0d231696867a8a"
                    }
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
                type: ComponentType.ActionRow,
                components: [
                    {
                        custom_id: "ticket-duckapp",
                        type: ComponentType.Button,
                        label: "Apply for Isle of Ducks",
                        style: ButtonStyle.Primary,
                        emoji: {
                            name: "📜"
                        }
                    },
                    {
                        custom_id: "ticket-ducklingapp",
                        type: ComponentType.Button,
                        label: "Apply for Isle of Ducklings",
                        style: ButtonStyle.Primary,
                        emoji: {
                            name: "📜"
                        }
                    }
                ]
            }
        ]),
        attachments: JSON.stringify([
            {
                id: 0,
                filename: 'title.png',
                url: "https://i.imgur.com/A6JxR7g.png"
            }
        ])
    },
    support: {
        content: null,
        data: JSON.stringify({
            embeds: [
                {
                    title: "Ticket Support",
                    description: "Need assistance from our staff team? Open a ticket, and we’ll be happy to help!",
                    color: 12403455,
                    fields: [
                        {
                            name: "Staff Request",
                            value: "▫️Report a player\n▫️Apply for partnership\n▫️Questions or concerns\n\nPlease include your reasoning as to why you opened the ticket."
                        },
                        {
                            name: "Sponsor a Giveaway",
                            value: "▫️Minimum value 10M+\n▫️You will receive donor role(s)\n▫️100M+ in value grants a custom role with the name, color, and icon of your choosing\n\nPlease include what you would like to give away as you open the ticket."
                        },
                        {
                            name: "Claim Giveaway",
                            value: "▫️You have 24h to claim a giveaway you won\n▫️Open a ticket to claim, and let staff know when you are available to get online\n\nPlease copy the message link of your win message in the giveaway channel as you open the ticket."
                        }
                    ],
                    footer: {
                        text: "Ready to open a ticket? Click the appropriate button below!"
                    },
                    image: {
                        url: "https://i.giphy.com/media/v1.Y2lkPTc5MGI3NjExM2huOGxpcHkwOXUycG83OHMyOW44NHBycm9peTZzODNxYWx4NG9ybCZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/n1UUsiVRzP9YGdSwcl/giphy.gif"
                    },
                    thumbnail: {
                        url: "https://media.discordapp.net/attachments/997909150610763900/1328108109054349472/3357500_card_circus_fair_star_ticket_icon.png?ex=67858090&is=67842f10&hm=a438444fa4097cbaf8bf948a2a0a0577a86cd573d4f627fe9e54acc6501138e6&=&format=webp&quality=lossless"
                    }
                }
            ],
        }),
        components: JSON.stringify([
            {
                type: ComponentType.ActionRow,
                components: [
                    {
                        custom_id: "ticket-support",
                        type: ComponentType.Button,
                        label: "Support",
                        style: ButtonStyle.Primary,
                        emoji: {
                            name: "🎟️"
                        }
                    },
                    {
                        custom_id: "ticket-sponsor",
                        type: ComponentType.Button,
                        label: "Sponsor Giveaway",
                        style: ButtonStyle.Primary,
                        emoji: {
                            name: "🎉"
                        }
                    },
                    {
                        custom_id: "ticket-claim",
                        type: ComponentType.Button,
                        label: "Claim Giveaway",
                        style: ButtonStyle.Primary,
                        emoji: {
                            name: "💰"
                        }
                    }
                ]
            }
        ]),
        attachments: undefined
    }
}
