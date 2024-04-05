import app, { db } from "../..";
import { getACIDFromJWT, getAuthUser, toBeLoggedOut } from "../../utils/auth";
import { Aphrodite } from "../../utils/error";
import { ProfileHelper } from "../../utils/builders/profile";
import UAParser from "../../utils/version";
import { bumpRvnNumber } from "./queryprofile";
import { z } from "zod";
import { attributes } from "../../database/models/attributes";
import { and, eq, sql } from "drizzle-orm";
import TokenManager from "../../utils/tokens";
import Encoding from "../../utils/encoding";
import Timing from "../../utils/timing";

app.post('/fortnite/api/game/v2/profile/:accountId/client/EquipBattleRoyaleCustomization', async (c) => {
    const t = new Timing("EquipBattleRoyaleCustomization");
    const validSlots = ["Character", "Backpack", "Pickaxe", "Glider", "SkyDiveContrail", "MusicPack", "LoadingScreen"];

    const Authorization = c.req.header("Authorization");
    const accountId = getACIDFromJWT(c);
    const requestedProfileId = c.req.query("profileId");
    const ua = UAParser.parse(c.req.header("User-Agent"));

    const body = await Encoding.getJSONBody(c);

    if (!Authorization) return c.sendError(Aphrodite.authentication.invalidHeader);
    if (!accountId || accountId !== c.req.param("accountId")) return c.sendError(Aphrodite.authentication.notYourAccount);
    if (!requestedProfileId) return c.sendError(Aphrodite.mcp.invalidPayload);
    if (!ua) return c.sendError(Aphrodite.internal.invalidUserAgent);

    const bodySchema = z.object({
        indexWithinSlot: z.number(),
        itemToSlot: z.string().or(z.literal("")),
        slotName: z.string().refine((v) => validSlots.includes(v), { message: `Invalid slot: ${body.slotName}` }),
        variantUpdates: z.array(z.object({
            channel: z.string(),
            active: z.string(),
        })).optional(),
    });

    const parsedBody = bodySchema.safeParse(body);
    if (!parsedBody.success) return c.sendError(Aphrodite.mcp.invalidPayload.withMessage(parsedBody.error.errors.map((e) => e.message).join(", ")));

    const { slotName, itemToSlot } = parsedBody.data;
    const ph = new ProfileHelper(requestedProfileId, ua.build);
    const fullProfile = await ph.getProfile(accountId);
    if (!fullProfile) return c.sendError(Aphrodite.mcp.templateNotFound);

    if (!fullProfile.profile.items[itemToSlot] && !itemToSlot.includes("_random") && itemToSlot !== "") {
        return c.sendError(Aphrodite.mcp.invalidPayload.withMessage("You do not own the item you are trying to equip"));
    }

    const profileChanges = [{
        changeType: "statModified",
        name: `favorite_${slotName.toLowerCase()}`,
        value: itemToSlot
    }];

    Promise.all([
        bumpRvnNumber.execute({ accountId, type: "athena" }),
        db.delete(attributes).where(and(eq(attributes.profileId, fullProfile.profile.profileUniqueId), eq(attributes.key, `favorite_${slotName.toLowerCase()}`))),
        db.insert(attributes).values({
            profileId: fullProfile.profile.profileUniqueId,
            key: `favorite_${slotName.toLowerCase()}`,
            type: requestedProfileId,
            valueJSON: itemToSlot
        }),
    ]);

    const rvn = c.req.query("rvn");
    if (!rvn && rvn !== "-1") return c.sendError(Aphrodite.mcp.invalidPayload.withMessage("Missing rvn"));
    if (fullProfile.profile.rvn !== Number.parseInt(rvn)) {
        Promise.all([
            TokenManager.resetAllTokensForAccountID(accountId),
            toBeLoggedOut.push({ accountId, token: Authorization.replace(/Bearer eg1~/i, "") })
        ]);
        return c.sendError(Aphrodite.mcp.invalidPayload.withMessage(`Profile revision mismatch, client: ${rvn}, server: ${fullProfile.profile.rvn}`));
    }

    t.print();

    return c.json({
        profileRevision: fullProfile.profile.rvn + 1,
        profileId: fullProfile.profile.profileId,
        profileChangesBaseRevision: fullProfile.profile.rvn,
        profileChanges: profileChanges,
        profileCommandRevision: fullProfile.profile.rvn + 1,
        serverTime: new Date().toISOString(),
        multiUpdate: [],
        responseVersion: 1,
    });
});