import { pgTable, serial, text, index, boolean, pgEnum } from 'drizzle-orm/pg-core';

export const hotfixScope = pgEnum('scope', ['global', 'user']);

export const hotfixes = pgTable('hotfixes', {
    id: serial('id').primaryKey(),
    filename: text('file').notNull(),
    section: text('section').notNull(),
    key: text('key').notNull(),
    value: text('value').notNull(),
    enabled: boolean('enabled').notNull().default(true),
    scope: hotfixScope('scope').notNull().default('user'),
    accountId: text('account_id')
}, (hotfixes) => {
    return {
        nameIndex: index('filename_idx').on(hotfixes.filename),
    }
});

export type Hotfix = typeof hotfixes.$inferSelect;
export type NewHotfix = typeof hotfixes.$inferInsert;