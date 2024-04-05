import fs from 'node:fs/promises';
import path from 'node:path';
import Logger from './logging';

let count = 0;

/**
 * Dynamically loads all routes from a directory
 * @param dir The directory to load the routes from
 * @param isInitialCall A boolean indicating whether this is the initial call to loadRoutes
 * @returns {Promise<void>}
 */
export async function loadRoutes(dir: string, isInitialCall = true): Promise<void> {
    const entries = await fs.readdir(path.join(import.meta.dir, dir), { withFileTypes: true });

    const importPromises = [];

    for (const entry of entries) {
        if (entry.name === "catchall.ts") continue;
        count++;
        const res = path.resolve(`${import.meta.dir}/${dir}`, entry.name);
        if (entry.isDirectory()) {
            importPromises.push(loadRoutes(`${dir + entry.name}/`, false));
        } else {
            importPromises.push(import(res));
        }
    }

    await Promise.all(importPromises);

    if (isInitialCall) {
        Logger.startup(`Loaded ${count} route${count === 1 ? '' : 's'}`);
        Logger.startup('Loaded catchall route')
    }
}