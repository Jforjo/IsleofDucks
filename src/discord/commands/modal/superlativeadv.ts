import { CreateInteractionResponse, IsleofDucks } from "@/discord/discordUtils";
import { APIInteractionResponse, APIMessageTopLevelComponent, APIModalSubmitInteraction, ButtonStyle, ComponentType, InteractionResponseType, MessageFlags } from "discord-api-types/v10";
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

    const customIds = interaction.data.custom_id.split("-");
    if (customIds[1] !== "create") {
        await CreateInteractionResponse(interaction.id, interaction.token, {
            type: InteractionResponseType.ChannelMessageWithSource,
            data: {
                flags: MessageFlags.Ephemeral,
                content: "Invalid command!"
            }
        });
        return NextResponse.json(
            { success: false, error: "Invalid command" },
            { status: 400 }
        )
    }

    const rankIdMatch = /^\[?([a-zA-Z]{1,6})\]?$/gm.exec(interaction.data.components[0].components[0].value);
    if (!rankIdMatch) {
        await CreateInteractionResponse(interaction.id, interaction.token, {
            type: InteractionResponseType.ChannelMessageWithSource,
            data: {
                flags: MessageFlags.Ephemeral,
                content: "Invalid rank ID!"
            }
        });
        return NextResponse.json(
            { success: false, error: "Invalid rank ID" },
            { status: 400 }
        )
    }
    const rankId = rankIdMatch[1].replaceAll("[", "").replaceAll("]", "").toUpperCase();

    const rankReqMatch = /^[0-9]+$/.exec(interaction.data.components[2].components[0].value);
    if (!rankReqMatch) {
        await CreateInteractionResponse(interaction.id, interaction.token, {
            type: InteractionResponseType.ChannelMessageWithSource,
            data: {
                flags: MessageFlags.Ephemeral,
                content: "Invalid rank requirement!"
            }
        });
        return NextResponse.json(
            { success: false, error: "Invalid rank requirement" },
            { status: 400 }
        )
    }
    const rankReq = parseInt(rankReqMatch[0]);

    await CreateInteractionResponse(interaction.id, interaction.token, {
        type: InteractionResponseType.UpdateMessage,
        data: {
            flags: MessageFlags.IsComponentsV2,
            components: interaction.message?.components?.map((component) => {
                if (component.type !== ComponentType.Container) return component;

                return {
                    ...component,
                    components: component.components.map((component) => {
                        if (component.type !== ComponentType.Section) return component;
                        if (component.accessory.type !== ComponentType.Button) return component;
                        if (component.accessory.style !== ButtonStyle.Secondary) return component;
                        if (!component.accessory.custom_id.includes(customIds[2])) return component;

                        return {
                            ...component,
                            components: [
                                {
                                    type: ComponentType.TextDisplay,
                                    content: `[${rankId}] ${interaction.data.components[1].components[0].value}`,
                                },
                                {
                                    type: ComponentType.TextDisplay,
                                    content: `Req: ${rankReq}`,
                                },
                            ]
                        }
                    })
                }
            }) as APIMessageTopLevelComponent[]
        }
    });

    return NextResponse.json(
        { success: true },
        { status: 200 }
    );
}