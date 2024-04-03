import path from "node:path";
import fs from "node:fs/promises";

import app from "..";

const contentpages = await fs.readFile(path.join(import.meta.dir, "../../static/contentpages.json"), "utf-8").then(JSON.parse);

app.get("/content/api/pages/fortnite-game", async (c) => {
    return c.json(contentpages);
});