interface ScammerListSuccessResponse {
    success: true;
    data: {
        results: {
            [key: string]: {
                matched_by: string;
            }
        } | null;
        summary: {
            requested: number,
            found: number,
            notFound: number,
            ids: string[]
        }
    }
}

export async function getScammerListFromIDs(
    ids: string[]
): Promise<ScammerListSuccessResponse | { success: false; message: string }> {
    if (!process.env.SCAMMER_LIST_TOKEN) throw new Error('SCAMMER_LIST_TOKEN is not defined');

    const res = await fetch(`https://block.lenny.ie/isleofducks/scammers/lookup`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${process.env.SCAMMER_LIST_TOKEN}`
        },
        body: JSON.stringify({ ids })
    });

    if (res.status === 400) {
        console.log("ScammerList res", JSON.stringify(res, null, 2), res);
        console.log("ScammerList resText", await res.text());
        return { success: false, message: 'Invalid request' };
    }
    if (res.status === 429) {
        console.log("ScammerList res", JSON.stringify(res, null, 2), res);
        console.log("ScammerList resText", await res.text());
        return { success: false, message: 'Rate limited' };
    }

    if (!res.ok) {
        console.log("ScammerList res", JSON.stringify(res, null, 2), res);
        console.log("ScammerList resText", await res.text());
        return { success: false, message: 'Failed to fetch scammer list' };
    }

    const data = await res.json();
    console.log("ScammerList data", JSON.stringify(data, null, 2));
    return data;
}