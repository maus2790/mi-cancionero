import { createClient } from '@libsql/client';
import { drizzle } from 'drizzle-orm/libsql';

const databaseUrl = process.env.TURSO_DATABASE_URL || 'file:local.db';
const authToken = process.env.TURSO_AUTH_TOKEN || undefined;

let client;
try {
    client = createClient({
        url: databaseUrl,
        authToken: authToken,
    });
} catch (err) {
    console.warn('[AI Studio] Could not connect using provided TURSO_DATABASE_URL, falling back to local file database:', err);
    client = createClient({
        url: 'file:local.db',
    });
}

// Exportamos db para hacer consultas
export const db = drizzle(client);