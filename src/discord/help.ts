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
            flatRoles = [...new Set(roles)];
        } else {
            const values = Object.values(roles) as (string[] | Record<string, string[]>)[];
            const flattened = values.flatMap(v => 
                Array.isArray(v) ? v : Object.values(v).flat()
            );
            flatRoles = [...new Set(flattened)];
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

