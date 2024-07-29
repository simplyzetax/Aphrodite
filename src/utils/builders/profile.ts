import { and, eq, sql } from "drizzle-orm";
import { db } from "../..";
import { profiles } from "../../database/models/profiles";
import { loadouts } from "../../database/models/loadouts";
import { attributes } from "../../database/models/attributes";
import ItemBuilder from "./items";
import { buildLoadouts } from "./loadouts";
import type { ProfileSchemaDB } from "../../types/athena";
import { items } from "../../database/models/items";
import Timing from "../timing";

const preparedJoinedQueryOther = db
    .select()
    .from(profiles)
    .where(and(eq(profiles.type, sql.placeholder('type')), eq(profiles.accountId, sql.placeholder('accountId'))))
    .leftJoin(attributes, eq(profiles.id, attributes.profileId))
    .leftJoin(items, eq(profiles.id, items.profileId))
    .leftJoin(loadouts, eq(profiles.id, loadouts.profileId));

class Profile {
    public profile: ProfileSchemaDB;

    constructor(profile: ProfileSchemaDB) {
        this.profile = profile;
    }
}

export class ProfileHelper {

    type: string;
    build: string;

    constructor(profileType: string, build: string) {
        this.type = profileType;
        this.build = build;
    }

    public async getProfile(accountId: string): Promise<Profile | undefined> {
        try {
            // Fetch profile from database (single row)
            const t = new Timing("Profile fetch");
            const result = await preparedJoinedQueryOther.execute({ type: this.type, accountId });
            t.print();

            // Extract the fetched profile, attributes, items, and loadouts from the result
            const fetchedProfile = result[0]?.profiles;
            const fetchedAttributes = result.map(({ attributes }) => attributes).filter(attr => attr !== null);
            const fetchedItems = result.map(({ items }) => items).filter(item => item !== null);
            const fetchedLoadouts = result.map(({ loadouts }) => loadouts).filter(loadout => loadout !== null);

            if (!fetchedProfile) {
                return undefined;
            }

            // Initialize loadoutsData and bLoadouts as empty, they will be populated if profile type is 'athena'
            let loadoutsData = [];
            let bLoadouts = {};

            // If profile type is 'athena', fetch and build loadouts
            if (fetchedProfile.type === 'athena') {
                loadoutsData = fetchedLoadouts;
                bLoadouts = buildLoadouts(loadoutsData);
            }

            // Convert attributes data to a key-value pair object
            const attributesObject: Record<string, any> = {};
            for (const attribute of fetchedAttributes) {
                if (attribute.key && attribute.valueJSON) {
                    attributesObject[attribute.key] = attribute.valueJSON;
                }
            }

            // Build items
            const itemBuilder = new ItemBuilder(fetchedProfile.id);
            const bItems = await itemBuilder.buildItems(fetchedItems);

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
                } as any // Temporary type casting, to be fixed later //TODO
            };

            // Create and return a new Profile instance
            const profileInstance = new Profile(profileObject);
            return profileInstance;
        } catch (error: unknown) {
            console.error(error); // Log the error for debugging purposes
            return undefined;
        }
    }
}