import app from "..";
import { Aphrodite } from "../utils/error";
import UAParser from "../utils/version";

const forever = "9999-01-01T00:00:00.000Z";

function createActiveEvents(season: number, lobby: string): Array<{ eventType: string, activeUntil: string, activeSince: string }> {
    const now = new Date().toISOString();
    return [
        { eventType: `EventFlag.Season${season}`, activeUntil: now, activeSince: now },
        { eventType: `EventFlag.${lobby}`, activeUntil: now, activeSince: now },
        { eventType: "EventFlag.Winterfest.Tree", activeUntil: forever, activeSince: "2020-01-01T00:00:00.000Z" },
        { eventType: "EventFlag.LTE_WinterFest", activeUntil: forever, activeSince: "2020-01-01T00:00:00.000Z" },
        { eventType: "EventFlag.LTE_WinterFest2019", activeUntil: forever, activeSince: "2020-01-01T00:00:00.000Z" }
    ];
}

function getIsoDateOneMinuteBeforeMidnight(): string {
    const todayAtMidnight = new Date();
    todayAtMidnight.setHours(24, 0, 0, 0);
    const todayOneMinuteBeforeMidnight = new Date(todayAtMidnight.getTime() - 1);
    return todayOneMinuteBeforeMidnight.toISOString();
}

app.get("/fortnite/api/calendar/v1/timeline", (c) => {
    const mem = UAParser.parse(c.req.header("User-Agent"));
    if (!mem || typeof mem.season !== 'number') return c.sendError(Aphrodite.internal.invalidUserAgent)

    const activeEvents = createActiveEvents(mem.season, mem.lobby);
    const isoDate = getIsoDateOneMinuteBeforeMidnight();
    const todayAtMidnight = new Date();
    todayAtMidnight.setHours(24, 0, 0, 0);

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
                            seasonEnd: forever,
                            seasonDisplayedEnd: forever,
                            weeklyStoreEnd: isoDate,
                            stwEventStoreEnd: forever,
                            stwWeeklyStoreEnd: forever,
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