import { text, integer, sqliteTable, uniqueIndex } from "drizzle-orm/sqlite-core";

export const users = sqliteTable('users', {
    accountId: text('account_id').primaryKey().unique(),
    displayName: text('display_name').unique().notNull(),
    banned: integer('banned', { mode: 'boolean' }).default(false).notNull(),
    discordId: text('discord_id').unique().notNull(),
    email: text('email').unique().notNull(),
}, (users) => {
    return {
        accountIdIndex: uniqueIndex('acid_idx').on(users.accountId),
        displayNameIndex: uniqueIndex('dpn_idx').on(users.displayName),
        discordIdIndex: uniqueIndex('did_idx').on(users.discordId)
    }
});

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;