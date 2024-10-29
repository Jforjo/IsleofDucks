import { get } from '@vercel/edge-config';

export default async (req, res) => {
    const immune = await get('immune');
    res.status(200).json(immune);
}