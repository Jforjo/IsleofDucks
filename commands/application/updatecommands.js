import { ApplicationCommandType } from "discord-api-types/v10";
import { InteractionResponseType } from "discord-interactions";
import { CreateInteractionResponse, FollowupMessage, IsleofDucks, InstallGlobalCommands, InstallGuildCommands, DeleteGlobalCommands, DeleteGuildCommands } from "../../utils/discordUtils.js";

import { CommandData as CheckAPI } from "../commands/application/checkapi.js";
import { CommandData as GuildCata } from "../commands/application/guildcata.js";
import { CommandData as Superlative } from "../commands/application/superlative.js";
import { CommandData as Ping } from "../commands/application/ping.js";
import { CommandData as Test } from "../commands/application/test.js";
import { CommandData as Embed } from "../commands/application/embed.js";
import { CommandData as Immune } from "../commands/application/immune.js";
import { CommandData as Weekly } from "../commands/application/weekly.js";

export default async (req, res) => {
    const interaction = req.body;

    // User sees the "[bot] is thinking..." message
    await CreateInteractionResponse(interaction.id, interaction.token, {
        type: InteractionResponseType.DEFERRED_CHANNEL_MESSAGE_WITH_SOURCE,
        data: { flags: 1 << 6 },
    });

    const user = interaction.member.user;
    if (user.id != IsleofDucks.staticIDs.Jforjo) {
        return await FollowupMessage(interaction.token, {
            content: `Only <@${IsleofDucks.staticIDs.Jforjo}> can use this command!`,
        });
    }

    const result = await InstallGlobalCommands([
        CommandData,
        CheckAPI,
        Superlative,
        Ping,
        Embed,
        Immune,
        Weekly
    ]);

    return await FollowupMessage(interaction.token, {
        content: result,
    });
}
export const CommandData = {
    name: "updatecommands",
    description: "Updates the bot's global commands.",
    type: ApplicationCommandType.ChatInput,
}