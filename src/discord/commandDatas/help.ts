import { ApplicationCommandType } from "discord-api-types/v10";
import { IsleofDucks } from "../discordUtils";

export const CommandData = {
    name: "help",
    description: "Displays the help menu.",
    type: ApplicationCommandType.ChatInput
}
export const RequiredRoles = [
    IsleofDucks.roles.verified
];
