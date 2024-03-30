import { z } from "zod";
import { config } from "..";

const BASE_URL = 'https://uplink.zetax.workers.dev';

const loadSchema = z.object({
    ownerId: z.string(),
    features: z.object({
        autoshop: z.object({
            enabled: z.boolean(),
        }),
        database: z.object({
            enabled: z.boolean(),
            uplink_database_url: z.string(),
            uplink_database_token: z.string(),
        }),
        boost: z.object({
            enabled: z.boolean(),
            uplink_boost_url: z.string(),
        }),
        heartbeat: z.boolean(),
    }),
});

class Uplink {

    public static async register() {
        const response = await fetch(`${BASE_URL}/register`, {
            method: 'POST',
            body: JSON.stringify({
                upkey: config.UPLINK_KEY
            }),
            headers: {
                'Content-Type': 'application/json'
            }
        });

        const data = await response.json();
        if (!response.ok) {
            throw new Error(data.error);
        }



    }

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
            autoshop: {
                enabled: boolean,
            },
            database: {
                enabled: boolean,
                uplink_database_url: string | undefined,
                uplink_database_token: string | undefined,
            },
            boost: {
                enabled: boolean,
                uplink_boost_url: string | undefined,
            },
            heartbeat: boolean,
        }
    ) { }
}

export default Uplink;