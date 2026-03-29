import { CreateInteractionResponse } from "@/discord/discordUtils";
import { APIInteractionResponse, APIMessageComponentButtonInteraction, ComponentType, InteractionResponseType, TextInputStyle } from "discord-api-types/v10";
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
    // let userId: Snowflake;
    // if (interaction.member) userId = interaction.member.user.id;
    // else if (interaction.user) userId = interaction.user.id;
    // else {
    //     await CreateInteractionResponse(interaction.id, interaction.token, {
    //         type: InteractionResponseType.ChannelMessageWithSource,
    //         data: {
    //             flags: MessageFlags.Ephemeral,
    //             content: "Could not find user ID from interaction!" ,
    //         }
    //     });
    //     return NextResponse.json(
    //         { success: false, error: "Could not find user ID from interaction" },
    //         { status: 400 }
    //     );
    // }
    
    // const discordExists = await checkDiscordInDB(userId);
    // if (!discordExists) {
    //     await CreateInteractionResponse(interaction.id, interaction.token, {
    //         type: InteractionResponseType.ChannelMessageWithSource,
    //         data: {
    //             flags: MessageFlags.Ephemeral | MessageFlags.IsComponentsV2,
    //             components: [
    //                 {
    //                     type: ComponentType.Section,
    //                     components: [
    //                         {
    //                             type: ComponentType.TextDisplay,
    //                             content: "You must authorise first!",
    //                         }
    //                     ],
    //                     accessory: {
    //                         type: ComponentType.Button,
    //                         style: ButtonStyle.Link,
    //                         label: "Authorise Me",
    //                         url: `https://isle-of-ducks.vercel.app/api/auth/discord/redirect`
    //                     }
    //                 }
    //             ]
    //         }
    //     });
    //     return NextResponse.json(
    //         { success: false, error: "You must authorise first" },
    //         { status: 400 }
    //     );
    // }

    await CreateInteractionResponse(interaction.id, interaction.token, {
        type: InteractionResponseType.Modal,
        data: {
            custom_id: `verify`,
            title: "Verify your Minecraft account",
            components: [
                {
                    type: ComponentType.Label,
                    label: "Username",
                    component: {
                        type: ComponentType.TextInput,
                        custom_id: "username",
                        placeholder: "Enter your Minecraft username",
                        style: TextInputStyle.Short,
                        min_length: 3,
                        max_length: 16,
                        required: true,
                    },
                }
            ]
        }
    });
    return NextResponse.json(
        { success: false },
        { status: 200 }
    );
}
