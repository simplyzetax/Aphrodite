import { jsonb, pgTable, uniqueIndex, varchar } from "drizzle-orm/pg-core";

export const loadouts = pgTable(
    "loadouts",
    {
        id: varchar("id", { length: 256 }).primaryKey(),
        profileId: varchar("profile_id", { length: 256 }).notNull(),
        templateId: varchar("template_id", { length: 256 }).notNull(),
        lockerName: varchar("locker_name", { length: 256 }).notNull(),
        bannerId: varchar("banner_id", { length: 256 }).notNull(),
        bannerColorId: varchar("banner_color_id", { length: 256 }).notNull(),
        characterId: varchar("character_id", { length: 256 }).notNull(),
        backpackId: varchar("backpack_id", { length: 256 }).notNull(),
        gliderId: varchar("glider_id", { length: 256 }).notNull(),
        danceId: jsonb("dance_id").notNull(),
        pickaxeId: varchar("pickaxe_id", { length: 256 }).notNull(),
        itemWrapId: jsonb("item_wrap_id").notNull(),
        contrailId: varchar("contrail_id", { length: 256 }).notNull(),
        loadingScreenId: varchar("loading_screen_id", { length: 256 }).notNull(),
        musicPackId: varchar("music_pack_id", { length: 256 }).notNull(),
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