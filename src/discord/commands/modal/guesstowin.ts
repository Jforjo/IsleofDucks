import { CreateInteractionResponse } from "@/discord/discordUtils";
import { capitalizeFirstLetter } from "@/discord/utils";
import { APIInteractionResponse, APIMessageTopLevelComponent, APIModalSubmitInteraction, ButtonStyle, ComponentType, InteractionResponseType, MessageFlags } from "discord-api-types/v10";
import { NextResponse } from "next/server";

async function setupGuessToWin(
    interaction: APIModalSubmitInteraction
): Promise<
    NextResponse<
        {
            success: boolean;
            error?: string;
        } | APIInteractionResponse
    >
> {
    const type = interaction.data.custom_id.split("-")[2];
    const inputs = Object.fromEntries(interaction.data.components.map(component => {
        if (component.type !== ComponentType.Label) return null;
        if (component.component.type !== ComponentType.TextInput) return null;
        return [
            component.component.custom_id,
            component.component.value
        ];
    }).filter((c): c is [string, string] => c !== null));

    await CreateInteractionResponse(interaction.id, interaction.token, {
        type: InteractionResponseType.UpdateMessage,
        data: {
            flags: MessageFlags.Ephemeral | MessageFlags.IsComponentsV2,
            components: interaction.message?.components?.map((component) => {
                if (component.type !== ComponentType.Container) return component;

                return {
                    ...component,
                    components: component.components.map((component) => {
                        if (component.type !== ComponentType.Section) return component;
                        if (component.accessory.type !== ComponentType.Button) return component;
                        if (component.accessory.style !== ButtonStyle.Secondary) return component;
                        if (!component.accessory.custom_id.includes(`guesstowin-setup-${type}`)) return component;

                        return {
                            ...component,
                            components: [
                                ...component.components.slice(0, 1),
                                {
                                    type: ComponentType.TextDisplay,
                                    content: [
                                        ...component.components.slice(1, 2).map(c => c.content),
                                        `${
                                        type === "answer" ?
                                            inputs.answer : (
                                                type === "hints" ?
                                                    `At ${inputs.at} guesses: ${inputs.hint}` :
                                                    inputs.prize
                                            )

                                    }`,
                                    ].join("\n")
                                },
                            ]
                        }
                    })
                }
            }) as APIMessageTopLevelComponent[]
        }
    });

    return NextResponse.json(
        { success: true },
        { status: 200 }
    );
}
    

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
    const type = interaction.data.custom_id.split("-")[1];
    if (type === "setup") return await setupGuessToWin(interaction);

    return NextResponse.json(
        { success: true },
        { status: 200 }
    );
}