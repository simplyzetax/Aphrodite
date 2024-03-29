import type { Config } from 'drizzle-kit';

export default {
    schema: ["./src/database/models/hotfixes.ts", "./src/database/models/items.ts", "./src/database/models/profiles.ts", "./src/database/models/users.ts", "./src/database/models/tokens.ts"],
    out: './drizzle/migrations',
    driver: 'turso', // 'pg' | 'mysql2' | 'better-sqlite' | 'libsql' | 'turso'
    dbCredentials: {
        url: process.env.DATABASE_URL as any,
        authToken: process.env.DATABASE_TOKEN
    },
} satisfies Config;