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
}, (items) => {
    return {
        profileIdIndex: index('item_profile_id_idx').on(items.profileId),
        templateIdIndex: index('item_template_id_idx').on(items.templateId),
        idIndex: uniqueIndex('item_id_idx').on(items.id),
    }
});

export type Item = typeof items.$inferSelect;
export type NewItem = typeof items.$inferInsert;