import { index, jsonb, pgTable, varchar } from "drizzle-orm/pg-core";

export const attributes = pgTable('attributes', {
    profileId: varchar('profile_id', { length: 256 }).notNull(),
    key: varchar('key', { length: 256 }).notNull(),
    valueJSON: jsonb('value_json').notNull(),
    type: varchar('type', { length: 256 }).notNull(),
}, (attributes) => {
    return {
        idIndex: index('attr_id_idx').on(attributes.profileId),
    }
});

export type Attribute = typeof attributes.$inferSelect;
export type NewAttribute = typeof attributes.$inferInsert;