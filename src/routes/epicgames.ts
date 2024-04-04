import app from "..";
import { Aphrodite } from "../utils/error";
import UAParser from "../utils/version";
import path from 'node:path';
import type { Context } from "hono";

app.get("/launcher/api/public/assets/Windows/:id/FortniteContentBuilds", (c) => {
    const mem = UAParser.parse(c.req.header("User-Agent"));
    if (!mem) return c.sendError(Aphrodite.internal.invalidUserAgent);

    return c.json({
        appName: "FortniteContentBuilds",
        labelName: "Aphrodite",
        buildVersion: mem.build,
        catalogItemId: "5cb97847cee34581afdbc445400e2f77",
        expires: "9999-12-31T23:59:59.999Z",
        items: {
            MANIFEST: {
                signature: "Aphrodite",
                distribution: "https://aphrodite.ol.epicgames.com/",
                path: "Builds/Fortnite/Content/CloudDir/Aphrodite.manifest",
                hash: "55bb954f5596cadbe03693e1c06ca73368d427f3",
                additionalDistributions: []
            },
            CHUNKS: {
                signature: "Aphrodite",
                distribution: "https://aphrodite.ol.epicgames.com/",
                path: "Builds/Fortnite/Content/CloudDir/Aphrodite.manifest",
                additionalDistributions: []
            }
        },
        assetId: "FortniteContentBuilds"
    });
});


const handleFileRequest = async (c: Context, defaultFile: string) => {
    const fileName = c.req.param("file");
    let filePath = path.join(import.meta.dir, "../../static/", defaultFile);

    if (fileName.includes("..")) return c.sendError(Aphrodite.cloudstorage.fileNotFound);
    if (fileName.includes(".ini")) filePath = path.join(import.meta.dir, "../../static/", "noclue.ini");

    try {
        const fileContent = await Bun.file(filePath).arrayBuffer();
        c.res.headers.append("Content-Type", "application/octet-stream");
        return new Response(fileContent, { status: 200 });
    } catch (err) {
        return c.sendError(Aphrodite.cloudstorage.fileNotFound);
    }
};

app.get("/Builds/Fortnite/Content/CloudDir/Aphrodite/:file", (c) => handleFileRequest(c, "Aphrodite.manifest"));
app.get("/Builds/Fortnite/Content/CloudDir/ChunksV4/06/:file", (c) => handleFileRequest(c, "Aphrodite.chunk"));

app.get("/launcher/api/public/distributionpoints", (c) => {
    return c.json({
        distributions: [
            "https://aphrodite.ol.epicgames.com/"
        ]
    });
});

app.post("/api/v1/assets/Fortnite/:release/:clid", (c) => {
    return c.sendStatus(204);
});