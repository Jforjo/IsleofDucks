import { ApplicationCommandType } from "discord-api-types/v10";
import { InteractionResponseType } from "discord-interactions";
import { getImmunePlayers } from "../../utils/hypixelUtils.js";
import { CreateInteractionResponse, ConvertSnowflakeToDate, FollowupMessage } from "../../utils/discordUtils.js";
// import { get } from '@vercel/edge-config';

export default async (req, res) => {
    const interaction = req.body;

    // User sees the "[bot] is thinking..." message
    await CreateInteractionResponse(interaction.id, interaction.token, {
        type: InteractionResponseType.DEFERRED_CHANNEL_MESSAGE_WITH_SOURCE,
    });

    const timestamp = ConvertSnowflakeToDate(interaction.id);

    const immunePlayers = await getImmunePlayers();

    if (!immunePlayers.success) {
        return await FollowupMessage(interaction.token, {
            content: null,
            embeds: [
                {
                    title: "Something went wrong!",
                    description: immunePlayers.message,
                    color: parseInt("B00020", 16),
                    footer: {
                        text: `Response time: ${Date.now() - timestamp.getTime()}ms`,
                    },
                    timestamp: new Date().toISOString()
                }
            ],
        });
    }

    return await FollowupMessage(interaction.token, {
        content: null,
        embeds: [
            {
                title: "Immune Players",
                description: immunePlayers.players.map(player => player.name).join('\n').replace('_', '\\_'),
                color: parseInt("FB9B00", 16),
                footer: {
                    text: `Response time: ${Date.now() - timestamp.getTime()}ms`,
                },
                timestamp: new Date().toISOString()
            }
        ],
    });
}
export const CommandData = {
    name: "immune",
    description: "Returns a list of all immune players.",
    type: ApplicationCommandType.ChatInput,
}