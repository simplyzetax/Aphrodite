import jwt from "jsonwebtoken";

import type { User } from "../database/models/users";
import Encoding from "./encoding";
import UUID from "./uuid";
import { config, db } from "..";
import { tokens } from "../database/models/tokens";
import { eq } from "drizzle-orm";

class TokenManager {

    private user: User;

    constructor(user: User) {
        this.user = user;
    }

    public async newAccessToken(clientId: string, gt: string): Promise<string> {
        const accessToken = jwt.sign({
            app: "fortnite",
            sub: this.user.accountId,
            dvid: Math.floor(Math.random() * 1000000000),
            mver: false,
            clid: clientId,
            dn: this.user.displayName,
            am: gt,
            p: Encoding.encodeBase64(UUID.gr()),
            iai: this.user.accountId,
            sec: 1,
            clsvc: "fortnite",
            t: "s",
            ic: true,
            jti: UUID.gr(),
            creation_date: new Date(),
            hours_expire: 4
        }, config.UPLINK_KEY, { expiresIn: "4h" });

        await db.insert(tokens).values({
            token: accessToken,
            type: "access_token",
            accountId: this.user.accountId
        })

        return accessToken;
    }

    public async newRefreshToken(clientId: string): Promise<string> {
        const refreshToken = jwt.sign({
            app: "fortnite",
            sub: this.user.accountId,
            dvid: Math.floor(Math.random() * 1000000000),
            mver: false,
            clid: clientId,
            dn: this.user.displayName,
            am: "refresh",
            p: Encoding.encodeBase64(UUID.gr()),
            iai: this.user.accountId,
            sec: 1,
            clsvc: "fortnite",
            t: "s",
            ic: true,
            jti: UUID.gr(),
            creation_date: new Date(),
            hours_expire: 24
        }, config.UPLINK_KEY, { expiresIn: "24h" });

        await db.insert(tokens).values({
            token: refreshToken,
            type: "refresh_token",
            accountId: this.user.accountId
        })

        return refreshToken;
    }

    public async newExchangeCode(): Promise<string> {

        const EC = UUID.gr();

        await db.insert(tokens).values({
            token: EC,
            type: "exchange_code",
            accountId: this.user.accountId
        })

        return EC;

    }

    public async resetAllTokensForUser(): Promise<void> {
        await db.delete(tokens).where(eq(tokens.accountId, this.user.accountId));
    }

}

export default TokenManager;