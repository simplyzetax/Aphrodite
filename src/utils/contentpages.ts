import type { BunFile } from "bun";
import type { Context } from "hono";

import Logger from "./logging";
import UAParser from "./version";
import { config } from "..";
import path from 'node:path';

const splash = await Bun.file(path.join(import.meta.dir, "../../static/", "splash.txt")).text();

class Contentpages {

    private file: BunFile;

    constructor(file: BunFile) {
        this.file = file;
    }

    public async process(c: Context) {

        try {
            const contentpages = await this.file.json();

            const modes = ["saveTheWorldUnowned", "battleRoyale", "creative", "saveTheWorld"];
            const news = ["savetheworldnews", "battleroyalenews"];

            const mem = UAParser.parse(c.req.header("User-Agent"));
            if (!mem || typeof mem.season !== 'number') return { error: "Failed" };

            for (const mode of modes) {
                if (contentpages.subgameselectdata[mode]) {
                    contentpages.subgameselectdata[mode].message.title = contentpages.subgameselectdata[mode].message.title.en
                    contentpages.subgameselectdata[mode].message.body = contentpages.subgameselectdata[mode].message.body.en
                }
            }

            if (Array.isArray(contentpages.dynamicbackgrounds.backgrounds.backgrounds) && contentpages.dynamicbackgrounds.backgrounds.backgrounds.length >= 2) {
                contentpages.dynamicbackgrounds.backgrounds.backgrounds[0].stage = `season${mem.season}`;
                contentpages.dynamicbackgrounds.backgrounds.backgrounds[1].stage = `season${mem.season}`;

                type BuildToStageMap = {
                    [key: string]: string;
                };

                const buildToStageMap: BuildToStageMap = {
                    "11.31": "Winter19",
                    "10.40": "SeasonX",
                };


                const stage = buildToStageMap[mem.build];
                if (stage) {
                    contentpages.dynamicbackgrounds.backgrounds.backgrounds[0].stage = stage;
                    contentpages.dynamicbackgrounds.backgrounds.backgrounds[1].stage = stage;
                }
            }

            if (Array.isArray(contentpages.emergencynotice.news.messages)) {
                contentpages.emergencynotice.news.messages = [];

                const splashLines = splash.split("\n");
                const randomSplash = splashLines[Math.floor(Math.random() * splashLines.length)];

                contentpages.emergencynotice.news.messages.push({
                    hidden: false,
                    _type: "CommonUI Simple Message Base",
                    title: `Aphrodite - ${mem.build}.${config.UPLINK_KEY.substring(0, 6)}`,
                    body: randomSplash,
                    spotlight: true
                });
            }

            if (Array.isArray(contentpages.emergencynoticev2.emergencynotices.emergencynotices)) {
                contentpages.emergencynoticev2.emergencynotices.emergencynotices = [];

                const splashLines = splash.split("\n");
                const randomSplash = splashLines[Math.floor(Math.random() * splashLines.length)];

                contentpages.emergencynoticev2.emergencynotices.emergencynotices.push({
                    gamemodes: [],
                    _type: "CommonUI Simple Message Base",
                    title: `Aphrodite - ${mem.build}.${config.UPLINK_KEY.substring(0, 6)}`,
                    body: randomSplash,
                    spotlight: true
                });
            }

            return contentpages;

        } catch (error: any) {
            Logger.error(error);
            return {
                error: "Failed",
                message: error.message
            };
        }

    }

}

export default Contentpages;