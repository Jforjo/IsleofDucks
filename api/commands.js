import { InstallGlobalCommands, InstallGuildCommands, DeleteGlobalCommands, DeleteGuildCommands } from "../utils/discordUtils.js";
import { CommandData as CheckAPI } from "../commands/application/checkapi.js";
import { CommandData as GuildCata } from "../commands/application/guildcata.js";
import { CommandData as Superlative } from "../commands/application/superlative.js";
// COMMANDS.push({
//     name: 'support',
//     description: 'Like this bot? Support me!',
// });

// COMMANDS.push({
//     name: 'ping',
//     description: 'Replies with Pong!',
// });


export default async (req, res) => {
    await InstallGlobalCommands([Superlative]);
    // const result = await InstallGuildCommands("997893922607087636", [CheckAPI, GuildCata]);
    // await DeleteGlobalCommands([{ id: "" }]);
    // await DeleteGuildCommands("997893922607087636", [{ id: "1288787008252018711" }, { id: "1288787008252018710" }]);
    return res.json({ message: result });
}
