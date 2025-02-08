import { APIInteractionResponse, APIModalSubmitInteraction, ButtonStyle, ComponentType, InteractionResponseType, MessageFlags, TextInputStyle } from "discord-api-types/v10";
import { CreateInteractionResponse, FollowupMessage, ConvertSnowflakeToDate, IsleofDucks, SendMessage, GetChannelMessage, EditMessage } from "@/discord/discordUtils";
import { NextResponse } from "next/server";

export default async function Command(
    interaction: APIModalSubmitInteraction
): Promise<
    NextResponse<
        {
            success: boolean;
            error?: string;
        } | APIInteractionResponse
    >
> {
    if (!interaction.member) {
        await CreateInteractionResponse(interaction.id, interaction.token, {
            type: InteractionResponseType.ChannelMessageWithSource,
            data: {
                content: "Could not find who ran the command",
                flags: MessageFlags.Ephemeral
            }
        });
        return NextResponse.json(
            { success: false, error: "Could not find who ran the command" },
            { status: 400 }
        );
    }
    const surveyDetails = interaction.data.custom_id.split("-");
    const surveyID = surveyDetails[1];
    const questionNumber = parseInt(surveyDetails[2]);
    const optionID = surveyDetails[3];
    const owner = surveyDetails[4];
    if (interaction.member.user.id !== owner) {
        await CreateInteractionResponse(interaction.id, interaction.token, {
            type: InteractionResponseType.ChannelMessageWithSource,
            data: {
                content: "This isn't your survey to complete",
                flags: MessageFlags.Ephemeral
            }
        });
        return NextResponse.json(
            { success: false, error: "You don't have permission to use this command" },
            { status: 400 }
        );
    }
    
    const survey = IsleofDucks.surveys.find(survey => survey.id === surveyID);
    if (!survey) {
        await CreateInteractionResponse(interaction.id, interaction.token, {
            type: InteractionResponseType.ChannelMessageWithSource,
            data: {
                content: "Survey not found",
                flags: MessageFlags.Ephemeral
            }
        });
        return NextResponse.json(
            { success: false, error: "Survey not found" },
            { status: 400 }
        );
    }
    let selectedOption;
    for (const row of survey.questions[questionNumber - 1].options) {
        for (const option of row) {
            if (option.id === optionID) {
                selectedOption = option;
            }
        }
    }
    if (!selectedOption) {
        await CreateInteractionResponse(interaction.id, interaction.token, {
            type: InteractionResponseType.ChannelMessageWithSource,
            data: {
                content: "Survey option not found",
                flags: MessageFlags.Ephemeral
            }
        });
        return NextResponse.json(
            { success: false, error: "Survey option not found" },
            { status: 400 }
        );
    }
    
    const totalMessage = await GetChannelMessage(IsleofDucks.channels.surveyResponses, "1337447048672448576");
    if (!totalMessage) {
        await CreateInteractionResponse(interaction.id, interaction.token, {
            type: InteractionResponseType.ChannelMessageWithSource,
            data: {
                content: "Survey results channel not found",
                flags: MessageFlags.Ephemeral
            }
        });
        return NextResponse.json(
            { success: false, error: "Survey results channel not found" },
            { status: 400 }
        );
    }

    const input = interaction.data.components[0].components[0].value;

    // ACK response and update the original message
    await CreateInteractionResponse(interaction.id, interaction.token, {
        type: InteractionResponseType.DeferredMessageUpdate,
    });
    
    const timestamp = ConvertSnowflakeToDate(interaction.id);

    let missing = survey.questions[questionNumber - 1].options.flatMap(row => row);
    
    if (!interaction.member.roles.includes(IsleofDucks.roles.staff)) {
        await EditMessage(IsleofDucks.channels.surveyResponses, "1337447048672448576", {
            content: [...totalMessage.content.split('\n').map(line => {
                const surveyType = line.split(' ').slice(1).join(' ');
                missing = missing.filter(option => option.name !== surveyType);
                if (surveyType !== survey.name) return line;
                const num = parseInt(line.split(' ')[0]);
                return `${num + 1} ${surveyType}`;
            }), ...missing.map(option => `${option.id === selectedOption.id ? '1' : '0'} ${option.name}`)].join('\n'),
            embeds: totalMessage.embeds.map(embed => {
                if (embed.title !== survey.name) return embed;
                if (!embed.fields || embed.fields.length === 0) return embed;
                return {
                    title: embed.title,
                    description: embed.description,
                    fields: embed.fields.map(field => {
                        if (field.name !== survey.questions[questionNumber - 1].question) return field;
                        return {
                            name: field.name,
                            value: field.value.split('\n').map(line => {
                                const answer = line.split(' ').slice(1).join(' ');
                                if (answer !== selectedOption.name) return line;
                                const num = parseInt(line.split(' ')[0]);
                                return `${num + 1} ${answer}`;
                            }).join('\n'),
                        }
                    }),
                    color: embed.color
                }
            })
        });
    }

    const message = await SendMessage(IsleofDucks.channels.surveyResponses, {
        embeds: [
            {
                title: `Survey - ${survey.name}`,
                description: [
                    `**Completed by**`,
                    `<@${interaction.member.user.id}> - ${interaction.member.user.id}`,
                    `${interaction.member.nick ? `${interaction.member.nick} - ${interaction.member.user.username}` : interaction.member.user.username}`,
                    `**Description:**`,
                    survey.description,
                ].join('\n'),
                color: 0xFB9B00,
                fields: [
                    {
                        name: survey.questions[questionNumber - 1].question,
                        value: [
                            `${selectedOption.name}:`,
                            input
                        ].join('\n')
                    }
                ],
                footer: {
                    text: `Response time: ${Date.now() - timestamp.getTime()}ms`,
                },
                timestamp: new Date().toISOString()
            }
        ],
    });

    if (!message) {
        await FollowupMessage(interaction.token, {
            content: "Failed to send survey response message",
        });
        return NextResponse.json(
            { success: false, error: "Failed to send survey response message" },
            { status: 400 }
        );
    }

    if (survey.questions.length === questionNumber) {
        await FollowupMessage(interaction.token, {
            content: null,
            embeds: [
                {
                    title: `Survey Completed`,
                    description: "Thank you for completing the survey!",
                    color: 0xFB9B00,
                    footer: {
                        text: `Response time: ${Date.now() - timestamp.getTime()}ms`,
                    },
                    timestamp: new Date().toISOString()
                }
            ],
            components: []
        });
    } else {
        await FollowupMessage(interaction.token, {
            content: survey.description,
            embeds: [
                {
                    title: `Question ${questionNumber + 1}/${survey.questions.length}`,
                    description: survey.questions[questionNumber].question,
                    color: 0xFB9B00,
                    footer: {
                        text: `Response time: ${Date.now() - timestamp.getTime()}ms`,
                    },
                    timestamp: new Date().toISOString()
                }
            ],
            components: survey.questions[0].options.map(row => ({
                type: ComponentType.ActionRow,
                components: row.map(option => ({
                    type: ComponentType.Button,
                    custom_id: `survey-${survey.id}-${questionNumber + 1}-${option.id}-${owner}-${message.id}`,
                    label: option.name,
                    style: ButtonStyle.Secondary
                }))
            }))
        });
    }

    return NextResponse.json(
        { success: true },
        { status: 200 }
    );
}
