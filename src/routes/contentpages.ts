import path from "node:path";

import app from "..";
import Contentpages from "../utils/contentpages";

//Contentpages does not actually have any auth, so it's proper
app.get("/content/api/pages/fortnite-game", async (c) => {
    const file = Bun.file(path.join(import.meta.dir, "../../static/contentpages.json"));
    const cp = new Contentpages(file);
    const processed = await cp.process(c);
    return c.json(processed);
});