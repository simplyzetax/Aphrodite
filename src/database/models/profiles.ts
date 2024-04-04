import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, uniqueIndex, boolean, jsonb, index, uuid } from "drizzle-orm/pg-core";
import { users } from "./users";

export const profiles = pgTable('profiles', {
    id: uuid('id').primaryKey().default(sql`uuid_generate_v4()`),
    accountId: text('account_id').references(() => users.accountId).notNull(),
    type: text('type').notNull(),
    revision: integer('revision').notNull(),
}, (profiles) => {
    return {
        accountIdProfileIndex: index('profile_accountId_idx').on(profiles.accountId),
        profileIdIndex: uniqueIndex('profile_id_idx').on(profiles.id),
    }
});

export type Profile = typeof profiles.$inferSelect;
export type NewProfile = typeof profiles.$inferInsert;