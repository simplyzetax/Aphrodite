import { drizzle, type PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import Logger from '../utils/logging';

class Database {

    public pg: postgres.Sql<{}> = null as unknown as postgres.Sql<{}>;
    public db: PostgresJsDatabase<Record<string, never>> = null as unknown as PostgresJsDatabase<Record<string, never>>;

    constructor(url: string) {
        this.pg = postgres(url);
    }

    async connect() {
        const result = await this.pg`SELECT 1;`;
        if (result.length === 0) {
            throw new Error('Failed to connect to database');
        }
        this.db = drizzle(this.pg);
        Logger.startup('Connected to database');
    }
}

export default Database;