import type { BunFile } from "bun";
import type { Context } from "hono";

import Logger from "./logging";
import UAParser from "./version";

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

            modes.forEach(mode => {
                if (contentpages.subgameselectdata[mode]) {
                    contentpages.subgameselectdata[mode].message.title = contentpages.subgameselectdata[mode].message.title["en"]
                    contentpages.subgameselectdata[mode].message.body = contentpages.subgameselectdata[mode].message.body["en"]
                }
            })

            if (Array.isArray(contentpages.dynamicbackgrounds.backgrounds.backgrounds) && contentpages.dynamicbackgrounds.backgrounds.backgrounds.length >= 2) {
                contentpages.dynamicbackgrounds.backgrounds.backgrounds[0].stage = `season${mem.season}`;
                contentpages.dynamicbackgrounds.backgrounds.backgrounds[1].stage = `season${mem.season}`;

                if (mem.build === 11.31) {
                    contentpages.dynamicbackgrounds.backgrounds.backgrounds[0].stage = "Winter19";
                    contentpages.dynamicbackgrounds.backgrounds.backgrounds[1].stage = "Winter19";
                }
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