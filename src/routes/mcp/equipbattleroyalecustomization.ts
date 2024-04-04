import app from "../..";
import { getACIDFromJWT, getAuthUser } from "../../utils/auth";
import { Aphrodite } from "../../utils/error";
import { ProfileHelper } from "../../utils/builders/profile";
import UAParser from "../../utils/version";

app.post('/fortnite/api/game/v2/profile/:accountId/client/EquipBattleRoyaleCustomization', async (c) => {

    console.log("EquipBattleRoyaleCustomization");

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

    const profileChanges = [];

    profileChanges.push({
        changeType: "statModified",
        name: ("favorite_character").toLowerCase(),
        value: "AthenaCharacter:CID_001_Athena_Commando_F_Default"
    });

    return c.json({
        profileRevision: fullProfile.profile.rvn || 0,
        profileId: fullProfile.profile.profileId,
        profileChangesBaseRevision: 0,
        profileChanges: profileChanges,
        profileCommandRevision: 0,
        serverTime: new Date().toISOString(),
        multiUpdate: [],
        responseVersion: 1,
    })

});