interface ScammerListSuccessResponse {
    success: true;
    data: {
        results: {
            [key: string]: {
                tag: string;
                id: string;
                method: string;
                scammed: string;
                known_alts_ids: string[];
                previous_tags: string[];
                known_payment_tags: string[];
                matchedBy: string;
            } | null;
        };
        summary: {
            requested: number,
            found: number,
            notFound: number,
            ids: string[]
        };
    }
}
interface ScammerListErrorResponse {
    success: false;
    message: string;
}

export async function getScammerListFromIDs(
    ids: string[]
): Promise<ScammerListSuccessResponse | ScammerListErrorResponse> {
    if (!process.env.SCAMMER_LIST_TOKEN) throw new Error('SCAMMER_LIST_TOKEN is not defined');

    const res = await fetch(`https://block.lenny.ie/isleofducks/scammers/lookup`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${process.env.SCAMMER_LIST_TOKEN}`
        },
        body: JSON.stringify({ ids })
    });

    const data = await res.json() as ScammerListSuccessResponse | ScammerListErrorResponse;

    if (!res.ok) {
        return data;
    }

    console.log("ScammerList data", JSON.stringify(data, null, 2));
    return data;
}