import app, { db } from "../..";
import { getACIDFromJWT } from "../../utils/auth";
import { Aphrodite } from "../../utils/error";
import { ProfileHelper } from "../../utils/builders/profile";
import UAParser from "../../utils/version";
import { items } from "../../database/models/items";
import { eq, sql } from "drizzle-orm";
import { bumpRvnNumber } from "./queryprofile";

const preparedMarkItemFavorite = db.update(items).set({
    favorite: true
}).where(eq(items.id, sql.placeholder('itemId')));

app.post("/fortnite/api/game/v2/profile/:unsafeAccountId/client/SetItemFavoriteStatusBatch", async (c) => {

    const unsafeAccountId = c.req.param("unsafeAccountId");
    const accountId = getACIDFromJWT(c);

    if (accountId !== unsafeAccountId) return c.sendError(Aphrodite.authentication.notYourAccount);

    const requestedProfileId = c.req.query("profileId");
    if (!requestedProfileId) return c.sendError(Aphrodite.mcp.invalidPayload);

    let body;
    try {
        body = await c.req.json();
    } catch (e) {
        return c.sendError(Aphrodite.mcp.invalidPayload);
    }

    const ua = UAParser.parse(c.req.header("User-Agent"));
    if (!ua) return c.sendError(Aphrodite.internal.invalidUserAgent);

    //TODO, request items in for loop, still better than fetching full profile
    const ph = new ProfileHelper(requestedProfileId, ua.build);
    const fullProfile = await ph.getProfile(accountId);
    if (!fullProfile) return c.sendError(Aphrodite.mcp.templateNotFound);

    const profileChanges = [];
    const itemFavoritePromises = [];
    for (const i in body.itemIds) {
        const [item] = await db.select().from(items).where(eq(items.id, body.itemIds[i]));
        if (!item) continue;

        profileChanges.push({
            changeType: "itemAttrChanged",
            itemId: body.itemIds[i],
            attributeName: "favorite",
            attributeValue: body.itemFavStatus[i]
        });

        itemFavoritePromises.push(preparedMarkItemFavorite.execute({ itemId: body.itemIds[i] }));
    }

    Promise.all([
        bumpRvnNumber.execute({ accountId, type: "athena" }),
        ...itemFavoritePromises,
    ]);

    return c.json({
        profileRevision: fullProfile.profile.rvn + 1,
        profileId: requestedProfileId,
        profileChangesBaseRevision: fullProfile.profile.rvn,
        profileChanges: profileChanges,
        profileCommandRevision: fullProfile.profile.commandRevision + 1,
        serverTime: new Date().toISOString(),
        responseVersion: 1
    });
});