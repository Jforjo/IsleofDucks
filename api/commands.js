import { InstallGlobalCommands, InstallGuildCommands, DeleteGlobalCommands, DeleteGuildCommands } from "../utils/discordUtils.js";
import { CommandData as CheckAPI } from "../commands/application/checkapi.js";
import { CommandData as GuildCata } from "../commands/application/guildcata.js";
import { CommandData as Superlative } from "../commands/application/superlative.js";
import { CommandData as Ping } from "../commands/application/ping.js";
import { CommandData as Test } from "../commands/application/test.js";
import { CommandData as Embed } from "../commands/application/embed.js";
import { CommandData as Immune } from "../commands/application/immune.js";
import { CommandData as Weekly } from "../commands/application/weekly.js";
// COMMANDS.push({
//     name: 'support',
//     description: 'Like this bot? Support me!',
// });

// COMMANDS.push({
//     name: 'ping',
//     description: 'Replies with Pong!',
// });


export default async (req, res) => {
    const result = await InstallGlobalCommands([CheckAPI, Superlative, Ping, Embed, Immune, Weekly]);
    // const result = await InstallGuildCommands("997893922607087636", [Test, GuildCata]);
    // await DeleteGlobalCommands([{ id: "" }]);
    // await DeleteGuildCommands("997893922607087636", [{ id: "1288791933543649432" }]);
    return res.json({ message: result });
    // return res.json({ message: "Hello, World!" });
}
