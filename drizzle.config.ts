import type { Config } from 'drizzle-kit';

export default {
    schema: ["./src/database/models/hotfixes.ts", "./src/database/models/items.ts", "./src/database/models/profiles.ts", "./src/database/models/users.ts", "./src/database/models/friends.ts", "./src/database/models/tokens.ts", "./src/database/models/attributes.ts", "./src/database/models/loadouts.ts"],
    out: './drizzle/migrations',
    driver: 'pg', // 'pg' | 'mysql2' | 'better-sqlite' | 'libsql' | 'turso'
    dbCredentials: {
        connectionString: process.env.DATABASE_URL as any,
    },
} satisfies Config;