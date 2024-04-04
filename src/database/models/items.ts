import { sql } from "drizzle-orm";
import { pgTable, text, integer, uniqueIndex, boolean, jsonb, index, uuid } from "drizzle-orm/pg-core";
import { profiles } from "./profiles";

const defaultJsonAttributes = {
    item_seen: true,
    variants: []
}

export const items = pgTable('items', {
    id: uuid('id').primaryKey().default(sql`uuid_generate_v4()`),
    profileId: uuid('profile_id').references(() => profiles.id).notNull(),
    templateId: text('template_id').notNull(),
    jsonAttributes: jsonb('attributes').notNull().default(defaultJsonAttributes),
    quantity: integer('quantity').notNull().default(1),
    favorite: boolean('favorite').default(false),
    seen: boolean('has_seen').default(false),
}, (users) => {
    return {
        idIndex: uniqueIndex('id_idx').on(users.id),
    }
});

export type Item = typeof items.$inferSelect;
export type NewItem = typeof items.$inferInsert;