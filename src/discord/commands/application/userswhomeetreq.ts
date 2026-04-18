import { APIChatInputApplicationCommandInteraction, APIChatInputApplicationCommandInteractionData, APIInteractionResponse, ApplicationCommandOptionType, ButtonStyle, ComponentType, InteractionResponseType, MessageFlags } from "discord-api-types/v10";
import { CreateInteractionResponse, ConvertSnowflakeToDate, FollowupMessage, IsleofDucks, RemoveGuildMemberRole, AddGuildMemberRole, GetGuildMember, ErrorEmbed } from "@/discord/discordUtils";
import { getImmunePlayers, isImmunePlayer, addImmunePlayer, removeImmunePlayer, getUserDataFromUUID, getSettingValue, getAllMinecraftUsersExpReqLimited, getAllMinecraftUsersExpReqCount } from "@/discord/utils";
import { getUsernameOrUUID, isPlayerInGuild } from "@/discord/hypixelUtils";
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
    // User sees the "[bot] is thinking..." message
    await CreateInteractionResponse(interaction.id, interaction.token, {
        type: InteractionResponseType.DeferredChannelMessageWithSource,
    });

    const timestamp = ConvertSnowflakeToDate(interaction.id);

    if (!interaction.data) {
        await FollowupMessage(interaction.token, {
            flags: MessageFlags.IsComponentsV2,
            components: ErrorEmbed("Missing interaction data", timestamp, true)
        }, null, true);
        return NextResponse.json(
            { success: false, error: "Missing interaction data" },
            { status: 400 }
        );
    }
    const interactionData = interaction.data as APIChatInputApplicationCommandInteractionData;
    if (!interactionData.options) {
        await FollowupMessage(interaction.token, {
            flags: MessageFlags.IsComponentsV2,
            components: ErrorEmbed("Missing interaction data options", timestamp, true)
        }, null, true);
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

    const req = await getSettingValue(options.duck ? "duck_req" : "duckling_req");
    if (req === null) {
        await FollowupMessage(interaction.token, {
            flags: MessageFlags.IsComponentsV2,
            components: ErrorEmbed(`Failed to get ${options.duck ? "Duck" : "Duckling"} requirements from database`, timestamp, true)
        }, null, true);
        return NextResponse.json(
            { success: false, error: `Failed to get ${options.duck ? "Duck" : "Duckling"} requirements from database` },
            { status: 400 }
        );
    }

    const usersRes = await getAllMinecraftUsersExpReqLimited(parseInt(req), 0, 25);
    if (usersRes.length === 0) {
        await FollowupMessage(interaction.token, {
            flags: MessageFlags.IsComponentsV2,
            components: ErrorEmbed(`No users meet the requirements for ${options.duck ? "Duck" : "Duckling"}`, timestamp, true)
        }, null, true);
        return NextResponse.json(
            { success: false, error: `No users meet the requirements for ${options.duck ? "Duck" : "Duckling"}` },
            { status: 400 }
        );
    }
    const userCount = await getAllMinecraftUsersExpReqCount(parseInt(req));

    // Get all names of the users
    const users = await Promise.all(usersRes.map(async (user) => {
        const nameRes = await getUsernameOrUUID(user.uuid);
        if (nameRes.success) {
            return { uuid: user.uuid, name: nameRes.name };
        } else {
            return { uuid: user.uuid, name: user.uuid };
        }
    }));

    await FollowupMessage(interaction.token, {
        flags: MessageFlags.IsComponentsV2,
        components: [
            {
                type: ComponentType.Container,
                accent_color: IsleofDucks.colours.main,
                components: [
                    {
                        type: ComponentType.TextDisplay,
                        content: `## User who meet ${options.duck ? "Duck" : "Duckling"} reqs`
                    },
                    { type: ComponentType.Separator },
                    {
                        type: ComponentType.TextDisplay,
                        content: users.map(user => user.name.replaceAll("_", "\\_")).join("\n")
                    },
                    { type: ComponentType.Separator },
                    {
                        type: ComponentType.TextDisplay,
                        content: `-# Response time: ${Date.now() - timestamp.getTime()}ms • <t:${Math.floor(Date.now() / 1000)}:F>`
                    }
                ]
            },
            {
                type: ComponentType.ActionRow,
                components: [
                    {
                        custom_id: `userswhomeetreq-${options.duck ? "duck" : "duckling"}-page_0`,
                        type: ComponentType.Button,
                        label: '◀️',
                        style: ButtonStyle.Primary,
                        disabled: true
                    },
                    {
                        custom_id: `userswhomeetreq-${options.duck ? "duck" : "duckling"}-search`,
                        type: ComponentType.Button,
                        label: `Page 1/${Math.ceil(userCount / 25)}`,
                        style: ButtonStyle.Secondary,
                        disabled: false
                    },
                    {
                        custom_id: `userswhomeetreq-${options.duck ? "duck" : "duckling"}-page_2`,
                        type: ComponentType.Button,
                        label: '▶️',
                        style: ButtonStyle.Primary,
                        disabled: Math.ceil(userCount / 25) < 2
                    }
                ]
            }
        ]
    }, null, true);
    
    return NextResponse.json(
        { success: false, error: "Unknown command" },
        { status: 404 }
    );
}
export const CommandData = {
    name: "userswhomeetreq",
    description: "View all users who meet the requirements for the guilds.",
    options: [
        {
            name: "duck",
            description: "View all users who meet the requirements for the Duck guild.",
            type: ApplicationCommandOptionType.Subcommand
        },
        {
            name: "duckling",
            description: "View all users who meet the requirements for the Duckling guild.",
            type: ApplicationCommandOptionType.Subcommand
        }
    ]
}