import { config } from "..";
import type { IVersion } from "../types/version";

class UAParser {

    public static parse(ua: string | undefined) {
        const officialRegex = new RegExp(/(.*)\/(.*)-CL-(\d+)(\s+\((.*?)\))?\s+(\w+)\/(\S*)(\s*\((.*?)\))?/);

        const memory: IVersion = {
            season: 0,
            build: "0.0",
            cl: '0',
            lobby: 'LobbySeason0'
        };

        
        const userAgent = ua;
        if (!userAgent) {
            return undefined;
        }

        const buildIDMatch = userAgent.match(/-(\d+)[, ]/);
        const buildMatch = userAgent.match(/Release-(\d+\.\d+)/);
        const officialMatch = userAgent.match(officialRegex);

        if (officialMatch) {
            const build = officialMatch[7];
            memory.season = Number(build.split('.')[0]);
            memory.build = Number.parseFloat(build).toFixed(2);
            memory.lobby = `LobbySeason${memory.season}`;
        }

        if (buildIDMatch) {
            memory.cl = buildIDMatch[1];
        }


        if (buildMatch) {
            const build = buildMatch[1];
            memory.season = Number(build.split('.')[0]);
            memory.build = Number.parseFloat(build).toFixed(2);
            memory.lobby = `LobbySeason${memory.season}`;
        }

        if (Number.isNaN(memory.season)) {
            memory.season = UAParser.getSeasonFromCL(memory.cl);
            memory.build = `${memory.season}`;
            memory.lobby = `LobbySeason${memory.season}`;
        }

        return memory;
    }

    public static getSeasonFromCL(cl: string): number {
        const clNumber = Number(cl);
        if (Number.isNaN(clNumber) || clNumber < 3724489) {
            return 0;
        }
        if (clNumber <= 3790078) {
            return 1;
        }
        return 2;
    }

    public static isAllowedBuild(build: string) {
        if (config.ALLOWED_SEASONS.includes(build)) return true;
        return false;
    }

}

export default UAParser;