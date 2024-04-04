import { sql } from "drizzle-orm";
import { jsonb, pgTable, text, uniqueIndex, uuid, varchar } from "drizzle-orm/pg-core";
import { profiles } from "./profiles";

export const loadouts = pgTable(
    "loadouts",
    {
        id: uuid("id").primaryKey().default(sql`uuid_generate_v4()`),
        profileId: uuid("profile_id").references(() => profiles.id).notNull(),
        templateId: text("template_id").notNull(),
        lockerName: text("locker_name").notNull(),
        bannerId: text("banner_id").notNull(),
        bannerColorId: text("banner_color_id").notNull(),
        characterId: text("character_id").notNull(),
        backpackId: text("backpack_id").notNull(),
        gliderId: text("glider_id").notNull(),
        danceId: jsonb("dance_id").notNull(),
        pickaxeId: text("pickaxe_id").notNull(),
        itemWrapId: jsonb("item_wrap_id").notNull(),
        contrailId: text("contrail_id").notNull(),
        loadingScreenId: text("loading_screen_id").notNull(),
        musicPackId: text("music_pack_id").notNull(),
    },
    (Exchanges) => {
        return {
            idIndex: uniqueIndex("accountId_idx").on(Exchanges.id),
            lockerNameIndex: uniqueIndex("lockerName_idx").on(Exchanges.lockerName),
        };
    },
);

export type Loadout = typeof loadouts.$inferSelect;
export type NewLoadout = typeof loadouts.$inferInsert;