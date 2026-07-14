const SKYKINGS = {
    routes: {
        base: `https://api.skykings.net`,
        getScammerFromUUID: (uuid: string) => `${SKYKINGS.routes.base}/user/lookup?uuid=${uuid}`,
        getScammerFromDiscordID: (id: string) => `${SKYKINGS.routes.base}/user/lookup?userid=${id}`,
    }
}

type GetScammerResponse = {
    success: false;
    message: string;
} | {
    success: true;
    result: {
        scammer: false;
        message: string;
        reason: null;
    }
} | {
    success: true;
    result: {
        scammer: true;
        message: string;
        reason: string;
    }
}

export async function getSkyKingsBanlistFromUUID(
    uuid: string,
    // tries = 0
): Promise<
    GetScammerResponse
>{
    if (!process.env.SKYKINGS_TOKEN) throw new Error('SKYKINGS_TOKEN is not defined');

    const res = await fetch(SKYKINGS.routes.getScammerFromUUID(uuid), {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${process.env.SKYKINGS_TOKEN}`
        }
    });

    if (!res.ok) {
        console.log("SkyKingsBanlist res", res);
        console.log("SkyKingsBanlist resText", await res.text());
        return {
            success: false,
            message: "Failed to fetch scammer"
        }
    }

    return await res.json() as GetScammerResponse;
}
