import { Hono } from "hono";

import responseEnhancementsMiddleware from "./middleware/rem";
import { loadRoutes } from "./utils/routing";
import Logger from "./utils/logging";
import { Aphrodite } from "./utils/error";
import { Config } from "./utils/config";

import "./matchmaker/server";
import DB from "./database/database";
import Hotfixes from "./utils/hotfixes";

const app = new Hono({
    strict: false,
});

// App needs to be exported before routes are loaded as
// this would lead to errors
export default app;

app.use('*', responseEnhancementsMiddleware());

export const config = Config.load();
//export const UPLINK_DATA = await Uplink.load();

const dbInstance = new DB(config.DATABASE_URL);
await dbInstance.connect();
export const db = dbInstance.client;

await loadRoutes('../../src/routes/');

import path from "path";

app.notFound((c) => c.sendError(Aphrodite.basic.notFound));

Logger.startup(`Aphrodite listening on port 3000 😏`);