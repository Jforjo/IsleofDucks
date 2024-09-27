import { InteractionResponseType, InteractionType, verifyKey } from "discord-interactions";

export default async (req, res) => {
    if (req?.method === 'POST') {
		const signature = req.headers["x-signature-ed25519"];
		const timestamp = req.headers["x-signature-timestamp"];
        const rawBody = JSON.stringify(req.body); 

        const isValidRequest = await verifyKey(
            rawBody,
            signature,
            timestamp,
            process.env.DISCORD_PUBLIC_KEY
        );

        if (!isValidRequest) {
            console.error('Invalid Request');
            return res.status(401).send({ error: 'Bad request signature' });
        }

        const interaction = req.body;

        if (interaction.type === InteractionType.PING) {
            console.log('Handling Ping request');
            return res.send({
                type: InteractionResponseType.PONG,
            });
        } else if (interaction.type === InteractionType.APPLICATION_COMMAND) {
            const { default: command } = await import(`../commands/application/${interaction.data.name.toLowerCase()}.js`);
            if (command) {
                // console.log(`Handling Command: ${interaction.data.name}`);
                await command(req, res);
            } else {
                console.error('Unknown Command');
                return res.status(400).send({ error: 'Unknown Command' });
            }
        } else if (interaction.type === InteractionType.MESSAGE_COMPONENT) {
            const { default: command } = await import(`../commands/components/${interaction.data.custom_id.toLowerCase()}.js`);
            if (command) {
                // console.log(`Handling Command: ${interaction.data.custom_id}`);
                await command(req, res);
            } else {
                console.error('Unknown Command');
                return res.status(400).send({ error: 'Unknown Component' });
            }
        } else if (interaction.type === InteractionType.MODAL_SUBMIT) {
            const { default: command } = await import(`../commands/modals/${interaction.data.custom_id.toLowerCase()}.js`);
            if (command) {
                // console.log(`Handling Command: ${interaction.data.custom_id}`);
                await command(req, res);
            } else {
                console.error('Unknown Command');
                return res.status(400).send({ error: 'Unknown Component' });
            }
        } else {
            console.error('Unknown Type');
            return res.status(400).send({ error: 'Unknown Type' });
        }
    } else {
        return res.json({ error: "Request method must be of type POST" });
    }
};
