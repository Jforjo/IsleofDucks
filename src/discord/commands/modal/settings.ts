import { CreateInteractionResponse, FollowupMessage, IsleofDucks } from "@/discord/discordUtils";
import { setSettingValue } from "@/discord/utils";
import { APIModalSubmitInteraction, APIInteractionResponse, InteractionResponseType, MessageFlags, ComponentType, APIMessageTopLevelComponent, ButtonStyle } from "discord-api-types/v10";
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
    const guildID = interaction.guild_id;
    if (!guildID) {
        await CreateInteractionResponse(interaction.id, interaction.token, {
            type: InteractionResponseType.ChannelMessageWithSource,
            data: {
                flags: MessageFlags.Ephemeral,
                content: "This modal can only be submitted in a server!"
            }
        });
        return NextResponse.json(
            { success: false, error: "This modal can only be submitted in a server" },
            { status: 400 }
        );
    }
    const member = interaction.member;
    if (!member) {
        await CreateInteractionResponse(interaction.id, interaction.token, {
            type: InteractionResponseType.ChannelMessageWithSource,
            data: {
                flags: MessageFlags.Ephemeral,
                content: "Could not find who ran the submitted the modal!"
            }
        });
        return NextResponse.json(
            { success: false, error: "Could not find who ran the submitted the modal" },
            { status: 400 }
        );
    }
    if (!(
        member.roles.includes(IsleofDucks.roles.admin)
    )) {
        await CreateInteractionResponse(interaction.id, interaction.token, {
            type: InteractionResponseType.ChannelMessageWithSource,
            data: {
                flags: MessageFlags.Ephemeral,
                content: "You don't have permission to submit this modal!"
            }
        });
        return NextResponse.json(
            { success: false, error: "You don't have permission to submit this modal" },
            { status: 403 }
        );
    }

    const action = interaction.data.custom_id.split("-")[1];
    const key = interaction.data.custom_id.split("-")[2];

    if (action != "edit") {
        await CreateInteractionResponse(interaction.id, interaction.token, {
            type: InteractionResponseType.ChannelMessageWithSource,
            data: {
                flags: MessageFlags.Ephemeral,
                content: "Unknown action for this modal!"
            }
        });
        return NextResponse.json(
            { success: false, error: "Unknown action for this modal" },
            { status: 400 }
        );
    }

    const components = Object.fromEntries(interaction.data.components.map(component => {
        if (component.type !== ComponentType.Label) return null;
        return [
            component.component.custom_id,
            component
        ];
    }).filter((c): c is [string, Extract<APIModalSubmitInteraction["data"]["components"][number], { type: ComponentType.Label }>] => c !== null));

    if (!components["value"] ||
        components["value"].component.type !== ComponentType.TextInput) {
        await CreateInteractionResponse(interaction.id, interaction.token, {
            type: InteractionResponseType.ChannelMessageWithSource,
            data: {
                flags: MessageFlags.Ephemeral,
                content: "Missing value input in modal!"
            }
        });
        return NextResponse.json(
            { success: false, error: "Missing value input in modal" },
            { status: 400 }
        );
    }

    const value = components["value"].component.value;

    await setSettingValue(key, value);

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
                        if (!component.accessory.custom_id.includes(interaction.data.custom_id.split("-")[2])) return component;

                        return {
                            ...component,
                            components: [
                                {
                                    type: ComponentType.TextDisplay,
                                    content: `**${key}**: ${value}`,
                                }
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