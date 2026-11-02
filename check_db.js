const sqlite3 = require('better-sqlite3');
const db = new sqlite3('sqlite.db');
const rows = db.prepare(`SELECT id, name, guitarPositions, pianoPositions FROM chords WHERE name IN ('G', 'C')`).all();
console.log(JSON.stringify(rows, null, 2));
