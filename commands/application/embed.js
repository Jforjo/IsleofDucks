import { ApplicationCommandOptionType, ApplicationCommandType } from "discord-api-types/v10";
import { InteractionResponseType } from "discord-interactions";
import { IsleofDucks, CreateInteractionResponse, SendMessage, FollowupMessage } from "../../utils/discordUtils.js";

export default async (req, res) => {
    const interaction = req.body;
    // User sees the "[bot] is thinking..." ephemeral message
    await CreateInteractionResponse(interaction.id, interaction.token, {
        type: InteractionResponseType.DEFERRED_CHANNEL_MESSAGE_WITH_SOURCE,
        data: { flags: 1 << 6 },
    });

    if (interaction.user != null) {
        // The command was a DM
        return await FollowupMessage(interaction.token, {
            content: "You can't use this command in DMs!",
        });
    }

    const user = interaction.member.user;
    if (user.id != IsleofDucks.staticIDs.Jforjo && user.id != IsleofDucks.staticIDs.Ducksicle) {
        return await FollowupMessage(interaction.token, {
            content: "You can't use this command!",
        });
    }

    const options = Object.fromEntries(interaction.data.options.map(option => [option.name, option.value]));
    
    let embedData = null;
    try {
        const { default: embed } = await import(`../../embeds/${options.name}.js`);
        embedData = embed;
    } catch {
        return await FollowupMessage(interaction.token, {
            content: "Failed to load embed!",
        });
    }
    if (embedData == null) {
        return await FollowupMessage(interaction.token, {
            content: "Failed to load embed!",
        });
    }
    
    await SendMessage(interaction.channel_id, embedData);
    
    return await FollowupMessage(interaction.token, {
        content: "Successfully loaded the embed!",
    });
}
export const CommandData = {
    name: "embed",
    description: "Sends an embed",
    type: ApplicationCommandType.ChatInput,
    options: [
        {
            name: "name",
            description: "The name of the embed",
            type: ApplicationCommandOptionType.String,
            required: true
        }
    ],
}