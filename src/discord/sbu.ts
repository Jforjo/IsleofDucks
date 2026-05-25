const SBU = {
    routes: {
        base: `http://sbu.rubic-solution.de/api`,
        getScammerFromUUID: (uuid: string) => `${SBU.routes.base}/banlist/check/${uuid}`,
    }
}

interface ScammerDetails {
    reason: string;
    banned_by: string;
    banned_at: string;
}
interface GetScammerResponse {
    success: boolean;
    banned: boolean;
    uuid: string;
    details?: null | ScammerDetails;
    message: string;
}

export async function getSBUBanlistFromUUID(
    uuid: string,
    // tries = 0
): Promise<
    GetScammerResponse | {
        success: false;
        message: string;
    }
>{
    if (!process.env.SBU_TOKEN) throw new Error('SBU_TOKEN is not defined');

    const res = await fetch(SBU.routes.getScammerFromUUID(uuid), {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${process.env.SBU_TOKEN}`
        }
    });

    // if (res.status === 400) {
    //     return {
    //         success: false,
    //         reason: "Invalid UUID"
    //     }
    // } else if (res.status === 403) {
    //     return {
    //         success: false,
    //         reason: "Invalid token"
    //     }
    // } else if (res.status === 525) {
    //     if (tries < 3) {
    //         return getScammerFromUUID(uuid, tries + 1);
    //     }
    // }

    if (!res.ok) {
        console.log("SBUBanlist res", res);
        console.log("SBUBanlist resText", await res.text());
        return {
            success: false,
            message: "Failed to fetch scammer"
        }
    }

    return await res.json() as GetScammerResponse;
}
