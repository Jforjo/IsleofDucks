import { APIApplicationCommandAutocompleteInteraction, APIInteractionResponse, ApplicationCommandOptionType } from "discord-api-types/v10";
import { NextResponse } from "next/server";

function flattenObject(data: { [key: string]: any }): { [key: string]: any } {
    const result: { [key: string]: any } = {};
    
    function recurse(cur: any, prop: string) {
        if (typeof cur !== "object" || cur === null) {
            result[prop] = cur;
        } else if (Array.isArray(cur)) {
            for (let i = 0; i < cur.length; i++) {
                recurse(cur[i], `${prop}[${i}]`);
            }
            if (cur.length === 0) {
                result[prop] = [];
            }
        } else {
            let hasNestedStructure = false;

            for (const p in cur) {
                if (typeof cur[p] === "object") {
                    hasNestedStructure = true;
                    recurse(cur[p], prop ? `${prop}.${p}` : p);
                }
            }

            if (!hasNestedStructure) {
                result[prop] = cur; // Preserve non-nested objects as-is
            }
        }
    }
    
    recurse(data, "");
    return result;
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
    const flatOptions = flattenObject(interaction.data);
    const focused = flatOptions.find((option: {
        type: ApplicationCommandOptionType;
        name: string;
        value: string;
        focused: boolean;
    }) => option.focused) as {
        type: ApplicationCommandOptionType;
        name: string;
        value: string;
        focused: boolean;
    };

    return NextResponse.json(
        { success: true },
        { status: 200 }
    );
}