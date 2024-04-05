import app, { db } from "../..";
import { getACIDFromJWT } from "../../utils/auth";
import { Aphrodite } from "../../utils/error";
import { ProfileHelper } from "../../utils/builders/profile";
import UAParser from "../../utils/version";
import { bumpRvnNumber } from "./queryprofile";

// TODO: MAKE PROPER
app.post('/fortnite/api/game/v2/profile/:accountId/client/ClientQuestLogin', async (c) => {

    const unsafeAccountId = c.req.param("accountId");

    const accountId = getACIDFromJWT(c);

    if (accountId !== unsafeAccountId) return c.sendError(Aphrodite.authentication.notYourAccount);

    const requestedProfileId = c.req.query("profileId");
    if (!requestedProfileId) return c.sendError(Aphrodite.mcp.invalidPayload);

    const ua = UAParser.parse(c.req.header("User-Agent"));
    if (!ua) return c.sendError(Aphrodite.internal.invalidUserAgent);

    const ph = new ProfileHelper(requestedProfileId, ua.build);

    const fullProfile = await ph.getProfile(accountId);
    if (!fullProfile) return c.sendError(Aphrodite.mcp.templateNotFound);

    await bumpRvnNumber.execute({ accountId, type: requestedProfileId });

    return c.json({
        profileRevision: fullProfile.profile.rvn + 1,
        profileId: fullProfile.profile.profileId,
        profileChangesBaseRevision: fullProfile.profile.rvn,
        profileChanges: [
            {
                changeType: "fullProfileUpdate",
                profile: fullProfile.profile,
            }
        ],
        profileCommandRevision: fullProfile.profile.rvn + 1,
        serverTime: new Date().toISOString(),
        multiUpdate: [],
        responseVersion: 1,
    })

});