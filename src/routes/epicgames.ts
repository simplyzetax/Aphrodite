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

const chunkFile = await Bun.file(path.join(import.meta.dir, "../../static/Aphrodite.chunk")).arrayBuffer();
const manifestFile = await Bun.file(path.join(import.meta.dir, "../../static/Aphrodite.manifest")).arrayBuffer();

const handleFileRequest = (c: Context) => {
    const fileName = c.req.param("file");

    switch (fileName) {
        case "Aphrodite.manifest":
            c.res.headers.append("Content-Type", "application/json");
            return new Response(manifestFile, { status: 200 });
        case "Aphrodite.chunk":
            c.res.headers.append("Content-Type", "application/octet-stream");
            return new Response(chunkFile, { status: 200 });
        default:
            return c.sendError(Aphrodite.cloudstorage.fileNotFound);
    }
};

app.get("/Builds/Fortnite/Content/CloudDir/Aphrodite/:file", (c) => handleFileRequest(c));
app.get("/Builds/Fortnite/Content/CloudDir/ChunksV4/06/:file", (c) => handleFileRequest(c));

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