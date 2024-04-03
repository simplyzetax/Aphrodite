import { and, eq } from "drizzle-orm";
import app, { db } from "../..";
import { profiles } from "../../database/models/profiles";
import { getAuthUser } from "../../utils/auth";
import { Aphrodite } from "../../utils/error";
import ItemBuilder from "../../utils/builders/items";
import { ProfileHelper } from "../../utils/builders/athena";
import UAParser from "../../utils/version";

app.post('/fortnite/api/game/v2/profile/:accountId/client/QueryProfile', async (c) => {

    const unsafeAccountId = c.req.param("accountId");

    const user = await getAuthUser(c);
    if (!user) return c.sendError(Aphrodite.authentication.invalidToken);

    if (user.accountId !== unsafeAccountId) return c.sendError(Aphrodite.authentication.notYourAccount);

    const requestedProfileId = c.req.query("profileId");
    if (!requestedProfileId) return c.sendError(Aphrodite.mcp.invalidPayload);

    const [profile] = await db.select().from(profiles).where(and(eq(profiles.type, requestedProfileId), eq(profiles.accountId, user.accountId)));
    if (!profile) return c.sendError(Aphrodite.mcp.templateNotFound.variable([user.accountId]));

    const ib = new ItemBuilder(String(profile.id));
    const items = await ib.buildItems();
    if (!items) return c.sendError(Aphrodite.mcp.emptyItems);

    //TODO make it not only query athena, but cc etc too

    const ua = UAParser.parse(c.req.header("User-Agent"));
    if (!ua) return c.sendError(Aphrodite.internal.invalidUserAgent);

    const ph = new ProfileHelper(profile.type, ua.season);

    const fullProfile = await ph.getProfile(user.accountId);
    if (!fullProfile) return c.sendError(Aphrodite.mcp.templateNotFound);

    return c.json({
        profileRevision: profile.revision || 0,
        profileId: profile.type,
        profileChangesBaseRevision: 0,
        profileChanges: [
            {
                "changeType": "fullProfileUpdate",
                "profile": fullProfile.profile,
            }
        ],
        profileCommandRevision: 0,
        serverTime: new Date().toISOString(),
        multiUpdate: [],
        responseVersion: 1,
    })

});