import app, { db } from "../..";
import { getACIDFromJWT, getAuthUser } from "../../utils/auth";
import { Aphrodite } from "../../utils/error";
import { ProfileHelper } from "../../utils/builders/profile";
import UAParser from "../../utils/version";
import Logger from "../../utils/logging";

app.post('/fortnite/api/game/v2/profile/:accountId/client/:action', async (c) => {

    Logger.warn("MCP catchall route hit");

    const unsafeAccountId = c.req.param("accountId");

    const accountId = getACIDFromJWT(c);

    if (accountId !== unsafeAccountId) return c.sendError(Aphrodite.authentication.notYourAccount);

    const requestedProfileId = c.req.query("profileId");
    if (!requestedProfileId) return c.sendError(Aphrodite.mcp.invalidPayload);

    //TODO make it not only query athena, but cc etc too

    const ua = UAParser.parse(c.req.header("User-Agent"));
    if (!ua) return c.sendError(Aphrodite.internal.invalidUserAgent);

    const ph = new ProfileHelper(requestedProfileId, ua.season);

    const fullProfile = await ph.getProfile(accountId);
    if (!fullProfile) return c.sendError(Aphrodite.mcp.templateNotFound);

    return c.json({
        profileRevision: fullProfile.profile.rvn || 0,
        profileId: fullProfile.profile.profileId,
        profileChangesBaseRevision: 0,
        profileChanges: [
            {
                changeType: "fullProfileUpdate",
                profile: fullProfile.profile,
            }
        ],
        profileCommandRevision: 0,
        serverTime: new Date().toISOString(),
        multiUpdate: [],
        responseVersion: 1,
    })

});