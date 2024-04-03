import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, uniqueIndex, boolean, jsonb, index, uuid } from "drizzle-orm/pg-core";

export const profiles = pgTable('profiles', {
    id: uuid('id').primaryKey().default(sql`uuid_generate_v4()`),
    accountId: varchar('account_id', { length: 256 }).notNull(),
    type: varchar('type', { length: 256 }).notNull(),
    revision: integer('revision').notNull(),
}, (profiles) => {
    return {
        accountIdProfileIndex: uniqueIndex('profile_accountId_idx').on(profiles.accountId),
        profileIdIndex: uniqueIndex('profile_id_idx').on(profiles.id),
    }
});

export type Profile = typeof profiles.$inferSelect;
export type NewProfile = typeof profiles.$inferInsert;