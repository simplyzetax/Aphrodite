import { eq } from "drizzle-orm";
import { db } from "../..";
import { profiles } from "../../database/models/profiles";
import { loadouts } from "../../database/models/loadouts";
import { attributes } from "../../database/models/attributes";
import ItemBuilder from "./items";
import { buildLoadouts } from "./loadouts";
import type { AthenaSchemaModelDB } from "../../types/athena";

class Athena {
    public profile: AthenaSchemaModelDB;

    constructor(profile: AthenaSchemaModelDB) {
        this.profile = profile;
    }
}

export namespace AthenaHelper {
    export async function getProfile(accountId: string): Promise<Athena | undefined> {
        try {
            // Fetch profile data from database
            const [profileData] = await db.select().from(profiles).where(eq(profiles.accountId, accountId));

            // Fetch associated lockers and attributes data
            const [lockersData, attributesData] = await Promise.all([
                db.select().from(loadouts).where(eq(loadouts.profileId, profileData.id)),
                db.select().from(attributes).where(eq(attributes.profileId, profileData.id))
            ]);

            // Convert attributes data to a key-value pair object
            const attributesObject: Record<string, any> = {};
            for (const attribute of attributesData) {
                attributesObject[attribute.key] = attribute.valueJSON;
            }

            // Build items and loadouts
            const itemBuilder = new ItemBuilder(profileData.id);
            const bItems = await itemBuilder.buildItems();
            const bLoadouts = buildLoadouts(lockersData);

            // Construct profile object
            const profileObject: AthenaSchemaModelDB = {
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
                profileId: profileData.type, // "athena" represents the profile type
                version: "11.31",
                items: {
                    ...bItems,
                    ...bLoadouts,
                } as any // Temporary type casting, to be fixed later
            }

            // Create and return a new Athena instance
            const athenaInstance = new Athena(profileObject);
            return athenaInstance;
        } catch (error: unknown) {
            console.error(error); // Log the error for debugging purposes
            return undefined;
        }
    }
}