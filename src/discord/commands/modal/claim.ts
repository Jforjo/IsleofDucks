import { APIInteractionResponse, APIMessageComponentButtonInteraction, APIModalSubmitInteraction, ButtonStyle, ChannelType, ComponentType, InteractionResponseType, RESTAPIGuildCreateOverwrite, Snowflake } from "discord-api-types/v10";
import { CreateInteractionResponse, FollowupMessage, ConvertSnowflakeToDate, IsleofDucks, ToPermissions, CreateChannel, SendMessage, BanGuildMember, CheckChannelExists } from "@/discord/discordUtils";
import { NextResponse } from "next/server";
import { getScammerFromDiscord } from "@/discord/jerry";
import { getUsernameOrUUID } from "@/discord/hypixelUtils";

export default async function(
    interaction: APIMessageComponentButtonInteraction | APIModalSubmitInteraction,
    autoDetectedWonGiveaways: false | {
        channelId: Snowflake;
        messageId: Snowflake;
    }[] = false
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
    const tickerButton = interaction.data.custom_id.includes('ticket-');
    const ticketID = tickerButton ? interaction.data.custom_id.split('-')[1] : interaction.data.custom_id;
    const TICKET = IsleofDucks.ticketTypes.filter((ticket) => ticket.id === ticketID)[0];
    if (!TICKET) {
        await FollowupMessage(interaction.token, {
            content: "Ticket type not found!",
        });
        return NextResponse.json(
            { success: false, error: "Ticket type not found" },
            { status: 400 }
        );
    }
    const timestamp = ConvertSnowflakeToDate(interaction.id);
    let userinput = "";
    if (!tickerButton) {
        // If statement needed because TS complains
        if ('data' in interaction && 'components' in interaction.data)
            userinput = interaction.data.components[0].components[0].value;
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

        let username = "Failed to fetch";
        if (scammerDiscordResponse.details) {
            const mojang = await getUsernameOrUUID(scammerDiscordResponse.details.uuid);
            if (mojang.success) username = mojang.name;
        }
        await SendMessage(IsleofDucks.channels.staffgeneral, {
            embeds: [
                {
                    title: "Automatic Ban Log",
                    description: `Automatic ban for being on the Jerry Scammer List. Detected through ${TICKET.name}.`,
                    fields: [
                        {
                            name: `Discord - <@${member.user.id}>`,
                            value: [
                                `ID: ${member.user.id}`,
                                `Username: ${member.user.username.replaceAll('_', '\\_')}`,
                                `Nickname: ${member.nick?.replaceAll('_', '\\_') ?? ""}`
                            ].join('\n')
                        },
                        {
                            name: "Minecraft",
                            value: [
                                `UUID: ${scammerDiscordResponse.details ? scammerDiscordResponse.details.uuid : "Failed to fetch"}`,
                                `Username: ${username.replaceAll('_', '\\_')}`,
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
                view_channel: true,
                send_messages: true,
                use_application_commands: true,
            }),
            deny: null
        },
        {
            id: IsleofDucks.roles.staff,
            type: 0,
            allow: ToPermissions({
                view_channel: true,
                send_messages: true,
                use_application_commands: true,
            }),
            deny: null
        }
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

    const field = tickerButton ? {
        name: "Auto detected giveaways won",
        value: autoDetectedWonGiveaways ?
            autoDetectedWonGiveaways.map(gw => `https://discord.com/channels/${IsleofDucks.serverID}/${gw.channelId}/${gw.messageId}`).join('\n') :
            "None"
    } : {
        name: "Giveaway they won",
        value: userinput
    };

    await SendMessage(channel.id, {
        content: `<@${member.user.id}> is requesting help from ${member.roles.includes(IsleofDucks.roles.staff) ? `Moderators` : `<@&${IsleofDucks.roles.mod_duck}>, <@&${IsleofDucks.roles.mod_duckling}>`}`,
        embeds: [
            {
                title: `${TICKET.name}`,
                description: `${TICKET.name} for ${member.nick?.replaceAll('_', '\\_') ?? member.user.username.replaceAll('_', '\\_')} - ${member.user.id}`,
                fields: [ field ],
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

    // await FollowupMessage(interaction.token, {
    //     content: `${TICKET.name} ticket created here: <#${channel.id}>`,
    // });

    await FollowupMessage(interaction.token, {
        content: [
            `Hey <@${member.user.id}> 👋`,
            ``,
            `Your ${TICKET.name} ticket has been created and can be viewed at <#${channel.id}>`,
            ``,
            `Best wishes,`,
            `Isle of Ducks`
        ].join("\n"),
    });

    return NextResponse.json(
        { success: true },
        { status: 200 }
    );
}
