import { ConvertSnowflakeToDate, CreateInteractionResponse, IsleofDucks } from "@/discord/discordUtils";
import { invertRoles } from "@/discord/help";
import { HelpData } from "@/discord/helpData";
import { APIInteractionResponse, InteractionResponseType, MessageFlags, ButtonStyle, ComponentType, APIMessageComponentInteraction, ApplicationCommandOptionType } from "discord-api-types/v10";
import { NextResponse } from "next/server";

export default async function(
    interaction: APIMessageComponentInteraction
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

    const isAdmin = interaction.member.roles.includes(IsleofDucks.roles.admin);
    const isMod = interaction.member.roles.includes(IsleofDucks.roles.mod_duck) || interaction.member.roles.includes(IsleofDucks.roles.mod_duckling);
    const isStaff = interaction.member.roles.includes(IsleofDucks.roles.staff);
    const isTrainee = interaction.member.roles.includes(IsleofDucks.roles.trainee);
    const options = invertRoles(HelpData.commands);
    const bridgeCommandOptions = invertRoles(HelpData.bridgeCommands);

    if (interaction.data.custom_id === "help" && interaction.data.component_type === ComponentType.Button) {
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
                                type: ComponentType.Section,
                                components: [
                                    {
                                        type: ComponentType.TextDisplay,
                                        content: "# Help - General"
                                    }
                                ],
                                accessory: isTrainee ? {
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
                                ].join('\n')
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
    } else if (interaction.data.custom_id === "help-trainee" && interaction.data.component_type === ComponentType.Button) {
        if (!isTrainee) {
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
                                type: ComponentType.Section,
                                components: [
                                    {
                                        type: ComponentType.TextDisplay,
                                        content: "# Help - Trainee General"
                                    }
                                ],
                                accessory: {
                                    type: ComponentType.Button,
                                    style: ButtonStyle.Primary,
                                    custom_id: `help`,
                                    label: "Back",
                                }
                            },
                            {
                                type: ComponentType.TextDisplay,
                                content: [
                                    `Trainee stuff goes here.`,
                                ].join('\n')
                            },
                            {
                                type: ComponentType.Separator
                            },
                            {
                                type: ComponentType.ActionRow,
                                components: [
                                    {
                                        type: ComponentType.StringSelect,
                                        custom_id: `help-trainee-menu`,
                                        options: options[IsleofDucks.roles.trainee],
                                        disabled: options[IsleofDucks.roles.trainee].length === 0
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
    } else if (interaction.data.custom_id === "help-staff" && interaction.data.component_type === ComponentType.Button) {
        if (!isStaff) {
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
                                type: ComponentType.Section,
                                components: [
                                    {
                                        type: ComponentType.TextDisplay,
                                        content: "# Help - Staff General"
                                    }
                                ],
                                accessory: {
                                    type: ComponentType.Button,
                                    style: isMod ? ButtonStyle.Primary : ButtonStyle.Secondary,
                                    custom_id: `help-mod`,
                                    label: "Mod",
                                    disabled: !isMod
                                }
                            },
                            {
                                type: ComponentType.TextDisplay,
                                content: [
                                    `Staff stuff goes here.`,
                                ].join('\n')
                            },
                            {
                                type: ComponentType.Separator
                            },
                            {
                                type: ComponentType.ActionRow,
                                components: [
                                    {
                                        type: ComponentType.StringSelect,
                                        custom_id: `help-staff-bridge-menu`,
                                        placeholder: "Select a bridge command",
                                        options: bridgeCommandOptions[IsleofDucks.roles.staff],
                                        disabled: bridgeCommandOptions[IsleofDucks.roles.staff].length === 0
                                    }
                                ]
                            },
                            {
                                type: ComponentType.ActionRow,
                                components: [
                                    {
                                        type: ComponentType.StringSelect,
                                        custom_id: `help-staff-menu`,
                                        placeholder: "Select an application command",
                                        options: options[IsleofDucks.roles.staff],
                                        disabled: options[IsleofDucks.roles.staff].length === 0
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
    } else if (interaction.data.custom_id === "help-mod" && interaction.data.component_type === ComponentType.Button) {
        if (!isMod) {
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
                                type: ComponentType.Section,
                                components: [
                                    {
                                        type: ComponentType.TextDisplay,
                                        content: "# Help - Mod General"
                                    }
                                ],
                                accessory: {
                                    type: ComponentType.Button,
                                    style: isAdmin ? ButtonStyle.Primary : ButtonStyle.Secondary,
                                    custom_id: `help-admin`,
                                    label: "Admin",
                                    disabled: !isAdmin
                                }
                            },
                            {
                                type: ComponentType.TextDisplay,
                                content: [
                                    `Mod stuff goes here.`,
                                ].join('\n')
                            },
                            {
                                type: ComponentType.Separator
                            },
                            {
                                type: ComponentType.ActionRow,
                                components: [
                                    {
                                        type: ComponentType.StringSelect,
                                        custom_id: `help-mod-bridge-menu`,
                                        placeholder: "Select a bridge command",
                                        options: bridgeCommandOptions[IsleofDucks.roles.mod_duck] || [],
                                        disabled: bridgeCommandOptions[IsleofDucks.roles.mod_duck] ? bridgeCommandOptions[IsleofDucks.roles.mod_duck].length === 0 : true
                                    }
                                ]
                            },
                            {
                                type: ComponentType.ActionRow,
                                components: [
                                    {
                                        type: ComponentType.StringSelect,
                                        custom_id: `help-mod-menu`,
                                        placeholder: "Select an application command",
                                        options: options[IsleofDucks.roles.mod_duck] || [],
                                        disabled: options[IsleofDucks.roles.mod_duck] ? options[IsleofDucks.roles.mod_duck].length === 0 : true
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
    } else if (interaction.data.custom_id === "help-admin" && interaction.data.component_type === ComponentType.Button) {
        if (!isAdmin) {
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
                                type: ComponentType.Section,
                                components: [
                                    {
                                        type: ComponentType.TextDisplay,
                                        content: "# Help - Admin General"
                                    }
                                ],
                                accessory: {
                                    type: ComponentType.Button,
                                    style: ButtonStyle.Primary,
                                    custom_id: `help`,
                                    label: "Back",
                                }
                            },
                            {
                                type: ComponentType.TextDisplay,
                                content: [
                                    `Admin stuff goes here.`,
                                ].join('\n')
                            },
                            {
                                type: ComponentType.Separator
                            },
                            {
                                type: ComponentType.ActionRow,
                                components: [
                                    {
                                        type: ComponentType.StringSelect,
                                        custom_id: `help-admin-bridge-menu`,
                                        placeholder: "Select a bridge command",
                                        options: bridgeCommandOptions[IsleofDucks.roles.admin] || [],
                                        disabled: bridgeCommandOptions[IsleofDucks.roles.admin] ? bridgeCommandOptions[IsleofDucks.roles.admin].length === 0 : true
                                    }
                                ]
                            },
                            {
                                type: ComponentType.ActionRow,
                                components: [
                                    {
                                        type: ComponentType.StringSelect,
                                        custom_id: `help-admin-menu`,
                                        placeholder: "Select an application command",
                                        options: options[IsleofDucks.roles.admin] || [],
                                        disabled: options[IsleofDucks.roles.admin] ? options[IsleofDucks.roles.admin].length === 0 : true
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
    } else if (interaction.data.custom_id === "help-staff-menu" && interaction.data.component_type === ComponentType.StringSelect) {
        const option = interaction.data.values[0];
        if (!option) {
            await CreateInteractionResponse(interaction.id, interaction.token, {
                type: InteractionResponseType.ChannelMessageWithSource,
                data: {
                    flags: MessageFlags.Ephemeral,
                    content: "You did not select an option!"
                }
            });
            return NextResponse.json(
                { success: false, error: "You did not select an option" },
                { status: 403 }
            );
        }
        if (!Object.keys(HelpData.commands).includes(option)) {
            await CreateInteractionResponse(interaction.id, interaction.token, {
                type: InteractionResponseType.ChannelMessageWithSource,
                data: {
                    flags: MessageFlags.Ephemeral,
                    content: "Invalid option!"
                }
            });
            return NextResponse.json(
                { success: false, error: "Invalid option" },
                { status: 403 }
            );
        }
        const command = HelpData.commands[option as keyof typeof HelpData.commands];
        const content: string[] = [];
        if ("description" in command.data && command.data.description) content.push(`### Description\n${command.data.description}`);
        if ("options" in command.data && command.data.options && command.data.options.length > 0) {
            content.push("### Options");
            for (const option of command.data.options) {
                if (option.type === ApplicationCommandOptionType.Subcommand) {
                    content.push(`* ${option.name}${option.description ? ` - ${option.description}` : ""}`);
                    if ("options" in option && option.options && option.options.length > 0) {
                        for (const subOption of option.options) {
                            content.push(`  * ${subOption.name}${subOption.description ? ` - ${subOption.description}` : ""}`);
                        }
                    }
                } else if (option.type === ApplicationCommandOptionType.SubcommandGroup) {
                    content.push(`* ${option.name}${option.description ? ` - ${option.description}` : ""}`);
                    if ("options" in option && option.options && Array.isArray(option.options) && option.options.length > 0) {
                        for (const subOption of option.options) {
                            content.push(`  * ${subOption.name}${subOption.description ? ` - ${subOption.description}` : ""}`);
                            if ("options" in option && option.options && option.options.length > 0) {
                                for (const subSubOption of option.options) {
                                    content.push(`    * ${subSubOption.name}${subSubOption.description ? ` - ${subSubOption.description}` : ""}`);
                                }
                            }
                        }
                    }
                } else
                    content.push(`* ${option.name}${option.description ? ` - ${option.description}` : ""}`);
            }
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
                                type: ComponentType.Section,
                                components: [
                                    {
                                        type: ComponentType.TextDisplay,
                                        content: `# Help - Staff Command: ${command.data.name ?? option}`
                                    }
                                ],
                                accessory: {
                                    type: ComponentType.Button,
                                    style: ButtonStyle.Primary,
                                    custom_id: `help`,
                                    label: "Back",
                                }
                            },
                            {
                                type: ComponentType.TextDisplay,
                                content: content.join('\n')
                            },
                            {
                                type: ComponentType.TextDisplay,
                                content: [
                                    `### Required Roles:`,
                                    `${command.roles ? (
                                        Array.isArray(command.roles) ?
                                            command.roles.map(role => `* <@&${role}>`).join('\n') :
                                            Object.entries(command.roles).map(([ key, value ]) => {
                                                return Array.isArray(value) ?
                                                    `* ${key}: ${value.map(role => `<@&${role}>`).join(', ')}` :
                                                    `* ${key}:\n${Object.entries(value).map(([ subKey, subValue ]) =>
                                                        `  * ${subKey}: ${(subValue as string[]).map(role => `<@&${role}>`).join(', ')}`
                                                    ).join('\n')}`;
                            }               ).join('\n')
                                    ): "None"}`,
                                ].join('\n')
                            },
                            {
                                type: ComponentType.Separator
                            },
                            {
                                type: ComponentType.ActionRow,
                                components: [
                                    {
                                        type: ComponentType.StringSelect,
                                        custom_id: `help-staff-bridge-menu`,
                                        placeholder: "Select a bridge command",
                                        options: bridgeCommandOptions[IsleofDucks.roles.staff] || [],
                                        disabled: bridgeCommandOptions[IsleofDucks.roles.staff] ? bridgeCommandOptions[IsleofDucks.roles.staff].length === 0 : true
                                    }
                                ]
                            },
                            {
                                type: ComponentType.ActionRow,
                                components: [
                                    {
                                        type: ComponentType.StringSelect,
                                        custom_id: `help-staff-menu`,
                                        placeholder: "Select an application command",
                                        options: options[IsleofDucks.roles.staff] || [],
                                        disabled: options[IsleofDucks.roles.staff] ? options[IsleofDucks.roles.staff].length === 0 : true
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
    } else if (interaction.data.custom_id === "help-staff-bridge-menu" && interaction.data.component_type === ComponentType.StringSelect) {
        const option = interaction.data.values[0];
        if (!option) {
            await CreateInteractionResponse(interaction.id, interaction.token, {
                type: InteractionResponseType.ChannelMessageWithSource,
                data: {
                    flags: MessageFlags.Ephemeral,
                    content: "You did not select an option!"
                }
            });
            return NextResponse.json(
                { success: false, error: "You did not select an option" },
                { status: 403 }
            );
        }
        if (!Object.keys(HelpData.bridgeCommands).includes(option)) {
            await CreateInteractionResponse(interaction.id, interaction.token, {
                type: InteractionResponseType.ChannelMessageWithSource,
                data: {
                    flags: MessageFlags.Ephemeral,
                    content: "Invalid option!"
                }
            });
            return NextResponse.json(
                { success: false, error: "Invalid option" },
                { status: 403 }
            );
        }
        const command = HelpData.bridgeCommands[option as keyof typeof HelpData.bridgeCommands];
        const content: string[] = [];
        if ("description" in command.data && command.data.description) content.push(`### Description\n${command.data.description}`);
        if ("usage" in command.data && command.data.usage) content.push(`### Usage\n${command.data.name} ${command.data.usage}`);
        if ("options" in command.data && command.data.options && command.data.options.length > 0) {
            content.push("### Options");
            for (const option of command.data.options) {
                content.push(`* ${option.name}${option.description ? ` - ${option.description}` : ""}`);
            }
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
                                type: ComponentType.Section,
                                components: [
                                    {
                                        type: ComponentType.TextDisplay,
                                        content: `# Help - Staff Bridge Command: ${command.data.name ?? option}`
                                    }
                                ],
                                accessory: {
                                    type: ComponentType.Button,
                                    style: ButtonStyle.Primary,
                                    custom_id: `help`,
                                    label: "Back",
                                }
                            },
                            {
                                type: ComponentType.TextDisplay,
                                content: content.join('\n')
                            },
                            {
                                type: ComponentType.TextDisplay,
                                content: [
                                    `### Required Roles:`,
                                    `${command.roles ? command.roles.map(role => `* <@&${role}>`).join('\n') : "None"}`,
                                ].join('\n')
                            },
                            {
                                type: ComponentType.Separator
                            },
                            {
                                type: ComponentType.ActionRow,
                                components: [
                                    {
                                        type: ComponentType.StringSelect,
                                        custom_id: `help-staff-bridge-menu`,
                                        placeholder: "Select a bridge command",
                                        options: bridgeCommandOptions[IsleofDucks.roles.staff] || [],
                                        disabled: bridgeCommandOptions[IsleofDucks.roles.staff] ? bridgeCommandOptions[IsleofDucks.roles.staff].length === 0 : true
                                    }
                                ]
                            },
                            {
                                type: ComponentType.ActionRow,
                                components: [
                                    {
                                        type: ComponentType.StringSelect,
                                        custom_id: `help-staff-menu`,
                                        placeholder: "Select an application command",
                                        options: options[IsleofDucks.roles.staff] || [],
                                        disabled: options[IsleofDucks.roles.staff] ? options[IsleofDucks.roles.staff].length === 0 : true
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
    } else if (interaction.data.custom_id === "help-mod-menu" && interaction.data.component_type === ComponentType.StringSelect) {
        const option = interaction.data.values[0];
        if (!option) {
            await CreateInteractionResponse(interaction.id, interaction.token, {
                type: InteractionResponseType.ChannelMessageWithSource,
                data: {
                    flags: MessageFlags.Ephemeral,
                    content: "You did not select an option!"
                }
            });
            return NextResponse.json(
                { success: false, error: "You did not select an option" },
                { status: 403 }
            );
        }
        if (!Object.keys(HelpData.commands).includes(option)) {
            await CreateInteractionResponse(interaction.id, interaction.token, {
                type: InteractionResponseType.ChannelMessageWithSource,
                data: {
                    flags: MessageFlags.Ephemeral,
                    content: "Invalid option!"
                }
            });
            return NextResponse.json(
                { success: false, error: "Invalid option" },
                { status: 403 }
            );
        }
        const command = HelpData.commands[option as keyof typeof HelpData.commands];
        const content: string[] = [];
        if ("description" in command.data && command.data.description) content.push(`### Description\n${command.data.description}`);
        if ("options" in command.data && command.data.options && command.data.options.length > 0) {
            content.push("### Options");
            for (const option of command.data.options) {
                if (option.type === ApplicationCommandOptionType.Subcommand) {
                    content.push(`* ${option.name}${option.description ? ` - ${option.description}` : ""}`);
                    if ("options" in option && option.options && option.options.length > 0) {
                        for (const subOption of option.options) {
                            content.push(`  * ${subOption.name}${subOption.description ? ` - ${subOption.description}` : ""}`);
                        }
                    }
                } else if (option.type === ApplicationCommandOptionType.SubcommandGroup) {
                    content.push(`* ${option.name}${option.description ? ` - ${option.description}` : ""}`);
                    if ("options" in option && option.options && Array.isArray(option.options) && option.options.length > 0) {
                        for (const subOption of option.options) {
                            content.push(`  * ${subOption.name}${subOption.description ? ` - ${subOption.description}` : ""}`);
                            if ("options" in option && option.options && option.options.length > 0) {
                                for (const subSubOption of option.options) {
                                    content.push(`    * ${subSubOption.name}${subSubOption.description ? ` - ${subSubOption.description}` : ""}`);
                                }
                            }
                        }
                    }
                } else
                    content.push(`* ${option.name}${option.description ? ` - ${option.description}` : ""}`);
            }
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
                                type: ComponentType.Section,
                                components: [
                                    {
                                        type: ComponentType.TextDisplay,
                                        content: `# Help - Mod Command: ${command.data.name ?? option}`
                                    }
                                ],
                                accessory: {
                                    type: ComponentType.Button,
                                    style: ButtonStyle.Primary,
                                    custom_id: `help`,
                                    label: "Back",
                                }
                            },
                            {
                                type: ComponentType.TextDisplay,
                                content: content.join('\n')
                            },
                            {
                                type: ComponentType.TextDisplay,
                                content: [
                                    `### Required Roles:`,
                                    `${command.roles ? (
                                        Array.isArray(command.roles) ?
                                            command.roles.map(role => `* <@&${role}>`).join('\n') :
                                            Object.entries(command.roles).map(([ key, value ]) => {
                                                return Array.isArray(value) ?
                                                    `* ${key}: ${value.map(role => `<@&${role}>`).join(', ')}` :
                                                    `* ${key}:\n${Object.entries(value).map(([ subKey, subValue ]) =>
                                                        `  * ${subKey}: ${(subValue as string[]).map(role => `<@&${role}>`).join(', ')}`
                                                    ).join('\n')}`;
                            }               ).join('\n')
                                    ): "None"}`,
                                ].join('\n')
                            },
                            {
                                type: ComponentType.Separator
                            },
                            {
                                type: ComponentType.ActionRow,
                                components: [
                                    {
                                        type: ComponentType.StringSelect,
                                        custom_id: `help-mod-bridge-menu`,
                                        placeholder: "Select a bridge command",
                                        options: bridgeCommandOptions[IsleofDucks.roles.mod_duck] || [],
                                        disabled: bridgeCommandOptions[IsleofDucks.roles.mod_duck] ? bridgeCommandOptions[IsleofDucks.roles.mod_duck].length === 0 : true
                                    }
                                ]
                            },
                            {
                                type: ComponentType.ActionRow,
                                components: [
                                    {
                                        type: ComponentType.StringSelect,
                                        custom_id: `help-mod-menu`,
                                        placeholder: "Select an application command",
                                        options: options[IsleofDucks.roles.mod_duck] || [],
                                        disabled: options[IsleofDucks.roles.mod_duck] ? options[IsleofDucks.roles.mod_duck].length === 0 : true
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
    } else if (interaction.data.custom_id === "help-mod-bridge-menu" && interaction.data.component_type === ComponentType.StringSelect) {
        const option = interaction.data.values[0];
        if (!option) {
            await CreateInteractionResponse(interaction.id, interaction.token, {
                type: InteractionResponseType.ChannelMessageWithSource,
                data: {
                    flags: MessageFlags.Ephemeral,
                    content: "You did not select an option!"
                }
            });
            return NextResponse.json(
                { success: false, error: "You did not select an option" },
                { status: 403 }
            );
        }
        if (!Object.keys(HelpData.bridgeCommands).includes(option)) {
            await CreateInteractionResponse(interaction.id, interaction.token, {
                type: InteractionResponseType.ChannelMessageWithSource,
                data: {
                    flags: MessageFlags.Ephemeral,
                    content: "Invalid option!"
                }
            });
            return NextResponse.json(
                { success: false, error: "Invalid option" },
                { status: 403 }
            );
        }
        const command = HelpData.bridgeCommands[option as keyof typeof HelpData.bridgeCommands];
        const content: string[] = [];
        if ("description" in command.data && command.data.description) content.push(`### Description\n${command.data.description}`);
        if ("usage" in command.data && command.data.usage) content.push(`### Usage\n${command.data.name} ${command.data.usage}`);
        if ("options" in command.data && command.data.options && command.data.options.length > 0) {
            content.push("### Options");
            for (const option of command.data.options) {
                content.push(`* ${option.name}${option.description ? ` - ${option.description}` : ""}`);
            }
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
                                type: ComponentType.Section,
                                components: [
                                    {
                                        type: ComponentType.TextDisplay,
                                        content: `# Help - Mod Bridge Command: ${command.data.name ?? option}`
                                    }
                                ],
                                accessory: {
                                    type: ComponentType.Button,
                                    style: ButtonStyle.Primary,
                                    custom_id: `help`,
                                    label: "Back",
                                }
                            },
                            {
                                type: ComponentType.TextDisplay,
                                content: content.join('\n')
                            },
                            {
                                type: ComponentType.TextDisplay,
                                content: [
                                    `### Required Roles:`,
                                    `${command.roles ? command.roles.map(role => `* <@&${role}>`).join('\n') : "None"}`,
                                ].join('\n')
                            },
                            {
                                type: ComponentType.Separator
                            },
                            {
                                type: ComponentType.ActionRow,
                                components: [
                                    {
                                        type: ComponentType.StringSelect,
                                        custom_id: `help-mod-bridge-menu`,
                                        placeholder: "Select a bridge command",
                                        options: bridgeCommandOptions[IsleofDucks.roles.mod_duck] || [],
                                        disabled: bridgeCommandOptions[IsleofDucks.roles.mod_duck] ? bridgeCommandOptions[IsleofDucks.roles.mod_duck].length === 0 : true
                                    }
                                ]
                            },
                            {
                                type: ComponentType.ActionRow,
                                components: [
                                    {
                                        type: ComponentType.StringSelect,
                                        custom_id: `help-mod-menu`,
                                        placeholder: "Select an application command",
                                        options: options[IsleofDucks.roles.mod_duck] || [],
                                        disabled: options[IsleofDucks.roles.mod_duck] ? options[IsleofDucks.roles.mod_duck].length === 0 : true
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
    } else if (interaction.data.custom_id === "help-admin-menu" && interaction.data.component_type === ComponentType.StringSelect) {
        const option = interaction.data.values[0];
        if (!option) {
            await CreateInteractionResponse(interaction.id, interaction.token, {
                type: InteractionResponseType.ChannelMessageWithSource,
                data: {
                    flags: MessageFlags.Ephemeral,
                    content: "You did not select an option!"
                }
            });
            return NextResponse.json(
                { success: false, error: "You did not select an option" },
                { status: 403 }
            );
        }
        if (!Object.keys(HelpData.commands).includes(option)) {
            await CreateInteractionResponse(interaction.id, interaction.token, {
                type: InteractionResponseType.ChannelMessageWithSource,
                data: {
                    flags: MessageFlags.Ephemeral,
                    content: "Invalid option!"
                }
            });
            return NextResponse.json(
                { success: false, error: "Invalid option" },
                { status: 403 }
            );
        }
        const command = HelpData.commands[option as keyof typeof HelpData.commands];
        const content: string[] = [];
        if ("description" in command.data && command.data.description) content.push(`### Description\n${command.data.description}`);
        if ("options" in command.data && command.data.options && command.data.options.length > 0) {
            content.push("### Options");
            for (const option of command.data.options) {
                if (option.type === ApplicationCommandOptionType.Subcommand) {
                    content.push(`* ${option.name}${option.description ? ` - ${option.description}` : ""}`);
                    if ("options" in option && option.options && option.options.length > 0) {
                        for (const subOption of option.options) {
                            content.push(`  * ${subOption.name}${subOption.description ? ` - ${subOption.description}` : ""}`);
                        }
                    }
                } else if (option.type === ApplicationCommandOptionType.SubcommandGroup) {
                    content.push(`* ${option.name}${option.description ? ` - ${option.description}` : ""}`);
                    if ("options" in option && option.options && Array.isArray(option.options) && option.options.length > 0) {
                        for (const subOption of option.options) {
                            content.push(`  * ${subOption.name}${subOption.description ? ` - ${subOption.description}` : ""}`);
                            if ("options" in option && option.options && option.options.length > 0) {
                                for (const subSubOption of option.options) {
                                    content.push(`    * ${subSubOption.name}${subSubOption.description ? ` - ${subSubOption.description}` : ""}`);
                                }
                            }
                        }
                    }
                } else
                    content.push(`* ${option.name}${option.description ? ` - ${option.description}` : ""}`);
            }
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
                                type: ComponentType.Section,
                                components: [
                                    {
                                        type: ComponentType.TextDisplay,
                                        content: `# Help - Admin Command: ${command.data.name ?? option}`
                                    }
                                ],
                                accessory: {
                                    type: ComponentType.Button,
                                    style: ButtonStyle.Primary,
                                    custom_id: `help`,
                                    label: "Back",
                                }
                            },
                            {
                                type: ComponentType.TextDisplay,
                                content: content.join('\n')
                            },
                            {
                                type: ComponentType.TextDisplay,
                                content: [
                                    `### Required Roles:`,
                                    `${command.roles ? (
                                        Array.isArray(command.roles) ?
                                            command.roles.map(role => `* <@&${role}>`).join('\n') :
                                            Object.entries(command.roles).map(([ key, value ]) => {
                                                return Array.isArray(value) ?
                                                    `* ${key}: ${value.map(role => `<@&${role}>`).join(', ')}` :
                                                    `* ${key}:\n${Object.entries(value).map(([ subKey, subValue ]) =>
                                                        `  * ${subKey}: ${(subValue as string[]).map(role => `<@&${role}>`).join(', ')}`
                                                    ).join('\n')}`;
                            }               ).join('\n')
                                    ): "None"}`,
                                ].join('\n')
                            },
                            {
                                type: ComponentType.Separator
                            },
                            {
                                type: ComponentType.ActionRow,
                                components: [
                                    {
                                        type: ComponentType.StringSelect,
                                        custom_id: `help-admin-bridge-menu`,
                                        placeholder: "Select a bridge command",
                                        options: bridgeCommandOptions[IsleofDucks.roles.admin] || [],
                                        disabled: bridgeCommandOptions[IsleofDucks.roles.admin] ? bridgeCommandOptions[IsleofDucks.roles.admin].length === 0 : true
                                    }
                                ]
                            },
                            {
                                type: ComponentType.ActionRow,
                                components: [
                                    {
                                        type: ComponentType.StringSelect,
                                        custom_id: `help-admin-menu`,
                                        placeholder: "Select an application command",
                                        options: options[IsleofDucks.roles.admin] || [],
                                        disabled: options[IsleofDucks.roles.admin] ? options[IsleofDucks.roles.admin].length === 0 : true
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
    } else if (interaction.data.custom_id === "help-admin-bridge-menu" && interaction.data.component_type === ComponentType.StringSelect) {
        const option = interaction.data.values[0];
        if (!option) {
            await CreateInteractionResponse(interaction.id, interaction.token, {
                type: InteractionResponseType.ChannelMessageWithSource,
                data: {
                    flags: MessageFlags.Ephemeral,
                    content: "You did not select an option!"
                }
            });
            return NextResponse.json(
                { success: false, error: "You did not select an option" },
                { status: 403 }
            );
        }
        if (!Object.keys(HelpData.bridgeCommands).includes(option)) {
            await CreateInteractionResponse(interaction.id, interaction.token, {
                type: InteractionResponseType.ChannelMessageWithSource,
                data: {
                    flags: MessageFlags.Ephemeral,
                    content: "Invalid option!"
                }
            });
            return NextResponse.json(
                { success: false, error: "Invalid option" },
                { status: 403 }
            );
        }
        const command = HelpData.bridgeCommands[option as keyof typeof HelpData.bridgeCommands];
        const content: string[] = [];
        if ("description" in command.data && command.data.description) content.push(`### Description\n${command.data.description}`);
        if ("usage" in command.data && command.data.usage) content.push(`### Usage\n${command.data.name} ${command.data.usage}`);
        if ("options" in command.data && command.data.options && command.data.options.length > 0) {
            content.push("### Options");
            for (const option of command.data.options) {
                content.push(`* ${option.name}${option.description ? ` - ${option.description}` : ""}`);
            }
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
                                type: ComponentType.Section,
                                components: [
                                    {
                                        type: ComponentType.TextDisplay,
                                        content: `# Help - Admin Bridge Command: ${command.data.name ?? option}`
                                    }
                                ],
                                accessory: {
                                    type: ComponentType.Button,
                                    style: ButtonStyle.Primary,
                                    custom_id: `help`,
                                    label: "Back",
                                }
                            },
                            {
                                type: ComponentType.TextDisplay,
                                content: content.join('\n')
                            },
                            {
                                type: ComponentType.TextDisplay,
                                content: [
                                    `### Required Roles:`,
                                    `${command.roles ? command.roles.map(role => `* <@&${role}>`).join('\n') : "None"}`,
                                ].join('\n')
                            },
                            {
                                type: ComponentType.Separator
                            },
                            {
                                type: ComponentType.ActionRow,
                                components: [
                                    {
                                        type: ComponentType.StringSelect,
                                        custom_id: `help-admin-bridge-menu`,
                                        placeholder: "Select a bridge command",
                                        options: bridgeCommandOptions[IsleofDucks.roles.admin] || [],
                                        disabled: bridgeCommandOptions[IsleofDucks.roles.admin] ? bridgeCommandOptions[IsleofDucks.roles.admin].length === 0 : true
                                    }
                                ]
                            },
                            {
                                type: ComponentType.ActionRow,
                                components: [
                                    {
                                        type: ComponentType.StringSelect,
                                        custom_id: `help-admin-menu`,
                                        placeholder: "Select an application command",
                                        options: options[IsleofDucks.roles.admin] || [],
                                        disabled: options[IsleofDucks.roles.admin] ? options[IsleofDucks.roles.admin].length === 0 : true
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
    } else {
        await CreateInteractionResponse(interaction.id, interaction.token, {
            type: InteractionResponseType.ChannelMessageWithSource,
            data: {
                flags: MessageFlags.Ephemeral,
                content: "Not implemented yet!"
            }
        });
        return NextResponse.json(
            { success: false, error: "Not implemented yet" },
            { status: 501 }
        );
    }

    return NextResponse.json(
        { success: true },
        { status: 200 }
    );
}