import type { Context } from "hono";
import jwt from "jsonwebtoken";
import type { JwtPayload } from "jsonwebtoken";
import { eq, sql } from "drizzle-orm";

import { users, type User } from "../database/models/users";
import { config, db } from "..";
import { tokens } from "../database/models/tokens";

function isJwtPayload(object: any): object is JwtPayload {
    return 'iat' in object && 'exp' in object && 'sub' in object;
}

/**
 * 
 * @param authorization The Authorization header
 * @returns Whether the token is valid or not
 */
export function verifyClientToken(authorization: string): boolean {
    try {
        const token = authorization.replace(/Bearer eg1~/i, "");
        jwt.verify(token, config.UPLINK_KEY);
        return true;
    } catch (e) {
        return false;
    }
}

const preparedGetUser = db.select().from(users).where(eq(users.accountId, sql.placeholder('accountId')))
const preparedGetToken = db.select().from(tokens).where(eq(tokens.token, sql.placeholder('token')))

/**
 * 
 * @param c The request context
 * @returns The user object
 */
export async function getAuthUser(c: Context): Promise<User | undefined> {

    const auth = c.req.header("Authorization");
    if (!auth) {
        return undefined;
    }

    const token = auth.replace(/Bearer eg1~/i, "");

    const decoded = jwt.verify(token, config.UPLINK_KEY);
    if (!decoded || typeof decoded === 'string' || !isJwtPayload(decoded)) {
        throw new Error('Invalid token');
    }

    const decodedToken: JwtPayload = decoded;

    const [validToken] = await preparedGetToken.execute({ token });
    if (!validToken) return undefined;

    if (!decodedToken.sub) return undefined;

    const [validUser] = await preparedGetUser.execute({ accountId: decodedToken.sub });
    if (!validUser) return undefined;

    return validUser;
}

/**
 * 
 * @param c The request context
 * @returns The account ID
 */
export function getACIDFromJWT(c: Context): string | undefined {
    try {
        const auth = c.req.header("Authorization");
        if (!auth) {
            return undefined;
        }

        const token = auth.replace(/Bearer eg1~/i, "");

        const decoded = jwt.verify(token, config.UPLINK_KEY);
        if (typeof decoded === 'string' || !isJwtPayload(decoded)) {
            throw new Error('Invalid token');
        }

        const decodedToken: JwtPayload = decoded;
        return decodedToken.sub;
    } catch (e) {
        return undefined;
    }
}

export function getTokenFromContext(c: Context): string | undefined {
    const auth = c.req.header("Authorization");
    if (!auth) {
        return undefined;
    }

    return auth.replace(/Bearer eg1~/i, "");
}

// Shamelessy stolen from Lawin (Love him)
export function addHoursJWT(arg0: Date, hours_expire: any) {
    const date = new Date(arg0);
    date.setHours(date.getHours() + hours_expire);
    return date;
}