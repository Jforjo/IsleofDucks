import { SkyBlockProfileMember } from "@zikeji/hypixel/dist/types/Augmented/SkyBlock/ProfileMember"
import { getHypixelCollections } from "./hypixelUtils";

export default {
    skyblockLevel: {
        title: "SkyBlock Level",
        value: (profile: SkyBlockProfileMember) => profile?.leveling?.experience ?? 0
    },
    totalHunts: {
        title: "Total Hunts",
        value: (profile: SkyBlockProfileMember) => 
            ( profile?.player_stats?.shard_trap_hunts ?? 0 ) +
            ( profile?.player_stats?.shard_combat_hunts ?? 0 ) +
            ( profile?.player_stats?.shard_forest_hunts ?? 0 ) +
            ( profile?.player_stats?.shard_fishing_hunts ?? 0 )
    },
    catacombsExperience: {
        title: "Catacombs Experience",
        value: (profile: SkyBlockProfileMember) => profile?.dungeons?.dungeon_types?.catacombs?.experience ?? 0
    },
    /**
     *  SKILLS
     */ 
    alchemyExperience: {
        title: "Alchemy Experience",
        value: (profile: SkyBlockProfileMember) => profile?.player_data?.experience?.SKILL_ALCHEMY ?? 0
    },
    carpentryExperience: {
        title: "Carpentry Experience",
        value: (profile: SkyBlockProfileMember) => profile?.player_data?.experience?.SKILL_CARPENTRY ?? 0
    },
    combatExperience: {
        title: "Combat Experience",
        value: (profile: SkyBlockProfileMember) => profile?.player_data?.experience?.SKILL_COMBAT ?? 0
    },
    enchantingExperience: {
        title: "Enchanting Experience",
        value: (profile: SkyBlockProfileMember) => profile?.player_data?.experience?.SKILL_ENCHANTING ?? 0
    },
    farmingExperience: {
        title: "Farming Experience",
        value: (profile: SkyBlockProfileMember) => profile?.player_data?.experience?.SKILL_FARMING ?? 0
    },
    fishingExperience: {
        title: "Fishing Experience",
        value: (profile: SkyBlockProfileMember) => profile?.player_data?.experience?.SKILL_FISHING ?? 0
    },
    foragingExperience: {
        title: "Foraging Experience",
        value: (profile: SkyBlockProfileMember) => profile?.player_data?.experience?.SKILL_FORAGING ?? 0
    },
    miningExperience: {
        title: "Mining Experience",
        value: (profile: SkyBlockProfileMember) => profile?.player_data?.experience?.SKILL_MINING ?? 0
    },
    runecraftingExperience: {
        title: "Runecrafting Experience",
        value: (profile: SkyBlockProfileMember) => profile?.player_data?.experience?.SKILL_RUNECRAFTING ?? 0
    },
    socialExperience: {
        title: "Social Experience",
        value: (profile: SkyBlockProfileMember) => profile?.player_data?.experience?.SKILL_SOCIAL ?? 0
    },
    tamingExperience: {
        title: "Taming Experience",
        value: (profile: SkyBlockProfileMember) => profile?.player_data?.experience?.SKILL_TAMING ?? 0
    },
    /**
     *  SLAYERS
     */
    totalSlayerExperience: {
        title: "Total Slayer Experience",
        value: (profile: SkyBlockProfileMember) => 
            ( profile?.slayer?.slayer_bosses?.zombie?.xp ?? 0 ) +
            ( profile?.slayer?.slayer_bosses?.spider?.xp ?? 0 ) +
            ( profile?.slayer?.slayer_bosses?.wolf?.xp ?? 0 ) +
            ( profile?.slayer?.slayer_bosses?.enderman?.xp ?? 0 ) +
            ( profile?.slayer?.slayer_bosses?.blaze?.xp ?? 0 ) +
            ( profile?.slayer?.slayer_bosses?.vampire?.xp ?? 0 )
    },
    zombieSlayerExperience: {
        title: "Zombie Slayer Experience",
        value: (profile: SkyBlockProfileMember) => profile?.slayer?.slayer_bosses?.zombie?.xp ?? 0
    },
    spiderSlayerExperience: {
        title: "Spider Slayer Experience",
        value: (profile: SkyBlockProfileMember) => profile?.slayer?.slayer_bosses?.spider?.xp ?? 0
    },
    wolfSlayerExperience: {
        title: "Wolf Slayer Experience",
        value: (profile: SkyBlockProfileMember) => profile?.slayer?.slayer_bosses?.wolf?.xp ?? 0
    },
    endermanSlayerExperience: {
        title: "Enderman Slayer Experience",
        value: (profile: SkyBlockProfileMember) => profile?.slayer?.slayer_bosses?.enderman?.xp ?? 0
    },
    blazeSlayerExperience: {
        title: "Blaze Slayer Experience",
        value: (profile: SkyBlockProfileMember) => profile?.slayer?.slayer_bosses?.blaze?.xp ?? 0
    },
    vampireSlayerExperience: {
        title: "Vampire Slayer Experience",
        value: (profile: SkyBlockProfileMember) => profile?.slayer?.slayer_bosses?.vampire?.xp ?? 0
    },
    /**
     *  KUUDRA
     */
    kuudraCompletions: {
        title: "Kuudra Completions",
        value: (profile: SkyBlockProfileMember) =>
            ( profile?.nether_island_player_data?.kuudra_completed_tiers?.none ?? 0 ) +
            ( profile?.nether_island_player_data?.kuudra_completed_tiers?.hot ?? 0 ) +
            ( profile?.nether_island_player_data?.kuudra_completed_tiers?.burning ?? 0 ) +
            ( profile?.nether_island_player_data?.kuudra_completed_tiers?.fiery ?? 0 ) +
            ( profile?.nether_island_player_data?.kuudra_completed_tiers?.infernal ?? 0 )
    },
    kuudraCollection: {
        title: "Kuudra Collection",
        value: (profile: SkyBlockProfileMember) =>
            ( profile?.nether_island_player_data?.kuudra_completed_tiers?.none ?? 0 ) +
            ( profile?.nether_island_player_data?.kuudra_completed_tiers?.hot ?? 0 ) * 2 +
            ( profile?.nether_island_player_data?.kuudra_completed_tiers?.burning ?? 0 ) * 3 +
            ( profile?.nether_island_player_data?.kuudra_completed_tiers?.fiery ?? 0 ) * 4 +
            ( profile?.nether_island_player_data?.kuudra_completed_tiers?.infernal ?? 0 ) * 5
    },
    /**
     * COLLECTIONS
     */
    totalTiersCollections: {
        title: "Total Collection Tiers",
        value: async (profile: SkyBlockProfileMember) => {
            if (!profile?.collection) return 0;
            const collections = await getHypixelCollections();
            if (!collections.success || !collections.collections) return 0;
            let totalTiers = 0;
            for (const [, collectionGroup] of Object.entries(collections.collections)) {
                if (!collectionGroup) continue;
                for (const [collectionKey, collectionData] of Object.entries(collectionGroup.items)) {
                    collectionData.tiers.forEach(tier => {
                        if (profile.collection?.[collectionKey] && profile.collection[collectionKey] >= tier.amountRequired) {
                            totalTiers += 1;
                        }
                    });
                }
            }
            return totalTiers
        }
    },
    mangroveCollection: {
        title: "Mangrove Collection",
        value: (profile: SkyBlockProfileMember) => profile?.collection?.MANGROVE_LOG ?? 0
    },
    seaLumiesCollection: {
        title: "Sea Lumies Collection",
        value: (profile: SkyBlockProfileMember) => profile?.collection?.SEA_LUMIES ?? 0
    },
    pumpkinCollection: {
        title: "Pumpkin Collection",
        value: (profile: SkyBlockProfileMember) => profile?.collection?.PUMPKIN ?? 0
    },
    /**
     * BESTIARY
     */
    headlesshorsemanBestiary: {
        title: "Headless Horseman Bestiary",
        value: (profile: SkyBlockProfileMember) => profile?.bestiary?.kills?.horseman_horse_100 ?? 0
    }
}