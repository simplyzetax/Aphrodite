import { z } from "zod";
import app from "..";
import type { TOAuthBody } from "../types/oauth";
import Encoding from "../utils/encoding";
import { Aphrodite } from "../utils/error";

//I'll implement this later
app.post("/account/api/oauth/token", async (c) => {
    const authHeader = c.req.header("Authorization");
    if (!authHeader) return c.sendError(Aphrodite.authentication.invalidHeader);

    const [clientId] = Encoding.decodeBase64(authHeader.split(" ")[1]).split(":");
    const [, clientSecret] = Encoding.decodeBase64(authHeader.split(" ")[1]).split(":");
    if (!clientId || !clientSecret) return c.sendError(Aphrodite.authentication.oauth.invalidClient);

    let requestBody: unknown;
    try {
        requestBody = await c.req.parseBody() as unknown;
    } catch {
        return c.sendError(Aphrodite.basic.badRequest.withMessage("Failed to parse request body"));
    }

    const schema = z.object({
        grant_type: z.string(),
        username: z.string().optional(),
        password: z.string().optional(),
        refresh_token: z.string().optional(),
        exchange_code: z.string().optional(),
    });

    let body: TOAuthBody;
    try {
        body = schema.parse(requestBody);
    } catch (err: any) {
        return c.sendError(Aphrodite.basic.badRequest.withMessage(err.errors[0].message));
    }

    switch (body.grant_type) {
        case "password": {
            break;
        }
        case "refresh_token": {
            break;
        }
        case "exchange_code": {
            break;
        }
        default: {
            return c.sendError(Aphrodite.basic.badRequest.withMessage("Invalid grant_type"));
        }
    }
});