import { BanGuildMember, ConvertSnowflakeToDate, CreateInteractionResponse, FollowupMessage, IsleofDucks, SendMessage } from "@/discord/discordUtils";
import { getUsernameOrUUID } from "@/discord/hypixelUtils";
import { addBannedPlayer, isBannedPlayer } from "@/discord/utils";
import { APIComponentInContainer, APIInteractionResponse, APIModalSubmitInteraction, ComponentType, InteractionResponseType, MessageFlags } from "discord-api-types/v10";
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
    await CreateInteractionResponse(interaction.id, interaction.token, {
        type: InteractionResponseType.DeferredChannelMessageWithSource,
        data: { flags: MessageFlags.Ephemeral }
    });

    const guildID = interaction.guild_id;
    if (!guildID) {
        await FollowupMessage(interaction.token, {
            content: "This modal can only be submitted in a server!",
        });
        return NextResponse.json(
            { success: false, error: "This modal can only be submitted in a server" },
            { status: 400 }
        );
    }
    const member = interaction.member;
    if (!member) {
        await FollowupMessage(interaction.token, {
            content: "Could not find who ran the submitted the modal!",
        });
        return NextResponse.json(
            { success: false, error: "Could not find who ran the submitted the modal" },
            { status: 400 }
        );
    }
    if (!(
        member.roles.includes(IsleofDucks.roles.admin) ||
        member.roles.includes(IsleofDucks.roles.mod_duck) ||
        member.roles.includes(IsleofDucks.roles.mod_duckling)
    )) {
        await FollowupMessage(interaction.token, {
            content: "You don't have permission to submit this modal!",
        });
        return NextResponse.json(
            { success: false, error: "You don't have permission to submit this modal" },
            { status: 403 }
        );
    }

    const components = Object.fromEntries(interaction.data.components.map(component => {
        if (component.type !== ComponentType.Label) return null;
        return [
            component.component.custom_id,
            component
        ];
    }).filter((c): c is [string, Extract<APIModalSubmitInteraction["data"]["components"][number], { type: ComponentType.Label }>] => c !== null));

    const timestamp = ConvertSnowflakeToDate(interaction.id);
    if (!components["username"] ||
        components["username"].component.type !== ComponentType.TextInput ||
        !components["discordid"] ||
        components["discordid"].component.type !== ComponentType.UserSelect ||
        !components["reason"] ||
        components["reason"].component.type !== ComponentType.TextInput ||
        !components["proof"] ||
        components["proof"].component.type !== ComponentType.FileUpload
    ) {
        await FollowupMessage(interaction.token, {
            content: "Invalid modal response!",
        });
        return NextResponse.json(
            { success: false, error: "Invalid modal response" },
            { status: 400 }
        );
    }
    const username = components["username"].component.value;
    
    const uuidResponse = await getUsernameOrUUID(username);
    if (!uuidResponse.success) {
        await FollowupMessage(interaction.token, {
            embeds: [
                {
                    title: "Something went wrong!",
                    description: uuidResponse.message,
                    color: IsleofDucks.colours.error,
                    footer: {
                        text: `Response time: ${Date.now() - timestamp.getTime()}ms`,
                    },
                    timestamp: new Date().toISOString()
                }
            ]
        });
        return NextResponse.json(
            { success: false, error: uuidResponse.message },
            { status: 404 }
        );
    }
    const uuid = uuidResponse.uuid;

    const banned = await isBannedPlayer(uuid);
    if (banned) {
        await FollowupMessage(interaction.token, {
            embeds: [
                {
                    title: `${uuidResponse.name.replaceAll("_", "\\_")} is already banned!`,
                    color: IsleofDucks.colours.main,
                    footer: {
                        text: `Response time: ${Date.now() - timestamp.getTime()}ms`,
                    },
                    timestamp: new Date().toISOString()
                }
            ]
        });
        return NextResponse.json(
            { success: false, error: "This player is already banned" },
            { status: 400 }
        );
    }

    await addBannedPlayer(
        uuid,
        components["discordid"].component.values[0] !== "" ?
            components["discordid"].component.values[0] :
            null,
        components["reason"].component.value
    );

    if (components["discordid"].component.values[0] !== "")
        await BanGuildMember(
            IsleofDucks.serverID,
            components["discordid"].component.values[0],
            `${member.user.username} banned ${uuidResponse.name} with reason: ${components["reason"].component.value}`
        );

    await SendMessage(IsleofDucks.channels.duckoc, {
        content: `kick ${uuidResponse.name} ${components["reason"].component.value}`
    });
    await SendMessage(IsleofDucks.channels.ducklingoc, {
        content: `kick ${uuidResponse.name} ${components["reason"].component.value}`
    });

    const containerComponents: APIComponentInContainer[] = [];
    containerComponents.push({
        type: ComponentType.TextDisplay,
        content: [
            `## ${uuidResponse.name.replaceAll('_', '\\_')} has been banned!`,
            `Reason: ${components["reason"].component.value}`,
            components["discordid"].component.values[0] !== "" ? `Discord: <@${components["discordid"].component.values[0]}> - ${components["discordid"].component.values[0]}` : "",
        ].filter(Boolean).join("\n"),
    }, { type: ComponentType.Separator });
    if (interaction.data.resolved && interaction.data.resolved.attachments) {
        containerComponents.push({
            type: ComponentType.TextDisplay,
            content: `**Proof:**`,
        }, {
            type: ComponentType.MediaGallery,
            items: Object.values(interaction.data.resolved.attachments).map(attachment => attachment.url).map(url => ({
                media: {
                    url: url,
                }
            }))
        });
    }
    containerComponents.push({ type: ComponentType.Separator }, {
        type: ComponentType.TextDisplay,
        content: `Response time: ${Date.now() - timestamp.getTime()}ms • <t:${Math.floor(Date.now() / 1000)}:F>`,
    });

    await SendMessage(IsleofDucks.channels.banlist, {
        flags: MessageFlags.IsComponentsV2,
        components: [
            {
                type: ComponentType.Container,
                accent_color: IsleofDucks.colours.main,
                components: containerComponents,
            },
        ]
    });

    await FollowupMessage(interaction.token, {
        content: `${uuidResponse.name.replaceAll("_", "\\_")} has been banned!`,
    });

    return NextResponse.json(
        { success: true },
        { status: 200 }
    );
}