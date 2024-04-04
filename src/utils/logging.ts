import { createMiddleware } from 'hono/factory';
import chalk from 'chalk';

import Timing from './timing';

// Log levels enum
enum LogLevels {
    DEBUG = 0,
    INFO = 1,
    WARNING = 2,
    ERROR = 3,
    CRITICAL = 4
}

// Log levels map
const LogLevelsMap = {
    DEBUG: { name: 'DEBUG', level: LogLevels.DEBUG },
    INFO: { name: 'INFO', level: LogLevels.INFO },
    WARNING: { name: 'WARNING', level: LogLevels.WARNING },
    ERROR: { name: 'ERROR', level: LogLevels.ERROR },
    CRITICAL: { name: 'CRITICAL', level: LogLevels.CRITICAL }
};

const colorMap = new Map<string, (arg0: string) => string>([
    ['A', chalk.red],
    ['B', chalk.green],
    ['C', chalk.blue],
    ['D', chalk.yellow],
    ['E', chalk.magenta],
    ['F', chalk.cyan],
    ['G', chalk.white],
    ['H', chalk.gray],
    ['I', chalk.redBright],
    ['J', chalk.greenBright],
    ['K', chalk.blueBright],
    ['L', chalk.yellowBright],
    ['M', chalk.magentaBright],
    ['N', chalk.cyanBright],
    ['O', chalk.whiteBright],
    ['P', chalk.bgRedBright],
    ['Q', chalk.bgRed],
    ['R', chalk.bgGreen],
    ['S', chalk.bgBlue],
    ['T', chalk.bgYellow],
    ['U', chalk.bgMagenta],
    ['V', chalk.bgCyan],
    ['W', chalk.bgWhite],
    ['X', chalk.bgGray],
    ['Y', chalk.bgRedBright],
    ['Z', chalk.bgGreenBright],
]);

// Logger class
class Logger {
    // Middleware to log requests
    private static currentLogLevel = LogLevels.DEBUG; // New static variable

    /**
     * 
     * @returns {Middleware} Middleware to log requests
     */
    public static logRequest = () =>
        createMiddleware(async (c, next) => {
            if (this.getLogLevel() !== LogLevels.DEBUG) {
                return await next();
            }

            if (c.req.path === '/') return await next();

            const timing = new Timing('logRequest');
            await next();

            let statusColor;
            if (c.res.status >= 500) statusColor = chalk.bgRed(` ${c.res.status} `);
            else if (c.res.status >= 400) statusColor = chalk.bgYellow(` ${c.res.status} `);
            else if (c.res.status >= 300) statusColor = chalk.bgCyan(` ${c.res.status} `);
            else statusColor = chalk.bgGreen(` ${c.res.status} `);

            console.log(chalk.gray(`${timing.startDateIso}`), chalk.bgBlue(` ${c.req.method} `), chalk.gray(`${c.req.url}`), statusColor, chalk.gray(`${timing.duration}ms`));
        });

    private static getLogLevel() {
        return Logger.currentLogLevel; // Use the new static variable
    }

    public static setLogLevel(level: keyof typeof LogLevelsMap) {
        Logger.currentLogLevel = LogLevelsMap[level].level;
    }

    public static debug = (...args: unknown[]) => {
        if (this.getLogLevel() > LogLevelsMap.DEBUG.level) return;
        console.log(chalk.bgBlue(" DEBUG "), ...args.map((arg) => typeof arg === 'string' ? chalk.gray(arg) : chalk.gray(JSON.stringify(arg))));
    };

    public static error = (...args: unknown[]) => {
        if (this.getLogLevel() > LogLevelsMap.ERROR.level) return;
        console.log(chalk.bgRed(" ERROR "), ...args.map((arg) => typeof arg === 'string' ? chalk.gray(arg) : chalk.gray(JSON.stringify(arg))));
    };

    public static warn = (...args: unknown[]) => {
        if (this.getLogLevel() > LogLevelsMap.WARNING.level) return;
        console.log(chalk.bgYellow(" WARN "), ...args.map((arg) => typeof arg === 'string' ? chalk.gray(arg) : chalk.gray(JSON.stringify(arg))));
    };

    public static info = (...args: unknown[]) => {
        if (this.getLogLevel() > LogLevelsMap.INFO.level) return;
        console.log(chalk.bgCyan(" INFO "), ...args.map((arg) => typeof arg === 'string' ? chalk.gray(arg) : chalk.gray(JSON.stringify(arg))));
    };

    public static startup = (...args: unknown[]) => {
        console.log(...args.map((arg) => typeof arg === 'string' ? chalk.gray(arg) : chalk.gray(JSON.stringify(arg))));
    };

    public static customPrefix = (prefix: string, ...args: unknown[]) => {
        const colorFunc = colorMap.get(prefix[0].toUpperCase()) || chalk.gray;
        console.log(colorFunc(prefix), ...args.map((arg) => typeof arg === 'string' ? chalk.gray(arg) : chalk.gray(JSON.stringify(arg))));
    }

    public static changeLogLevel = (level: keyof typeof LogLevelsMap) => {
        this.setLogLevel(level);
        console.log(chalk.bgCyan(" INFO "), chalk.gray(`Changed log level to ${level}`));
    }
}

// Export Logger class
export default Logger;