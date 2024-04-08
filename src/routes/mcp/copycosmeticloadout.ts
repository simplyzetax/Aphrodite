import app, { db } from "../..";
import { getACIDFromJWT, getAuthUser, toBeLoggedOut } from "../../utils/auth";
import { Aphrodite } from "../../utils/error";
import UAParser from "../../utils/version";
import { z } from "zod";
import { and, eq, sql } from "drizzle-orm";
import Encoding from "../../utils/encoding";
import { profiles } from "../../database/models/profiles";
import { items } from "../../database/models/items";
import { loadouts, type NewLoadout } from "../../database/models/loadouts";
import { attributes } from "../../database/models/attributes";

export const preparedJoinedQueryWithItems = db
    .select()
    .from(profiles)
    .where(and(eq(profiles.type, sql.placeholder('type')), eq(profiles.accountId, sql.placeholder('accountId'))))
    .leftJoin(attributes, and(eq(profiles.id, attributes.profileId), eq(attributes.key, "last_applied_loadout")))
    .prepare("preparedJoinedQueryCopyCosmeticLoadout");

const lastAppliedLoadoutAttributeQuery = db.select().from(attributes).where(and(eq(attributes.profileId, sql.placeholder('profileId')), eq(attributes.key, "last_applied_loadout_attribute_query"))).prepare("lastAppliedLoadoutQuery")

const lastAppliedLoadoutQuery = db.select().from(loadouts).where(eq(loadouts.profileId, sql.placeholder('profileId'))).prepare("lastAppliedLoadoutQuery");

//THIS DOESNT WORK YET, I approached it wrong
app.post('/fortnite/api/game/v2/profile/:accountId/client/CopyCosmeticLoadout', async (c) => {

    const Authorization = c.req.header("Authorization");
    const accountId = getACIDFromJWT(c);
    const requestedProfileId = c.req.query("profileId");
    const ua = UAParser.parse(c.req.header("User-Agent"));

    const unsafeBody = await Encoding.getJSONBody(c);

    if (!Authorization) return c.sendError(Aphrodite.authentication.invalidHeader);
    if (!accountId || accountId !== c.req.param("accountId")) return c.sendError(Aphrodite.authentication.notYourAccount);
    if (!requestedProfileId) return c.sendError(Aphrodite.mcp.invalidPayload);
    if (!ua) return c.sendError(Aphrodite.internal.invalidUserAgent);

    const bodySchema = z.object({
        sourceIndex: z.number(),
        targetIndex: z.number(),
        optNewNameForTarget: z.string(),
    });

    const parsedBody = bodySchema.safeParse(unsafeBody);
    if (!parsedBody.success) return c.sendError(Aphrodite.mcp.invalidPayload.withMessage(parsedBody.error.errors.map((e) => e.message).join(", ")));

    const { sourceIndex, targetIndex, } = parsedBody.data;

    const profileChanges: object[] = [];

    const queryResult = await preparedJoinedQueryWithItems.execute({ type: requestedProfileId, accountId });

    const fetchedProfile = queryResult.map(({ profiles }) => profiles)[0];
    const lastAppliedLoadoutAttribute = queryResult.map(({ attributes }) => attributes)[0];

    const [lastAppliedLoadoutQueryResult] = await lastAppliedLoadoutAttributeQuery.execute({ profileId: fetchedProfile.id });
    if (!lastAppliedLoadoutQueryResult) return c.sendError(Aphrodite.mcp.invalidPayload.withMessage("No last applied loadout attribute query found"));
    const lastAppliedLoadoutName = lastAppliedLoadoutQueryResult.valueJSON;

    const [lastAppliedLoadoutResult] = await lastAppliedLoadoutQuery.execute({ profileId: fetchedProfile.id });
    if (!lastAppliedLoadoutResult) return c.sendError(Aphrodite.mcp.invalidPayload.withMessage("No last applied loadout found"));

    const mutableLoadout = { ...lastAppliedLoadoutResult };
    mutableLoadout.lockerName = `Copy of ${lastAppliedLoadoutResult.lockerName}-${targetIndex}`;

    const newLoadout: NewLoadout = { ...mutableLoadout }

    Promise.all([
        db.insert(loadouts).values(newLoadout).execute(),
    ]);

    const clientCommandRevision = JSON.parse(c.req.header("X-EpicGames-ProfileRevisions") || '[]')
        .find((x: any) => x.profileId === "athena")?.clientCommandRevision;
    if (!clientCommandRevision) return c.sendError(Aphrodite.mcp.invalidPayload.withMessage("Missing X-EpicGames-ProfileRevisions header"));

    return c.json({
        profileRevision: fetchedProfile.revision + 1,
        profileId: fetchedProfile.type,
        profileChangesBaseRevision: fetchedProfile.revision,
        profileChanges: profileChanges,
        profileCommandRevision: clientCommandRevision,
        serverTime: new Date().toISOString(),
        responseVersion: 1,
    });
});