import { MessageComponentTypes, ButtonStyleTypes } from "discord-interactions";
import { IsleofDucks } from "../utils/discordUtils.js";

export default {
    content: null,
    embeds: [
        {
            title: "Temporary Carry Application Embed",
            description: "Use this to create a carry application. Not the embed above.",
            color: parseInt("FB9B00", 16),
            fields: [
                {
                    name: "Encountered an error?",
                    value: `* Create a support ticket here: <#${IsleofDucks.channels.support}>\n* Ping <@${IsleofDucks.staticIDs.Jforjo}>.\n* Explain the error in detail and provide screenshots.`,
                }
            ]
        }
    ],
    components: [
        {
            type: MessageComponentTypes.ACTION_ROW,
            components: [
                {
                    type: MessageComponentTypes.BUTTON,
                    label: "Click here to apply",
                    style: ButtonStyleTypes.PRIMARY,
                    custom_id: "carry_application",
                    emoji: {
                        name: "📜",
                        id: null
                    }
                },
            ]
        }
    ]
}