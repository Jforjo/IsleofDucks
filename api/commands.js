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
    await DeleteGlobalCommands([{ id: "1288515773488435331" }, { id: "1288515771768504383" }]);
    await DeleteGuildCommands("997893922607087636", [{ id: "1288515773488435331" }, { id: "1288515771768504383" }]);
    return res.json({ message: "Commands Loaded" });
}
