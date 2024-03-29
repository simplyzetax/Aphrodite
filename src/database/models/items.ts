import { text, integer, sqliteTable, uniqueIndex } from "drizzle-orm/sqlite-core";

export const items = sqliteTable('items', {
    id: integer('id').primaryKey(),
    templateId: text('template_id').notNull(),
    attributes: text('attributes', { mode: "json" }).notNull(),
    quantity: integer('quantity').default(1),
    favorite: integer('favorite', { mode: "boolean" }).default(false),
    seen: integer('item_seen', { mode: "boolean" }).default(false)
}, (items) => {
    return {

    }
});
export type Item = typeof items.$inferSelect;
export type NewItem = typeof items.$inferInsert;