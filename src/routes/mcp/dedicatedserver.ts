import app, { db } from "../..";
import { Aphrodite } from "../../utils/error";
import { ProfileHelper } from "../../utils/builders/profile";
import { bumpRvnNumber } from "./queryprofile";

//TODO: Add rate limiting to prevent abuse
app.post('/fortnite/api/game/v2/profile/:accountId/dedicated_server/:operation', async (c) => {

    const unsafeAccountId = c.req.param("accountId");

    const requestedProfileId = c.req.query("profileId");
    if (!requestedProfileId) return c.sendError(Aphrodite.mcp.invalidPayload);

    const ph = new ProfileHelper(requestedProfileId, "1");

    const fullProfile = await ph.getProfile(unsafeAccountId);
    if (!fullProfile) return c.sendError(Aphrodite.mcp.templateNotFound);

    Promise.all([
        bumpRvnNumber.execute({ unsafeAccountId, type: "athena" }),
    ])

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