import { index, jsonb, pgTable, text, uuid, varchar } from "drizzle-orm/pg-core";
import { profiles } from "./profiles";

export const attributes = pgTable('attributes', {
    profileId: uuid('profile_id').references(() => profiles.id).notNull(),
    key: text('key').notNull(),
    valueJSON: jsonb('value_json').notNull(),
    type: text('type').notNull(),
}, (attributes) => {
    return {
        idIndex: index('attr_id_idx').on(attributes.profileId),
    }
});

export type Attribute = typeof attributes.$inferSelect;
export type NewAttribute = typeof attributes.$inferInsert;