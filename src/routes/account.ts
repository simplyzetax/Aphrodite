import { eq } from "drizzle-orm";
import app, { db } from "..";
import { users } from "../database/models/users";
import { getAuthUser } from "../utils/auth";
import { Aphrodite } from "../utils/error";

app.get("/account/api/public/account/:accountId", async (c) => {

    const user = await getAuthUser(c);
    if (!user) return c.sendError(Aphrodite.authentication.invalidToken);

    const redactedEmail = `${user.email.split("@")[0]}@********`;

    return c.json({
        id: user.accountId,
        displayName: user.displayName,
        name: user.displayName,
        email: redactedEmail,
        failedLoginAttempts: 0,
        lastLogin: new Date().toISOString(),
        numberOfDisplayNameChanges: 0,
        ageGroup: "UNKNOWN",
        headless: false,
        country: "DE",
        lastName: "Server",
        preferredLanguage: "en",
        canUpdateDisplayName: false,
        tfaEnabled: false,
        emailVerified: true,
        minorVerified: false,
        minorExpected: false,
        minorStatus: "NOT_MINOR",
        cabinedMode: false,
        hasHashedEmail: false
    });
});

app.get("/account/api/public/account/*/externalAuths", (c) => {
    return c.json([]); //Too lazy to implement this, maybe later
});

app.get("/account/api/public/account/displayName/:displayName", async (c) => {
    const displayName = c.req.param("displayName");
    const [user] = await db.select().from(users).where(eq(users.displayName, displayName));
    if (!user) return c.sendError(Aphrodite.account.accountNotFound.variable([displayName]));

    return c.json({
        id: user.accountId,
        displayName: user.displayName,
        externalAuths: {}
    });
});

app.get("/account/api/public/account", async (c) => {
    const response = [];

    const accountId = c.req.query("accountId");

    if (typeof accountId === "string") {
        const [user] = await db.select().from(users).where(eq(users.accountId, accountId));

        if (user) {
            response.push({
                id: user.accountId,
                displayName: user.displayName,
                externalAuths: {}
            });
        }
    }

    if (Array.isArray(accountId)) {
        const foundUsers = await db.select().from(users).where(eq(users.accountId, accountId));

        for (const user of foundUsers) {
            if (response.length >= 100) break;

            response.push({
                id: user.accountId,
                displayName: user.displayName,
                externalAuths: {}
            });
        }
    }

    return c.json(response);
});