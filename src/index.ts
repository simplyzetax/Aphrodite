import { Hono } from "hono";

import { DatabaseConnector } from "./database/database";
import responseEnhancementsMiddleware from "./middleware/rem";
import { loadRoutes } from "./utils/routing";
import Logger from "./utils/logging";
import { Aphrodite } from "./utils/error";
import { Config } from "./utils/config";
import Uplink from "./utils/uplink";

const app = new Hono({
    strict: false,
});

// App needs to be exported before routes are loaded as
// this would lead to errors
export default app;

app.use('*', responseEnhancementsMiddleware());

export const config = Config.load();
export const UPLINK_DATA = await Uplink.load();
for (const [key, value] of Object.entries(UPLINK_DATA.features)) {
    Logger.startup(`Uplink feature: ${key} is ${value ? 'enabled' : 'disabled'}`);
}

const dbInstance = new DatabaseConnector(config.DATABASE_URL, config.DATABASE_TOKEN);
const connectedDb = await dbInstance.connect();
export const db = connectedDb.db;

await loadRoutes('../../src/routes/');

app.notFound((c) => c.sendError(Aphrodite.basic.notFound));

Logger.startup(`Aphrodite listening on port 3000 😏`);