import { eq } from "drizzle-orm";
import { db } from "../..";
import { profiles } from "../../database/models/profiles";
import { items } from "../../database/models/items";
import { loadouts } from "../../database/models/loadouts";
import { attributes } from "../../database/models/attributes";
import ItemBuilder from "./items";
import { buildLoadouts } from "./loadouts";
import type { AthenaSchemaModelDB } from "../../types/athena";

class Athena {
    public profile: AthenaSchemaModelDB;

    constructor(profile: AthenaSchemaModelDB) {
        this.profile = profile;
    }
}

export namespace AthenaHelper {
    export async function getProfile(accountId: string): Promise<Athena | undefined> {
        try {

            // Fetch data from database
            const [athenaProfile] = await db.select().from(profiles).where(eq(profiles.accountId, accountId));
            const lockersDb = await db.select().from(loadouts).where(eq(loadouts.profileId, athenaProfile.id));
            const attributesDb = await db.select().from(attributes).where(eq(attributes.profileId, athenaProfile.id));

            const attributesLocal = {} as Record<string, any>;
            for (const attribute of attributesDb) {
                attributesLocal[attribute.key] = attribute.valueJSON;
            }
            // Build items and loadouts
            const ib = new ItemBuilder(athenaProfile.id);
            const tempItems = await ib.buildItems();
            const tempLoadouts = buildLoadouts(lockersDb);

            // Build profile
            const tempProfile: AthenaSchemaModelDB = {
                accountId: athenaProfile.accountId,
                profileUniqueId: athenaProfile.id,
                stats: {
                    attributes: {
                        season_match_boost: attributesLocal['season_match_boost'],
                        loadouts: attributesLocal['loadouts'],
                        rested_xp_overflow: attributesLocal['rested_xp_overflow'],
                        mfa_reward_claimed: attributesLocal['mfa_reward_claimed'],
                        quest_manager: {},
                        mfa_enabled: attributesLocal['mfa_enabled'],
                        book_level: attributesLocal['book_level'],
                        season_num: attributesLocal['season_num'],
                        season_update: attributesLocal['season_update'],
                        book_xp: attributesLocal['book_xp'],
                        permissions: attributesLocal['permissions'],
                        book_purchased: attributesLocal['book_purchased'],
                        lifetime_wins: attributesLocal['lifetime_wins'],
                        party_assist_quest: attributesLocal['party_assist_quest'],
                        purchased_battle_pass_tier_offers: attributesLocal['purchased_battle_pass_tier_offers'],
                        rested_xp_exchange: attributesLocal['rested_xp_exchange'],
                        level: attributesLocal['level'],
                        xp_overflow: attributesLocal['xp_overflow'],
                        rested_xp: attributesLocal['rested_xp'],
                        rested_xp_mult: attributesLocal['rested_xp_mult'],
                        accountLevel: attributesLocal['accountLevel'],
                        competitive_identity: attributesLocal['competitive_identity'],
                        inventory_limit_bonus: attributesLocal['inventory_limit_bonus'],
                        last_applied_loadout: attributesLocal['last_applied_loadout'],
                        daily_rewards: attributesLocal['daily_rewards'],
                        xp: attributesLocal['xp'],
                        season_friend_match_boost: attributesLocal['season_friend_match_boost'],
                        active_loadout_index: attributesLocal['active_loadout_index'],
                        favorite_musicpack: attributesLocal['favorite_musicpack'],
                        favorite_glider: attributesLocal['favorite_glider'],
                        favorite_pickaxe: attributesLocal['favorite_pickaxe'],
                        favorite_skydivecontrail: attributesLocal['favorite_skydivecontrail'],
                        favorite_backpack: attributesLocal['favorite_backpack'],
                        favorite_dance: attributesLocal['favorite_dance'],
                        favorite_itemwraps: attributesLocal['favorite_itemwraps'],
                        favorite_character: attributesLocal['favorite_character'],
                        favorite_loading_screen: attributesLocal['favorite_loading_screen'],
                    },
                },
                commandRevision: 0,
                created: new Date().toISOString(),
                updated: new Date().toISOString(),
                rvn: athenaProfile.revision,
                wipeNumber: 0,
                profileId: athenaProfile.type, // Just fancy "athena"
                version: "11.31",
                items: {
                    ...tempItems,
                    ...tempLoadouts,
                } as any //I will fix this soon, I dont care enough right now though
            }

            const newAthena = new Athena(tempProfile);

            return newAthena;
        } catch (error: unknown) {
            return undefined;
        }
    }
}