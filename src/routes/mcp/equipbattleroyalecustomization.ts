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
import { profiles } from "../../database/models/profiles";
import { items } from "../../database/models/items";

const preparedJoinedQueryWithItems = db
    .select()
    .from(profiles)
    .where(and(eq(profiles.type, sql.placeholder('type')), eq(profiles.accountId, sql.placeholder('accountId'))))
    .leftJoin(items, and(eq(profiles.id, items.profileId), eq(items.id, sql.placeholder('itemToSlot')))).prepare("preparedJoinedQueryOther");

app.post('/fortnite/api/game/v2/profile/:accountId/client/EquipBattleRoyaleCustomization', async (c) => {
    const t = new Timing("EquipBattleRoyaleCustomization");
    const validSlots = ["Character", "Backpack", "Pickaxe", "Glider", "SkyDiveContrail", "MusicPack", "LoadingScreen"];

    const notImplementedSlots = ["Dance", "ItemWrap"];

    const Authorization = c.req.header("Authorization");
    const accountId = getACIDFromJWT(c);
    const requestedProfileId = c.req.query("profileId");
    const ua = UAParser.parse(c.req.header("User-Agent"));

    const body = await Encoding.getJSONBody(c);

    if (notImplementedSlots.includes(body.slotName)) return c.sendError(Aphrodite.mcp.invalidPayload.withMessage("This slot is not implemented yet"));

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

    const queryResult = await preparedJoinedQueryWithItems.execute({ type: requestedProfileId, accountId, itemToSlot: itemToSlot });

    const fetchedProfile = queryResult.map(({ profiles }) => profiles)[0];
    const fetchedItems = queryResult.map(({ items }) => items);

    const firstItem = fetchedItems[0];

    if (!firstItem && !itemToSlot.includes("_random") && itemToSlot !== "") {
        return c.sendError(Aphrodite.mcp.invalidPayload.withMessage("You do not own the item you are trying to equip"));
    }

    const profileChanges = [{
        changeType: "statModified",
        name: `favorite_${slotName.toLowerCase()}`,
        value: itemToSlot
    }];

    Promise.all([
        bumpRvnNumber.execute({ accountId, type: "athena" }),
        db.delete(attributes).where(and(eq(attributes.profileId, fetchedProfile.id), eq(attributes.key, `favorite_${slotName.toLowerCase()}`))),
        db.insert(attributes).values({
            profileId: fetchedProfile.id,
            key: `favorite_${slotName.toLowerCase()}`,
            type: requestedProfileId,
            valueJSON: itemToSlot
        }),
    ]);

    const rvn = c.req.query("rvn");
    if (!rvn && rvn !== "-1") return c.sendError(Aphrodite.mcp.invalidPayload.withMessage("Missing rvn"));
    if (fetchedProfile.revision !== Number.parseInt(rvn)) {
        Promise.all([
            TokenManager.resetAllTokensForAccountID(accountId),
            toBeLoggedOut.push({ accountId, token: Authorization.replace(/Bearer eg1~/i, "") })
        ]);
        return c.sendError(Aphrodite.mcp.invalidPayload.withMessage(`Profile revision mismatch, client: ${rvn}, server: ${fetchedProfile.revision}`));
    }

    t.print();

    return c.json({
        profileRevision: fetchedProfile.revision + 1,
        profileId: fetchedProfile.type,
        profileChangesBaseRevision: fetchedProfile.revision,
        profileChanges: profileChanges,
        profileCommandRevision: fetchedProfile.revision + 1,
        serverTime: new Date().toISOString(),
        multiUpdate: [],
        responseVersion: 1,
    });
});