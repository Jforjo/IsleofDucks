import { ConvertSnowflakeToDate, CreateInteractionResponse, ErrorEmbed, FollowupMessage, IsleofDucks } from "@/discord/discordUtils";
import { getUsernameOrUUID } from "@/discord/hypixelUtils";
import { getAllMinecraftUsersExpReqLimited, getSettingValue } from "@/discord/utils";
import { APIInteractionResponse, APIMessageComponentButtonInteraction, ButtonStyle, ComponentType, InteractionResponseType, MessageFlags } from "discord-api-types/v10";
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
    if (interaction.data.custom_id === 'userswhomeetreq-search') {
        await CreateInteractionResponse(interaction.id, interaction.token, {
            type: InteractionResponseType.ChannelMessageWithSource,
            data: {
                content: "o/",
                flags: 1 << 6
            }
        });
        return NextResponse.json(
            { success: false, error: "Unknown command" },
            { status: 404 }
        );
    }

    // ACK response and update the original message
    await CreateInteractionResponse(interaction.id, interaction.token, {
        type: InteractionResponseType.DeferredMessageUpdate,
    });

    const timestamp = ConvertSnowflakeToDate(interaction.id);
    
    const page = interaction.data.custom_id.split('_')[1];
    const guild = interaction.data.custom_id.split('-')[1];

    const req = await getSettingValue(`${guild}_req`);
    if (req === null) {
        await FollowupMessage(interaction.token, {
            flags: MessageFlags.IsComponentsV2,
            components: ErrorEmbed(`Failed to get ${guild === "duck" ? "Duck" : "Duckling"} requirements from database`, timestamp, true)
        }, null, true);
        return NextResponse.json(
            { success: false, error: `Failed to get ${guild === "duck" ? "Duck" : "Duckling"} requirements from database` },
            { status: 400 }
        );
    }

    const usersRes = await getAllMinecraftUsersExpReqLimited(parseInt(req), ( parseInt(page) - 1 ) * 25, 25);
    if (usersRes.length === 0) {
        await FollowupMessage(interaction.token, {
            flags: MessageFlags.IsComponentsV2,
            components: ErrorEmbed(`No users meet the requirements for ${guild === "duck" ? "Duck" : "Duckling"}`, timestamp, true)
        }, null, true);
        return NextResponse.json(
            { success: false, error: `No users meet the requirements for ${guild === "duck" ? "Duck" : "Duckling"}` },
            { status: 400 }
        );
    }

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
                        content: `## User who meet ${guild === "duck" ? "Duck" : "Duckling"} reqs`
                    },
                    { type: ComponentType.Separator },
                    {
                        type: ComponentType.TextDisplay,
                        content: users.map(user => user.name).join("\n")
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
                        custom_id: `userswhomeetreq-${guild}-page_${parseInt(page) - 1}`,
                        type: ComponentType.Button,
                        label: '◀️',
                        style: ButtonStyle.Primary,
                        disabled: parseInt(page) <= 1
                    },
                    {
                        custom_id: `userswhomeetreq-search`,
                        type: ComponentType.Button,
                        label: `Page ${page}/${Math.ceil(users.length / 25)}`,
                        style: ButtonStyle.Secondary,
                        disabled: false
                    },
                    {
                        custom_id: `userswhomeetreq-${guild}-page_${parseInt(page) + 1}`,
                        type: ComponentType.Button,
                        label: '▶️',
                        style: ButtonStyle.Primary,
                        disabled: Math.ceil(users.length / 25) < parseInt(page) + 1
                    }
                ]
            }
        ]
    }, null, true);

    return NextResponse.json(
        { success: true },
        { status: 200 }
    );
}