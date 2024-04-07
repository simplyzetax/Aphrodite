import qs from "qs";
import app, { config } from "..";
import { getAuthUser } from "../utils/auth";
import { Aphrodite } from "../utils/error";
import UUID from "../utils/uuid";
import UAParser from "../utils/version";
import Hashing from "../utils/hashing";
import jwt from "jsonwebtoken";

type buildUniqueId = {
    [accountId: string]: string;
};

export const buildUniqueId: buildUniqueId = {};

app.get("/fortnite/api/game/v2/matchmaking/account/:accountId/session/:sessionId", (c) => {
    return c.json({
        accountId: c.req.param("accountId"),
        sessionId: c.req.param("sessionId"),
        key: "none",
    });
});

app.get("/fortnite/api/matchmaking/session/:sessionId", async (c) => {
    const user = await getAuthUser(c);

    const sessionId = c.req.param("sessionId");

    return c.json({
        id: sessionId,
        ownerId: UUID.gr().toUpperCase(),
        ownerName: "Aphrodite.SO",
        serverName: `Aphrodite.SO's Game`,
        serverAddress: "PLACEHOLDER",
        serverPort: "PLACEHOLDER",
        maxPublicPlayers: 100,
        openPublicPlayers: 100,
        maxPrivatePlayers: 100,
        openPrivatePlayers: 100,
        attributes: {},
        publicPlayers: [],
        privatePlayers: [],
        totalPlayers: 0,
        allowJoinInProgress: false,
        shouldAdvertise: false,
        isDedicated: false,
        usesStats: false,
        allowInvites: false,
        usesPresence: false,
        allowJoinViaPresence: true,
        allowJoinViaPresenceFriendsOnly: false,
        buildUniqueId: "PLACEHOLDER",
        lastUpdated: new Date().toISOString(),
        started: false,
    });
});

app.post("/fortnite/api/matchmaking/session/:sessionId/join", (c) => c.sendStatus(204));

app.post("/fortnite/api/matchmaking/session/matchMakingRequest", (c) => {
    return c.json([]);
});

app.get("/fortnite/api/game/v2/matchmakingservice/ticket/player/:accountId", async (c) => {

    const user = await getAuthUser(c);
    if (!user) {
        return c.sendError(Aphrodite.authentication.invalidToken);
    }

    if (c.req.param("accountId") !== user.accountId) {
        return c.sendError(Aphrodite.authentication.notYourAccount);
    }

    const bucketId = c.req.query("bucketId");
    if (typeof bucketId !== "string") {
        return c.sendError(Aphrodite.matchmaking.invalidBucketId);
    }

    const bucketIdParts = bucketId.split(":");
    if (bucketIdParts.length !== 4) {
        return c.sendError(Aphrodite.matchmaking.invalidBucketId);
    }

    const [buildUniqueIdPart, , region] = bucketIdParts;
    if (!buildUniqueIdPart || !region) {
        return c.sendError(Aphrodite.matchmaking.invalidBucketId);
    }

    buildUniqueId[user.accountId] = buildUniqueIdPart;

    const playerCustomKey = c.req.query("player.option.customKey")
    const memory = UAParser.parse(c.req.header("User-Agent"));
    if (!memory) {
        return c.sendError(Aphrodite.internal.invalidUserAgent);
    }

    /*const party = parties.find((party: { members: any[] }) =>
        party.members.some((member) => member.account_id === user.accountId),
    );
    const partyId = party ? party.id : "none";

    const partyMembers: string[] = [];
    if (party) {
        for (const member of party.members ?? []) {
            if (member?.account_id) {
                partyMembers.push(member.account_id);
            }
        }
    }*/

    const unixTime = new Date().getMilliseconds().toString();

    const signatureHash = Hashing.sha256(
        `${user.accountId}:${bucketId}:${unixTime}:${config.UPLINK_KEY}`,
    );

    const payload = {
        playerId: user.accountId,
        partyPlayerIds: "partyMembers", //Replace with partyMembers variable
        bucketId: bucketId,
        attributes: {
            "player.subregions": region,
            "player.season": memory.season,
            "player.option.partyId": "partyId", //Replace with partyId variable
            "player.userAgent": memory.cl,
            "player.platform": "Windows",
            "player.option.linkType": "DEFAULT",
            "player.preferredSubregion": region,
            "player.input": "KBM",
            "playlist.revision": 1,
            ...(playerCustomKey && { customKey: playerCustomKey }),
            "player.option.fillTeam": false,
            "player.option.linkCode": playerCustomKey ? playerCustomKey : "none",
            "player.option.uiLanguage": "en",
            "player.privateMMS": playerCustomKey ? true : false,
            "player.option.spectator": false,
            "player.inputTypes": "KBM",
            "player.option.groupBy": playerCustomKey ? playerCustomKey : "none",
            "player.option.microphoneEnabled": true,
        },
        expireAt: new Date(Date.now() + 1000 * 30).toISOString(),
        nonce: signatureHash,
    };

    const signedPayload = jwt.sign(payload, config.UPLINK_KEY, { algorithm: "HS256" });

    return c.json({
        serviceUrl: "wss://127.0.0.1:3001", //Make dynamic later
        ticketType: "mms-player",
        payload: signedPayload,
        signature: signatureHash,
    });
});