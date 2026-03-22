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

        // Normalize roles into a flat array of strings
        const flatRoles = Array.isArray(roles)
            ? roles
            : Object.values(roles).flat();

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
