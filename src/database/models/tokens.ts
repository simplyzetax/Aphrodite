import { sql } from "drizzle-orm";
import { users } from "./users";
import { index, integer, pgTable, text, uuid } from "drizzle-orm/pg-core";

export const tokens = pgTable('tokens', {
    id: uuid('id').primaryKey().default(sql`uuid_generate_v4()`),
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