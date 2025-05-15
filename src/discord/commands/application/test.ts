import { CreateInteractionResponse, FollowupMessage, IsleofDucks, SendMessage } from "@/discord/discordUtils";
import { APIChatInputApplicationCommandInteraction, APIInteractionResponse, ApplicationCommandType, ButtonStyle, ComponentType, InteractionResponseType, MessageFlags, RESTPatchAPIApplicationCommandJSONBody } from "discord-api-types/v10";
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
    const member = interaction.member;
    if (!member) {
        await CreateInteractionResponse(interaction.id, interaction.token, {
            type: InteractionResponseType.ChannelMessageWithSource,
            data: {
                content: "Could not find who ran the command!",
                flags: MessageFlags.Ephemeral
            }
        });
        return NextResponse.json(
            { success: false, error: "Could not find who ran the command" },
            { status: 400 }
        );
    }
    if (!(
        member.user.id === IsleofDucks.staticIDs.Jforjo
        // || member.roles.includes(IsleofDucks.roles.admin)
    )) {
        await CreateInteractionResponse(interaction.id, interaction.token, {
            type: InteractionResponseType.ChannelMessageWithSource,
            data: {
                content: "You do not have permission to run this command!",
                flags: MessageFlags.Ephemeral
            }
        });
        return NextResponse.json(
            { success: false, error: "You do not have permission to run this command" },
            { status: 400 }
        );
    }

    await CreateInteractionResponse(interaction.id, interaction.token, {
        type: InteractionResponseType.DeferredChannelMessageWithSource,
        data: {
            flags: MessageFlags.Ephemeral
        }
    });

    await SendMessage(interaction.channel.id, {
        flags: MessageFlags.IsComponentsV2,
        components: [
            {
                type: ComponentType.Container,
                accent_color: 0xFB9B00,
                components: [
                    {
                        type: ComponentType.ActionRow,
                        components: [
                            {
                                custom_id: "test1",
                                type: ComponentType.Button,
                                label: "Test",
                                style: ButtonStyle.Primary,
                            },
                            {
                                custom_id: "test2",
                                type: ComponentType.Button,
                                label: "Test",
                                style: ButtonStyle.Primary,
                            },
                        ]
                    },
                    {
                        type: ComponentType.TextDisplay,
                        content: "Some text"
                    },
                    {
                        type: ComponentType.Separator
                    },
                    {
                        type: ComponentType.Section,
                        components: [
                            {
                                type: ComponentType.TextDisplay,
                                content: "Some more text"
                            }
                        ],
                        accessory: {
                            custom_id: "test3",
                            type: ComponentType.Button,
                            label: "Test",
                            style: ButtonStyle.Primary,
                        }
                    },
                    {
                        type: ComponentType.ActionRow,
                        components: [
                            {
                                custom_id: "test4",
                                type: ComponentType.Button,
                                label: "1",
                                style: ButtonStyle.Primary,
                            },
                            {
                                custom_id: "test5",
                                type: ComponentType.Button,
                                label: "2",
                                style: ButtonStyle.Primary,
                            },
                            {
                                custom_id: "test6",
                                type: ComponentType.Button,
                                label: "3",
                                style: ButtonStyle.Primary,
                            },
                            {
                                custom_id: "test7",
                                type: ComponentType.Button,
                                label: "4",
                                style: ButtonStyle.Primary,
                            },
                            {
                                custom_id: "test8",
                                type: ComponentType.Button,
                                label: "5",
                                style: ButtonStyle.Primary,
                            },
                        ]
                    },
                    {
                        type: ComponentType.ActionRow,
                        components: [
                            {
                                custom_id: "test9",
                                type: ComponentType.Button,
                                label: "1",
                                style: ButtonStyle.Primary,
                            },
                            {
                                custom_id: "test10",
                                type: ComponentType.Button,
                                label: "2",
                                style: ButtonStyle.Primary,
                            },
                            {
                                custom_id: "test11",
                                type: ComponentType.Button,
                                label: "3",
                                style: ButtonStyle.Primary,
                            },
                            {
                                custom_id: "test12",
                                type: ComponentType.Button,
                                label: "4",
                                style: ButtonStyle.Primary,
                            },
                            {
                                custom_id: "test13",
                                type: ComponentType.Button,
                                label: "5",
                                style: ButtonStyle.Primary,
                            },
                        ]
                    },
                    {
                        type: ComponentType.ActionRow,
                        components: [
                            {
                                custom_id: "test14",
                                type: ComponentType.Button,
                                label: "1",
                                style: ButtonStyle.Primary,
                            },
                            {
                                custom_id: "test15",
                                type: ComponentType.Button,
                                label: "2",
                                style: ButtonStyle.Primary,
                            },
                            {
                                custom_id: "test16",
                                type: ComponentType.Button,
                                label: "3",
                                style: ButtonStyle.Primary,
                            },
                            {
                                custom_id: "test17",
                                type: ComponentType.Button,
                                label: "4",
                                style: ButtonStyle.Primary,
                            },
                            {
                                custom_id: "test18",
                                type: ComponentType.Button,
                                label: "5",
                                style: ButtonStyle.Primary,
                            },
                        ]
                    },
                    {
                        type: ComponentType.ActionRow,
                        components: [
                            {
                                custom_id: "test19",
                                type: ComponentType.Button,
                                label: "1",
                                style: ButtonStyle.Primary,
                            },
                            {
                                custom_id: "test20",
                                type: ComponentType.Button,
                                label: "2",
                                style: ButtonStyle.Primary,
                            },
                            {
                                custom_id: "test21",
                                type: ComponentType.Button,
                                label: "3",
                                style: ButtonStyle.Primary,
                            },
                            {
                                custom_id: "test22",
                                type: ComponentType.Button,
                                label: "4",
                                style: ButtonStyle.Primary,
                            },
                            {
                                custom_id: "test23",
                                type: ComponentType.Button,
                                label: "5",
                                style: ButtonStyle.Primary,
                            },
                        ]
                    },
                    {
                        type: ComponentType.ActionRow,
                        components: [
                            {
                                custom_id: "test24",
                                type: ComponentType.Button,
                                label: "1",
                                style: ButtonStyle.Primary,
                            },
                            {
                                custom_id: "test25",
                                type: ComponentType.Button,
                                label: "2",
                                style: ButtonStyle.Primary,
                            },
                            {
                                custom_id: "test26",
                                type: ComponentType.Button,
                                label: "3",
                                style: ButtonStyle.Primary,
                            },
                            {
                                custom_id: "test27",
                                type: ComponentType.Button,
                                label: "4",
                                style: ButtonStyle.Primary,
                            },
                            {
                                custom_id: "test28",
                                type: ComponentType.Button,
                                label: "5",
                                style: ButtonStyle.Primary,
                            },
                        ]
                    }
                ]
            }
        ]
    });
    
    // const { rows } = await sql`SELECT * FROM users`;

    // const users = await Promise.all(rows.map(async (user) => {
    //     const res = await getUsernameOrUUID(user.uuid);
    //     const disc = await getDiscordRole(user.uuid);
    //     return {
    //         uuid: user.uuid,
    //         name: res.success ? res.name : user.uuid,
    //         disc: disc?.discordid
    //     }
    // }));

    // const chunkSize = 20;
    // for (let i = 0; i < users.length; i += chunkSize) {
    //     await SendMessage(interaction.channel.id, {
    //         content: users.slice(i, i + chunkSize).map((user) => `\`${user.name}\` (${user.uuid}) ${user.disc ? `<@${user.disc}>` : ""}`).join("\n"),
    //         flags: MessageFlags.SuppressNotifications
    //     });
    // }

    // await CreateInteractionResponse(interaction.id, interaction.token, {
    //     type: InteractionResponseType.ChannelMessageWithSource,
    //     data: {
    //         content: `Done!`,
    //         flags: MessageFlags.Ephemeral
    //     }
    // });

    await FollowupMessage(interaction.token, {
        content: `Done!`,
    });

    return NextResponse.json(
        { success: true },
        { status: 200 }
    );
}
export const CommandData: RESTPatchAPIApplicationCommandJSONBody = {
    name: "test",
    description: "Test command",
    type: ApplicationCommandType.ChatInput,
    default_member_permissions: "0",
}