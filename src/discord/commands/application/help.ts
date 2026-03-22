import { APIChatInputApplicationCommandInteraction, APIInteractionResponse, ApplicationCommandType, ButtonStyle, ComponentType, InteractionResponseType, MessageFlags } from "discord-api-types/v10";
import { ConvertSnowflakeToDate, CreateInteractionResponse, IsleofDucks } from "../../discordUtils";
import { NextResponse } from "next/server";
import { HelpData, invertRoles } from "../../help";

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
    const timestamp = ConvertSnowflakeToDate(interaction.id);

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
        );
    }
    
    // if (!arrayContainsAll(interaction.member.roles, RequiredRoles)) {
    //     await CreateInteractionResponse(interaction.id, interaction.token, {
    //         type: InteractionResponseType.ChannelMessageWithSource,
    //         data: {
    //             flags: MessageFlags.Ephemeral,
    //             content: "You do not have permission to run this command!"
    //         }
    //     });
    //     return NextResponse.json(
    //         { success: false, error: "You do not have permission to run this command" },
    //         { status: 403 }
    //     );
    // }

    if (!interaction.data) {
        await CreateInteractionResponse(interaction.id, interaction.token, {
            type: InteractionResponseType.ChannelMessageWithSource,
            data: {
                flags: MessageFlags.Ephemeral,
                content: "Missing interaction data!"
            }
        });
        return NextResponse.json(
            { success: false, error: 'Missing interaction data' },
            { status: 400 }
        );
    }
    if (!interaction.data.options) {
        await CreateInteractionResponse(interaction.id, interaction.token, {
            type: InteractionResponseType.ChannelMessageWithSource,
            data: {
                flags: MessageFlags.Ephemeral,
                content: "Missing interaction data options!"
            }
        });
        return NextResponse.json(
            { success: false, error: 'Missing interaction data options' },
            { status: 400 }
        );
    }

    const isStaff = interaction.member.roles.includes(IsleofDucks.roles.staff);
    const isTrainee = interaction.member.roles.includes(IsleofDucks.roles.trainee);
    const isHelper = interaction.member.roles.includes(IsleofDucks.roles.helper);
    const options = invertRoles(HelpData.commands);

    await CreateInteractionResponse(interaction.id, interaction.token, {
        type: InteractionResponseType.ChannelMessageWithSource,
        data: {
            flags: MessageFlags.IsComponentsV2,
            components: [
                {
                    type: ComponentType.Container,
                    accent_color: IsleofDucks.colours.main,
                    components: [
                        {
                            type: ComponentType.Section,
                            components: [
                                {
                                    type: ComponentType.TextDisplay,
                                    content: "# Help - General"
                                }
                            ],
                            accessory: isHelper ? {
                                type: ComponentType.Button,
                                style: isHelper ? ButtonStyle.Primary : ButtonStyle.Secondary,
                                custom_id: `help-helper`,
                                label: "Helper",
                                disabled: !isHelper
                            } : isTrainee ? {
                                type: ComponentType.Button,
                                style: isTrainee ? ButtonStyle.Primary : ButtonStyle.Secondary,
                                custom_id: `help-trainee`,
                                label: "Trainee",
                                disabled: !isTrainee
                            } : {
                                type: ComponentType.Button,
                                style: isStaff ? ButtonStyle.Primary : ButtonStyle.Secondary,
                                custom_id: `help-staff`,
                                label: "Staff",
                                disabled: !isStaff
                            }
                        },
                        {
                            type: ComponentType.TextDisplay,
                            content: [
                                `https://discord.com/channels/823061629812867113/833548595826917396 | Learn about our server.`,
                                `https://discord.com/channels/823061629812867113/1320463957273739274 | Learn about our SkyBlock guilds.`,
                                ``,
                                `Use the select menu below to view information about the many commands this bot has to offer. Alternatively, you can use \`/help command:[command name]\`.`
                            ].join('/n')
                        },
                        {
                            type: ComponentType.Separator
                        },
                        {
                            type: ComponentType.ActionRow,
                            components: [
                                {
                                    type: ComponentType.StringSelect,
                                    custom_id: `help-menu`,
                                    options: options[IsleofDucks.roles.verified],
                                    disabled: options[IsleofDucks.roles.verified].length === 0
                                }
                            ]
                        },
                        {
                            type: ComponentType.Separator
                        },
                        {
                            type: ComponentType.TextDisplay,
                            content: `Response time: ${Date.now() - timestamp.getTime()}ms • <t:${Math.floor(Date.now() / 1000)}:F>`
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
export const CommandData = {
    name: "help",
    description: "Displays the help menu.",
    type: ApplicationCommandType.ChatInput
}
export const RequiredRoles: string[] = [
    IsleofDucks.roles.verified
];
