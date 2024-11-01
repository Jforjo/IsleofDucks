import { InteractionResponseType } from "discord-interactions";
import { ApplicationCommandOptionType, ApplicationCommandType } from "discord-api-types/v10";
import { ConvertSnowflakeToDate, FollowupMessage, CreateInteractionResponse, IsleofDucks } from "../../utils/discordUtils.js";
import { getUUID } from "../../utils/hypixelUtils.js";
// import { sql } from "@vercel/postgres";

const IMMUNE_USERS = [
    "Ducksicle",
    "Serendibite",
    "J_forjoooooo",
    "j2iscool",
    "kaapelix",
    "justjackjackm",
    "1imb",
    "5kills_",
    "almightysage",
    "Bestesk",
    "CN_E24",
    "Dragibo",
    "DuckyTribunal",
    "eggman45",
    "EloWello",
    "Erik_Valk",
    "FeatheryQuack",
    "Genuineship",
    "GrindPapi",
    "Grocceries",
    "Icewarz",
    "ImWelt",
    "izrys",
    "JalluPullo",
    "Jdy",
    "Jeff_Pr0",
    "kalabash",
    "Lightning9308",
    "Liyua",
    "NoobDuck39",
    "NullVibes",
    "oDaw",
    "pigeonistic",
    "pilot_ahaha",
    "RangeProX69",
    "RetroImp",
    "RubenKan",
    "stezt",
    "StonkSwap",
    "tiger261108",
    "Tinkafu",
    "tqms",
    "Urct",
    "Vxporized",
    "WeBreakTheBank",
    "Wystial",
    "y_w_d",
];

export default async (req, res) => {
    const interaction = req.body;
    // User sees the "[bot] is thinking..." message
    await CreateInteractionResponse(interaction.id, interaction.token, {
        type: InteractionResponseType.DEFERRED_CHANNEL_MESSAGE_WITH_SOURCE,
    });
    const timestamp = ConvertSnowflakeToDate(interaction.id);

    let result = await Promise.all(IMMUNE_USERS.map(async (username) => {
        const mojang = await getUUID(username);
        if (!mojang.success) throw new Error(mojang.message);
        return {
            uuid: mojang.uuid,
            name: mojang.name,
        };
    })).catch((err) => {
        console.log(err.message);
        return {
            success: false,
            message: err.message,
            ping: err.message === "Invalid API key"
        };
    });
    
    if (result?.success === false) {
        let content = null;
        if (result?.ping === true) content = `<@${IsleofDucks.staticIDs.Jforjo}>`;
        return await FollowupMessage(interaction.token, {
            content: content,
            embeds: [
                {
                    title: "Something went wrong!",
                    description: result.message,
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
                title: `Immune Players!`,
                description: result.map((user) => `**${user.name}** - ${user.uuid}`).join("\n"),
                color: parseInt("FF69B4", 16),
                footer: {
                    text: `Response time: ${Date.now() - timestamp.getTime()}ms`,
                },
                timestamp: new Date().toISOString()
            }
        ],
    });
}
export const CommandData = {
    name: "test",
    description: "Test command! It's response will change overtime for testing purposes.",
    type: ApplicationCommandType.ChatInput,
}