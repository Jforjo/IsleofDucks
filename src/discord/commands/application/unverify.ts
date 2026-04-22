import { APIChatInputApplicationCommandInteraction, APIInteractionResponse, ApplicationCommandType, ComponentType, InteractionResponseType, MessageFlags, Snowflake } from "discord-api-types/v10";
import { ConvertSnowflakeToDate, CreateInteractionResponse, ErrorEmbed, IsleofDucks, RemoveGuildMemberRole } from "@/discord/discordUtils";
import { NextResponse } from "next/server";
import { checkLinked, removeLink } from "@/discord/utils";

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

    let userId: Snowflake;
    if (interaction.member) userId = interaction.member.user.id;
    else if (interaction.user) userId = interaction.user.id;
    else {
        await CreateInteractionResponse(interaction.id, interaction.token, {
            type: InteractionResponseType.ChannelMessageWithSource,
            data: {
                flags: MessageFlags.Ephemeral | MessageFlags.IsComponentsV2,
                components: ErrorEmbed("Could not find user ID from interaction!", timestamp, true),
            }
        });
        return NextResponse.json(
            { success: false, error: "Could not find user ID from interaction" },
            { status: 400 }
        );
    }
    
    const linked = await checkLinked(userId);
    if (!linked) {
        await CreateInteractionResponse(interaction.id, interaction.token, {
            type: InteractionResponseType.ChannelMessageWithSource,
            data: {
                flags: MessageFlags.Ephemeral | MessageFlags.IsComponentsV2,
                components: ErrorEmbed("You don't have a linked Minecraft account!", timestamp, true),
            }
        });
        return NextResponse.json(
            { success: false, error: "You don't have a linked Minecraft account!" },
            { status: 400 }
        );
    }

    await removeLink(userId);

    if (interaction.guild)
        await RemoveGuildMemberRole(interaction.guild.id, userId, IsleofDucks.roles.verified);

    await CreateInteractionResponse(interaction.id, interaction.token, {
        type: InteractionResponseType.ChannelMessageWithSource,
        data: {
            flags: MessageFlags.Ephemeral | MessageFlags.IsComponentsV2,
            components: [
                {
                    type: ComponentType.Container,
                    accent_color: 0x00FF00,
                    components: [
                        {
                            type: ComponentType.TextDisplay,
                            content: "You have successfully unlinked your Minecraft account!"
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
    name: "unverify",
    description: "Unverify your Minecraft account.",
    type: ApplicationCommandType.ChatInput,
}
export const RequiredRoles: string[] = [];