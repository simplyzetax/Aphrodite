import path from "node:path";
import fs from "node:fs/promises";

import app from "..";
import Contentpages from "../utils/contentpages";

app.get("/content/api/pages/fortnite-game", async (c) => {

    const file = Bun.file(path.join(import.meta.dir, "../../static/contentpages.json"));
    const cp = new Contentpages(file);

    const processed = await cp.process(c);

    return c.json(processed);
});