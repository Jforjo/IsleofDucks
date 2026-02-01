import { APIChatInputApplicationCommandInteraction, APIChatInputApplicationCommandInteractionData, APIEmbedField, APIInteractionResponse, ApplicationCommandOptionType, ButtonStyle, ComponentType, InteractionResponseType, Snowflake } from "discord-api-types/v10";
import { CreateInteractionResponse, ConvertSnowflakeToDate, FollowupMessage, IsleofDucks, formatNumber, GetChannel, EditChannel, AddGuildMemberRole, GetGuildMember, RemoveGuildMemberRole } from "@/discord/discordUtils";
import { getDonation, setDonation, getDonations, getDonationsCount, getTotalDonation } from "@/discord/utils";
import { NextResponse } from "next/server";

function parseNumber(number: string): number | null {
    const regex = /^(\d+(?:\.\d{1,3})?)\s*(k|m|b|t)?$/i;
    const match = regex.exec(number);
    if (!match) return null;
    const value = parseFloat(match[1]);
    // Full number, no 'k', 'm', 'b' or 't' etc
    if (!match[2]) return value;
    const unit = match[2].toLowerCase();
    switch (unit) {
        case 'k':
            return value * 1_000;
        case 'm':
            return value * 1_000_000;
        case 'b':
            return value * 1_000_000_000;
        case 't':
            return value * 1_000_000_000_000;
        default:
            return null;
    }
}

async function updateDonationTotal(number: number): Promise<boolean> {
    const channel = await GetChannel(IsleofDucks.channels.donationTotal);
    if (!channel || !channel.name) return false;

    const regex = /^(.*?)(\d+(?:\.\d{1,3})?)(k|m|b|t)?$/i;
    const match = regex.exec(channel.name);
    if (!match) return false;

    const prefix = match[1];
    // const currentNumber = parseNumber(`${match[2]}${match[3]}`);
    // if (!currentNumber) return false;

    // const newNumber = currentNumber + number;
    const newName = `${prefix}${formatNumber(number, 3)}`;

    if (newName === channel.name) return false;

    await EditChannel(channel.id, { name: newName });

    return true;
}

async function updateDonationRoles(amount: number, userId: Snowflake): Promise<null | {
    added: string[];
    removed: string[];
}> {
    const user = await GetGuildMember(IsleofDucks.serverID, userId);
    if (!user) return null;

    const rolesShouldBeAdded = IsleofDucks.roles.donor.filter(role => amount >= role.requirement);
    const rolesShouldBeRemoved = IsleofDucks.roles.donor.filter(role => amount < role.requirement);

    const rolesAdded: string[] = [];
    const rolesRemoved: string[] = [];

    for (const role of rolesShouldBeAdded) {
        if (user.roles.includes(role.id)) continue;
        if (!await AddGuildMemberRole(IsleofDucks.serverID, userId, role.id)) continue;
        rolesAdded.push(role.id);
    }

    for (const role of rolesShouldBeRemoved) {
        if (!user.roles.includes(role.id)) continue;
        if (!await RemoveGuildMemberRole(IsleofDucks.serverID, userId, role.id)) continue;
        rolesRemoved.push(role.id);
    }

    return { added: rolesAdded, removed: rolesRemoved };
}

export async function updateDonation(
    interaction: APIChatInputApplicationCommandInteraction
): Promise<
    NextResponse<
        {
            success: boolean;
            error?: string;
        } | APIInteractionResponse
    >
> {
    const timestamp = ConvertSnowflakeToDate(interaction.id);

    if (!interaction.member) {
        await FollowupMessage(interaction.token, {
            content: "Could not find who ran the command!"
        });
        return NextResponse.json(
            { success: false, error: "Could not find who ran the command" },
            { status: 400 }
        );
    }
    if (!interaction.member.roles.includes(IsleofDucks.roles.admin)) {
        await FollowupMessage(interaction.token, {
            content: "You don't have permission to use this command!"
        });
        return NextResponse.json(
            { success: false, error: "You don't have permission to use this command" },
            { status: 403 }
        );
    }

    await FollowupMessage(interaction.token, {
        embeds: [
            {
                title: "Updating donation total...",
                description: `If this embed doesn't change <t:${Math.floor(timestamp.getTime() / 1000) + 60}:R> then you may to wait for 10 minutes and run the command again.`,
                color: 0xFB9B00,
                footer: {
                    text: `Response time: ${Date.now() - timestamp.getTime()}ms`,
                },
                timestamp: new Date().toISOString()
            }
        ]
    });

    const amount = await getTotalDonation();
    await updateDonationTotal(amount);

    await FollowupMessage(interaction.token, {
        embeds: [
            {
                title: "Done!",
                description: `<#${IsleofDucks.channels.donationTotal}> has been updated to ${formatNumber(amount, 3)}!`,
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

export async function addDonation(
    interaction: APIChatInputApplicationCommandInteraction,
    userid: Snowflake,
    amount: string
): Promise<
    NextResponse<
        {
            success: boolean;
            error?: string;
        } | APIInteractionResponse
    >
> {
    const timestamp = ConvertSnowflakeToDate(interaction.id);

    if (!interaction.member) {
        await FollowupMessage(interaction.token, {
            content: "Could not find who ran the command!"
        });
        return NextResponse.json(
            { success: false, error: "Could not find who ran the command" },
            { status: 400 }
        );
    }
    if (!(
        interaction.member.roles.includes(IsleofDucks.roles.admin) ||
        interaction.member.roles.includes(IsleofDucks.roles.mod_duck) ||
        interaction.member.roles.includes(IsleofDucks.roles.mod_duckling) ||
        interaction.member.roles.includes(IsleofDucks.roles.trainee)
    )) {
        await FollowupMessage(interaction.token, {
            content: "You don't have permission to use this command!"
        });
        return NextResponse.json(
            { success: false, error: "You don't have permission to use this command" },
            { status: 403 }
        );
    }

    const amountNumber = parseNumber(amount);
    if (!amountNumber) {
        await FollowupMessage(interaction.token, {
            embeds: [
                {
                    title: "Something went wrong!",
                    description: "Invalid amount",
                    color: 0xB00020,
                    footer: {
                        text: `Response time: ${Date.now() - timestamp.getTime()}ms`,
                    },
                    timestamp: new Date().toISOString()
                }
            ],
        });
        return NextResponse.json(
            { success: false, error: "Invalid amount" },
            { status: 400 }
        );
    }

    const donation = await getDonation(userid);
    if (!donation) {
        await FollowupMessage(interaction.token, {
            embeds: [
                {
                    title: "Something went wrong!",
                    description: "Could not get donation",
                    color: 0xB00020,
                    footer: {
                        text: `Response time: ${Date.now() - timestamp.getTime()}ms`,
                    },
                    timestamp: new Date().toISOString()
                }
            ],
        });
        return NextResponse.json(
            { success: false, error: "Could not get donation" },
            { status: 400 }
        )
    }

    // Not including this Number bs seems to concat them instead...
    const newDonation = Math.max(0, Number(Number(donation.donation) + Number(amountNumber)));

    await setDonation(userid, newDonation);

    const roles = await updateDonationRoles(newDonation, userid);
    if (!roles) {
        await FollowupMessage(interaction.token, {
            embeds: [
                {
                    title: "Something went wrong!",
                    description: "Could not update donation roles",
                    color: 0xB00020,
                    footer: {
                        text: `Response time: ${Date.now() - timestamp.getTime()}ms`,
                    },
                    timestamp: new Date().toISOString()
                }
            ],
        });
        return NextResponse.json(
            { success: false, error: "Could not update donation roles" },
            { status: 400 }
        );
    }

    const fields: APIEmbedField[] = [];
    if (roles.added.length > 0) fields.push({ name: "Roles added", value: roles.added.map(role => `<@&${role}>`).join("\n") });
    if (roles.removed.length > 0) fields.push({ name: "Roles removed", value: roles.removed.map(role => `<@&${role}>`).join("\n") });

    await FollowupMessage(interaction.token, {
        embeds: [
            {
                title: "Donations updated!",
                description: [
                    `Total: ${formatNumber(newDonation)}`,
                    `Raw: ${newDonation}`
                ].join("\n"),
                fields: fields.length > 0 ? fields : undefined,
                color: 0xFB9B00,
                footer: {
                    text: `Response time: ${Date.now() - timestamp.getTime()}ms`,
                },
                timestamp: new Date().toISOString()
            }
        ]
    });

    const totalDonation = await getTotalDonation();
    await updateDonationTotal(totalDonation);

    return NextResponse.json(
        { success: true },
        { status: 200 }
    );
}

export async function removeDonation(
    interaction: APIChatInputApplicationCommandInteraction,
    userid: Snowflake,
    amount: string
): Promise<
    NextResponse<
        {
            success: boolean;
            error?: string;
        } | APIInteractionResponse
    >
> {
    const timestamp = ConvertSnowflakeToDate(interaction.id);

    if (!interaction.member) {
        await FollowupMessage(interaction.token, {
            content: "Could not find who ran the command!"
        });
        return NextResponse.json(
            { success: false, error: "Could not find who ran the command" },
            { status: 400 }
        );
    }
    if (!interaction.member.roles.includes(IsleofDucks.roles.admin)) {
        await FollowupMessage(interaction.token, {
            content: "You don't have permission to use this command!"
        });
        return NextResponse.json(
            { success: false, error: "You don't have permission to use this command" },
            { status: 403 }
        );
    }

    const amountNumber = parseNumber(amount);
    if (!amountNumber) {
        await FollowupMessage(interaction.token, {
            embeds: [
                {
                    title: "Something went wrong!",
                    description: "Invalid amount",
                    color: 0xB00020,
                    footer: {
                        text: `Response time: ${Date.now() - timestamp.getTime()}ms`,
                    },
                    timestamp: new Date().toISOString()
                }
            ],
        });
        return NextResponse.json(
            { success: false, error: "Invalid amount" },
            { status: 400 }
        );
    }

    const donation = await getDonation(userid);
    if (!donation) {
        await FollowupMessage(interaction.token, {
            embeds: [
                {
                    title: "Something went wrong!",
                    description: "Could not get donation",
                    color: 0xB00020,
                    footer: {
                        text: `Response time: ${Date.now() - timestamp.getTime()}ms`,
                    },
                    timestamp: new Date().toISOString()
                }
            ],
        });
        return NextResponse.json(
            { success: false, error: "Could not get donation" },
            { status: 400 }
        )
    }

    const newDonation = Math.max(0, Number(Number(donation.donation) - Number(amountNumber)));

    await setDonation(userid, newDonation);

    const roles = await updateDonationRoles(newDonation, userid);
    if (!roles) {
        await FollowupMessage(interaction.token, {
            embeds: [
                {
                    title: "Something went wrong!",
                    description: "Could not update donation roles",
                    color: 0xB00020,
                    footer: {
                        text: `Response time: ${Date.now() - timestamp.getTime()}ms`,
                    },
                    timestamp: new Date().toISOString()
                }
            ],
        });
        return NextResponse.json(
            { success: false, error: "Could not update donation roles" },
            { status: 400 }
        );
    }

    const fields: APIEmbedField[] = [];
    if (roles.added.length > 0) fields.push({ name: "Roles added", value: roles.added.map(role => `<@&${role}>`).join("\n") });
    if (roles.removed.length > 0) fields.push({ name: "Roles removed", value: roles.removed.map(role => `<@&${role}>`).join("\n") });

    await FollowupMessage(interaction.token, {
        embeds: [
            {
                title: "Donations updated!",
                description: [
                    `Total: ${formatNumber(newDonation)}`,
                    `Raw: ${newDonation}`
                ].join("\n"),
                fields: fields.length > 0 ? fields : undefined,
                color: 0xFB9B00,
                footer: {
                    text: `Response time: ${Date.now() - timestamp.getTime()}ms`,
                },
                timestamp: new Date().toISOString()
            }
        ]
    });

    const totalDonation = await getTotalDonation();
    await updateDonationTotal(totalDonation);

    return NextResponse.json(
        { success: true },
        { status: 200 }
    );
}

export async function viewDonations(
    interaction: APIChatInputApplicationCommandInteraction
): Promise<
    NextResponse<
        {
            success: boolean;
            error?: string;
        } | APIInteractionResponse
    >
> {
    const timestamp = ConvertSnowflakeToDate(interaction.id);

    const donations = await getDonations(0, 25);
    const donationCount = await getDonationsCount();
    const donationsTotal = await getTotalDonation();
    if (!donations.length || !donationCount || !donationsTotal) {
        await FollowupMessage(interaction.token, {
            content: null,
            embeds: [
                {
                    title: "Something went wrong!",
                    description: "Could not get donations",
                    color: 0xB00020,
                    footer: {
                        text: `Response time: ${Date.now() - timestamp.getTime()}ms`,
                    },
                    timestamp: new Date().toISOString()
                }
            ],
        });
        return NextResponse.json(
            { success: false, error: "Could not get donations" },
            { status: 400 }
        );
    }

    if (donations.length === 0 || donationCount === 0 || donationsTotal === 0) {
        await FollowupMessage(interaction.token, {
            content: null,
            embeds: [
                {
                    title: "There are no donations!",
                    color: 0xFB9B00,
                    footer: {
                        text: `Response time: ${Date.now() - timestamp.getTime()}ms`,
                    },
                    timestamp: new Date().toISOString()
                }
            ],
        });
        return NextResponse.json(
            { success: false, error: "There are no donations" },
            { status: 400 }
        )
    }

    await FollowupMessage(interaction.token, {
        embeds: [
            {
                title: `Donations - ${formatNumber(donationsTotal, 3)}`,
                color: 0xFB9B00,
                description: donations.map(donation => `<@${donation.discordid}> - ${formatNumber(donation.donation, 3)}`).join('\n'),
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
                        custom_id: 'donor-page_0',
                        type: ComponentType.Button,
                        label: '◀️',
                        style: ButtonStyle.Primary,
                        disabled: true
                    },
                    {
                        custom_id: 'donor-page_2',
                        type: ComponentType.Button,
                        label: '▶️',
                        style: ButtonStyle.Primary,
                        disabled: Math.ceil(donationCount / 25) < 2
                    }
                ]
            }
        ]
    });

    await updateDonationTotal(donationsTotal);

    return NextResponse.json(
        { success: true },
        { status: 200 }
    );
}

export async function checkDonation(
    interaction: APIChatInputApplicationCommandInteraction,
    userid: Snowflake,
): Promise<
    NextResponse<
        {
            success: boolean;
            error?: string;
        } | APIInteractionResponse
    >
> {
    const timestamp = ConvertSnowflakeToDate(interaction.id);

    const donation = await getDonation(userid);
    if (!donation) {
        await FollowupMessage(interaction.token, {
            content: null,
            embeds: [
                {
                    title: "Something went wrong!",
                    description: "Could not get donation",
                    color: 0xB00020,
                    footer: {
                        text: `Response time: ${Date.now() - timestamp.getTime()}ms`,
                    },
                    timestamp: new Date().toISOString()
                }
            ],
        });
        return NextResponse.json(
            { success: false, error: "Could not get donation" },
            { status: 400 }
        )
    }

    const currentRole = IsleofDucks.roles.donor.sort((a, b) => b.requirement - a.requirement).find(role => donation.donation >= role.requirement);
    const nextRole = IsleofDucks.roles.donor.sort((a, b) => a.requirement - b.requirement).find(role => donation.donation < role.requirement);

    const description = [
        `Donated: ${formatNumber(donation.donation)}`,
        `Raw: ${donation.donation}`,
        `Rank: ${currentRole ? `<@&${currentRole.id}>` : 'None'}`
    ];

    if (nextRole) {
        description.push(`Until Next Rank: ${nextRole.requirement - donation.donation}`);
    }

    await FollowupMessage(interaction.token, {
        embeds: [
            {
                title: `Donations for ${donation.discordname}`,
                color: 0xFB9B00,
                description: description.join('\n'),
                footer: {
                    text: `Response time: ${Date.now() - timestamp.getTime()}ms`,
                },
                timestamp: new Date().toISOString()
            }
        ],
    });

    const totalDonation = await getTotalDonation();
    await updateDonationTotal(totalDonation);

    return NextResponse.json(
        { success: true },
        { status: 200 }
    );
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
    // User sees the "[bot] is thinking..." message
    await CreateInteractionResponse(interaction.id, interaction.token, {
        type: InteractionResponseType.DeferredChannelMessageWithSource,
    });

    const timestamp = ConvertSnowflakeToDate(interaction.id);

    if (!interaction.data) {
        await FollowupMessage(interaction.token, {
            content: null,
            embeds: [
                {
                    title: "Something went wrong!",
                    description: "Missing interaction data",
                    color: 0xB00020,
                    footer: {
                        text: `Response time: ${Date.now() - timestamp.getTime()}ms`,
                    },
                    timestamp: new Date().toISOString()
                }
            ],
        });
        return NextResponse.json(
            { success: false, error: "Missing interaction data" },
            { status: 400 }
        );
    }
    const interactionData = interaction.data as APIChatInputApplicationCommandInteractionData;
    if (!interactionData.options) {
        await FollowupMessage(interaction.token, {
            content: null,
            embeds: [
                {
                    title: "Something went wrong!",
                    description: "Missing interaction data options",
                    color: 0xB00020,
                    footer: {
                        text: `Response time: ${Date.now() - timestamp.getTime()}ms`,
                    },
                    timestamp: new Date().toISOString()
                }
            ],
        });
        return NextResponse.json(
            { success: false, error: "Missing interaction data options" },
            { status: 400 }
        );
    }
    // I'm not improving this :sob:
    const options = Object.fromEntries(interactionData.options.map(option => {
        if ('value' in option) {
            return [option.name, option.value];
        } else if (option.options) {
            return [option.name, Object.fromEntries(option.options.map(option => {
                if ('value' in option) {
                    return [option.name, option.value];
                } else if (option.options) {
                    return [option.name, Object.fromEntries(option.options.map(option => {
                        return [option.name, option.value]
                }   ))];
                } else {
                    return [option.name, null];
                }
        }   ))];
        } else {
            return [option.name, null];
        }
    }));

    if (options.add) {
        return await addDonation(interaction, options.add.user, options.add.amount);
    } else if (options.remove) {
        return await removeDonation(interaction, options.remove.user, options.remove.amount);
    } else if (options.view) {
        return await viewDonations(interaction);
    } else if (options.check) {
        return await checkDonation(interaction, options.check.user);
    } else if (options.update) {
        return await updateDonation(interaction);
    }

    await FollowupMessage(interaction.token, {
        embeds: [
            {
                title: "Something went wrong!",
                description: "Unknown command",
                color: 0xFB9B00,
                footer: {
                    text: `Response time: ${Date.now() - timestamp.getTime()}ms`,
                },
                timestamp: new Date().toISOString()
            }
        ],
    });
    return NextResponse.json(
        { success: false, error: "Unknown command" },
        { status: 404 }
    );
}
export const CommandData = {
    name: "donor",
    description: "List or edit donations.",
    options: [
        {
            name: "add",
            description: "Add a donation entry.",
            type: ApplicationCommandOptionType.Subcommand,
            options: [
                {
                    name: "user",
                    description: "The user.",
                    type: ApplicationCommandOptionType.User,
                    required: true
                },
                {
                    name: "amount",
                    description: "The amount of the donation. (accepts 'k', 'm', 'b')",
                    type: ApplicationCommandOptionType.String,
                    required: true,
                }
            ]
        },
        {
            name: "remove",
            description: "Remove a donation entry.",
            type: ApplicationCommandOptionType.Subcommand,
            options: [
                {
                    name: "user",
                    description: "The user.",
                    type: ApplicationCommandOptionType.User,
                    required: true
                },
                {
                    name: "amount",
                    description: "The amount of the donation. (accepts 'k', 'm', 'b')",
                    type: ApplicationCommandOptionType.String,
                    required: true,
                }
            ]
        },
        {
            name: "view",
            description: "View the donation list.",
            type: ApplicationCommandOptionType.Subcommand
        },
        {
            name: "check",
            description: "Displays details on a users donation entry.",
            type: ApplicationCommandOptionType.Subcommand,
            options: [
                {
                    name: "user",
                    description: "The user.",
                    type: ApplicationCommandOptionType.User,
                    required: true
                }
            ]
        },
        {
            name: "update",
            description: "Updates the channel name.",
            type: ApplicationCommandOptionType.Subcommand
        }
    ]
}