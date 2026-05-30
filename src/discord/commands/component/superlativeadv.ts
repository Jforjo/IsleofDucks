import { APIInteractionResponse, APIMessageComponentButtonInteraction, ButtonStyle, ComponentType, InteractionResponseType, MessageFlags, TextInputStyle } from "discord-api-types/v10";
import { NextResponse } from "next/server";
import { viewSuperlativeAdv, viewSuperlativeAdvWithDate } from "../application/superlativeadv";
import { ConvertSnowflakeToDate, CreateInteractionResponse, FollowupMessage, formatNumber, getSuperlativeValue, IsleofDucks } from "@/discord/discordUtils";
import { createSuperlative } from "@/discord/utils";
import SuperlativeTypes from "@/discord/superlatives";
import { getGuildData, getProfiles, getUsernameOrUUID } from "@/discord/hypixelUtils";

async function createSuperlativeAdv(
    interaction: APIMessageComponentButtonInteraction
): Promise<
    NextResponse<
        {
            success: boolean;
            error?: string;
        } | APIInteractionResponse
    >
> {
    if (!interaction.member) {
        await CreateInteractionResponse(interaction.id, interaction.token, {
            type: InteractionResponseType.ChannelMessageWithSource,
            data: {
                flags: MessageFlags.Ephemeral,
                content: "Could not find who ran the command!"
            }
        });
        return NextResponse.json(
            { success: false, error: "Could not find who ran the command" },
            { status: 400 }
        )
    }
    if (!interaction.member.roles.includes(IsleofDucks.roles.admin)) {
        await CreateInteractionResponse(interaction.id, interaction.token, {
            type: InteractionResponseType.ChannelMessageWithSource,
            data: {
                flags: MessageFlags.Ephemeral,
                content: "You do not have permission to run this command!"
            }
        });
        return NextResponse.json(
            { success: false, error: "You do not have permission to run this command" },
            { status: 403 }
        )
    }

    if (!interaction.message.components) {
        await CreateInteractionResponse(interaction.id, interaction.token, {
            type: InteractionResponseType.ChannelMessageWithSource,
            data: {
                flags: MessageFlags.Ephemeral,
                content: "Missing components"
            }
        })
        return NextResponse.json(
            { success: false, error: "Missing components" },
            { status: 400 }
        );
    }
    if (interaction.message.components[0].type !== ComponentType.Container || interaction.message.components[0].components[1].type !== ComponentType.TextDisplay) {
        await CreateInteractionResponse(interaction.id, interaction.token, {
            type: InteractionResponseType.ChannelMessageWithSource,
            data: {
                flags: MessageFlags.Ephemeral,
                content: "Invalid components"
            }
        })
        return NextResponse.json(
            { success: false, error: "Invalid components" },
            { status: 400 }
        );
    }

    const dataText = /^Start Date: \*\*([a-zA-Z]+ [0-9]{4})\*\*\nType: \*\*([a-zA-Z\s]+)\*\*\nDecimals: \*\*([0-3])\*\*$/gm.exec(interaction.message.components[0].components[1].content);
    if (!dataText) {
        await CreateInteractionResponse(interaction.id, interaction.token, {
            type: InteractionResponseType.ChannelMessageWithSource,
            data: {
                flags: MessageFlags.Ephemeral,
                content: "Invalid data"
            }
        })
        return NextResponse.json(
            { success: false, error: "Invalid data" },
            { status: 400 }
        );
    }
    const startDateObj = new Date(dataText[1]);
    if (startDateObj.toString() === "Invalid Date") {
        await CreateInteractionResponse(interaction.id, interaction.token, {
            type: InteractionResponseType.ChannelMessageWithSource,
            data: {
                flags: MessageFlags.Ephemeral,
                content: "Invalid date"
            }
        })
        return NextResponse.json(
            { success: false, error: "Invalid date" },
            { status: 400 }
        );
    }
    const startDate = `${startDateObj.getUTCFullYear()}-${(startDateObj.getUTCMonth() + 1).toString().padStart(2, '0')}-01`;

    const sections = interaction.message.components[0].components.filter((component) => component.type === ComponentType.Section).map((section) => {
        if (section.accessory.type !== ComponentType.Button) return;
        if (section.accessory.style !== ButtonStyle.Secondary) return;
        const btnId = section.accessory.custom_id.split("-")[2];
        if (!btnId.includes("duckrank") && !btnId.includes("ducklingrank")) return;

        const rankMatch = /^\[?([a-zA-Z]{1,6})\]? ([a-zA-Z\s]+)$/gm.exec(section.components[0].content);
        if (!rankMatch) {
            return false;
        }
        const reqMatch = /^Req: ([0-9]+)$/gm.exec(section.components[1].content);
        if (!reqMatch) {
            return false;
        }

        return {
            type: btnId.includes("duckrank") ? "duck" : "duckling",
            id: rankMatch[1],
            name: rankMatch[2],
            requirement: Number(reqMatch[1])
        }
    }).filter((section) => section !== undefined);

    if (sections.filter((section) => section === false).length > 0) {
        await CreateInteractionResponse(interaction.id, interaction.token, {
            type: InteractionResponseType.ChannelMessageWithSource,
            data: {
                flags: MessageFlags.Ephemeral,
                content: "Failed to read rank values"
            }
        })
        return NextResponse.json(
            { success: false, error: "Failed to read rank values" },
            { status: 400 }
        );
    }

    const rankData = sections.filter((section) => section !== false);

    const superlativeType = Object.entries(SuperlativeTypes).filter(([, v]) => v.title === dataText[2]).map(([k,]) => k)[0] as keyof typeof SuperlativeTypes;

    const created = await createSuperlative(
        startDate,
        superlativeType,
        Number(dataText[3]),
        rankData.filter((section) => section.type === "duck").map((section) => ({ id: section.id.toUpperCase(), name: section.name.toLowerCase(), requirement: section.requirement })),
        rankData.filter((section) => section.type === "duckling").map((section) => ({ id: section.id.toUpperCase(), name: section.name.toLowerCase(), requirement: section.requirement }))
    );

    if (!created) {
        await CreateInteractionResponse(interaction.id, interaction.token, {
            type: InteractionResponseType.ChannelMessageWithSource,
            data: {
                flags: MessageFlags.Ephemeral,
                content: "Failed to create superlative"
            }
        })
        return NextResponse.json(
            { success: false, error: "Failed to create superlative" },
            { status: 400 }
        );
    }

    await CreateInteractionResponse(interaction.id, interaction.token, {
        type: InteractionResponseType.UpdateMessage,
        data: {
            flags: MessageFlags.IsComponentsV2,
            components: [
                {
                    type: ComponentType.Container,
                    accent_color: IsleofDucks.colours.main,
                    components: [
                        {
                            type: ComponentType.TextDisplay,
                            content: `## Superlative Created!`
                        }
                    ]
                }
            ]
        }
    })

    return NextResponse.json(
        { success: true },
        { status: 200 }
    );
}

async function createRanks(
    interaction: APIMessageComponentButtonInteraction,
    input: string
): Promise<
    NextResponse<
        {
            success: boolean;
            error?: string;
        } | APIInteractionResponse
    >
> {
    if (!interaction.member) {
        await CreateInteractionResponse(interaction.id, interaction.token, {
            type: InteractionResponseType.ChannelMessageWithSource,
            data: {
                flags: MessageFlags.Ephemeral,
                content: "Could not find who ran the command!"
            }
        });
        return NextResponse.json(
            { success: false, error: "Could not find who ran the command" },
            { status: 400 }
        )
    }
    if (!interaction.member.roles.includes(IsleofDucks.roles.admin)) {
        await CreateInteractionResponse(interaction.id, interaction.token, {
            type: InteractionResponseType.ChannelMessageWithSource,
            data: {
                flags: MessageFlags.Ephemeral,
                content: "You do not have permission to run this command!"
            }
        });
        return NextResponse.json(
            { success: false, error: "You do not have permission to run this command" },
            { status: 403 }
        )
    }
    
    const type = input.includes("duck") ? "Duck" : "Duckling";

    await CreateInteractionResponse(interaction.id, interaction.token, {
        type: InteractionResponseType.Modal,
        data: {
            custom_id: `superlativeadv-create-${input}`,
            title: `Create ${type} Rank`,
            components: [
                {
                    type: ComponentType.Label,
                    label: `${type} Rank Tag`,
                    description: `i.e. "[RANK]"`,
                    component: {
                        type: ComponentType.TextInput,
                        custom_id: "rankid",
                        placeholder: `Enter the ${type} Rank Tag`,
                        style: TextInputStyle.Short,
                        min_length: 1,
                        max_length: 8,
                        required: true
                    }
                },
                {
                    type: ComponentType.Label,
                    label: `${type} Rank Name`,
                    component: {
                        type: ComponentType.TextInput,
                        custom_id: "rankname",
                        placeholder: `Enter the ${type} Rank Name`,
                        style: TextInputStyle.Short,
                        min_length: 1,
                        max_length: 16,
                        required: true
                    }
                },
                {
                    type: ComponentType.Label,
                    label: `${type} Rank Requirement`,
                    component: {
                        type: ComponentType.TextInput,
                        custom_id: "rankreq",
                        placeholder: `Enter the ${type} Rank Requirement`,
                        style: TextInputStyle.Short,
                        min_length: 1,
                        max_length: 16,
                        required: true
                    }
                }
            ]
        }
    });

    return NextResponse.json(
        { success: true },
        { status: 200 }
    );
}

async function testSuperlativeAdv(
    interaction: APIMessageComponentButtonInteraction,
    guild: string,
    type: string
): Promise<
    NextResponse<
        {
            success: boolean;
            error?: string;
        } | APIInteractionResponse
    >
> {
    if (!interaction.member) {
        await CreateInteractionResponse(interaction.id, interaction.token, {
            type: InteractionResponseType.ChannelMessageWithSource,
            data: {
                flags: MessageFlags.Ephemeral,
                content: "Could not find who ran the command!"
            }
        });
        return NextResponse.json(
            { success: false, error: "Could not find who ran the command" },
            { status: 400 }
        )
    }
    if (!interaction.member.roles.includes(IsleofDucks.roles.admin)) {
        await CreateInteractionResponse(interaction.id, interaction.token, {
            type: InteractionResponseType.ChannelMessageWithSource,
            data: {
                flags: MessageFlags.Ephemeral,
                content: "You do not have permission to run this command!"
            }
        });
        return NextResponse.json(
            { success: false, error: "You do not have permission to run this command" },
            { status: 403 }
        )
    }

    await CreateInteractionResponse(interaction.id, interaction.token, {
        type: InteractionResponseType.DeferredMessageUpdate,
    });

    const timestamp = ConvertSnowflakeToDate(interaction.id);
    const superlativeType = SuperlativeTypes[type as keyof typeof SuperlativeTypes];

    const guildPromise = getGuildData(guild === "ducklings" ? "Isle of Ducklings" : "Isle of Ducks");
    const guildUpdateResponse = FollowupMessage(interaction.token, {
        embeds: [
            {
                title: "Superlative - Fetching",
                description: `Fetching ${guild === "ducklings" ? "Isle of Ducklings" : "Isle of Ducks"} guild...`,
                color: 0xFB9B00,
                footer: {
                    text: `Response time: ${Date.now() - timestamp.getTime()}ms`,
                },
                timestamp: new Date().toISOString()
            }
        ]
    });
    const guildData = await guildPromise;
    await guildUpdateResponse;
    if (!guildData.success) {
        let content = undefined;
        if (guildData?.ping === true) content = `<@${IsleofDucks.staticIDs.Jforjo}>`;
        await FollowupMessage(interaction.token, {
            content: content,
            embeds: [
                {
                    title: "Something went wrong!",
                    description: guildData.message === "Key throttle" && typeof guildData.retry === "number" ? [
                        guildData.message,
                        `Try again <t:${Math.floor(( timestamp.getTime() + guildData.retry ) / 1000)}:R>`
                    ].join("\n") : guildData.message,
                    color: 0xB00020,
                    footer: {
                        text: `Response time: ${Date.now() - timestamp.getTime()}ms`,
                    },
                    timestamp: new Date().toISOString()
                }
            ],
        });
        return NextResponse.json(
            { success: false, error: guildData.message },
            { status: 400 }
        );
    }
    
    await FollowupMessage(interaction.token, {
        embeds: [
            {
                title: "Superlative - Fetching",
                description: `Fetching player data...`,
                color: 0xFB9B00,
                footer: {
                    text: `Response time: ${Date.now() - timestamp.getTime()}ms`,
                },
                timestamp: new Date().toISOString()
            }
        ]
    });

    const superlativeResult = await Promise.all(guildData.guild.members.map(async (member) => {
        const mojang = await getUsernameOrUUID(member.uuid);
        if (!mojang.success) throw new Error(mojang.message);
        const valueRes = await fetch(`https://isle-of-ducks.vercel.app/api/superlativevalue/${type}/${member.uuid}`, {
            headers: {
                Authorization: `Bearer ${process.env.BRIDGE_API_KEY}`
            },
            next: {
                revalidate: 600
            }
        });
        const data = await valueRes.json() as {
            success: false;
            message: string;
        } | {
            success: true;
            value: number;
        };
        if (data.success === false) {
            throw new Error(data.message);
        }

        return {
            uuid: member.uuid,
            name: mojang.name,
            value: data.value
        };
    })).catch((err) => {
        console.log(err.message);
        return {
            success: false,
            message: err.message,
            ping: err.message === "Invalid API key"
        };
    });
    
    if ("success" in superlativeResult && superlativeResult.success === false) {
        let content = undefined;
        if (superlativeResult.ping === true) content = `<@${IsleofDucks.staticIDs.Jforjo}>`;
        await FollowupMessage(interaction.token, {
            content: content,
            embeds: [
                {
                    title: "Something went wrong!",
                    description: superlativeResult.message,
                    color: 0xB00020,
                    footer: {
                        text: `Response time: ${Date.now() - timestamp.getTime()}ms`,
                    },
                    timestamp: new Date().toISOString()
                }
            ],
        });
        return NextResponse.json(
            { success: false, error: superlativeResult.message },
            { status: 400 }
        );
    }
    
    let result = superlativeResult as {
        uuid: string;
        name: string;
        value: number;
    }[];
    // b - a = bigger number first
    result.sort((a, b) => b.value - a.value);
    result = result.map((member, index) => {
        return {
            rank: index + 1,
            uuid: member.uuid,
            name: member.name,
            value: member.value
        };
    });
    const finalResult = result as {
        rank: number;
        uuid: string;
        name: string;
        value: number;
    }[];
    const fieldArray = [];
    const chunkSize = 21;
    for (let i = 0; i < finalResult.length; i += chunkSize) {
        fieldArray.push(
            {
                name: '\u200b',
                value: finalResult.slice(i, i + chunkSize).map((field) => `\`#${field.rank}\` ${field.name.replaceAll('_', '\\_')}: ${field.value}`).join('\n'),
                inline: true
            }
        );
    }

    await FollowupMessage(interaction.token, {
        embeds: [
            {
                title: `Superlative Test for ${superlativeType.title}`,
                // description: ``,
                color: 0xFB9B00,
                fields: fieldArray,
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
                        custom_id: `superlativeadv-test-ducks-${type}`,
                        type: ComponentType.Button,
                        label: "Ducks",
                        style: guild === "ducks" ? ButtonStyle.Success : ButtonStyle.Primary,
                        disabled: guild === "ducks"
                    },
                    {
                        custom_id: `superlativeadv-test-ducklings-${type}`,
                        type: ComponentType.Button,
                        label: "Ducklings",
                        style: guild === "ducklings" ? ButtonStyle.Success : ButtonStyle.Primary,
                        disabled: guild === "ducklings"
                    }
                ]
            }
        ]
    });

    return NextResponse.json(
        { success: true },
        { status: 200 }
    );
}

export default async function(
    interaction: APIMessageComponentButtonInteraction
): Promise<
    NextResponse<
        {
            success: boolean;
            error?: string;
        } | APIInteractionResponse
    >
> {
    // ACK response and update the original message
    // await CreateInteractionResponse(interaction.id, interaction.token, {
    //     type: InteractionResponseType.DeferredChannelMessageWithSource,
    //     data: { flags: MessageFlags.Ephemeral }
    // });

    const customIds = interaction.data.custom_id.split("-");

    if (customIds[1] === "view") {
        if (/^page_[0-9]+$/gm.test(customIds[2])) {
            const page = parseInt(customIds[2].split("_")[1]);
            return await viewSuperlativeAdv(interaction, page);
        } else if (/^[0-9]{4}_[0-9]{2}_01$/gm.test(customIds[2])) {
            const date = customIds[2].replaceAll("_", "-");
            return await viewSuperlativeAdvWithDate(interaction, date);
        }
    } else if (customIds[1] === "create") {
        if (customIds[2] === "create") return await createSuperlativeAdv(interaction);
        else return await createRanks(interaction, customIds[2]);
    } else if (customIds[1] === "test") return await testSuperlativeAdv(interaction, customIds[2], customIds[3]);

    return NextResponse.json(
        { success: true },
        { status: 200 }
    );
}