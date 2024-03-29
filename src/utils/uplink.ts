import { z } from "zod";
import { config } from "..";

const BASE_URL = 'https://uplink.zetax.workers.dev';

const loadSchema = z.object({
    ownerId: z.string(),
    features: z.object({
        shop: z.boolean(),
        leaderboard: z.boolean(),
        database: z.boolean(),
        heartbeat: z.boolean(),
        ratelimiting: z.boolean(),
    }),
});

class Uplink {

    public static async load() {
        const response = await fetch(`${BASE_URL}/features`, {
            headers: {
                'Authorization': `Bearer ${config.UPLINK_KEY}`
            }
        });

        const data = await response.json();
        const unsafeConfig = loadSchema.safeParse(data);
        if (!unsafeConfig.success) {
            throw new Error(unsafeConfig.error.message);
        }

        return new EstablishedUplink(
            unsafeConfig.data.ownerId,
            unsafeConfig.data.features
        );
    }

}

class EstablishedUplink {
    constructor(
        public ownerId: string,
        public features: {
            shop: boolean,
            leaderboard: boolean,
            database: boolean,
            heartbeat: boolean,
            ratelimiting: boolean,
        }
    ) { }
}

export default Uplink;