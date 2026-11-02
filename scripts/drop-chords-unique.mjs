import { createClient } from '@libsql/client';
import { readFileSync } from 'fs';

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
    console.log('Eliminando índice único chords_name_unique...');
    await client.execute('DROP INDEX IF EXISTS `chords_name_unique`');
    console.log('✅ Índice eliminado exitosamente. Ahora se pueden guardar acordes con nombres duplicados.');
} catch (err) {
    console.error('❌ Error:', err.message);
} finally {
    client.close();
}
