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