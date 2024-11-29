import { ApplicationCommandType } from "discord-api-types/v10";
import { InteractionResponseType } from "discord-interactions";
import { CreateInteractionResponse, FollowupMessage, IsleofDucks, GetAllGuildMembers, AddGuildMemberRole, RemoveGuildMemberRole } from "../../utils/discordUtils.js";
import embed from "./embed.js";

const tempRole = "1311851831361671168";

export default async (req, res) => {
    const interaction = req.body;
    const timestamp = ConvertSnowflakeToDate(interaction.id);

    // User sees the "[bot] is thinking..." message
    await CreateInteractionResponse(interaction.id, interaction.token, {
        type: InteractionResponseType.DEFERRED_CHANNEL_MESSAGE_WITH_SOURCE,
        data: { flags: 1 << 6 },
    });

    let perm = false;
    interaction.member.roles.forEach(role => {
        if (role == IsleofDucks.roles.admin) perm = true;
        else if (role == IsleofDucks.roles.mod_duck) perm = true;
        else if (role == IsleofDucks.roles.mod_duckling) perm = true;
        else if (role == IsleofDucks.roles.service_management) perm = true;
    });
    if (!perm) {
        return await FollowupMessage(interaction.token, {
            content: `You don't have permission to use this command!`,
        });
    }

    let usersHadRolesAdded = 0;
    let usersHadRolesRemoved = 0;
    let rolesAdded = 0;
    let rolesRemoved = 0;

    const members = await GetAllGuildMembers(interaction.guild.id);
    await Promise.all(members.map(async (member) => {
        if (member.roles.includes(IsleofDucks.roles.duck_guild_member) || member.roles.includes(IsleofDucks.roles.duckling_guild_member)) {
            if (!member.roles.includes(tempRole)) {
                await AddGuildMemberRole(interaction.guild.id, member.id, tempRole);
                rolesAdded++;
                usersHadRolesAdded++;
            }
        } else {
            if (member.roles.includes(tempRole)) {
                await RemoveGuildMemberRole(interaction.guild.id, member.id, tempRole);
                rolesRemoved++;
                usersHadRolesRemoved++;
            }
        }
    }));

    return await FollowupMessage(interaction.token, {
        content: null,
        embeds: [
            {
                title: "Done!",
                description: `Added ${rolesAdded} roles to ${usersHadRolesAdded} users.\nRemoved ${rolesRemoved} roles from ${usersHadRolesRemoved} users.`,
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
    name: "updateroles",
    description: "Updates roles for all users.",
    type: ApplicationCommandType.ChatInput
}