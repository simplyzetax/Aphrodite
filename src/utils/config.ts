import { z } from "zod";

const configSchema = z.object({
    DATABASE_URL: z.string(),
    PORT: z.string(),
    ALLOWED_SEASONS: z.string(),
});

class Config {
    public static DATABASE_URL: string;
    public static PORT: string;
    public static ALLOWED_SEASONS: number[] = []

    public static load() {
        const env = process.env;
        const unsafeConfig = configSchema.safeParse(env);

        if (!unsafeConfig.success) {
            throw new Error(unsafeConfig.error.message);
        }

        const config = unsafeConfig.data;

        Config.DATABASE_URL = config.DATABASE_URL;
        Config.PORT = config.PORT;
        Config.ALLOWED_SEASONS = config.ALLOWED_SEASONS.split(',').map(Number);

        return config;
    }
}

export default Config;