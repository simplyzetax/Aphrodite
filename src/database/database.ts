import { drizzle, type PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import Logger from '../utils/logging';

class DatabaseConnector {
    private pg: postgres.Sql<{}>;

    constructor(url: string) {
        this.pg = postgres(url);
    }

    async connect(): Promise<ConnectedDatabase> {
        const result = await this.pg`SELECT 1;`;
        if (result.length === 0) {
            throw new Error('Failed to connect to database');
        }
        Logger.startup('Connected to database');
        return new ConnectedDatabase(this.pg);
    }
}

class ConnectedDatabase {
    public db: PostgresJsDatabase<Record<string, never>>;

    constructor(pg: postgres.Sql<{}>) {
        this.db = drizzle(pg);
    }
}

export { DatabaseConnector, ConnectedDatabase };