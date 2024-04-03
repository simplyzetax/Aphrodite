import app from "..";

// Love to lawin

app.post("/fortnite/api/game/v2/tryPlayOnPlatform/account/:accountId", (c) => {
    c.res.headers.append("Content-Type", "text/plain")
    return c.body("true");
});

app.get("/waitingroom/api/waitingroom", (c) => {
    return c.sendStatus(204);
});

app.get("/socialban/api/public/v1/*", (c) => {
    return c.json({
        bans: [],
        warnings: []
    });
});

app.get("/fortnite/api/game/v2/events/tournamentandhistory/*/EU/WindowsClient", (c) => {
    return c.json({});
});

app.get("/fortnite/api/statsv2/account/:accountId", (c) => {
    return c.json({
        startTime: 0,
        endTime: 0,
        stats: {},
        accountId: c.req.param("accountId")
    });
});

app.get("/statsproxy/api/statsv2/account/:accountId", (c) => {
    return c.json({
        startTime: 0,
        endTime: 0,
        stats: {},
        accountId: c.req.param("accountId")
    });
});

app.get("/fortnite/api/stats/accountId/:accountId/bulk/window/alltime", (c) => {
    return c.json({
        "startTime": 0,
        "endTime": 0,
        "stats": {},
        "accountId": c.req.param("accountId")
    });
});

app.post("/fortnite/api/feedback/*", (c) => {
    return c.sendStatus(200);
});

app.post("/fortnite/api/statsv2/query", (c) => {
    return c.json([]);
});

app.post("/statsproxy/api/statsv2/query", (c) => {
    return c.json([]);
});

app.post("/fortnite/api/game/v2/events/v2/setSubgroup/*", (c) => {
    return c.sendStatus(204);
});

app.get("/fortnite/api/game/v2/enabled_features", (c) => {
    return c.json([]);
});

app.get("/api/v1/events/Fortnite/download/*", (c) => {
    return c.json({});
});

app.get("/fortnite/api/game/v2/twitch/*", (c) => {
    return c.sendStatus(200);
});

app.get("/fortnite/api/game/v2/world/info", (c) => {
    return c.json({});
});

app.post("/fortnite/api/game/v2/chat/*/recommendGeneralChatRooms/pc", (c) => {
    return c.json({});
});

app.get("/fortnite/api/receipts/v1/account/*/receipts", (c) => {
    return c.json([]);
});

app.get("/fortnite/api/game/v2/leaderboards/cohort/*", (c) => {
    return c.json([]);
});

app.post("/datarouter/api/v1/public/data", (c) => {
    return c.sendStatus(204);
});