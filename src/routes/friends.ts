import { eq } from "drizzle-orm";
import app, { db } from "..";
import { friends } from "../database/models/friends";
import { getACIDFromJWT } from './../utils/auth';
import { Aphrodite } from "../utils/error";
import destr from "destr";
import { z } from "zod";

app.get("/friends/api/public/friends/:accountId", async (c) => {
    const accountId = getACIDFromJWT(c);
    if (!accountId) return c.sendError(Aphrodite.authentication.invalidToken);

    const [fetchedFriends] = await db.select().from(friends).where(eq(friends.accountId, accountId));
    if (!fetchedFriends) return c.sendError(Aphrodite.friends.accountNotFound);

    const friendSchema = z.object({
        accountId: z.string(),
        created: z.string()
    });

    const friendsListSchema = z.object({
        accepted: z.array(friendSchema),
        incoming: z.array(friendSchema),
        outgoing: z.array(friendSchema)
    });

    const friendsDataUnsafe = friendsListSchema.safeParse(destr(fetchedFriends.list));
    if (!friendsDataUnsafe.success) return c.json(friendsDataUnsafe.error)
    const friendsData = friendsDataUnsafe.data;

    const friendTypes = {
        accepted: { status: "ACCEPTED", direction: "OUTBOUND" },
        incoming: { status: "PENDING", direction: "INBOUND" },
        outgoing: { status: "PENDING", direction: "OUTBOUND" }
    };

    const response = [];

    for (const type in friendTypes) {
        const friendTypeKey = type as 'accepted' | 'incoming' | 'outgoing';
        for (const friend of friendsData[friendTypeKey]) {
            response.push({
                accountId: friend.accountId,
                status: friendTypes[friendTypeKey].status,
                direction: friendTypes[friendTypeKey].direction,
                created: friend.created,
                favorite: false
            });
        }
    }

    return c.json(response);
});