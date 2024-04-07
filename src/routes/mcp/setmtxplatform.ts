import app, { db } from "../..";
import { getACIDFromJWT } from "../../utils/auth";
import { Aphrodite } from "../../utils/error";
import UAParser from "../../utils/version";
import { and, eq } from "drizzle-orm";
import { bumpRvnNumber } from "./queryprofile";
import { profiles } from "../../database/models/profiles";

// TODO: MAKE PROPER
app.post('/fortnite/api/game/v2/profile/:accountId/client/SetMtxPlatform', async (c) => {

    const unsafeAccountId = c.req.param("accountId");

    const accountId = getACIDFromJWT(c);
    if (!accountId) return c.sendError(Aphrodite.authentication.invalidToken);

    if (accountId !== unsafeAccountId) return c.sendError(Aphrodite.authentication.notYourAccount);

    const requestedProfileId = c.req.query("profileId");
    if (!requestedProfileId) return c.sendError(Aphrodite.mcp.invalidPayload);

    const ua = UAParser.parse(c.req.header("User-Agent"));
    if (!ua) return c.sendError(Aphrodite.internal.invalidUserAgent);

    const [fetchedProfile] = await db.select().from(profiles).where(and(eq(profiles.type, requestedProfileId), eq(profiles.accountId, accountId)));
    if (!fetchedProfile) return c.sendError(Aphrodite.mcp.profileNotFound);

    Promise.all([
        bumpRvnNumber.execute({ accountId, type: "athena" }),
    ])

    return c.json({
        profileRevision: fetchedProfile.revision + 1,
        profileId: requestedProfileId,
        profileChangesBaseRevision: fetchedProfile.revision,
        profileChanges: [
            {
                changeType: "fullProfileUpdate",
                profile: {},
            }
        ],
        profileCommandRevision: fetchedProfile.revision + 1,
        serverTime: new Date().toISOString(),
        responseVersion: 1
    })

});