import path from "node:path";

import app from "..";

const keychain = await Bun.file(path.join(import.meta.dir, "../../static/keychain.json")).json();

const catalog = await Bun.file(path.join(import.meta.dir, "../../static/catalog.json")).json();


app.get("/fortnite/api/storefront/v2/keychain", (c) => {
    return c.json(keychain);
});

app.get("/fortnite/api/storefront/v2/catalog", (c) => {
    return c.json(catalog);
});