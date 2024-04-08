import app, { db } from "../..";
import { getACIDFromJWT } from "../../utils/auth";
import { Aphrodite } from "../../utils/error";
import { ProfileHelper } from "../../utils/builders/profile";
import UAParser from "../../utils/version";
import { bumpRvnNumber } from "./queryprofile";
import { profiles } from "../../database/models/profiles";
import { and, eq } from "drizzle-orm";

// TODO: MAKE PROPER
app.post('/fortnite/api/game/v2/profile/:accountId/client/ClientQuestLogin', async (c) => {

    const unsafeAccountId = c.req.param("accountId");

    const accountId = getACIDFromJWT(c);
    if (!accountId) return c.sendError(Aphrodite.authentication.invalidToken);

    if (accountId !== unsafeAccountId) return c.sendError(Aphrodite.authentication.notYourAccount);

    const requestedProfileId = c.req.query("profileId");
    if (!requestedProfileId) return c.sendError(Aphrodite.mcp.invalidPayload);

    const ua = UAParser.parse(c.req.header("User-Agent"));
    if (!ua) return c.sendError(Aphrodite.internal.invalidUserAgent);

    const [profile] = await db.select().from(profiles).where(and(eq(profiles.accountId, accountId), eq(profiles.type, requestedProfileId)));

    Promise.all([
        bumpRvnNumber.execute({ accountId, type: "athena" }),
    ])

    return c.json({
        profileRevision: profile.revision + 1,
        profileId: profile.type,
        profileChangesBaseRevision: profile.revision,
        profileChanges: [],
        profileCommandRevision: profile.revision + 1,
        serverTime: new Date().toISOString(),
        multiUpdate: [],
        responseVersion: 1,
    })

});