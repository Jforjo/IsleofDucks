import { InteractionResponseType, MessageComponentTypes } from "discord-interactions";
import { encodeCarrierData } from "../../utils/discordUtils";

export default async (req, res) => {
    const interaction = req.body;
    const selectedCarriers = {
        f1_4: interaction.data.values.includes("f1_4"),
        f5_6: interaction.data.values.includes("f5_6"),
        f7: interaction.data.values.includes("f7"),
        m1: interaction.data.values.includes("m1"),
        m2: interaction.data.values.includes("m2"),
        m3: interaction.data.values.includes("m3"),
        m4: interaction.data.values.includes("m4"),
        m5: interaction.data.values.includes("m5"),
        m6: interaction.data.values.includes("m6"),
        m7: interaction.data.values.includes("m7"),
        rev: interaction.data.values.includes("rev"),
        tara: interaction.data.values.includes("tara"),
        sven: interaction.data.values.includes("sven"),
        eman: interaction.data.values.includes("eman"),
        eman4: interaction.data.values.includes("eman4"),
        inferno: interaction.data.values.includes("inferno"),
        inferno4: interaction.data.values.includes("inferno4"),
        kuudrabasic: interaction.data.values.includes("kuudrabasic"),
        kuudrahot: interaction.data.values.includes("kuudrahot"),
        kuudraburning: interaction.data.values.includes("kuudraburning"),
        kuudrafiery: interaction.data.values.includes("kuudrafiery"),
        kuudrainfernal: interaction.data.values.includes("kuudrainfernal"),
    };

    return res.status(200).send({
        type: InteractionResponseType.MODAL,
        data: {
            title: "We need more information!",
            custom_id: `carry_ticket_data_${encodeCarrierData(selectedCarriers)}`,
            components: [
                {
                    type: MessageComponentTypes.ACTION_ROW,
                    components: [
                        {
                            type: MessageComponentTypes.INPUT_TEXT,
                            custom_id: "username",
                            label: "Username",
                            style: 1,
                            min_length: 3,
                            max_length: 16,
                            placeholder: "Your Minecraft username",
                            required: true
                        }
                    ]
                },
                {
                    type: MessageComponentTypes.ACTION_ROW,
                    components: [
                        {
                            type: MessageComponentTypes.INPUT_TEXT,
                            custom_id: "carries",
                            label: "Carries",
                            style: 1,
                            min_length: 1,
                            max_length: 3,
                            placeholder: "How many carries do you need?",
                            required: true
                        }
                    ]
                },
                {
                    type: MessageComponentTypes.ACTION_ROW,
                    components: [
                        {
                            type: MessageComponentTypes.INPUT_TEXT,
                            custom_id: "timezone",
                            label: "Timezone",
                            style: 1,
                            min_length: 1,
                            max_length: 6,
                            placeholder: "Your timezone based on UTC. eg. EST is UTC-5.",
                            required: true
                        }
                    ]
                },
                {
                    type: MessageComponentTypes.ACTION_ROW,
                    components: [
                        {
                            type: MessageComponentTypes.INPUT_TEXT,
                            custom_id: "extra_info",
                            label: "Notes",
                            style: 2,
                            min_length: 5,
                            max_length: 1000,
                            placeholder: "Anything else you would like us to know?",
                            required: false
                        }
                    ]
                }
            ]
        },
    });
}

