import { relations } from 'drizzle-orm';
import { pgTable, serial, text, index, boolean, pgEnum, PgBoolean, uniqueIndex, uuid, integer } from 'drizzle-orm/pg-core';
import { items } from './items';

export const profileTypes = pgEnum('profiletypes', ['athena', 'common_core', 'creative', 'profile0', 'common_public']);

export const profiles = pgTable('profiles', {
    id: uuid('id').primaryKey(),
    type: profileTypes('type').notNull(),
    rvn: integer('revision').notNull().default(0),
}, (profiles) => {
    return {
        idIndex: uniqueIndex('pid_idx').on(profiles.id),
    }
});

export const profilesRelation = relations(profiles, ({ many }) => ({
    items: many(items),
}));

export type Profile = typeof profiles.$inferSelect;
export type NewProfile = typeof profiles.$inferInsert;