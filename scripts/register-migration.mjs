import { createClient } from '@libsql/client';
import { readFileSync } from 'fs';
import { createHash } from 'crypto';

const envContent = readFileSync('.env', 'utf-8');
const envVars = {};
for (const line of envContent.split('\n')) {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#')) {
        const eqIndex = trimmed.indexOf('=');
        if (eqIndex !== -1) {
            const key = trimmed.slice(0, eqIndex).trim();
            const value = trimmed.slice(eqIndex + 1).trim().replace(/^["']|["']$/g, '');
            envVars[key] = value;
        }
    }
}

const client = createClient({
    url: envVars.TURSO_DATABASE_URL,
    authToken: envVars.TURSO_AUTH_TOKEN,
});

try {
    const migrationContent = readFileSync('drizzle/0008_remove_chords_name_unique.sql', 'utf-8');
    const hash = createHash('sha256').update(migrationContent).digest('hex');
    
    // Ver migraciones existentes
    const existing = await client.execute('SELECT * FROM __drizzle_migrations ORDER BY id');
    console.log('Migraciones registradas:');
    for (const row of existing.rows) {
        console.log(' -', row);
    }
    
    // Registrar la nueva migración
    const now = Date.now();
    await client.execute({
        sql: 'INSERT INTO __drizzle_migrations (hash, created_at) VALUES (?, ?)',
        args: [hash, now]
    });
    console.log('\n✅ Migración 0008 registrada con hash:', hash);

} catch (err) {
    console.error('❌ Error:', err.message);
} finally {
    client.close();
}
