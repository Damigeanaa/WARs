import sqlite3 from 'sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbPath = path.join(__dirname, 'database.db');
const db = new sqlite3.Database(dbPath);

console.log('Checking driver_schedules table schema...');

db.all('PRAGMA table_info(driver_schedules)', (err, rows) => {
  if (err) {
    console.error('Error:', err);
  } else {
    console.log('driver_schedules columns:');
    rows.forEach(row => {
      console.log(`  ${row.cid}: ${row.name} (${row.type}) - ${row.notnull ? 'NOT NULL' : 'NULLABLE'} - Default: ${row.dflt_value || 'NULL'}`);
    });
  }
  
  db.close();
});
