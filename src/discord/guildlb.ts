export type BlacklistEntryType = "SCAMMING" | "CHEATING" | "TOXICITY" | "ALT_ABUSE" | "OTHER";

type GuildLBError = {
    success: false;
    error: {
        code: string;
        message: string;
    };
};

export type CheckGuildLBBlacklistResponse = GuildLBError | {
    success: true;
    data: {
        blacklisted: boolean;
        entries: {
            guildId: string;
            guildName: string;
            category: string;
            reason: string;
            addedBy: string;
            createdAt: string;
        }[];
    };
    meta: {
        generatedAt: string;
    };
};

export type AddGuildLBBlacklistEntryResponse = GuildLBError | {
    success: true;
    data: {
        id: number;
        playerUuid: string;
        category: BlacklistEntryType;
        public: boolean;
    };
    meta: {
        generatedAt: string;
    };
};

export type DeleteGuildLBBlacklistEntryResponse = GuildLBError | {
    success: true;
    data: {
        removed: true;
    };
    meta: {
        generatedAt: string;
    };
};

const ROUTES = {
    base: "https://guildlb.com/api",
    allianceBlacklistCheck: (uuid: string) => `/alliance/blacklist/check/${uuid}`,
    guild: (name: string) => `/guild/${name}`,
    guildBlacklist: () => `/guild/blacklist`,
    guildBlacklistPlayer: (uuid: string) => `/guild/blacklist/${uuid}`,
    player: (name: string) => `/player/${name}`,
    playerNetworth: (name: string) => `/player/${name}/networth`
}

export async function checkGuildLBBlacklist(uuid: string): Promise<
    {
        success: false,
        message: string
    } | CheckGuildLBBlacklistResponse
> {
    if (!process.env.GUILDLB_API_KEY) throw new Error("GUILDLB_API_KEY is not set");

    const res = await fetch(`${ROUTES.base}${ROUTES.allianceBlacklistCheck(uuid)}`, {
        headers: {
            "Authorization": `Bearer ${process.env.GUILDLB_API_KEY}`
        }
    });

    if (res.status === 429) {
        const retryAfter = res.headers.get("Retry-After");
        if (retryAfter) {
            const retryAfterMs = parseInt(retryAfter) * 1000;
            await new Promise(resolve => setTimeout(resolve, retryAfterMs));
            return checkGuildLBBlacklist(uuid);
        }
    }

    return await res.json() as CheckGuildLBBlacklistResponse;
}

export async function addGuildLBBlacklistEntry(uuid: string, reason: string, type: BlacklistEntryType, addedBy = "791380888197660722"): Promise<AddGuildLBBlacklistEntryResponse> {
    if (!process.env.GUILDLB_API_KEY) throw new Error("GUILDLB_API_KEY is not set");

    const res = await fetch(`${ROUTES.base}${ROUTES.guildBlacklist()}`, {
        method: "POST",
        headers: {
            "Authorization": `Bearer ${process.env.GUILDLB_API_KEY}`,
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            playerUuid: uuid,
            category: type,
            reason,
            addedBy,
            public: true
        })
    });

    if (res.status === 429) {
        const retryAfter = res.headers.get("Retry-After");
        if (retryAfter) {
            const retryAfterMs = parseInt(retryAfter) * 1000;
            await new Promise(resolve => setTimeout(resolve, retryAfterMs));
            return addGuildLBBlacklistEntry(uuid, reason, type, addedBy);
        }
    }

    return await res.json() as AddGuildLBBlacklistEntryResponse;
}

export async function deleteGuildLBBlacklistEntry(uuid: string): Promise<DeleteGuildLBBlacklistEntryResponse> {
    if (!process.env.GUILDLB_API_KEY) throw new Error("GUILDLB_API_KEY is not set");

    const res = await fetch(`${ROUTES.base}${ROUTES.guildBlacklistPlayer(uuid)}`, {
        method: "DELETE",
        headers: {
            "Authorization": `Bearer ${process.env.GUILDLB_API_KEY}`
        }
    });

    if (res.status === 429) {
        const retryAfter = res.headers.get("Retry-After");
        if (retryAfter) {
            const retryAfterMs = parseInt(retryAfter) * 1000;
            await new Promise(resolve => setTimeout(resolve, retryAfterMs));
            return deleteGuildLBBlacklistEntry(uuid);
        }
    }

    return await res.json() as DeleteGuildLBBlacklistEntryResponse;
}
