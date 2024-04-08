import app, { db } from "../..";
import { getACIDFromJWT } from "../../utils/auth";
import { Aphrodite } from "../../utils/error";
import UAParser from "../../utils/version";
import { items } from "../../database/models/items";
import { and, eq, sql } from "drizzle-orm";
import { bumpRvnNumber } from "./queryprofile";
import { profiles } from "../../database/models/profiles";
import Encoding from "../../utils/encoding";
import { z } from "zod";

const preparedMarkItemSeenQuery = db.update(items).set({
    seen: true
}).where(eq(items.id, sql.placeholder('itemId')));

export const preparedJoinedQueryWithItems = db
    .select()
    .from(profiles)
    .where(and(eq(profiles.type, sql.placeholder('type')), eq(profiles.accountId, sql.placeholder('accountId'))))
    .leftJoin(items, and(eq(profiles.id, items.profileId), eq(items.id, sql.placeholder('itemToSlot'))))
    .prepare("preparedJoinedQueryOther")

app.post("/fortnite/api/game/v2/profile/:unsafeAccountId/client/MarkItemSeen", async (c) => {

    const Authorization = c.req.header("Authorization");
    const accountId = getACIDFromJWT(c);
    const requestedProfileId = c.req.query("profileId");
    const ua = UAParser.parse(c.req.header("User-Agent"));

    const body = await Encoding.getJSONBody(c);

    if (!Authorization) return c.sendError(Aphrodite.authentication.invalidHeader);
    if (!accountId || accountId !== c.req.param("unsafeAccountId")) return c.sendError(Aphrodite.authentication.notYourAccount);
    if (!requestedProfileId) return c.sendError(Aphrodite.mcp.invalidPayload);
    if (!ua) return c.sendError(Aphrodite.internal.invalidUserAgent);

    const bodySchema = z.object({
        itemIds: z.array(z.string())
    });

    const parsedBody = bodySchema.safeParse(body);
    if (!parsedBody.success) return c.sendError(Aphrodite.mcp.invalidPayload.withMessage(parsedBody.error.errors.map((e) => e.message).join(", ")));

    const { itemIds } = parsedBody.data;

    const [fetchedProfile] = await db.select().from(profiles).where(and(eq(profiles.type, requestedProfileId), eq(profiles.accountId, accountId)));
    if (!fetchedProfile) return c.sendError(Aphrodite.mcp.profileNotFound);

    const fetchedItems = await db.select().from(items).where(eq(items.profileId, fetchedProfile.id));
    if (!fetchedItems) return c.sendError(Aphrodite.mcp.profileNotFound);

    const profileChanges = [];
    const itemSeenPromises = [];

    for (const i in itemIds) {
        const item = fetchedItems.find((item) => item.id === itemIds[i]);
        if (!item) continue;

        if ('item_seen' in (item.jsonAttributes as any)) {
            profileChanges.push({
                changeType: "itemAttrChanged",
                itemId: itemIds[i],
                attributeName: "item_seen",
                attributeValue: true
            });

            itemSeenPromises.push(preparedMarkItemSeenQuery.execute({ itemId: itemIds[i] }));
        }
    }

    Promise.all([
        bumpRvnNumber.execute({ accountId, type: "athena" }),
        ...itemSeenPromises
    ])

    const clientCommandRevision = JSON.parse(c.req.header("X-EpicGames-ProfileRevisions") || '[]')
        .find((x: any) => x.profileId === "athena")?.clientCommandRevision;
    if (!clientCommandRevision) return c.sendError(Aphrodite.mcp.invalidPayload.withMessage("Missing X-EpicGames-ProfileRevisions header"));

    return c.json({
        profileRevision: fetchedProfile.revision + 1,
        profileId: requestedProfileId,
        profileChangesBaseRevision: fetchedProfile.revision,
        profileChanges: profileChanges,
        profileCommandRevision: clientCommandRevision,
        serverTime: new Date().toISOString(),
        responseVersion: 1
    });
});