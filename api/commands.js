import { CommandData } from "../commands/checkapi";
// COMMANDS.push({
//     name: 'support',
//     description: 'Like this bot? Support me!',
// });

// COMMANDS.push({
//     name: 'ping',
//     description: 'Replies with Pong!',
// });


export default async (req, res) => {
    await InstallGlobalCommands([CommandData]);
    await InstallGuildCommands("997893922607087636", [CommandData]);
    // await DeleteGlobalCommands(COMMANDS);
    return res.json({ message: "Commands Loaded" });
}
