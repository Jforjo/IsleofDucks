import { CommandData as HelpCommandData, RequiredRoles as HelpRequiredRoles } from "./commandDatas/help";
import { CommandData as AwayCommandData, RequiredRoles as AwayRequiredRoles } from "./commands/application/away";
import { CommandData as BanCommandData, RequiredRoles as BanRequiredRoles } from "./commands/application/ban";
import { CommandData as BanListCommandData, RequiredRoles as BanListRequiredRoles } from "./commands/application/banlist";
import { CommandData as CheapestShardsCommandData, RequiredRoles as CheapestShardsRequiredRoles } from "./commands/application/cheapestshards";
import { CommandData as checkAPICommandData, RequiredRoles as checkAPIRequiredRoles } from "./commands/application/checkapi";
import { IsleofDucks } from "./discordUtils";

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
        },
        banlist: {
            data: BanListCommandData,
            roles: BanListRequiredRoles
        },
        cheapestshards: {
            data: CheapestShardsCommandData,
            roles: CheapestShardsRequiredRoles
        },
        checkapi: {
            data: checkAPICommandData,
            roles: checkAPIRequiredRoles
        }
    },
    bridgeCommands: {
        combine: {
            data: {
                name: "combine",
                description: "Displays the combination status of the bridges.",
                options: [
                    {
                        name: "guild",
                        description: "Combines or separates the guild bridges.",
                    },
                    {
                        name: "officer",
                        description: "Combines or separates the officer bridges.",
                    }
                ]
            },
            roles: [
                IsleofDucks.roles.admin
            ]
        },
        reset: {
            data: {
                name: "reset",
                description: "Resets the bridges.",
                options: [
                    {
                        name: "duck",
                        description: "Attempts to relog the duck bridge.",
                    },
                    {
                        name: "duckling",
                        description: "Attempts to relog the duckling bridge.",
                    },
                    {
                        name: "both",
                        description: "Attempts to relog both bridges.",
                    },
                    {
                        name: "full",
                        description: "Resets both bridges (takes longer).",
                    }
                ]
            },
            roles: [
                IsleofDucks.roles.admin
            ]
        },
        updatefilters: {
            data: {
                name: "updatefilters",
                description: "Updates the chat filters for the guild.",
            },
            roles: [
                IsleofDucks.roles.admin
            ]
        },
        invite: {
            data: {
                name: "invite",
                description: "Invites a user to the guild.",
                usage: "<user>",
            },
            roles: [
                IsleofDucks.roles.staff
            ]
        },
        kick: {
            data: {
                name: "kick",
                description: "Kicks a user from the guild.",
                usage: "<user> <reason>",
            },
            roles: [
                IsleofDucks.roles.staff
            ]
        },
        log: {
            data: {
                name: "log",
                description: "Displays the logs for the guild or user.",
                usage: "<user> <page>",
            },
            roles: [
                IsleofDucks.roles.staff
            ]
        },
        setrank: {
            data: {
                name: "setrank",
                description: "Sets the rank of a user.",
                usage: "<user> <rank>",
            },
            roles: [
                IsleofDucks.roles.staff
            ]
        }
    }
}