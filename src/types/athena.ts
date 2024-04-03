import type { TempLoadouts } from "./loadouts";

export interface LoadoutSchema {
    templateId: string;
    attributes: {
        locker_slots_data: {
            slots: {
                Pickaxe: {
                    items: string[];
                    activeVariants: any[];
                };
                Dance: {
                    items: string[];
                };
                Glider: {
                    items: string[];
                };
                Character: {
                    items: string[];
                    activeVariants: {
                        variants: any[];
                    }[];
                };
                Backpack: {
                    items: string[];
                    activeVariants: any[];
                };
                ItemWrap: {
                    items: string[];
                    activeVariants: any[];
                };
                LoadingScreen: {
                    items: string[];
                    activeVariants: any;
                };
                SkyDiveContrail: {
                    items: string[];
                    activeVariants: any;
                };
                MusicPack: {
                    items: string[];
                    activeVariants: any;
                };
            };
        };
        use_count: number;
        banner_icon_template: string;
        locker_name: string;
        banner_color_template: string;
        items_seen: boolean;
        favorite: boolean;
    };
    quantity: number;
}

export interface ItemSchema {
    attributes: {
        favorite: boolean;
        item_seen: boolean;
        level: number;
        max_level_bonus: number;
        rnd_sel_cnt: number;
        variants: any[];
        xp: number;
        locker_slots_data: any;
    };
    templateId: string;
}

export interface ProfileStats {
    attributes: {
        [key: string]: any;
        /* season_match_boost: number;
        loadouts: string[];
        rested_xp_overflow: number;
        mfa_reward_claimed: boolean;
        quest_manager: Record<string, unknown>;
        mfa_enabled: boolean;
        book_level: number;
        season_num: number;
        season_update: number;
        book_xp: number;
        permissions: string[];
        book_purchased: boolean;
        lifetime_wins: number;
        party_assist_quest: string;
        purchased_battle_pass_tier_offers: string[];
        rested_xp_exchange: number;
        level: number;
        xp_overflow: number;
        rested_xp: number;
        rested_xp_mult: number;
        accountLevel: number;
        competitive_identity: Record<string, unknown>;
        inventory_limit_bonus: number;
        last_applied_loadout: string;
        daily_rewards: Record<string, unknown>;
        xp: number;
        season_friend_match_boost: number;
        active_loadout_index: number;
        favorite_musicpack: string;
        favorite_glider: string;
        favorite_pickaxe: string;
        favorite_skydivecontrail: string;
        favorite_backpack: string;
        favorite_dance: string[];
        favorite_itemwraps: string[];
        favorite_character: string;
        favorite_loading_screen: string; */
    };
}

export interface ProfileAttributes {
    [key: string]: any;
    season_match_boost: number;
    loadouts: string[];
    rested_xp_overflow: number;
    mfa_reward_claimed: boolean;
    quest_manager: Record<string, unknown>;
    mfa_enabled: boolean;
    book_level: number;
    season_num: number;
    season_update: number;
    book_xp: number;
    permissions: string[];
    book_purchased: boolean;
    lifetime_wins: number;
    party_assist_quest: string;
    purchased_battle_pass_tier_offers: string[];
    rested_xp_exchange: number;
    level: number;
    xp_overflow: number;
    rested_xp: number;
    rested_xp_mult: number;
    accountLevel: number;
    competitive_identity: Record<string, unknown>;
    inventory_limit_bonus: number;
    last_applied_loadout: string;
    daily_rewards: Record<string, unknown>;
    xp: number;
    season_friend_match_boost: number;
    active_loadout_index: number;
    favorite_musicpack: string;
    favorite_glider: string;
    favorite_pickaxe: string;
    favorite_skydivecontrail: string;
    favorite_backpack: string;
    favorite_dance: string[];
    favorite_itemwraps: string[];
    favorite_character: string;
    favorite_loading_screen: string;
}

export interface ProfileSchemaDB {
    created: string;
    updated: string;
    rvn: number;
    wipeNumber: number;
    accountId: string;
    profileUniqueId: string;
    profileId: string;
    version: string;
    items: Record<string, ItemSchema | TempLoadouts>;
    stats: ProfileStats;
    commandRevision: number;
}

export interface ProfileSchemaJSON {
    created: string;
    updated: string;
    rvn: number;
    wipeNumber: number;
    accountId: string;
    profileId: string;
    version: string;
    items: Record<string, ItemSchema | LoadoutSchema>;
    stats: ProfileStats;
    commandRevision: number;
}