import { createClient } from '@libsql/client';
import { readFileSync } from 'fs';
import { createHash } from 'crypto';

// Leer variables de entorno desde .env manualmente
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
    // Ver qué tablas existen
    const tables = await client.execute("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name");
    console.log('Tablas existentes:', tables.rows.map(r => r[0]));

    // Ver índices en chords
    const indexes = await client.execute("SELECT name FROM sqlite_master WHERE type='index' AND tbl_name='chords'");
    console.log('Índices en chords:', indexes.rows.map(r => r[0]));

} catch (err) {
    console.error('❌ Error:', err.message);
} finally {
    client.close();
}
