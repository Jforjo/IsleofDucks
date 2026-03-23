import { HelpData } from "./helpData";

type Input = {
    [key: string]: {
        roles: typeof HelpData["commands"][keyof typeof HelpData["commands"]]["roles"];
    };
};

type Output = {
    [role: string]: {
        label: string;
        value: string;
    }[];
};

export function invertRoles(input: Input): Output {
    const result: Output = {};

    for (const entity in input) {
        const roles = input[entity].roles;

        let flatRoles: string[];

        if (Array.isArray(roles)) {
            // Case 1: string[]
            flatRoles = [...new Set(roles)];
        } else {
            // Case 2 & 3: Record<string, string[]> OR Record<Record<string,string[]>, string[]>
            // At runtime both are just objects with string keys
            const values = Object.values(roles) as string[][];
            flatRoles = [...new Set(values.flat())];
        }

        for (const role of flatRoles) {
            if (!result[role]) {
                result[role] = [];
            }
            result[role].push({
                label: entity,
                value: entity
            });
        }
    }

    return result;
}

