import { and, eq } from "drizzle-orm";
import app, { db } from "../..";
import { getAuthUser } from "../../utils/auth";
import { Aphrodite } from "../../utils/error";
import { ProfileHelper } from "../../utils/builders/profile";
import UAParser from "../../utils/version";

app.post('/fortnite/api/game/v2/profile/:accountId/client/:action', async (c) => {

    const unsafeAccountId = c.req.param("accountId");

    const user = await getAuthUser(c);
    if (!user) return c.sendError(Aphrodite.authentication.invalidToken);

    if (user.accountId !== unsafeAccountId) return c.sendError(Aphrodite.authentication.notYourAccount);

    const requestedProfileId = c.req.query("profileId");
    if (!requestedProfileId) return c.sendError(Aphrodite.mcp.invalidPayload);

    //TODO make it not only query athena, but cc etc too

    const ua = UAParser.parse(c.req.header("User-Agent"));
    if (!ua) return c.sendError(Aphrodite.internal.invalidUserAgent);

    const ph = new ProfileHelper(requestedProfileId, ua.season);

    const fullProfile = await ph.getProfile(user.accountId);
    if (!fullProfile) return c.sendError(Aphrodite.mcp.templateNotFound);

    return c.json({
        profileRevision: fullProfile.profile.rvn || 0,
        profileId: fullProfile.profile.profileId,
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