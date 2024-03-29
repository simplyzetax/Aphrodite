import { z } from "zod";
import { config } from "..";

const BASE_URL = 'https://uplink.nexusfn.net';

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
        const response = await fetch(`${BASE_URL}/api/config`, {
            headers: {
                'Authorization': `Bearer ${config.UPLINK_KEY}`
            }
        });

        const data = await response.json();
        const unsafeConfig = loadSchema.safeParse(data);
        if (!unsafeConfig.success) {
            throw new Error(unsafeConfig.error.message);
        }

        return unsafeConfig.data;
    }

}

export default Uplink;