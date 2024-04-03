import { boolean, integer, pgTable, text, uniqueIndex } from "drizzle-orm/pg-core";

export const users = pgTable('users', {
    accountId: text('account_id').primaryKey().unique(),
    displayName: text('display_name').unique().notNull(),
    banned: boolean('banned').default(false).notNull(),
    discordId: text('discord_id').unique().notNull(),
    email: text('email').unique().notNull(),
    password: text('password').notNull(),
}, (users) => {
    return {
        accountIdIndex: uniqueIndex('acid_idx').on(users.accountId),
        displayNameIndex: uniqueIndex('dpn_idx').on(users.displayName),
        discordIdIndex: uniqueIndex('did_idx').on(users.discordId)
    }
});

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;