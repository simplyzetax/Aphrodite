import { z } from "zod";

const configSchema = z.object({
    DATABASE_URL: z.string(),
    PORT: z.string(),
    ALLOWED_SEASONS: z.string(),
});

class Config {
    private static configMap: Map<string, string | number[]> = new Map();

    public static get(key: string): string | number[] | undefined {
        return this.configMap.get(key);
    }

    public static load() {
        const env = process.env;
        const unsafeConfig = configSchema.safeParse(env);

        if (!unsafeConfig.success) {
            throw new Error(unsafeConfig.error.message);
        }

        const config = unsafeConfig.data;

        this.configMap.set('DATABASE_URL', config.DATABASE_URL);
        this.configMap.set('PORT', config.PORT);
        this.configMap.set('ALLOWED_SEASONS', config.ALLOWED_SEASONS.split(',').map(Number));

        return config;
    }
}

export default Config;