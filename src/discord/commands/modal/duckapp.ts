import { APIInteractionResponse, APIModalSubmitInteraction, ApplicationCommandPermissionType, ButtonStyle, ChannelType, ComponentType, InteractionResponseType, RESTAPIGuildCreateOverwrite } from "discord-api-types/v10";
import { getUsernameOrUUID, isPlayerInGuild } from "@/discord/hypixelUtils";
import { CreateInteractionResponse, FollowupMessage, ConvertSnowflakeToDate, IsleofDucks, Emojis, ToPermissions, CreateChannel, SendMessage, BanGuildMember } from "@/discord/discordUtils";
import { NextResponse } from "next/server";
import { checkPlayer } from "../application/recruit";
import { getBannedPlayer, isOnOldScammerList, updateBannedPlayerDiscord } from "@/discord/utils";

export default async function(
    interaction: APIModalSubmitInteraction
): Promise<
    NextResponse<
        {
            success: boolean;
            error?: string;
        } | APIInteractionResponse
    >
> {
    // ACK response
    await CreateInteractionResponse(interaction.id, interaction.token, {
        type: InteractionResponseType.DeferredChannelMessageWithSource,
        data: {
            flags: 1 << 6
        }
    });
    
    const timestamp = ConvertSnowflakeToDate(interaction.id);
    const username = interaction.data.components[0].components[0].value;

    const guildID = interaction.guild_id;
    if (!guildID) {
        await FollowupMessage(interaction.token, {
            content: "This command can only be used in a server!",
        });
        return NextResponse.json(
            { success: false, error: "This command can only be used in a server" },
            { status: 400 }
        );
    }
    const member = interaction.member;
    if (!member) {
        await FollowupMessage(interaction.token, {
            content: "Could not find who ran the command!",
        });
        return NextResponse.json(
            { success: false, error: "Could not find who ran the command" },
            { status: 400 }
        );
    }
    
    const mojang = await getUsernameOrUUID(username);
    if (!mojang.success) {
        await FollowupMessage(interaction.token, {
            embeds: [
                {
                    title: "Something went wrong!",
                    description: mojang.message,
                    color: 0xB00020,
                    footer: {
                        text: `Response time: ${Date.now() - timestamp.getTime()}ms`,
                    },
                    timestamp: new Date().toISOString()
                }
            ],
        });
        return NextResponse.json(
            { success: false, error: mojang.message },
            { status: mojang.status }
        );
    }

    const bannedResponse = await getBannedPlayer(mojang.uuid);
    if (bannedResponse) {
        if (bannedResponse.discord) {
            await BanGuildMember(guildID, bannedResponse.discord, "Automatic ban for being on banlist. Detected through Duck Application.");
        } else {
            await updateBannedPlayerDiscord(mojang.uuid, member.user.id);
        }
        if (bannedResponse.discord !== member.user.id) {
            await BanGuildMember(guildID, member.user.id, "Automatic ban for being on banlist. Detected through Duck Application.");
        }
        
        await SendMessage(IsleofDucks.channels.staffgeneral, {
            embeds: [
                {
                    title: "Automatic Ban Log",
                    description: "Automatic ban for being on banlist. Detected through Duck Application.",
                    fields: [
                        {
                            name: "Minecraft UUID",
                            value: `${mojang.uuid}`
                        },
                        {
                            name: "Minecraft Username",
                            value: `${mojang.name.replaceAll('_', '\\_')}`
                        },
                        {
                            name: "Discord ID",
                            value: `<@${member.user.id}> - ${member.user.id}`
                        },
                        {
                            name: "Banlist Reason",
                            value: `${bannedResponse.reason.replaceAll('_', '\\_')}`
                        }
                    ],
                    color: 0xFB9B00,
                    footer: {
                        text: `Response time: ${Date.now() - timestamp.getTime()}ms`,
                    },
                    timestamp: new Date().toISOString()
                }
            ]
        });
        return NextResponse.json(
            { success: true },
            { status: 200 }
        );
    }
    const oldScammerResponse = await isOnOldScammerList(mojang.uuid);
    if (oldScammerResponse.success && oldScammerResponse.scammer) {
        await BanGuildMember(guildID, member.user.id, "Automatic ban for being on Old Jerry Scammer List. Detected through Duck Application.");
        await SendMessage(IsleofDucks.channels.staffgeneral, {
            embeds: [
                {
                    title: "Automatic Ban Log",
                    description: "Automatic ban for being on old scammer list. Detected through Duck Application.",
                    fields: [
                        {
                            name: "Minecraft UUID",
                            value: `${mojang.uuid}`
                        },
                        {
                            name: "Minecraft Username",
                            value: `${mojang.name.replaceAll('_', '\\_')}`
                        },
                        {
                            name: "Banlist Reason",
                            value: `${oldScammerResponse.reason.replaceAll('_', '\\_')}`
                        }
                    ],
                    color: 0xFB9B00,
                    footer: {
                        text: `Response time: ${Date.now() - timestamp.getTime()}ms`,
                    },
                    timestamp: new Date().toISOString()
                }
            ]
        });
        return NextResponse.json(
            { success: true },
            { status: 200 }
        );
    }

    const profileAPIResponse = await checkPlayer(mojang.uuid);
    if (!profileAPIResponse.success) {
        await FollowupMessage(interaction.token, {
            embeds: [
                {
                    title: "Something went wrong!",
                    description: profileAPIResponse.message,
                    color: 0xB00020,
                    footer: {
                        text: `Response time: ${Date.now() - timestamp.getTime()}ms`,
                    },
                    timestamp: new Date().toISOString()
                }
            ],
        });
        return NextResponse.json(
            { success: false, error: profileAPIResponse.message },
            { status: profileAPIResponse.status }
        );
    }
    if (profileAPIResponse.experience < profileAPIResponse.ducklingReq) {
        await FollowupMessage(interaction.token, {
            content: `You do not meet the level requirements to join either guild!`,
        });
        return NextResponse.json(
            { success: true },
            { status: 200 }
        );
    }

    const guildResponse = await isPlayerInGuild(mojang.uuid);
    if (!guildResponse.success) {
        await FollowupMessage(interaction.token, {
            embeds: [
                {
                    title: "Something went wrong!",
                    description: guildResponse.message,
                    color: 0xB00020,
                    footer: {
                        text: `Response time: ${Date.now() - timestamp.getTime()}ms`,
                    },
                    timestamp: new Date().toISOString()
                }
            ],
        });
        return NextResponse.json(
            { success: false, error: guildResponse.message },
            { status: guildResponse.status }
        );
    }

    const channelPermissions = [
        {
            id: guildID,
            type: 0,
            allow: null,
            deny: ToPermissions({
                view_channel: true
            })
        },
        {
            id: member.user.id,
            type: 1,
            allow: ToPermissions({
                view_channel: true
            }),
            deny: ToPermissions({
                send_messages: true
            })
        },
        {
            id: IsleofDucks.roles.staff,
            type: 0,
            allow: ToPermissions({
                view_channel: true,
                send_messages: true
            }),
            deny: null
        }
    ] as RESTAPIGuildCreateOverwrite[];

    const channel = await CreateChannel(guildID, {
        type: ChannelType.GuildText,
        name: `duck-${member.nick ?? member.user.username}`,
        topic: `Duck Application for ${member.nick ?? member.user.username} - ${member.user.id}`,
        parent_id: IsleofDucks.channelGroups.tickets,
        permission_overwrites: channelPermissions
    });
    if (!channel) {
        await FollowupMessage(interaction.token, {
            content: "Could not create channel!",
        });
        return NextResponse.json(
            { success: false, error: "Could not create channel" },
            { status: 400 }
        );
    }

    const yes = Emojis.yes;
    const no = Emojis.no;
    await SendMessage(channel.id, {
        content: `<@${member.user.id}> is requesting help from <@&${IsleofDucks.roles.mod_duck}>`,
        embeds: [
            {
                title: "Duck Application",
                description: `Duck Application for ${member.nick ?? member.user.username} - ${member.user.id}`,
                color: 0xFB9B00,
            },
            {
                title: mojang.name,
                thumbnail: {
                    url: `attachment://${mojang.name}.png`
                },
                url: `https://sky.shiiyu.moe/stats/${mojang.uuid}/${profileAPIResponse.name}`,
                description: 
                    profileAPIResponse.inventory &&
                    profileAPIResponse.collection &&
                    profileAPIResponse.skills &&
                    profileAPIResponse.vault &&
                    ( profileAPIResponse.experience >= profileAPIResponse.duckReq || profileAPIResponse.experience >= profileAPIResponse.ducklingReq ) &&
                    !guildResponse.isInGuild &&
                    ( oldScammerResponse.success && oldScammerResponse.scammer ) &&
                    !bannedResponse ? `\`\`\`/g invite ${mojang.name}\`\`\`` : undefined,
                fields: [
                    {
                        name: "Guild",
                        value: guildResponse.isInGuild ? `${no} ${guildResponse.guild.name} (${guildResponse.guild.members.length}/125)` : `${yes} They are not in a guild`,
                        inline: false
                    },
                    {
                        name: "Guild Requirements",
                        value: [
                            `${profileAPIResponse.experience < profileAPIResponse.duckReq ? no : yes} Ducks (${Math.floor(profileAPIResponse.experience / 100)}/${Math.floor(profileAPIResponse.duckReq / 100)})`,
                            `${profileAPIResponse.experience < profileAPIResponse.ducklingReq ? no : yes} Ducklings (${Math.floor(profileAPIResponse.experience / 100)}/${Math.floor(profileAPIResponse.ducklingReq / 100)})`,
                        ].join('\n'),
                        inline: false
                    },
                    {
                        name: "APIs",
                        value: [
                            `${profileAPIResponse.inventory ? yes : no} Inventory API`,
                            `${profileAPIResponse.banking ? yes : no} Banking API`,
                            `${profileAPIResponse.collection ? yes : no} Collection API`,
                            `${profileAPIResponse.skills ? yes : no} Skills API`,
                            `${profileAPIResponse.vault ? yes : no} Personal Vault API`,
                        ].join('\n'),
                        inline: false
                    },
                    {
                        name: "Banned",
                        value: `${yes} They are not in my ban list`,
                        inline: false
                    },
                    {
                        name: "Old Jerry Scammer List",
                        value: `${yes} They are not in the old Jerry scammer list`,
                        inline: false
                    }
                ],
                color: 0xFB9B00,
                footer: {
                    text: `Response time: ${Date.now() - timestamp.getTime()}ms`,
                },
                timestamp: new Date().toISOString()
            }
        ],
        components: [
            {
                type: ComponentType.ActionRow,
                components: [
                    {
                        custom_id: `close-duckapp-${member.user.id}`,
                        type: ComponentType.Button,
                        label: "Close",
                        style: ButtonStyle.Danger,
                        emoji: {
                            name: "🔒"
                        }
                    },
                ]
            }
        ],
    }, [
        {
            id: 0,
            url: `https://mineskin.eu/helm/${mojang.name}/100.png`,
            filename: `${mojang.name}.png`
        }
    ]);

    await FollowupMessage(interaction.token, {
        content: `Duck Application ticket created here: <#${channel.id}>`,
    });

    return NextResponse.json(
        { success: true },
        { status: 200 }
    );
}
