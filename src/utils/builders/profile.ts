import { and, eq, sql } from "drizzle-orm";
import { db } from "../..";
import { profiles } from "../../database/models/profiles";
import { loadouts } from "../../database/models/loadouts";
import { attributes } from "../../database/models/attributes";
import ItemBuilder from "./items";
import { buildLoadouts } from "./loadouts";
import type { ProfileSchemaDB } from "../../types/athena";
import Timing from "../timing";
import { items } from "../../database/models/items";

class Profile {
    public profile: ProfileSchemaDB;

    constructor(profile: ProfileSchemaDB) {
        this.profile = profile;
    }
}

const preparedJoinedQueryOther = db
    .select()
    .from(profiles)
    .where(and(eq(profiles.type, sql.placeholder('type')), eq(profiles.accountId, sql.placeholder('accountId'))))
    .leftJoin(attributes, eq(profiles.id, attributes.profileId))
    .leftJoin(items, eq(profiles.id, items.profileId))
    .leftJoin(loadouts, eq(profiles.id, loadouts.profileId));



export class ProfileHelper {

    type: string;
    build: number;

    constructor(profileType: string, build: number) {
        this.type = profileType;
        this.build = build;
    }

    public async getProfile(accountId: string): Promise<Profile | undefined> {
        try {
            // Fetch profile from database (single row)
            const t1 = new Timing("getProfileAndAttributes");
            const result = await preparedJoinedQueryOther.execute({ type: this.type, accountId });
            t1.print();

            // Access the fetchedProfile and fetchedAttributes from the result
            const fetchedProfile = result.map(({ profiles }) => profiles)[0];
            const fetchedAttributes = result.map(({ attributes }) => attributes);
            const fetchedItems = result.map(({ items }) => items);
            const fetchedLoadouts = result.map(({ loadouts }) => loadouts);

            // Initialize loadoutsData and bLoadouts as empty, they will be populated if profile type is 'athena'
            let loadoutsData = [];
            let bLoadouts = {};

            // If profile type is 'athena', fetch and build loadouts
            if (fetchedProfile.type === 'athena') {
                loadoutsData = fetchedLoadouts.filter(loadout => loadout !== null);
                bLoadouts = buildLoadouts(loadoutsData);
            }

            // Convert attributes data to a key-value pair object
            const attributesObject: Record<string, any> = {};
            for (const attribute of fetchedAttributes) {
                if (attribute == null || attribute.key == null || attribute.valueJSON == null) {
                    continue;
                }
                attributesObject[attribute.key] = attribute.valueJSON;
            }

            // Build items
            const itemBuilder = new ItemBuilder(fetchedProfile.id);
            const nonNullItems = fetchedItems.filter(item => item !== null);
            const bItems = await itemBuilder.buildItems(nonNullItems);

            // Construct profile object
            const profileObject: ProfileSchemaDB = {
                accountId: fetchedProfile.accountId,
                profileUniqueId: fetchedProfile.id,
                stats: {
                    attributes: { ...attributesObject },
                },
                commandRevision: 0,
                created: new Date().toISOString(),
                updated: new Date().toISOString(),
                rvn: fetchedProfile.revision,
                wipeNumber: 0,
                profileId: fetchedProfile.type,
                version: `${this.build}`,
                items: {
                    ...bItems,
                    ...bLoadouts,
                } as any // Temporary type casting, to be fixed later
            }

            // Create and return a new Profile instance
            const profileInstance = new Profile(profileObject);
            return profileInstance;
        } catch (error: unknown) {
            console.error(error); // Log the error for debugging purposes
            return undefined;
        }
    }
}