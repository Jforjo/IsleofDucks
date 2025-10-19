import { BanGuildMember, bitfieldToJson, CarrierAppChoices, CarrierAppChoicesType, CheckChannelExists, ConvertSnowflakeToDate, CreateChannel, CreateInteractionResponse, FollowupMessage, IsleofDucks, SendMessage, ToPermissions } from "@/discord/discordUtils";
import { getUsernameOrUUID } from "@/discord/hypixelUtils";
import { getScammerFromDiscord, getScammerFromUUID } from "@/discord/jerry";
import { getBannedPlayer, updateBannedPlayerDiscord } from "@/discord/utils";
import { APIInteractionResponse, APIModalSubmitInteraction, ButtonStyle, ChannelType, ComponentType, InteractionResponseType, MessageFlags, OverwriteType, RESTAPIGuildCreateOverwrite } from "discord-api-types/v10";
import { NextResponse } from "next/server";

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
    await CreateInteractionResponse(interaction.id, interaction.token, {
        type: InteractionResponseType.DeferredChannelMessageWithSource,
        data: { flags: MessageFlags.Ephemeral }
    });

    const TICKET = IsleofDucks.ticketTypes.filter((ticket) => ticket.id === interaction.data.custom_id.split("-")[0])[0];
    if (!TICKET) {
        await FollowupMessage(interaction.token, {
            content: "Ticket type not found!",
        });
        return NextResponse.json(
            { success: false, error: "Ticket type not found" },
            { status: 400 }
        );
    }

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

    if (!member.roles.includes(IsleofDucks.roles.verified)) {
        await FollowupMessage(interaction.token, {
            content: `You must verify first! <#${IsleofDucks.channels.verification}>`,
        });
        return NextResponse.json(
            { success: false, error: "You are not verified" },
            { status: 400 }
        );
    }

    const hasTicket = await CheckChannelExists.names(guildID, TICKET.excludes.map(id => `${id}-${member.user.username}`));
    if (hasTicket.exists) {
        await FollowupMessage(interaction.token, {
            content: [
                `You already have a ticket open here: <#${hasTicket.channelIDs[0]}>`,
                `Please close the existing ticket before opening a new one.`
            ].join("\n"),
        });
        return NextResponse.json(
            { success: false, error: "You already have a ticket open" },
            { status: 400 }
        );
    }

    const timestamp = ConvertSnowflakeToDate(interaction.id);
    const username = interaction.data.components[0].components[0].value;
    const number = interaction.data.components[1].components[0].value;
    const timezone = interaction.data.components[2].components[0].value;

    if (isNaN(parseInt(number)) || parseInt(number) < 1 || parseInt(number) > 99) {
        await FollowupMessage(interaction.token, {
            content: "Invalid number!",
        });
        return NextResponse.json(
            { success: false, error: "Invalid number" },
            { status: 400 }
        );
    }

    const scammerDiscordResponse = await getScammerFromDiscord(member.user.id);
    if (scammerDiscordResponse.success && scammerDiscordResponse.scammer) {
        if (scammerDiscordResponse.details?.discordIds) {
            for (const discord of scammerDiscordResponse.details.discordIds) {
                await BanGuildMember(guildID, discord, `Automatic ban for being on the Jerry Scammer List. Detected through ${TICKET.name}.`);
            }
            if (!scammerDiscordResponse.details.discordIds.includes(member.user.id)) {
                await BanGuildMember(guildID, member.user.id, `Automatic ban for being on the Jerry Scammer List. Detected through ${TICKET.name}.`);
            }
        } else {
            await BanGuildMember(guildID, member.user.id, `Automatic ban for being on the Jerry Scammer List. Detected through ${TICKET.name}.`);
        }

        const mojang = await getUsernameOrUUID(username);
        await SendMessage(IsleofDucks.channels.staffgeneral, {
            embeds: [
                {
                    title: "Automatic Ban Log",
                    description: `Automatic ban for being on the Jerry Scammer List. Detected through ${TICKET.name}.`,
                    fields: [
                        {
                            name: `Discord - ${member.user.id}`,
                            value: [
                                `User: <@${member.user.id}>`,
                                `Username: ${member.user.username.replaceAll('_', '\\_')}`,
                                `Nickname: ${member.nick?.replaceAll('_', '\\_') ?? ""}`
                            ].join('\n')
                        },
                        {
                            name: "Minecraft",
                            value: [
                                `UUID: ${scammerDiscordResponse.details ? scammerDiscordResponse.details.uuid : mojang.success ? mojang.uuid : "Failed to fetch"}`,
                                `Username: ${mojang.success ? mojang.name.replaceAll('_', '\\_') : "Failed to fetch"}`,
                            ].join('\n')
                        },
                        {
                            name: "Banlist Reason",
                            value: `${scammerDiscordResponse.details ? scammerDiscordResponse.details.reason.replaceAll('_', '\\_') : "Unknown reason"}`
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

    const carryChoices = bitfieldToJson(parseInt(interaction.data.custom_id.split("-")[1]), CarrierAppChoices);
    const chosen = (Object.keys(carryChoices) as CarrierAppChoicesType[]).filter(key => carryChoices[key]);
    const uuidRes = await getUsernameOrUUID(username);
    if (!uuidRes.success) {
        await FollowupMessage(interaction.token, {
            content: `Failed to get the UUID for the username \`${username}\`!`,
        });
        return NextResponse.json(
            { success: false, error: `Failed to get the UUID for the username \`${username}\`` },
            { status: 400 }
        );
    }
    const uuid = uuidRes.uuid;

    const bannedResponse = await getBannedPlayer(uuid);
    if (bannedResponse) {
        if (bannedResponse.discords) {
            for (const discord of bannedResponse.discords) {
                await BanGuildMember(guildID, discord, `Automatic ban for being on banlist. Detected through ${TICKET.name}.`);
            }
            if (!bannedResponse.discords.includes(member.user.id)) {
                await updateBannedPlayerDiscord(uuid, member.user.id);
                await BanGuildMember(guildID, member.user.id, `Automatic ban for being on banlist. Detected through ${TICKET.name}.`);
            }
        } else {
            await updateBannedPlayerDiscord(uuid, member.user.id);
            await BanGuildMember(guildID, member.user.id, `Automatic ban for being on banlist. Detected through ${TICKET.name}.`);
        }
        
        await SendMessage(IsleofDucks.channels.staffgeneral, {
            embeds: [
                {
                    title: "Automatic Ban Log",
                    description: `Automatic ban for being on banlist. Detected through ${TICKET.name}.`,
                    fields: [
                        {
                            name: `Discord - ${member.user.id}`,
                            value: [
                                `User: <@${member.user.id}>`,
                                `Username: ${member.user.username.replaceAll('_', '\\_')}`,
                                `Nickname: ${member.nick?.replaceAll('_', '\\_') ?? ""}`
                            ].join('\n')
                        },
                        {
                            name: "Minecraft",
                            value: [
                                `UUID: ${uuid}`,
                                `Username: ${uuidRes.name.replaceAll('_', '\\_')}`,
                            ].join('\n')
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
    // const oldScammerResponse = await isOnOldScammerList(uuid);
    let scammerResponse = await getScammerFromUUID(uuidRes.uuiddashes);
    if (!scammerResponse.success) {
        console.log("Scammer Error:", scammerResponse.reason);
        scammerResponse = await getScammerFromUUID(uuid);
    }
    if (!scammerResponse.success) {
        console.log("Scammer Error:", scammerResponse.reason);
        scammerResponse = await getScammerFromUUID(uuid);
    }
    if (!scammerResponse.success) console.log("Scammer Error:", scammerResponse.reason);
    if (scammerResponse.success && scammerResponse.scammer) {
        if (scammerResponse.details?.discordIds) {
            for (const discord of scammerResponse.details.discordIds) {
                await BanGuildMember(guildID, discord, `Automatic ban for being on the Jerry Scammer List. Detected through ${TICKET.name}.`);
            }
            if (!scammerResponse.details.discordIds.includes(member.user.id)) {
                await BanGuildMember(guildID, member.user.id, `Automatic ban for being on the Jerry Scammer List. Detected through ${TICKET.name}.`);
            }
        } else {
            await BanGuildMember(guildID, member.user.id, `Automatic ban for being on the Jerry Scammer List. Detected through ${TICKET.name}.`);
        }

        await SendMessage(IsleofDucks.channels.staffgeneral, {
            embeds: [
                {
                    title: "Automatic Ban Log",
                    description: `Automatic ban for being on the Jerry Scammer List. Detected through ${TICKET.name}.`,
                    fields: [
                        {
                            name: `Discord - ${member.user.id}`,
                            value: [
                                `User: <@${member.user.id}>`,
                                `Username: ${member.user.username.replaceAll('_', '\\_')}`,
                                `Nickname: ${member.nick?.replaceAll('_', '\\_') ?? ""}`
                            ].join('\n')
                        },
                        {
                            name: "Minecraft",
                            value: [
                                `UUID: ${scammerDiscordResponse.details ? scammerDiscordResponse.details.uuid : uuidRes.success ? uuid : "Failed to fetch"}`,
                                `Username: ${uuidRes.success ? uuidRes.name.replaceAll('_', '\\_') : "Failed to fetch"}`,
                            ].join('\n')
                        },
                        {
                            name: "Banlist Reason",
                            value: `${scammerResponse.details ? scammerResponse.details.reason.replaceAll('_', '\\_') : "Unknown reason"}`
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

    // const profilesRes = await getProfiles(uuid);
    // if (!profilesRes.success) {
    //     await FollowupMessage(interaction.token, {
    //         content: `Failed to get the profile for the username \`${username}\`!`,
    //     });
    //     return NextResponse.json(
    //         { success: false, error: `Failed to get the profile for the username \`${username}\`` },
    //         { status: 400 }
    //     );
    // }
    
    // const carrierRequirementsMet: Partial<Record<CarrierAppChoicesType, boolean>> = {};
    // for (const profile of profilesRes.profiles) {
    //     const member = profile.members[uuid];
    //     if (!member) continue;
    //     for (const [ choice, chose ] of Object.entries(carryChoices)) {
    //         if (!chose) continue;
    //         if (carrierRequirementsMet[choice as CarrierAppChoicesType]) continue;
    //         const reqCheck = CarrierRequirements[choice as CarrierAppChoicesType](member);
    //         carrierRequirementsMet[choice as CarrierAppChoicesType] = typeof reqCheck === 'boolean' ? reqCheck : reqCheck.runs && reqCheck.cata;
    //     }
    // }

    // const failedRequirements = Object.entries(carryChoices).filter(([ choice, chose ]) => chose && !carrierRequirementsMet[choice as CarrierAppChoicesType]);
    // if (failedRequirements.length > 0) {
    //     await FollowupMessage(interaction.token, {
    //         content: `You do not meet the requirements for the following: ${failedRequirements.map(([ choice ]) => `\`${choice}\``).join(", ")}!`,
    //     });
    //     return NextResponse.json(
    //         { success: false, error: `You do not meet the requirements for the following: ${failedRequirements.map(([ choice ]) => `\`${choice}\``).join(", ")}` },
    //         { status: 400 }
    //     );
    // }

    const channelPermissions = [
        {
            id: guildID,
            type: OverwriteType.Role,
            allow: null,
            deny: ToPermissions({
                view_channel: true
            })
        },
        {
            id: member.user.id,
            type: OverwriteType.Member,
            allow: ToPermissions({
                view_channel: true,
            }),
            deny: ToPermissions({
                send_messages: true
            })
        },
        {
            id: IsleofDucks.roles.service_management,
            type: OverwriteType.Role,
            allow: ToPermissions({
                view_channel: true,
                send_messages: true,
                use_application_commands: true,
            }),
            deny: null
        },
        ...chosen.map(id => ({
            id: IsleofDucks.roles.carrier[id],
            type: OverwriteType.Role,
            allow: ToPermissions({
                view_channel: true,
            }),
            deny: ToPermissions({
                send_messages: true
            })
        }))
    ] as RESTAPIGuildCreateOverwrite[];

    const channel = await CreateChannel(guildID, {
        type: ChannelType.GuildText,
        name: `${TICKET.ticketName}-${member.user.username}`,
        topic: `${TICKET.name} for ${member.nick ?? member.user.username} - ${member.user.id}`,
        parent_id: TICKET.catagory,
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

    await SendMessage(channel.id, {
        content: `<@${member.user.id}> is requesting help from ${member.roles.includes(IsleofDucks.roles.service_management) ? `Various Carriers` : Object.entries(IsleofDucks.roles.carrier).filter(([ id ]) => chosen.includes(id as CarrierAppChoicesType)).map(([ , role ]) => `<@&${role}>`).join(", ")}`,
        embeds: [
            {
                title: `${TICKET.name}`,
                description: `${TICKET.name} for ${member.nick?.replaceAll('_', '\\_') ?? member.user.username.replaceAll('_', '\\_')} - ${member.user.id}`,
                fields: [
                    {
                        name: "Requested Carry",
                        value: chosen.join(", ")
                    },
                    {
                        name: "Amount of Carries",
                        value: number
                    },
                    {
                        name: "Timezone",
                        value: timezone || "Not specified"
                    }
                ],
                color: 0xFB9B00,
                footer: {
                    text: `Response time: ${Date.now() - timestamp.getTime()}ms`,
                },
                timestamp: new Date().toISOString()
            },
        ],
        components: [
            {
                type: ComponentType.ActionRow,
                components: [
                    {
                        custom_id: `claim-${TICKET.id}-${member.user.id}`,
                        type: ComponentType.Button,
                        label: "Claim",
                        style: ButtonStyle.Success
                    },
                    {
                        custom_id: `close-${TICKET.id}-${member.user.id}-auto`,
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
    });

    await FollowupMessage(interaction.token, {
        content: `Created your ticket: <#${channel.id}>`,
    });

    return NextResponse.json(
        { success: true },
        { status: 200 }
    );
}