import { boolean, date, integer, jsonb, pgTable, text, uniqueIndex } from "drizzle-orm/pg-core";
import { users } from "./users";
import { sql } from "drizzle-orm";
import { z } from "zod";

const defaultFriendsObj = {
    accepted: [],
    incoming: [],
    outgoing: []
};

export const friends = pgTable('friends', {
    accountId: text('account_id').references(() => users.accountId).primaryKey().unique(),
    list: jsonb('friends').default(JSON.stringify(defaultFriendsObj)),
    created: date('created').default(sql`now()`),
}, (users) => {
    return {
        accountIdIndex: uniqueIndex('friends_acid_idx').on(users.accountId),
    }
});

export type Friend = typeof friends.$inferSelect;
export type NewFriend = typeof friends.$inferInsert;