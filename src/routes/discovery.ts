import app from "..";
const discovery = require("../../static/discovery_assets.json");

app.post("/api/v1/discovery/surface/*", async (c) => {
    return c.json(discovery);
});

app.get("/links/api/fn/mnemonic/*", async (c) => {
    const panels = discovery.Panels[0];
    const pages = panels.Pages[0];
    const results = pages.results;

    for (let i in results) {
        const data = results[i].linkData;

        if (data.mnemonic) {
            return c.json(data);
        }
    }
});