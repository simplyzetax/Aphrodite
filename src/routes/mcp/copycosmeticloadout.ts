import app, { db } from "../..";
import { getACIDFromJWT, getAuthUser, toBeLoggedOut } from "../../utils/auth";
import { Aphrodite } from "../../utils/error";
import UAParser from "../../utils/version";
import { z } from "zod";
import { and, eq, sql } from "drizzle-orm";
import Encoding from "../../utils/encoding";
import { profiles } from "../../database/models/profiles";
import { items } from "../../database/models/items";
import { loadouts } from "../../database/models/loadouts";
import { buildOneLoadout } from "../../utils/builders/loadouts";

export const preparedJoinedQueryWithItems = db
    .select()
    .from(profiles)
    .where(and(eq(profiles.type, sql.placeholder('type')), eq(profiles.accountId, sql.placeholder('accountId'))))
    .leftJoin(items, and(eq(profiles.id, items.profileId), eq(items.templateId, sql.placeholder('itemToSlot'))))
    .leftJoin(loadouts, and(eq(profiles.id, loadouts.profileId), eq(loadouts.lockerName, sql.placeholder('lockerItem'))))
    .prepare("preparedJoinedQueryOther");

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
        category: z.string(),
        itemToSlot: z.string().or(z.literal("")),
        lockerItem: z.string(),
        optLockerUseCountOverride: z.number(),
        slotIndex: z.number(),
        variantUpdates: z.array(z.object({
            channel: z.string(),
            active: z.string(),
        })).optional(),
    });

    const parsedBody = bodySchema.safeParse(unsafeBody);
    if (!parsedBody.success) return c.sendError(Aphrodite.mcp.invalidPayload.withMessage(parsedBody.error.errors.map((e) => e.message).join(", ")));

    const { category, itemToSlot, slotIndex, lockerItem } = parsedBody.data;

    const profileChanges: object[] = [];

    const queryResult = await preparedJoinedQueryWithItems.execute({ type: requestedProfileId, accountId, itemToSlot: itemToSlot, lockerItem: lockerItem });

    const fetchedProfile = queryResult.map(({ profiles }) => profiles)[0];
    const fetchedItems = queryResult.map(({ items }) => items);
    const fetchedLoadouts = queryResult.map(({ loadouts }) => loadouts);

    const firstItem = fetchedItems[0];
    const firstLoadout = fetchedLoadouts[0];

    if (!firstItem && firstItem !== null && !itemToSlot.includes("_random") && itemToSlot !== "") return c.sendError(Aphrodite.mcp.invalidPayload.withMessage("You do not own the item you are trying to equip"));
    if (!firstLoadout) return c.sendError(Aphrodite.mcp.invalidPayload.withMessage("Invalid locker item"));

    const locker = buildOneLoadout(firstLoadout);

    const XEpicProfileRevisions = c.req.header("X-EpicGames-ProfileRevisions");
    if (!XEpicProfileRevisions) return c.sendError(Aphrodite.mcp.invalidPayload.withMessage("Missing X-EpicGames-ProfileRevisions header"));

    const parsed = JSON.parse(XEpicProfileRevisions);

    const athenaValue = parsed.find((x: any) => x.profileId === "athena");
    const clientCommandRevision = athenaValue?.clientCommandRevision;

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