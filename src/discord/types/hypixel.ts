
export type SkyblockProfileGameMode = "ironman" | "island" | "bingo";
export type SkyblockProfile = {
    profile_id: string;
    members: Record<string, SkyblockProfileMember>;
    cute_name?: string;
    selected?: boolean;
    community_upgrades?: SkyblockProfileCommunityUpgrade;
    banking?: SkyblockProfileBanking;
    game_mode?: SkyblockProfileGameMode;
}
export type SkyblockProfileBanking = {
    balance?: number;
    transactions?: SkyblockProfileBankingTransaction[];
}
export type SkyblockProfileBankingTransaction = {
    amount: number;
    timestamp: number;
    action: "DEPOSIT" | "WITHDRAW";
    initiator_name: string;
}

export type SkyblockProfileCommunityUpgrade = {
    currently_upgrading?: SkyblockProfileCommunityUpgradeCurrentlyUpgrading;
    upgrade_states?: SkyblockProfileCommunityUpgradeState[];
}

export type SkyblockProfileCommunityUpgradeCurrentlyUpgrading = {
    upgrade: string;
    new_tier: number;
    start_ms: number;
    who_started: string;
}
export type SkyblockProfileCommunityUpgradeState = {
    upgrade: string;
    tier: number;
    started_ms: number;
    started_by: string;
    claimed_ms: number;
    claimed_by: string;
    fasttracked: boolean;
}
export type SkyblockProfileMemberDeletionNotice = {
    timestamp: number;
}
// export type SkyblockProfileMember = {
//     deletion_notice?: SkyBlockProfileMemberDeletionNotice;
//     player_id?: string;
//     rift?: SkyblockMemberRiftData;
// }
// TODO: Fill this shit in
export type SkyblockProfileMember = any;