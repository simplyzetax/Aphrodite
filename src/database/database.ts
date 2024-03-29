import { drizzle } from 'drizzle-orm/libsql';
import { createClient, type Client } from '@libsql/client';
import Logger from '../utils/logging';

class DatabaseConnector {
    private client;

    constructor(url: string, authToken: string) {
        this.client = createClient({ url, authToken });
    }

    async connect(): Promise<ConnectedDatabase> {
        try {
            await this.client.execute('SELECT 1;');
            Logger.startup('Connected to database');
            return new ConnectedDatabase(this.client);
        } catch (error) {
            throw new Error('Failed to connect to database');
        }
    }
}

class ConnectedDatabase {
    public db;

    constructor(client: Client) {
        this.db = drizzle(client);
    }
}

export { DatabaseConnector, ConnectedDatabase };