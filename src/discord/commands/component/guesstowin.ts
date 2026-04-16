import { ConvertSnowflakeToDate, CreateInteractionResponse, EditChannel, ErrorEmbed, FollowupMessage, IsleofDucks, PinMessage, SendMessage, ToPermissions } from "@/discord/discordUtils";
import { getHypixelItems } from "@/discord/hypixelUtils";
import { createGuessToWin } from "@/discord/utils";
import { APIComponentInContainer, APIInteractionResponse, APIMessageComponentButtonInteraction, ButtonStyle, ComponentType, InteractionResponseType, MessageFlags, OverwriteType, TextInputStyle } from "discord-api-types/v10";
import { NextResponse } from "next/server";

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
    const timestamp = ConvertSnowflakeToDate(interaction.id)

    const customIds = interaction.data.custom_id.split("-");

    if (customIds[1] === "setup") {
        if (customIds[2] === "answer") await CreateInteractionResponse(interaction.id, interaction.token, {
            type: InteractionResponseType.Modal,
            data: {
                custom_id: `guesstowin-setup-answer`,
                title: "GtW Setup - Answer",
                components: [
                    {
                        type: ComponentType.Label,
                        label: "Answer",
                        description: "Must be spelt perfectly. (case-sensitive)",
                        component: {
                            type: ComponentType.TextInput,
                            custom_id: "answer",
                            style: TextInputStyle.Short,
                            required: true,
                        }
                    }
                ]
            }
        });
        else if (customIds[2] === "hints") await CreateInteractionResponse(interaction.id, interaction.token, {
            type: InteractionResponseType.Modal,
            data: {
                custom_id: `guesstowin-setup-hints`,
                title: "GtW Setup - Hint",
                components: [
                    {
                        type: ComponentType.Label,
                        label: "At number of guesses",
                        component: {
                            type: ComponentType.TextInput,
                            custom_id: "at",
                            style: TextInputStyle.Short,
                            required: true,
                        }
                    },
                    {
                        type: ComponentType.Label,
                        label: "Hint",
                        component: {
                            type: ComponentType.TextInput,
                            custom_id: "hint",
                            style: TextInputStyle.Short,
                            required: true,
                        }
                    }
                ]
            }
        });
        else if (customIds[2] === "prize") await CreateInteractionResponse(interaction.id, interaction.token, {
            type: InteractionResponseType.Modal,
            data: {
                custom_id: `guesstowin-setup-prize`,
                title: "GtW Setup - Prize",
                components: [
                    {
                        type: ComponentType.Label,
                        label: "Prize",
                        component: {
                            type: ComponentType.TextInput,
                            custom_id: "prize",
                            style: TextInputStyle.Short,
                            required: true,
                        }
                    }
                ]
            }
        });
        else if (customIds[2] === "create") {
            if (
                !interaction.message.components ||
                interaction.message.components[0].type !== ComponentType.Container ||
                interaction.message.components[0].components[2].type !== ComponentType.TextDisplay || 
                interaction.message.components[0].components[3].type !== ComponentType.Section ||
                interaction.message.components[0].components[4].type !== ComponentType.Section
            ) {
                await CreateInteractionResponse(interaction.id, interaction.token, {
                    type: InteractionResponseType.ChannelMessageWithSource,
                    data: {
                        flags: MessageFlags.Ephemeral | MessageFlags.IsComponentsV2,
                        components: ErrorEmbed("Invalid setup message", timestamp, true),
                    }
                });
                return NextResponse.json(
                    { success: false, error: "Invalid setup message" },
                    { status: 400 }
                )
            }

            const sponsor = customIds[3];
            const answer = interaction.message.components[0].components[2].content.split(": ").slice(1).join(": ").trim();
            // Is valid answer
            const items = await getHypixelItems();
            if (!items.success) {
                await CreateInteractionResponse(interaction.id, interaction.token, {
                    type: InteractionResponseType.ChannelMessageWithSource,
                    data: {
                        flags: MessageFlags.Ephemeral | MessageFlags.IsComponentsV2,
                        components: ErrorEmbed(`Failed to fetch Hypixel items: ${items.message}`, timestamp, true),
                    }
                });
                return NextResponse.json(
                    { success: false, error: `Failed to fetch Hypixel items: ${items.message}` },
                    { status: 400 }
                )
            }
            const item = items.items?.find(i => i?.name?.toLowerCase() === answer.toLowerCase());
            if (!items.items || !item) {
                await CreateInteractionResponse(interaction.id, interaction.token, {
                    type: InteractionResponseType.ChannelMessageWithSource,
                    data: {
                        flags: MessageFlags.Ephemeral | MessageFlags.IsComponentsV2,
                        components: ErrorEmbed("Invalid answer provided. Must be a valid Hypixel item name.", timestamp, true),
                    }
                });
                return NextResponse.json(
                    { success: false, error: "Invalid answer provided. Must be a valid Hypixel item name." },
                    { status: 400 }
                )
            }

            const prize = interaction.message.components[0].components[4].components.length === 2 ? interaction.message.components[0].components[4].components[1].content : null;
            const hints = interaction.message.components[0].components[3].components.length > 1 ? interaction.message.components[0].components[3].components[1].content.split("\n").map(row => {
                // At ${inputs.at} guesses: ${inputs.hint}
                const match = row.match(/^At (\d+) guesses: (.+)$/);
                if (!match) return;
                return {
                    at: parseInt(match[1]),
                    hint: match[2]
                }
            }).filter(h => h !== undefined) : undefined;

            const game = await createGuessToWin(answer, prize, sponsor, hints);
            if (!game) {
                await CreateInteractionResponse(interaction.id, interaction.token, {
                    type: InteractionResponseType.ChannelMessageWithSource,
                    data: {
                        flags: MessageFlags.Ephemeral | MessageFlags.IsComponentsV2,
                        components: ErrorEmbed("Failed to create game", timestamp, true),
                    }
                });
                return NextResponse.json(
                    { success: false, error: "Failed to create game" },
                    { status: 500 }
                )
            }

            const components: APIComponentInContainer[] = [
                {
                    type: ComponentType.TextDisplay,
                    content: `## New Guess to Win Game!`,
                },
            ];
            if (sponsor)
                components.push({
                    type: ComponentType.TextDisplay,
                    content: `Sponsored by <@${IsleofDucks.staticIDs.Jforjo}>`,
                });
            if (prize)
                components.push({
                    type: ComponentType.TextDisplay,
                    content: `Prize: **${prize}**`,
                });
            // components.push({ type: ComponentType.Separator });
            // components.push({
            //     type: ComponentType.TextDisplay,
            //     content: `GtW ID: ${game} • Total guesses: 0`,
            // });
            const message = await SendMessage(IsleofDucks.channels.guesstowin, {
                flags: MessageFlags.IsComponentsV2,
                components: [
                    {
                        type: ComponentType.TextDisplay,
                        content: `<@&${IsleofDucks.roles.chat_revive}>${prize ? ` <@&${IsleofDucks.roles.giveaway}>` : ''}`
                    },
                    {
                        type: ComponentType.Container,
                        accent_color: IsleofDucks.colours.main,
                        components: components
                    },
                ]
            });

            if (message) {
                const pinned = await PinMessage(message.channel_id, message.id, "Pinning new Guess to Win game");
                if (!pinned) {
                    await CreateInteractionResponse(interaction.id, interaction.token, {
                        type: InteractionResponseType.ChannelMessageWithSource,
                        data: {
                            flags: MessageFlags.Ephemeral | MessageFlags.IsComponentsV2,
                            components: ErrorEmbed("Failed to pin game message. Please pin it manually.", timestamp, true),
                        }
                    });
                    return NextResponse.json(
                        { success: false, error: "Failed to pin game message. Please pin it manually." },
                        { status: 500 }
                    )
                }
            }

            const response = await SendMessage(IsleofDucks.channels.duckoc, {
                content: `guesstowin ${game}`
            });
            if (!response) {
                await CreateInteractionResponse(interaction.id, interaction.token, {
                    type: InteractionResponseType.ChannelMessageWithSource,
                    data: {
                        flags: MessageFlags.Ephemeral | MessageFlags.IsComponentsV2,
                        components: ErrorEmbed("Failed to send game data to DuckOC. Game will not function properly.", timestamp, true),
                    }
                });
                return NextResponse.json(
                    { success: false, error: "Failed to send game data to DuckOC. Game will not function properly." },
                    { status: 500 }
                )
            }

            // Allow people to see/type in the channel
            await EditChannel(IsleofDucks.channels.guesstowin, {
                topic: `${game} | Guesses so far: 0 | ${prize ? `${prize} ` : ''}${sponsor ? `sponsored by <@${sponsor}>` : 'Guess to Win'}`,
                permission_overwrites: [
                    {
                        id: IsleofDucks.serverID,
                        type: OverwriteType.Role,
                        allow: ToPermissions({
                            view_channel: true,
                        }),
                        deny: ToPermissions({
                            send_messages: true,
                        })
                    },
                    {
                        id: IsleofDucks.roles.verified,
                        type: OverwriteType.Role,
                        allow: ToPermissions({
                            send_messages: true,
                        }),
                    }
                ]
            });

            await CreateInteractionResponse(interaction.id, interaction.token, {
                type: InteractionResponseType.ChannelMessageWithSource,
                data: {
                    flags: MessageFlags.Ephemeral | MessageFlags.IsComponentsV2,
                    components: [
                        {
                            type: ComponentType.TextDisplay,
                            content: `Game created successfully!`
                        }
                    ]
                }
            });
        }
    }

    return NextResponse.json(
        { success: true },
        { status: 200 }
    );
}