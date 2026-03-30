import { CreateInteractionResponse } from "@/discord/discordUtils";
import { getSuperlativesList, PartialActiveSuperlative } from "@/discord/utils";
import { APIApplicationCommandAutocompleteInteraction, APIInteractionResponse, InteractionResponseType } from "discord-api-types/v10";
import { NextResponse } from "next/server";
import SuperlativeTypes from "@/discord/superlatives";

function getPossibleDates(value: string, disallowedDates: PartialActiveSuperlative[]): {
    name: string;
    value: string;
}[] {
    const months = [
        "january", "february", "march", "april", "may", "june",
        "july", "august", "september", "october", "november", "december"
    ];
    const years = Array.from({ length: 10 }, (_, i) => new Date().getUTCFullYear() + i);
    const possibleDates = months.flatMap(month => years.map(year => `${month} ${year}`));
    const filteredDates = possibleDates.filter(date => {
        const tempDate = new Date(date);
        for (const d of disallowedDates) {
            const dDate = new Date(d.start);
            if (dDate.getFullYear() === tempDate.getFullYear() && dDate.getMonth() === tempDate.getMonth()) {
                return false;
            }
        }
        return date.includes(value.toLowerCase());
    }).slice(0, 25).map(date => {
        const tempDate = new Date(date);
        return {
            name: `${tempDate.toLocaleDateString("en-US", {
                month: "long",
                year: "numeric"
            })}`,
            value: date
        };
    });
    return filteredDates;
}

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

    const filteredDates = getPossibleDates(value, dates);
    if (filteredDates.length === 0) {
        await CreateInteractionResponse(interaction.id, interaction.token, {
            type: InteractionResponseType.ApplicationCommandAutocompleteResult,
            data: { choices: [] }
        });
        return NextResponse.json(
            { success: false, error: "No superlatives available for that month." },
            { status: 404 }
        );
    }
    const choices = filteredDates.map(date => {
        const dDate = new Date(date.value);
        return {
            name: `${dDate.toLocaleDateString("en-US", {
                month: "long",
                year: "numeric"
            })} - ${dates.find(d => new Date(d.start).getTime() === dDate.getTime())?.data.title}`,
            value: date.value
        };
    });

    await CreateInteractionResponse(interaction.id, interaction.token, {
        type: InteractionResponseType.ApplicationCommandAutocompleteResult,
        data: {
            choices: choices
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

    const filteredDates = getPossibleDates(value, dates);
    if (filteredDates.length === 0) {
        await CreateInteractionResponse(interaction.id, interaction.token, {
            type: InteractionResponseType.ApplicationCommandAutocompleteResult,
            data: { choices: [] }
        });
        return NextResponse.json(
            { success: false, error: "No superlatives available for that month." },
            { status: 404 }
        );
    }

    // const date = new Date(value);
    // if (date.toString() === "Invalid Date") {
    //     await CreateInteractionResponse(interaction.id, interaction.token, {
    //         type: InteractionResponseType.ApplicationCommandAutocompleteResult,
    //         data: { choices: [] }
    //     });
    //     return NextResponse.json(
    //         { success: false, error: "Invalid date." },
    //         { status: 400 }
    //     );
    // }
    // const startDate = `${date.getUTCFullYear()}-${(date.getUTCMonth() + 1).toString().padStart(2, '0')}-01`;
    // const startDateObj = new Date(startDate);

    // if (dates.map(d => new Date(d.start).getTime()).includes(startDateObj.getTime())) {
    //     await CreateInteractionResponse(interaction.id, interaction.token, {
    //         type: InteractionResponseType.ApplicationCommandAutocompleteResult,
    //         data: { choices: [] }
    //     });
    //     return NextResponse.json(
    //         { success: false, error: "A superlative with that date already exists." },
    //         { status: 404 }
    //     );
    // }

    await CreateInteractionResponse(interaction.id, interaction.token, {
        type: InteractionResponseType.ApplicationCommandAutocompleteResult,
        data: {
            // choices: [
            //     {
            //         name: startDateObj.toLocaleDateString("en-US", {
            //             month: "long",
            //             year: "numeric"
            //         }),
            //         value: startDate
            //     }
            // ]
            choices: filteredDates
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

    const filteredDates = getPossibleDates(value, dates);
    if (filteredDates.length === 0) {
        await CreateInteractionResponse(interaction.id, interaction.token, {
            type: InteractionResponseType.ApplicationCommandAutocompleteResult,
            data: { choices: [] }
        });
        return NextResponse.json(
            { success: false, error: "No superlatives available for that month." },
            { status: 404 }
        );
    }

    const choices = filteredDates.map(date => {
        const dDate = new Date(date.value);
        return dDate <= new Date() ? null : {
            name: `${dDate.toLocaleDateString("en-US", {
                month: "long",
                year: "numeric"
            })} - ${dates.find(d => new Date(d.start).getTime() === dDate.getTime())?.data.title}`,
            value: date.value
        };
    }).filter(d => d !== null);

    await CreateInteractionResponse(interaction.id, interaction.token, {
        type: InteractionResponseType.ApplicationCommandAutocompleteResult,
        data: {
            choices: choices
        }
    });

    return NextResponse.json(
        { success: true },
        { status: 200 }
    );
}

async function createType(
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
    await CreateInteractionResponse(interaction.id, interaction.token, {
        type: InteractionResponseType.ApplicationCommandAutocompleteResult,
        data: {
            choices: Object.entries(SuperlativeTypes).filter(([, v]) =>
                v.title.toLowerCase().includes(value.toLowerCase())
            ).slice(0, 25).map(([k, v]) => ({
                name: v.title,
                value: k
            }))
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
    else if ('create' in options) {
        if ('date' in options.create && options.create.date.focused === true) return await createDate(interaction, options.create.date.value);
        else if ('type' in options.create && options.create.type.focused === true) return await createType(interaction, options.create.type.value);
    } else if ('delete' in options && 'date' in options.delete && options.delete.date.focused === true) return await deleteDate(interaction, options.delete.date.value);

    return NextResponse.json(
        { success: true },
        { status: 200 }
    );
}