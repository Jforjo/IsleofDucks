import { CommandData as HelpCommandData, RequiredRoles as HelpRequiredRoles } from "./commands/application/help";
import { CommandData as AwayCommandData, RequiredRoles as AwayRequiredRoles } from "./commands/application/away";

export const HelpData = {
    commands: {
        help: {
            data: HelpCommandData,
            roles: HelpRequiredRoles
        },
        away: {
            data: AwayCommandData,
            roles: AwayRequiredRoles
        }
    }
}

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
            : [...roles.apply, ...roles.remove, ...roles.view];

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
