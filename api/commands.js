import { InstallGlobalCommands, InstallGuildCommands, DeleteGlobalCommands, DeleteGuildCommands } from "../utils/discordUtils";
import { CommandData } from "../commands/application/checkapi";
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
    // await InstallGuildCommands("997893922607087636", [CommandData]);
    // await DeleteGlobalCommands(COMMANDS);
    // await DeleteGuildCommands("997893922607087636", [CommandData]);
    return res.json({ message: "Commands Loaded" });
}
