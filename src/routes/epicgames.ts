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
const iniFile = await Bun.file(path.join(import.meta.dir, "../../static/Full.ini")).arrayBuffer();

const handleFileRequest = (c: Context) => {
    const fileName = c.req.param("file");

    switch (fileName) {
        case "Aphrodite.manifest":
            c.res.headers.append("Content-Type", "application/json");
            return new Response(manifestFile, { status: 200 });
        case "Aphrodite.chunk":
            c.res.headers.append("Content-Type", "application/octet-stream");
            return new Response(chunkFile, { status: 200 });
        case "Full.ini":
            c.res.headers.append("Content-Type", "application/octet-stream");
            return new Response(iniFile, { status: 200 });
        default:
            return new Response(chunkFile, { status: 200 });
    }
};

app.get("/Builds/Fortnite/Content/CloudDir/Aphrodite/:file", (c) => handleFileRequest(c));
app.get("/Builds/Fortnite/Content/CloudDir/:file", (c) => handleFileRequest(c));
app.get("/Builds/Fortnite/Content/CloudDir/ChunksV4/:id/:file", (c) => handleFileRequest(c));

app.get("/launcher/api/public/distributionpoints", (c) => {
    return c.json({
        distributions: [
            "https://aphrodite.ol.epicgames.com/"
        ]
    });
});

app.post("/api/v1/assets/Fortnite/*/*", async (c) => {
    return c.json({
    FortCreativeDiscoverySurface: {
        meta: {
          "promotion": 1
        },
        assets: {
          CreativeDiscoverySurface_Frontend: {
            "meta": {
              "revision": 1,
              "headRevision": 1,
              "revisedAt": "2022-04-11T16:34:03.517Z",
              "promotion": 1,
              "promotedAt": "2022-04-11T16:34:49.510Z"
            },
            assetData: {
              "AnalyticsId": "t412",
              "TestCohorts": [
                {
                  "AnalyticsId": "c522715413",
                  "CohortSelector": "PlayerDeterministic",
                  "PlatformBlacklist": [],
                  "ContentPanels": [
                    {
                      "NumPages": 1,
                      "AnalyticsId": "p536",
                      "PanelType": "AnalyticsList",
                      "AnalyticsListName": "ByEpicWoven",
                      "CuratedListOfLinkCodes": [],
                      "ModelName": "",
                      "PageSize": 7,
                      "PlatformBlacklist": [],
                      "PanelName": "ByEpicWoven",
                      "MetricInterval": "",
                      "SkippedEntriesCount": 0,
                      "SkippedEntriesPercent": 0,
                      "SplicedEntries": [],
                      "PlatformWhitelist": [],
                      "EntrySkippingMethod": "None",
                      "PanelDisplayName": {
                        "Category": "Game",
                        "NativeCulture": "",
                        "Namespace": "CreativeDiscoverySurface_Frontend",
                        "LocalizedStrings": [
                          {
                            "key": "en",
                            "value": "Play Your Way"
                          }
                        ],
                        "bIsMinimalPatch": false,
                        "NativeString": "Play Your Way",
                        "Key": "ByEpicWoven"
                      },
                      "PlayHistoryType": "RecentlyPlayed",
                      "bLowestToHighest": false,
                      "PanelLinkCodeBlacklist": [],
                      "PanelLinkCodeWhitelist": [],
                      "FeatureTags": [],
                      "MetricName": ""
                    }
                  ],
                  "PlatformWhitelist": [],
                  "SelectionChance": 0.1,
                  "TestName": "Aphrodite"
                }
              ],
              "GlobalLinkCodeBlacklist": [],
              "SurfaceName": "CreativeDiscoverySurface_Frontend",
              "TestName": "20.10_4/11/2022_hero_combat_popularConsole",
              "primaryAssetId": "FortCreativeDiscoverySurface:CreativeDiscoverySurface_Frontend",
              "GlobalLinkCodeWhitelist": []
            }
          }
        }
      }
    })
});