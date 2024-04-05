import { z } from "zod";
import Hashing from "./hashing";

const configSchema = z.object({
    DATABASE_URL: z.string(),
    PORT: z.string(),
    ALLOWED_SEASONS: z.string(),
    BOT_TOKEN: z.string(),
});

class Config {
    public static load(): LoadedConfig {
        const env = process.env;
        const unsafeConfig = configSchema.safeParse(env);

        if (!unsafeConfig.success) {
            throw new Error(unsafeConfig.error.message);
        }

        const config = unsafeConfig.data;
        const allowedSeasons = config.ALLOWED_SEASONS.split(',').map(String);
        const uplinkKey = Hashing.sha256(config.BOT_TOKEN);

        return new LoadedConfig(
            config.DATABASE_URL,
            config.PORT,
            allowedSeasons,
            config.BOT_TOKEN,
            uplinkKey
        );
    }
}

class LoadedConfig {
    constructor(
        public DATABASE_URL: string,
        public PORT: string,
        public ALLOWED_SEASONS: string[],
        public BOT_TOKEN: string,
        public UPLINK_KEY: string
    ) { }
}

export { Config, LoadedConfig };