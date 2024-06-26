import { sql } from "drizzle-orm";
import { users } from "./users";
import { boolean, index, integer, pgTable, text, uuid } from "drizzle-orm/pg-core";

export const hotfixes = pgTable('hotfixes', {
    id: uuid('id').primaryKey().default(sql`uuid_generate_v4()`),
    filename: text('file').notNull(),
    section: text('section').notNull(),
    key: text('key').notNull(),
    value: text('value').notNull(),
    enabled: boolean('enabled').notNull().default(true),
    scope: text('scope').notNull().default('user'),
    accountId: text('account_id').references(() => users.accountId),
}, (hotfixes) => {
    return {
        nameIndex: index('filename_idx').on(hotfixes.filename),
    }
});

export type Hotfix = typeof hotfixes.$inferSelect;
export type NewHotfix = typeof hotfixes.$inferInsert;