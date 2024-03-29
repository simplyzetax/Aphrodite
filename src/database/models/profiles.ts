import { text, integer, sqliteTable, uniqueIndex } from "drizzle-orm/sqlite-core";
import { users } from './users';

export const profiles = sqliteTable('profiles', {
    id: integer('id').primaryKey(),
    type: text('type').notNull(),
    rvn: integer('revision').notNull().default(0),
    accountId: text('account_id').references(() => users.accountId).notNull(),
}, (profiles) => {
    return {
        idIndex: uniqueIndex('pid_idx').on(profiles.id),
    }
});
export type Profile = typeof profiles.$inferSelect;
export type NewProfile = typeof profiles.$inferInsert;