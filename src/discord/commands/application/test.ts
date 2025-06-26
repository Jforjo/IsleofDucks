import { CreateInteractionResponse, FollowupMessage, IsleofDucks, SendMessage } from "@/discord/discordUtils";
import { arrayChunks } from "@/discord/utils";
import { SkyblockBazaarResponse } from "@zikeji/hypixel/dist/types/AugmentedTypes";
import { APIChatInputApplicationCommandInteraction, APIInteractionResponse, ApplicationCommandType, ComponentType, InteractionResponseType, MessageFlags, RESTPatchAPIApplicationCommandJSONBody } from "discord-api-types/v10";
import { NextResponse } from "next/server";

async function getShards() {
    const bzRes = await fetch("https://api.hypixel.net/v2/skyblock/bazaar");
    if (!bzRes.ok) return;
    const bzData = await bzRes.json() as SkyblockBazaarResponse;
    if (!bzData.success) return;
    // return the key and value of bzData.products where the key of the object starts with "SHARD_"
    return Object.entries(bzData.products)
        .filter(([key,]) => key.startsWith("SHARD_"))
        .sort(([, valueA], [, valueB]) => valueA.buy_summary[0].pricePerUnit - valueB.buy_summary[0].pricePerUnit)
    ;
}

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
    // const member = interaction.member;
    // if (!member) {
    //     await CreateInteractionResponse(interaction.id, interaction.token, {
    //         type: InteractionResponseType.ChannelMessageWithSource,
    //         data: {
    //             content: "Could not find who ran the command!",
    //             flags: MessageFlags.Ephemeral
    //         }
    //     });
    //     return NextResponse.json(
    //         { success: false, error: "Could not find who ran the command" },
    //         { status: 400 }
    //     );
    // }
    // if (!(
    //     member.user.id === IsleofDucks.staticIDs.Jforjo
    //     // || member.roles.includes(IsleofDucks.roles.admin)
    // )) {
    //     await CreateInteractionResponse(interaction.id, interaction.token, {
    //         type: InteractionResponseType.ChannelMessageWithSource,
    //         data: {
    //             content: "You do not have permission to run this command!",
    //             flags: MessageFlags.Ephemeral
    //         }
    //     });
    //     return NextResponse.json(
    //         { success: false, error: "You do not have permission to run this command" },
    //         { status: 400 }
    //     );
    // }

    await CreateInteractionResponse(interaction.id, interaction.token, {
        type: InteractionResponseType.DeferredChannelMessageWithSource,
        data: {
            flags: MessageFlags.Ephemeral
        }
    });

    const bzData = await getShards();
    if (!bzData) {
        await FollowupMessage(interaction.token, {
            content: "Failed to fetch shards"
        });
        return NextResponse.json(
            { success: false, error: "Failed to fetch shards" },
            { status: 400 }
        );
    }

    for (const chunk of arrayChunks(bzData, 30)) {
        await SendMessage(interaction.channel.id, {
            flags: MessageFlags.IsComponentsV2,
            components: [
                {
                    type: ComponentType.Container,
                    accent_color: IsleofDucks.colours.main,
                    components: chunk.map(([key, value]) => ({
                        type: ComponentType.TextDisplay,
                        content: `**${key}** - ${value.quick_status.sellPrice} / ${value.quick_status.buyPrice}`,
                    }))
                }
            ]
        })
    }

    // await SendMessage(interaction.channel.id, {
    //     flags: MessageFlags.IsComponentsV2,
    //     components: [
    //         {
    //             type: ComponentType.Container,
    //             accent_color: 0xFB9B00,
    //             components: arrayChunks([...Array(32).keys()].map(num => ({
    //                 type: ComponentType.Button,
    //                 custom_id: `test-${num}`,
    //                 label: `${num}`,
    //                 style: ButtonStyle.Primary
    //             }) as APIButtonComponent), 5).map(row => ({
    //                 type: ComponentType.ActionRow,
    //                 components: row
    //             }))
    //         }
    //     ]
    // });
    
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