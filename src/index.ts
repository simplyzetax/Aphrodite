import { Hono } from "hono";

import Database from "./database/database";
import responseEnhancementsMiddleware from "./middleware/rem";
import { loadRoutes } from "./utils/routing";
import Logger from "./utils/logging";
import { Aphrodite, ApiError } from "./utils/error";
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

const dbInstance = new Database(config.DATABASE_URL);
await dbInstance.connect();
export const db = dbInstance.db;

await loadRoutes('../../src/routes/');

app.notFound((c) => {
    return c.sendError(Aphrodite.basic.notFound);
});

Logger.startup(`Aphrodite listening on port 3000 😏`);