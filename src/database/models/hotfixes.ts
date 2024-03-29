import { text, integer, sqliteTable, index } from "drizzle-orm/sqlite-core";
import { users } from "./users";

export const hotfixes = sqliteTable('hotfixes', {
    id: integer('id').primaryKey(),
    filename: text('file').notNull(),
    section: text('section').notNull(),
    key: text('key').notNull(),
    value: text('value').notNull(),
    enabled: integer('enabled', { mode: "boolean" }).notNull().default(true),
    scope: text('scope').notNull().default('user'),
    accountId: text('account_id').references(() => users.accountId),
}, (hotfixes) => {
    return {
        nameIndex: index('filename_idx').on(hotfixes.filename),
    }
});

export type Hotfix = typeof hotfixes.$inferSelect;
export type NewHotfix = typeof hotfixes.$inferInsert;