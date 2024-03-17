import type { Config } from 'drizzle-kit';

export default {
    schema: ["./src/database/models/hotfixes.ts"],
    out: './drizzle/migrations',
    driver: 'pg', // 'pg' | 'mysql2' | 'better-sqlite' | 'libsql' | 'turso'
    dbCredentials: {
        host: "ep-icy-night-a25lbvtt.eu-central-1.aws.neon.tech",
        user: "backend_owner",
        port: 5432,
        password: "OGAp8h5kItcl",
        database: "backend",
        ssl: true
    },
} satisfies Config;