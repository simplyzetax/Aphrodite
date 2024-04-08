
import app, { db } from "..";
import Hotfixes from "../utils/hotfixes";
import { hotfixes } from "../database/models/hotfixes";
import { Aphrodite } from "../utils/error";
import { getACIDFromJWT, verifyClientToken } from "../utils/auth";

// This is the superior Cloudstorage approach in every way, it's faster and allows 
// changes without watching files (Thats what these are for after all)

app.get("/fortnite/api/cloudstorage/system", async (c) => {

    const Authorization = c.req.header("Authorization");
    if (!Authorization) {
        return c.sendError(Aphrodite.authentication.invalidHeader);
    }

    if (!verifyClientToken(Authorization) && !getACIDFromJWT(c)) {
        return c.sendError(Aphrodite.authentication.invalidToken);
    }

    const files = await db.select().from(hotfixes);
    const uniqueFiles = [...new Set(files.map(file => file.filename))];
    const hotfixList = uniqueFiles.map(filename => {
        const date = new Date().toISOString();

        const sha256 = new Bun.SHA256();
        sha256.update(date);

        const sha1 = new Bun.SHA1();
        sha1.update(date);

        const sha256Hex = sha256.digest("hex");
        const sha1Hex = sha1.digest("hex");

        return {
            uniqueFilename: filename,
            filename: filename,
            hash: sha1Hex,
            hash256: sha256Hex,
            length: Number((Math.random() * 1000).toFixed(0)),
            contentType: "application/octet-stream",
            uploaded: date,
            storageType: "S3",
            storageIds: {},
            doNotCache: true,
        };
    });

    return c.json(hotfixList);
});

app.get("/fortnite/api/cloudstorage/system/:file", async (c) => {

    const Authorization = c.req.header("Authorization");
    if (!Authorization) {
        return c.sendError(Aphrodite.authentication.invalidHeader);
    }

    if (!verifyClientToken(Authorization) && !getACIDFromJWT(c)) {
        return c.sendError(Aphrodite.authentication.invalidToken);
    }

    const fileName = c.req.param("file");

    const hotfixes = new Hotfixes(fileName);
    await hotfixes.fetchGlobalHotfixes();
    const parsedHotfixes = hotfixes.processHotfixes();

    if (!parsedHotfixes) {
        return c.sendError(Aphrodite.cloudstorage.fileNotFound);
    }

    return c.sendIni(parsedHotfixes);
});