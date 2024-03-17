import type { Config } from 'drizzle-kit';

export default {
    schema: ["./src/database/models/hotfixes.ts"],
    out: './drizzle/migrations',
    driver: 'pg', // 'pg' | 'mysql2' | 'better-sqlite' | 'libsql' | 'turso'
    dbCredentials: {
        host: "",
        user: "",
        port: 5432,
        password: "",
        database: "",
        //ssl: true
    },
} satisfies Config;