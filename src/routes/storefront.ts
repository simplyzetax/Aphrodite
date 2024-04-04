import path from "node:path";

import app from "..";

const keychain = await Bun.file(path.join(import.meta.dir, "../../static/keychain.json")).json();

app.get("/fortnite/api/storefront/v2/keychain", (c) => {
    return c.json(keychain);
});