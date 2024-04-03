import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, uniqueIndex, boolean, jsonb, index, uuid } from "drizzle-orm/pg-core";

export const items = pgTable('items', {
    id: uuid('id').primaryKey().default(sql`uuid_generate_v4()`),
    profileId: text('profile_id').notNull(),
    templateId: text('template_id').notNull(),
    jsonAttributes: jsonb('attributes').notNull(),
    quantity: integer('quantity').notNull(),
    favorite: boolean('favorite').default(false),
    seen: boolean('has_seen').default(false),
}, (users) => {
    return {
        idIndex: uniqueIndex('id_idx').on(users.id),
    }
});

export type Item = typeof items.$inferSelect;
export type NewItem = typeof items.$inferInsert;