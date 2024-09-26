export default async (req, res) => {
    const response = await fetch(`https://api.hypixel.net/v2/guild?name=Isle%20of%20Ducks`, {
        method: 'GET',
        headers: {
            'API-Key': process.env.HYPIXEL_API_KEY
        }
    });
    const data = await response.json();

    res.status(200).send(data);
}