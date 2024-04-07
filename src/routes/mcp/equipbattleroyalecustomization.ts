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
    .leftJoin(items, and(eq(profiles.id, items.profileId), eq(items.id, sql.placeholder('itemToSlot'))))
    .leftJoin(attributes, eq(profiles.id, attributes.profileId))
    .prepare("preparedJoinedQueryOther")

const preparedBoringProfileQuery = db.select().from(profiles).where(and(eq(profiles.type, sql.placeholder('type')), eq(profiles.accountId, sql.placeholder('accountId')))).prepare("preparedBoringProfileQuery");

app.post('/fortnite/api/game/v2/profile/:accountId/client/EquipBattleRoyaleCustomization', async (c) => {
    const t = new Timing("EquipBattleRoyaleCustomization");
    const validSlots = ["Character", "Backpack", "Pickaxe", "Glider", "SkyDiveContrail", "MusicPack", "LoadingScreen", "Dance", "ItemWrap"];

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

    const { slotName, itemToSlot, indexWithinSlot } = parsedBody.data;

    let profileChanges = [];

    if (itemToSlot === "" || itemToSlot.includes("_random")) {
        const [profile] = await preparedBoringProfileQuery.execute({ type: requestedProfileId, accountId });
        const [attribute] = await db.select().from(attributes).where(and(eq(attributes.profileId, profile.id), eq(attributes.key, `favorite_${slotName.toLowerCase()}`)));

        let valueJSON: string[] | string = attribute ? attribute.valueJSON as string[] : [];

        if (["ItemWrap", "Dance"].includes(slotName)) {
            if (!Array.isArray(valueJSON)) {
                valueJSON = [];
            }
            if (indexWithinSlot === -1 && itemToSlot !== "") {
                const length = slotName === "ItemWrap" ? 7 : 6;
                valueJSON = new Array(length).fill(itemToSlot);
            } else {
                if (valueJSON.length <= indexWithinSlot) {
                    valueJSON = valueJSON.concat(new Array(indexWithinSlot - valueJSON.length + 1).fill(""));
                }
                valueJSON[indexWithinSlot] = itemToSlot;
            }
        } else if (indexWithinSlot === 0) {
            valueJSON = itemToSlot;
        }

        const profileChanges = [{
            changeType: "statModified",
            name: slotName.toLowerCase() === "itemwrap" ? "favorite_itemwraps" : "favorite_dance",
            value: valueJSON
        }];

        Promise.all([
            bumpRvnNumber.execute({ accountId, type: "athena" }),
            db.delete(attributes).where(and(eq(attributes.profileId, profile.id), eq(attributes.key, `favorite_${slotName.toLowerCase()}`))),
            db.insert(attributes).values({
                profileId: profile.id,
                key: `favorite_${slotName.toLowerCase()}`,
                type: requestedProfileId,
                valueJSON: valueJSON
            })
        ]);

        return c.json({
            profileRevision: profile.revision + 1,
            profileId: profile.type,
            profileChangesBaseRevision: profile.revision,
            profileChanges: profileChanges,
            profileCommandRevision: profile.revision + 1,
            serverTime: new Date().toISOString(),
            responseVersion: 1,
        });
    }

    const queryResult = await preparedJoinedQueryWithItems.execute({ type: requestedProfileId, accountId, itemToSlot: itemToSlot });

    const fetchedProfile = queryResult.map(({ profiles }) => profiles)[0];
    const fetchedItems = queryResult.map(({ items }) => items);
    const fetchedAttributes = queryResult.map(({ attributes }) => attributes);

    const firstItem = fetchedItems[0];

    if (!firstItem && !itemToSlot.includes("_random") && itemToSlot !== "") {
        return c.sendError(Aphrodite.mcp.invalidPayload.withMessage("You do not own the item you are trying to equip"));
    }

    if (slotName.toLowerCase() === "dance" || slotName.toLowerCase() === "itemwrap") {
        const previousAttribute = fetchedAttributes.find((a) => a && a.key === `favorite_${slotName.toLowerCase()}`);
        let valueJSON: any = previousAttribute ? previousAttribute.valueJSON : [];

        if (["ItemWrap", "Dance"].includes(slotName)) {
            if (!Array.isArray(valueJSON)) {
                valueJSON = [];
            }
            if (indexWithinSlot === -1 && itemToSlot !== "") {
                const length = slotName === "ItemWrap" ? 7 : 6;
                valueJSON = new Array(length).fill(itemToSlot);
            } else {
                if (valueJSON.length <= indexWithinSlot) {
                    valueJSON = valueJSON.concat(new Array(indexWithinSlot - valueJSON.length + 1).fill(""));
                }
                valueJSON[indexWithinSlot] = itemToSlot;
            }
        }

        Promise.all([
            bumpRvnNumber.execute({ accountId, type: "athena" }),
            db.delete(attributes).where(and(eq(attributes.profileId, fetchedProfile.id), eq(attributes.key, `favorite_${slotName.toLowerCase()}`))),
            db.insert(attributes).values({
                profileId: fetchedProfile.id,
                key: `favorite_${slotName.toLowerCase()}`,
                type: requestedProfileId,
                valueJSON: valueJSON
            })
        ]);

        profileChanges = [{
            changeType: "statModified",
            name: slotName.toLowerCase() === "itemwrap" ? "favorite_itemwraps" : "favorite_dance",
            value: valueJSON
        }];
    } else {
        Promise.all([
            bumpRvnNumber.execute({ accountId, type: "athena" }),
            db.insert(attributes).values({
                profileId: fetchedProfile.id,
                key: `favorite_${slotName.toLowerCase()}`,
                type: requestedProfileId,
                valueJSON: itemToSlot
            }),
        ]);

        profileChanges = [{
            changeType: "statModified",
            name: `favorite_${slotName.toLowerCase()}`,
            value: itemToSlot
        }];
    }

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