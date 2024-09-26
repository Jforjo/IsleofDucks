import { InstallGlobalCommands, InstallGuildCommands, DeleteGlobalCommands, DeleteGuildCommands } from "../utils/discordUtils";
import { CommandData as CheckAPI } from "../commands/application/checkapi";
import { CommandData as GuildCata } from "../commands/application/guildcata";
// COMMANDS.push({
//     name: 'support',
//     description: 'Like this bot? Support me!',
// });

// COMMANDS.push({
//     name: 'ping',
//     description: 'Replies with Pong!',
// });


export default async (req, res) => {
    // await InstallGlobalCommands([CommandData]);
    // await InstallGuildCommands("997893922607087636", [CheckAPI, GuildCata]);
    // await DeleteGlobalCommands([{ id: "" }]);
    await DeleteGuildCommands("997893922607087636", [{ id: "1288783738511163424" }]);
    return res.json({ message: "Commands Loaded" });
}
