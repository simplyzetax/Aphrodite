import { Hono } from "hono";

import Config from "./utils/config";
import responseEnhancementsMiddleware from "./middleware/rem";
import { loadRoutes } from "./utils/routing";
import Logger from "./utils/logging";
import { Aphrodite, ApiError } from "./utils/error";
import { DatabaseConnector } from "./database/database";

const app = new Hono({
    strict: false,
});

// App needs to be exported before routes are loaded as
// this would lead to errors
export default app;

app.use('*', responseEnhancementsMiddleware());

const config = Config.load();

const dbInstance = new DatabaseConnector(config.DATABASE_URL);
const connectedDb = await dbInstance.connect();
export const db = connectedDb.db;

await loadRoutes('../../src/routes/');

app.notFound((c) => {
    return c.sendError(Aphrodite.basic.notFound);
});

Logger.startup(`Aphrodite listening on port 3000 😏`);