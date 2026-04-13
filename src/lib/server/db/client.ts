import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

// Initialize the database client
// Connection is deferred to runtime to avoid issues during build
let db: ReturnType<typeof drizzle> | null = null;

export function getDatabase() {
	if (!db) {
		if (!process.env.DATABASE_URL) {
			throw new Error(
				'DATABASE_URL is not set. Please configure your Supabase connection string in .env.local'
			);
		}

		// Create Postgres connection
		const client = postgres(process.env.DATABASE_URL, {
			max: 1,
			idle_timeout: 30
		});

		// Initialize Drizzle ORM
		db = drizzle(client, { schema });
	}

	return db;
}

export type Database = ReturnType<typeof getDatabase>;
