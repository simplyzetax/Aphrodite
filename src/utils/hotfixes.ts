import { and, eq, sql } from "drizzle-orm";
import { db } from "..";
import { hotfixes, type Hotfix, type NewHotfix } from "../database/models/hotfixes";
import type { IHotfixStats } from "../types/hotfixes";
import Logger from "./logging";
import type { BunFile } from "bun";

const preparedGlobalHotfixesQuery = db.select().from(hotfixes)
    .where(and(eq(hotfixes.filename, sql.placeholder('file')), eq(hotfixes.enabled, true), eq(hotfixes.scope, 'global'))).prepare('global_hotfixes');

const preparedUserHotfixesQuery = db.select().from(hotfixes).where(
    and(
        eq(hotfixes.filename, sql.placeholder('file')),
        and(
            eq(hotfixes.enabled, true),
            and(
                eq(hotfixes.scope, 'user'),
                eq(hotfixes.accountId, sql.placeholder('accountId'))
            )
        )
    )
).prepare('user_hotfixes');

class Hotfixes {
    private filename: string;
    private hotfixes: Hotfix[] = [];
    public static hotfixStats: Map<string, IHotfixStats> = new Map();

    constructor(filename: string) {
        this.filename = filename;
    }

    public async fetchGlobalHotfixes() {
        this.hotfixes = await preparedGlobalHotfixesQuery.execute({ file: this.filename });

        if (!this.hotfixes.length) {
            return;
        }
    }

    public async fetchUserHotifxes(accountId: string) {

        const userHotfixes = await preparedUserHotfixesQuery.execute({ file: this.filename, accountId });
        this.hotfixes = this.hotfixes.concat(userHotfixes);
    }

    public processHotfixes() {
        const sections: Map<string, Map<string, string[]>> = new Map();

        if (!this.hotfixes.length) {
            Logger.debug(`Hotifx length is 0 for file: ${this.filename}`);
            return '';
        }

        for (const hotfix of this.hotfixes) {
            const trimmedSection = hotfix.section.trim();
            if (!trimmedSection) continue;

            if (!sections.has(trimmedSection)) {
                sections.set(trimmedSection, new Map());
            }

            const section = sections.get(trimmedSection);
            if (!section) continue;
            if (!section.has(hotfix.key)) {
                section.set(hotfix.key, []);
            }

            let hotfixArray = section.get(hotfix.key);
            if (!hotfixArray) {
                hotfixArray = [];
                section.set(hotfix.key, hotfixArray);
            }
            hotfixArray.push(hotfix.value);

            let hotfixStat = Hotfixes.hotfixStats.get(hotfix.filename);
            if (!hotfixStat) {
                hotfixStat = { length: 0, keys: [], values: [] };
                Hotfixes.hotfixStats.set(hotfix.filename, hotfixStat);
            }

            hotfixStat.length++;
            hotfixStat.keys.push(hotfix.key);
            hotfixStat.values.push(hotfix.value);
        }

        const iniFile = [];
        for (const [section, keys] of sections) {
            iniFile.push(`[${section}]\n`);
            for (const [key, values] of keys) {
                iniFile.push(...values.map(value => `${key}=${value}\n`));
            }
        }

        return iniFile.join('');
    }

    /**
     * Should not be used without knowing what you are doing
     * @param file 
     */
    public static async insertFromFile(file: BunFile) {
        const text = await file.text();
        const lines = text.split('\n');
        const hotfixArray: NewHotfix[] = [];

        let section = '';
        for (const line of lines) {
            const trimmedLine = line.trim();
            if (trimmedLine === '' || trimmedLine.startsWith(';')) {
                continue;
            }
            Logger.debug(`Processing line: ${line}`);
            if (trimmedLine.startsWith('[') && trimmedLine.endsWith(']')) {
                section = trimmedLine.slice(1, -1);
                continue;
            }
            let processedLine = trimmedLine;
            if (processedLine.startsWith('+')) {
                processedLine = processedLine.slice(1);
            }
            const splitIndex = processedLine.indexOf('=');
            if (splitIndex === -1) {
                continue; // Skip lines without '='
            }
            const key = processedLine.substring(0, splitIndex).trim();
            const value = processedLine.substring(splitIndex + 1);

            if (!file.name) throw new Error('File name is undefined');
            const path = file.name.split('\\');
            const filename = path[path.length - 1];



            hotfixArray.push({
                filename: filename,
                section,
                key,
                scope: 'global',
                value,
            });
        }

        try {
            await db.insert(hotfixes).values(hotfixArray);
        } catch (error) {
            Logger.error(`Error inserting hotfixes for file: ${file.name}`, error);
            if (!file.name) throw new Error('File name is undefined');
            const path = file.name.split('/');
            const filename = path[path.length - 1];
            await db.delete(hotfixes).where(eq(hotfixes.filename, filename));
        }
    }

}

export default Hotfixes;