import { text, integer, sqliteTable, index } from "drizzle-orm/sqlite-core";
import { users } from "./users";

export const tokens = sqliteTable('tokens', {
    id: integer('id').primaryKey(),
    token: text('token').notNull(),
    type: text('type').notNull(), // refresh, access, exchange_code
    accountId: text('account_id').references(() => users.accountId).notNull(),
}, (tokens) => {
    return {
        tokenIndex: index('token_idx').on(tokens.token),
    }
});

export type Token = typeof tokens.$inferSelect;
export type NewToken = typeof tokens.$inferInsert;