import { InteractionResponseType } from "discord-interactions";
import { ApplicationCommandOptionType, ApplicationCommandType } from "discord-api-types/v10";
import { ConvertSnowflakeToDate } from "../../utils/discordUtils.js";

export default async (req, res) => {
    const interaction = req.body;
    // const DISCORD_EPOCH = 14200070400000;
    // const timestamp = parseInt(interaction.id.padStart(64, '0').toString(2).slice(0,42), 2) + DISCORD_EPOCH;
    const timestamp = ConvertSnowflakeToDate(interaction.id);
    const date = new Date();
    return res.status(200).send({
        type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
        data: {
            content: null,
            embeds: [
                {
                    title: "Pong!",
                    color: parseInt("FF69B4", 16),
                    footer: {
                        text: `Response time: ${date.getTime() - timestamp.getTime()}ms`,
                    },
                    timestamp: date.toISOString()
                }
            ],
        },
    });
}
export const CommandData = {
    name: "ping",
    description: "Pings the bot!",
    type: ApplicationCommandType.ChatInput,
}