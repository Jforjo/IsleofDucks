import { CreateInteractionResponse } from "@/discord/discordUtils";
import { getSuperlativesList } from "@/discord/utils";
import { APIApplicationCommandAutocompleteInteraction, APIInteractionResponse, InteractionResponseType } from "discord-api-types/v10";
import { NextResponse } from "next/server";

async function viewDate(
    interaction: APIApplicationCommandAutocompleteInteraction,
    value: string
): Promise<
    NextResponse<
        {
            success: boolean;
            error?: string;
        } | APIInteractionResponse
    >
> {
    const dates = await getSuperlativesList();
    if (dates.length === 0) {
        await CreateInteractionResponse(interaction.id, interaction.token, {
            type: InteractionResponseType.ApplicationCommandAutocompleteResult,
            data: { choices: [] }
        });
        return NextResponse.json(
            { success: false, error: "No superlatives available." },
            { status: 404 }
        );
    }

    const date = new Date(value);
    if (date.toString() === "Invalid Date") {
        await CreateInteractionResponse(interaction.id, interaction.token, {
            type: InteractionResponseType.ApplicationCommandAutocompleteResult,
            data: { choices: [] }
        });
        return NextResponse.json(
            { success: false, error: "Invalid date." },
            { status: 400 }
        );
    }
    const startDate = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}-01`;

    if (!dates.map(d => d.start).includes(startDate)) {
        await CreateInteractionResponse(interaction.id, interaction.token, {
            type: InteractionResponseType.ApplicationCommandAutocompleteResult,
            data: { choices: [] }
        });
        return NextResponse.json(
            { success: false, error: "No superlative for that date." },
            { status: 404 }
        );
    }

    const startDateObj = new Date(startDate);

    await CreateInteractionResponse(interaction.id, interaction.token, {
        type: InteractionResponseType.ApplicationCommandAutocompleteResult,
        data: {
            choices: [
                {
                    name: `${startDateObj.toLocaleDateString("en-US", {
                        month: "long",
                        year: "numeric"
                    })} - ${dates.find(d => d.start === startDate)?.data.title}`,
                    value: startDate
                }
            ]
        }
    });

    return NextResponse.json(
        { success: true },
        { status: 200 }
    );
}

async function createDate(
    interaction: APIApplicationCommandAutocompleteInteraction,
    value: string
): Promise<
    NextResponse<
        {
            success: boolean;
            error?: string;
        } | APIInteractionResponse
    >
> {
    const dates = await getSuperlativesList();
    if (dates.length === 0) {
        await CreateInteractionResponse(interaction.id, interaction.token, {
            type: InteractionResponseType.ApplicationCommandAutocompleteResult,
            data: { choices: [] }
        });
        return NextResponse.json(
            { success: false, error: "No superlatives available." },
            { status: 404 }
        );
    }

    const date = new Date(value);
    if (date.toString() === "Invalid Date") {
        await CreateInteractionResponse(interaction.id, interaction.token, {
            type: InteractionResponseType.ApplicationCommandAutocompleteResult,
            data: { choices: [] }
        });
        return NextResponse.json(
            { success: false, error: "Invalid date." },
            { status: 400 }
        );
    }
    const startDate = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}-01`;

    if (dates.map(d => d.start).includes(startDate)) {
        await CreateInteractionResponse(interaction.id, interaction.token, {
            type: InteractionResponseType.ApplicationCommandAutocompleteResult,
            data: { choices: [] }
        });
        return NextResponse.json(
            { success: false, error: "A superlative with that date already exists." },
            { status: 404 }
        );
    }

    const startDateObj = new Date(startDate);

    await CreateInteractionResponse(interaction.id, interaction.token, {
        type: InteractionResponseType.ApplicationCommandAutocompleteResult,
        data: {
            choices: [
                {
                    name: startDateObj.toLocaleDateString("en-US", {
                        month: "long",
                        year: "numeric"
                    }),
                    value: startDate
                }
            ]
        }
    });

    return NextResponse.json(
        { success: true },
        { status: 200 }
    );
}

async function deleteDate(
    interaction: APIApplicationCommandAutocompleteInteraction,
    value: string
): Promise<
    NextResponse<
        {
            success: boolean;
            error?: string;
        } | APIInteractionResponse
    >
> {
    const dates = await getSuperlativesList();
    if (dates.length === 0) {
        await CreateInteractionResponse(interaction.id, interaction.token, {
            type: InteractionResponseType.ApplicationCommandAutocompleteResult,
            data: { choices: [] }
        });
        return NextResponse.json(
            { success: false, error: "No superlatives available." },
            { status: 404 }
        );
    }

    const date = new Date(value);
    if (date.toString() === "Invalid Date") {
        await CreateInteractionResponse(interaction.id, interaction.token, {
            type: InteractionResponseType.ApplicationCommandAutocompleteResult,
            data: { choices: [] }
        });
        return NextResponse.json(
            { success: false, error: "Invalid date." },
            { status: 400 }
        );
    }
    const startDate = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}-01`;

    if (!dates.map(d => d.start).includes(startDate)) {
        await CreateInteractionResponse(interaction.id, interaction.token, {
            type: InteractionResponseType.ApplicationCommandAutocompleteResult,
            data: { choices: [] }
        });
        return NextResponse.json(
            { success: false, error: "No superlative for that date." },
            { status: 404 }
        );
    }

    const startDateObj = new Date(startDate);

    if (startDateObj <= new Date()) {
        await CreateInteractionResponse(interaction.id, interaction.token, {
            type: InteractionResponseType.ApplicationCommandAutocompleteResult,
            data: { choices: [] }
        });
        return NextResponse.json(
            { success: false, error: "Cannot delete the current or a previous superlative." },
            { status: 403 }
        );
    }

    await CreateInteractionResponse(interaction.id, interaction.token, {
        type: InteractionResponseType.ApplicationCommandAutocompleteResult,
        data: {
            choices: [
                {
                    name: `${startDateObj.toLocaleDateString("en-US", {
                        month: "long",
                        year: "numeric"
                    })} - ${dates.find(d => d.start === startDate)?.data.title}`,
                    value: startDate
                }
            ]
        }
    });

    return NextResponse.json(
        { success: true },
        { status: 200 }
    );
}

export default async function(
    interaction: APIApplicationCommandAutocompleteInteraction
): Promise<
    NextResponse<
        {
            success: boolean;
            error?: string;
        } | APIInteractionResponse
    >
> {
    // I'm not improving this :sob:
    const options = Object.fromEntries(interaction.data.options.map(option => {
        if ('value' in option) {
            return [option.name, option];
        } else if (option.options) {
            return [option.name, Object.fromEntries(option.options.map(option => {
                if ('value' in option) {
                    return [option.name, option];
                } else if (option.options) {
                    return [option.name, Object.fromEntries(option.options.map(option => {
                        return [option.name, option]
                    }))];
                } else {
                    return [option.name, null];
                }
            }))];
        } else {
            return [option.name, null];
        }
    }));

    if ('view' in options && 'date' in options.view && options.view.date.focused === true) return await viewDate(interaction, options.view.date.value);
    else if ('create' in options && 'date' in options.create && options.create.date.focused === true) return await createDate(interaction, options.create.date.value);

    return NextResponse.json(
        { success: true },
        { status: 200 }
    );
}