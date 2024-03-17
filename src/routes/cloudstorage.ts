
import app, { db } from "..";
import Hotfixes from "../utils/hotfixes";
import { hotfixes } from "../database/models/hotfixes";
import { Aphrodite } from "../utils/error";

app.get("/fortnite/api/cloudstorage/system", async (c) => {

    const hotfixList = [];

    const files = await db.select().from(hotfixes);
    for (const file of files) {
        const name = file.filename.toLowerCase();

        const sha256 = new Bun.SHA256();
        sha256.update(new Date().toISOString());

        const sha1 = new Bun.SHA1();
        sha1.update(new Date().toISOString());

        const sha256Hex = sha256.digest("hex");
        const sha1Hex = sha1.digest("hex");

        hotfixList.push({
            uniqueFilename: `${name}-${sha256Hex}`,
            filename: name,
            hash: sha1Hex,
            hash256: sha256Hex,
            length: Number((Math.random() * 1000).toFixed(0)),
            contentType: "application/octet-stream",
            uploaded: new Date().toISOString(),
            storageType: "S3",
            storageIds: {},
        });
    }

    return c.json(hotfixList);

});

app.get("/fortnite/api/cloudstorage/system/:file", async (c) => {
    const fileName = c.req.param("file");

    const hotfixes = new Hotfixes(fileName);
    await hotfixes.fetchGlobalHotfixes();
    const parsedHotfixes = hotfixes.processHotfixes();
    if (!parsedHotfixes) return c.sendError(Aphrodite.cloudstorage.fileNotFound)

    return c.sendIni(parsedHotfixes);

});