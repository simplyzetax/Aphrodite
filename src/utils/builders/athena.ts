import { and, eq } from "drizzle-orm";
import { db } from "../..";
import { profiles } from "../../database/models/profiles";
import { loadouts } from "../../database/models/loadouts";
import { attributes } from "../../database/models/attributes";
import ItemBuilder from "./items";
import { buildLoadouts } from "./loadouts";
import type { ProfileSchemaDB } from "../../types/athena";

class Profile {
    public profile: ProfileSchemaDB;

    constructor(profile: ProfileSchemaDB) {
        this.profile = profile;
    }
}

export class ProfileHelper {

    type: string;
    season: number;

    constructor(profileType: string, season: number) {
        this.type = profileType;
        this.season = season;
    }

    public async getProfile(accountId: string): Promise<Profile | undefined> {
        try {
            // Fetch profile data from database
            const [profileData] = await db.select().from(profiles).where(and(eq(profiles.type, this.type), eq(profiles.accountId, accountId)));

            // Initialize loadoutsData and bLoadouts as empty, they will be populated if profile type is 'athena'
            let loadoutsData = [];
            let bLoadouts = {};

            // Fetch associated attributes data
            const attributesData = await db.select().from(attributes).where(eq(attributes.profileId, profileData.id));

            // If profile type is 'athena', fetch and build loadouts
            if (profileData.type === 'athena') {
                loadoutsData = await db.select().from(loadouts).where(eq(loadouts.profileId, profileData.id));
                bLoadouts = buildLoadouts(loadoutsData);
            }

            // Convert attributes data to a key-value pair object
            const attributesObject: Record<string, any> = {};
            for (const attribute of attributesData) {
                attributesObject[attribute.key] = attribute.valueJSON;
            }

            // Build items
            const itemBuilder = new ItemBuilder(profileData.id);
            const bItems = await itemBuilder.buildItems();

            // Construct profile object
            const profileObject: ProfileSchemaDB = {
                accountId: profileData.accountId,
                profileUniqueId: profileData.id,
                stats: {
                    attributes: { ...attributesObject },
                },
                commandRevision: 0,
                created: new Date().toISOString(),
                updated: new Date().toISOString(),
                rvn: profileData.revision,
                wipeNumber: 0,
                profileId: profileData.type,
                version: `${this.season}`,
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