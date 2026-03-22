import { CommandData as HelpCommandData, RequiredRoles as HelpRequiredRoles } from "./commandDatas/help";
import { CommandData as AwayCommandData, RequiredRoles as AwayRequiredRoles } from "./commands/application/away";
import { CommandData as BanCommandData, RequiredRoles as BanRequiredRoles } from "./commands/application/ban";

export const HelpData = {
    commands: {
        help: {
            data: HelpCommandData,
            roles: HelpRequiredRoles
        },
        away: {
            data: AwayCommandData,
            roles: AwayRequiredRoles
        },
        ban: {
            data: BanCommandData,
            roles: BanRequiredRoles
        }
    }
}