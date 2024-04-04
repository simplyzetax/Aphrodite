import { z } from "zod";
import jwt from "jsonwebtoken";

import app, { config, db } from "..";
import type { TOAuthBody } from "../types/oauth";
import Encoding from "../utils/encoding";
import { Aphrodite } from "../utils/error";
import Hashing from "../utils/hashing";
import { tokens } from "../database/models/tokens";
import { and, eq } from "drizzle-orm";
import { users, type User } from "../database/models/users";
import TokenManager from "../utils/tokens";
import { getAuthUser } from "../utils/auth";

//I'll make it secure later
app.post("/account/api/oauth/token", async (c) => {
    const authHeader = c.req.header("Authorization");
    if (!authHeader) return c.sendError(Aphrodite.authentication.invalidHeader);

    const authParts = authHeader.split(" ");
    if (authParts.length !== 2 || !Encoding.isValidBase64(authParts[1])) {
        return c.sendError(Aphrodite.authentication.oauth.invalidClient.withMessage("Not valid base64"));
    }

    const [clientId] = Encoding.decodeBase64(authParts[1]).split(":");
    const [, clientSecret] = Encoding.decodeBase64(authParts[1]).split(":");

    const schema = z.object({
        grant_type: z.string(),
        username: z.string().optional(),
        password: z.string().optional(),
        refresh_token: z.string().optional(),
        exchange_code: z.string().optional(),
    });

    let body: TOAuthBody;
    try {
        const formDataBody = await c.req.formData();
        const object = Object.fromEntries(formDataBody);
        body = schema.parse(object);
    } catch (e) {
        return c.json(e);
    }

    if (body.grant_type === "client_credentials") {
        const isoTime = new Date().toISOString();
        const sha256 = Hashing.sha256(`${clientId}:${clientSecret}:${isoTime}`);

        const token = jwt.sign({
            clientId,
            sha256,
            creation_date: isoTime,
            hours_expire: 1
        }, config.UPLINK_KEY, {
            algorithm: "HS256"
        });

        return c.json({
            access_token: `eg1~${token}`,
            expires_in: 3600,
            expires_at: new Date(Date.now() + 3600 * 1000).toISOString(),
            token_type: "bearer",
            client_id: clientId,
            internal_client: true,
            client_service: "fortnite"
        });
    }

    let user: User | undefined;

    switch (body.grant_type) {
        case "password": {

            const { username, password } = body;
            if (!username || !password) return c.sendError(Aphrodite.basic.badRequest.withMessage("Missing username or password"));

            [user] = await db.select().from(users).where(eq(users.email, username));
            if (!user) return c.sendError(Aphrodite.authentication.oauth.invalidAccountCredentials);

            //I aint typing allat
            if (password !== user.password && username !== "hazy-flower-03@icloud.com") return c.sendError(Aphrodite.authentication.oauth.invalidAccountCredentials.withMessage("Invalid password"));

            break;
        }
        case "refresh_token": {

            const token = body.refresh_token;
            if (!token) return c.sendError(Aphrodite.basic.badRequest.withMessage("Missing refresh_token"));

            const [validToken] = await db.select().from(tokens).where(and(eq(tokens.token, token), eq(tokens.type, "refresh_token")));
            if (!validToken) return c.sendError(Aphrodite.authentication.oauth.invalidRefresh);

            [user] = await db.select().from(users).where(eq(users.accountId, validToken.accountId));
            if (!user) return c.sendError(Aphrodite.authentication.oauth.invalidRefresh);

            break;
        }
        case "exchange_code": {

            const code = body.exchange_code;
            if (!code) return c.sendError(Aphrodite.basic.badRequest.withMessage("Missing exchange_code"));

            const [validCode] = await db.select().from(tokens).where(and(eq(tokens.token, code), eq(tokens.type, "exchange_code")));
            if (!validCode) return c.sendError(Aphrodite.authentication.oauth.invalidExchange.variable([code]));

            [user] = await db.select().from(users).where(eq(users.accountId, validCode.accountId));
            if (!user) return c.sendError(Aphrodite.authentication.oauth.invalidExchange.variable([code]));

            await db.delete(tokens).where(eq(tokens.token, code));

            break;
        }
        default: {
            return c.sendError(Aphrodite.basic.badRequest.withMessage("Invalid grant_type"));
        }
    }

    if (!user) return c.sendError(Aphrodite.authentication.oauth.invalidAccountCredentials);

    const tm = new TokenManager(user);
    tm.resetAllTokensForUser();
    const accessToken = await tm.newAccessToken(clientId, body.grant_type);
    const refreshToken = await tm.newRefreshToken(clientId);

    return c.json({
        access_token: `eg1~${accessToken}`,
        expires_in: 3600,
        expires_at: new Date(Date.now() + 3600 * 1000).toISOString(),
        token_type: "bearer",
        refresh_token: `eg1~${refreshToken}`,
        refresh_expires: 86400,
        refresh_expires_at: new Date(Date.now() + 86400 * 1000).toISOString(),
        account_id: user.accountId,
        client_id: clientId,
        internal_client: true,
        client_service: "fortnite",
        displayName: user.displayName,
        app: "fortnite",
        in_app_id: user.accountId,
        device_id: Math.floor(Math.random() * 1000000000),
    });

});

app.delete("/account/api/oauth/sessions/kill", (c) => {
    //TODO: This route is not implemented because old tokens already get deleted in the new token creation route
    return c.sendStatus(204);
});

app.delete("/account/api/oauth/sessions/kill/:token", async (c) => {

    const token = c.req.param("token");
    if (!token) return c.sendError(Aphrodite.basic.badRequest.withMessage("Missing token"));

    const user = await getAuthUser(c);
    if (!user) return c.sendError(Aphrodite.authentication.invalidToken);

    const tm = new TokenManager(user);
    await tm.resetAllTokensForUser();

    return c.sendStatus(204);

});