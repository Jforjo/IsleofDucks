import { InteractionResponseType, MessageComponentTypes } from "discord-interactions";

export default async (req, res) => {
    const interaction = req.body;

    return res.status(200).send({
        type: InteractionResponseType.MODAL,
        data: {
            title: "We need more information!",
            custom_id: "carrier_application_modal",
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
                            custom_id: "details",
                            label: "What are you applying for?",
                            style: 2,
                            min_length: 1,
                            max_length: 1000,
                            placeholder: "List the carriers roles you are applying for.",
                            required: true
                        }
                    ]
                }
            ]
        },
    });
}

