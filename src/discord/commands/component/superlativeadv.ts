import { APIInteractionResponse, APIMessageComponentButtonInteraction, ButtonStyle, ComponentType, InteractionResponseType, MessageFlags, TextInputStyle } from "discord-api-types/v10";
import { NextResponse } from "next/server";
import { viewSuperlativeAdv, viewSuperlativeAdvWithDate } from "../application/superlativeadv";
import { CreateInteractionResponse, IsleofDucks } from "@/discord/discordUtils";
import { createSuperlative } from "@/discord/utils";
import superlativeTypes from "@/discord/superlatives";
import SuperlativeTypes from "@/discord/superlatives";

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

    const rankRegex = /^\[?([a-zA-Z]{1,6})\]? ([a-zA-Z\s]+)$/gm;
    const reqRegex = /^Req: ([0-9]+)$/gm;
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

        const rankMatch = rankRegex.exec(section.components[0].content);
        if (!rankMatch) return;
        const reqMatch = reqRegex.exec(section.components[1].content);
        if (!reqMatch) return;

        return {
            type: btnId.includes("duckrank") ? "duck" : "duckling",
            id: rankMatch[1],
            name: rankMatch[2],
            requirement: Number(reqMatch[1])
        }
    }).filter((section) => section !== undefined);

    const superlativeType = Object.entries(SuperlativeTypes).filter(([, v]) => v.title === dataText[2]).map(([k,]) => k)[0] as keyof typeof superlativeTypes;

    const created = await createSuperlative(
        startDate,
        superlativeType,
        Number(dataText[3]),
        sections.filter((section) => section.type === "duck").map((section) => ({ id: section.id.toUpperCase(), name: section.name.toLowerCase(), requirement: section.requirement })),
        sections.filter((section) => section.type === "duckling").map((section) => ({ id: section.id.toUpperCase(), name: section.name.toLowerCase(), requirement: section.requirement }))
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
                    type: ComponentType.ActionRow,
                    components: [
                        {
                            type: ComponentType.TextInput,
                            custom_id: "rankid",
                            label: `${type} Rank ID (i.e. "[RANK]")`,
                            style: TextInputStyle.Short,
                            min_length: 1,
                            max_length: 8,
                            required: true
                        }
                    ]
                },
                {
                    type: ComponentType.ActionRow,
                    components: [
                        {
                            type: ComponentType.TextInput,
                            custom_id: "rankname",
                            label: `${type} Rank Name`,
                            style: TextInputStyle.Short,
                            min_length: 1,
                            max_length: 16,
                            required: true
                        }
                    ]
                },
                {
                    type: ComponentType.ActionRow,
                    components: [
                        {
                            type: ComponentType.TextInput,
                            custom_id: "rankreq",
                            label: `${type} Rank Requirement`,
                            style: TextInputStyle.Short,
                            min_length: 1,
                            max_length: 16,
                            required: true
                        }
                    ]
                }
            ]
        }
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
    }

    return NextResponse.json(
        { success: true },
        { status: 200 }
    );
}