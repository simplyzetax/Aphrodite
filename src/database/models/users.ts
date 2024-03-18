import { relations } from 'drizzle-orm';
import { pgTable, serial, text, index, boolean, pgEnum, PgBoolean, uniqueIndex } from 'drizzle-orm/pg-core';
import { profiles } from './profiles';

export const users = pgTable('users', {
    accountId: text('account_id').primaryKey().unique(),
    displayName: text('display_name').unique().notNull(),
    banned: boolean('banned').default(false).notNull(),
    discordId: text('discord_id').unique().notNull(),
    email: text('email').unique().notNull(),
}, (users) => {
    return {
        accountIdIndex: uniqueIndex('acid_idx').on(users.accountId),
        displayNameIndex: uniqueIndex('dpn_idx').on(users.displayName),
        discordIdIndex: uniqueIndex('did_idx').on(users.discordId)
    }
});

export const UserProfilesRelation = relations(users, ({ many }) => ({
    profiles: many(profiles),
}));

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;