import { relations } from 'drizzle-orm';
import { pgTable, serial, text, index, boolean, pgEnum, PgBoolean, uniqueIndex, uuid, integer, jsonb } from 'drizzle-orm/pg-core';
import { profiles } from './profiles';

export const items = pgTable('items', {
    id: uuid('id').primaryKey(),
    templateId: text('template_id').notNull(),
    attributes: jsonb('attributes').notNull(),
    profileId: uuid('profile_id'),
    quantity: integer('quantity').default(1),
    favorite: boolean('favorite').default(false),
    seen: boolean('item_seen').default(false)
}, (items) => {
    return {
    }
});

export const itemsRelations = relations(items, ({ one }) => ({
    profile: one(profiles, {
        fields: [items.profileId],
        references: [profiles.id],
    }),
}));

export type Item = typeof items.$inferSelect;
export type NewItem = typeof items.$inferInsert;