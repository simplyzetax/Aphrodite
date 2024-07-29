import { drizzle, type NodePgDatabase } from 'drizzle-orm/node-postgres';
import { config } from '..';
import { Client } from 'pg';
import Logger from '../utils/logging';

class DB {
    private static instanceCount = 0;

    /**
     * The database connection
     */
    public connection: Client;

    /**
     * The database client to run queries with
     */
    public client: NodePgDatabase;

    /**
     * The connection UID. Used for logging purposes
     */
    id: number;

    /**
     * Creates a new database instance
     */
    constructor(database_url: string) {

        this.connection = new Client({
            connectionString: database_url,
        });

        this.client = drizzle(this.connection, { logger: true });
        this.id = DB.instanceCount++;
    }

    /**
     * Connects to the database and validates the connection
     * @returns {Promise<void>}
     */
    async connect(): Promise<void> {
        try {
            await this.connection.connect();

            const validate = await this.connection.query('SELECT 1');
            if (JSON.stringify(validate).includes('1')) {
                Logger.startup(`Database connection with id ${this.id} established 🙌`);
            } else {
                Logger.error(`Database connection test for id ${this.id} failed 😢`);
                process.exit(1);
            }
        } catch (err: any) {
            Logger.error(err.message);
            Logger.error(`Database connection test for id ${this.id} failed 😢`);
            process.exit(1);
        }
    }

    /**
     * Disconnects from the database
     * @returns {Promise<void>}
     */
    async disconnect(): Promise<void> {
        await this.connection.end();
    }

    /**
     * Runs migrations
     * @returns {Promise<void>}
     */
    async migrate(): Promise<void> {
        //await migrate(this.client, { migrationsFolder: path.join(import.meta.dir, '../../drizzle/migrations/') });
    }
}

export default DB;