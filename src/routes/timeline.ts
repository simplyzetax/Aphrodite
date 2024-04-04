import app from "..";
import { Aphrodite } from "../utils/error";
import UAParser from "../utils/version";

app.get("/fortnite/api/calendar/v1/timeline", (c) => {

    const mem = UAParser.parse(c.req.header("User-Agent"));
    if (!mem || typeof mem.season !== 'number') return c.sendError(Aphrodite.internal.invalidUserAgent)

    const activeEvents = [
        {
            eventType: `EventFlag.Season${mem.season}`,
            activeUntil: new Date().toISOString(),
            activeSince: new Date().toISOString(),
        },
        {
            eventType: `EventFlag.${mem.lobby}`,
            activeUntil: new Date().toISOString(),
            activeSince: new Date().toISOString(),
        },
        {
            "eventType": "EventFlag.Winterfest.Tree",
            "activeUntil": "9999-01-01T00:00:00.000Z",
            "activeSince": "2020-01-01T00:00:00.000Z"
        },
        {
            "eventType": "EventFlag.LTE_WinterFest",
            "activeUntil": "9999-01-01T00:00:00.000Z",
            "activeSince": "2020-01-01T00:00:00.000Z"
        },
        {
            "eventType": "EventFlag.LTE_WinterFest2019",
            "activeUntil": "9999-01-01T00:00:00.000Z",
            "activeSince": "2020-01-01T00:00:00.000Z"
        }
    ];

    const todayAtMidnight = new Date();
    todayAtMidnight.setHours(24, 0, 0, 0);
    const todayOneMinuteBeforeMidnight = new Date(todayAtMidnight.getTime() - 1);
    const isoDate = todayOneMinuteBeforeMidnight.toISOString();

    return c.json({
        channels: {
            "client-matchmaking": {
                states: [],
                cacheExpire: isoDate,
            },
            "client-events": {
                states: [
                    {
                        validFrom: todayAtMidnight,
                        activeEvents: activeEvents,
                        state: {
                            activeStorefronts: [],
                            eventNamedWeights: {},
                            seasonNumber: mem.season,
                            seasonTemplateId: `AthenaSeason:athenaseason${mem.season}`,
                            matchXpBonusPoints: 0,
                            seasonBegin: todayAtMidnight.toISOString(),
                            seasonEnd: todayAtMidnight.toISOString(),
                            seasonDisplayedEnd: todayAtMidnight.toISOString(),
                            weeklyStoreEnd: isoDate,
                            stwEventStoreEnd: todayAtMidnight.toISOString(), //TODO: Change to actual date in 24h for example
                            stwWeeklyStoreEnd: todayAtMidnight.toISOString(),
                            sectionStoreEnds: {
                                Featured: isoDate,
                            },
                            dailyStoreEnd: isoDate,
                        },
                    },
                ],
                cacheExpire: isoDate,
            },
        },
        eventsTimeOffsetHrs: 0,
        cacheIntervalMins: 10,
        currentTime: new Date().toISOString(),
    });
});