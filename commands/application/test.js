import { InteractionResponseType } from "discord-interactions";
import { ApplicationCommandOptionType, ApplicationCommandType } from "discord-api-types/v10";
import { ConvertSnowflakeToDate } from "../../utils/discordUtils.js";

export default async (req, res) => {
    const interaction = req.body;
    const timestamp = ConvertSnowflakeToDate(interaction.id);
    return res.status(200).send({
        type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
        data: {
            content: null,
            embeds: [
                {
                    title: `Test!`,
                    description: `test\n# Heading (#)\n## Subheading (##)\n### Sub-subheading (###)\n-# Small text (-#)\ntest`,
                    color: parseInt("FF69B4", 16),
                    footer: {
                        text: `Response time: ${Date.now() - timestamp.getTime()}ms`,
                    },
                    timestamp: new Date().toISOString()
                }
            ],
        },
    });
}
export const CommandData = {
    name: "test",
    description: "Test command! It's response will change overtime for testing purposes.",
    type: ApplicationCommandType.ChatInput,
}