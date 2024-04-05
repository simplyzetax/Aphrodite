import app, { db } from "../..";
import { getACIDFromJWT, getAuthUser } from "../../utils/auth";
import { Aphrodite } from "../../utils/error";
import { ProfileHelper } from "../../utils/builders/profile";
import UAParser from "../../utils/version";
import { bumpRvnNumber } from "./queryprofile";
import Timing from "../../utils/timing";

app.post('/fortnite/api/game/v2/profile/:accountId/client/EquipBattleRoyaleCustomization', async (c) => {

    const unsafeAccountId = c.req.param("accountId");

    const accountId = getACIDFromJWT(c);

    if (accountId !== unsafeAccountId) return c.sendError(Aphrodite.authentication.notYourAccount);

    const requestedProfileId = c.req.query("profileId");
    if (!requestedProfileId) return c.sendError(Aphrodite.mcp.invalidPayload);

    const ua = UAParser.parse(c.req.header("User-Agent"));
    if (!ua) return c.sendError(Aphrodite.internal.invalidUserAgent);

    let body;
    try {
        body = await c.req.json();
    } catch (e) {
        return c.sendError(Aphrodite.mcp.invalidPayload);
    }

    const ph = new ProfileHelper(requestedProfileId, ua.build);

    const fullProfile = await ph.getProfile(accountId);
    if (!fullProfile) return c.sendError(Aphrodite.mcp.templateNotFound);

    const profileChanges = [];

    const slotName = body.slotName;

    const validSlots = ["Character", "Backpack", "Pickaxe", "Glider", "SkyDiveContrail", "MusicPack", "LoadingScreen"];
    if (!validSlots.includes(slotName)) return c.sendError(Aphrodite.mcp.invalidPayload.withMessage(`Invalid slot: ${body.slot}`));

    const itemToSlot = body.itemToSlot;
    if (!fullProfile.profile.items[itemToSlot] && !itemToSlot.includes("_random")) return c.sendError(Aphrodite.mcp.invalidPayload.withMessage("You do not own the item you are trying to equip"));

    //Im adding emotes, wraps etc later
    profileChanges.push({
        changeType: "statModified",
        name: (`favorite_${slotName.toLowerCase()}`).toLowerCase(),
        value: itemToSlot
    });

    Promise.all([
        bumpRvnNumber.execute({ accountId, type: "athena" }),
    ])

    return c.json({
        profileRevision: fullProfile.profile.rvn + 1,
        profileId: fullProfile.profile.profileId,
        profileChangesBaseRevision: fullProfile.profile.rvn,
        profileChanges: profileChanges,
        profileCommandRevision: fullProfile.profile.rvn + 1,
        serverTime: new Date().toISOString(),
        multiUpdate: [],
        responseVersion: 1,
    })

});